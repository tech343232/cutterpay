// Códigos de verificación de 6 dígitos enviados al correo.
// Se usan para: confirmar el correo al registrarse, entrar (login) y autorizar compras, ventas y retiros.
// El código nunca se guarda en texto: solo su hash. Vence en 10 minutos y permite 5 intentos.
import crypto from 'node:crypto';
import { query, isRemote } from '../db/index.js';
import { config } from '../config.js';
import { HttpError, badRequest } from '../lib/errors.js';
import { sendCode, mailConfigured } from './mailer.js';

const hash = (s) => crypto.createHash('sha256').update(s).digest('hex');
const codeHash = (id, code) => hash(`${id}:${code}:${config.jwtSecret}`);

/** Huella de lo que se va a autorizar: el código solo sirve para ESA operación exacta. */
export const payloadHash = (action, payload) => {
  const sorted = Object.keys(payload).sort().reduce((o, k) => ((o[k] = payload[k]), o), {});
  return hash(`${action}:${JSON.stringify(sorted)}`);
};

export const maskEmail = (email) => {
  const [u, d] = email.split('@');
  return `${u.slice(0, 2)}${'•'.repeat(Math.max(2, u.length - 2))}@${d}`;
};

const isDemo = (email) => email.toLowerCase().endsWith(`@${config.demoEmailDomain}`);

/** Crea el código, lo envía y devuelve lo que necesita la pantalla para pedirlo. */
export async function createChallenge({ user, purpose, action = null, payload = null, detail = null }) {
  const [{ recent }] = await query(
    `SELECT COUNT(*)::int AS recent FROM codigos_verificacion WHERE usuario_id = $1 AND creado_en > now() - interval '15 minutes'`,
    [user.id],
  );
  if (recent >= 8) throw new HttpError(429, 'Pediste muchos códigos seguidos. Espera unos minutos e intenta de nuevo.');

  const id = crypto.randomUUID();
  const code = String(crypto.randomInt(0, 1_000_000)).padStart(6, '0');
  await query(
    `INSERT INTO codigos_verificacion (id, usuario_id, proposito, accion, payload_hash, codigo_hash, expira_en)
     VALUES ($1,$2,$3,$4,$5,$6, now() + ($7 || ' minutes')::interval)`,
    [id, user.id, purpose, action, action ? payloadHash(action, payload) : null, codeHash(id, code), String(config.otpTtlMin)],
  );
  return deliver({ id, code, user, purpose, detail });
}

async function deliver({ id, code, user, purpose, detail }) {
  const email = user.correo;
  const demo = isDemo(email);
  // Mostrar el código en pantalla solo si es una cuenta de demostración o si estamos en local sin correo configurado
  const showCode = demo || (!mailConfigured && !isRemote);
  if (!demo) {
    try {
      await sendCode({ to: email, name: user.nombre.split(' ')[0], code, purpose, detail });
    } catch (e) {
      console.error('[correo] No se pudo enviar:', e.message);
      if (!showCode) throw new HttpError(503, 'No pudimos enviar el código a tu correo. Intenta de nuevo en un momento.');
    }
    if (!mailConfigured && isRemote) throw new HttpError(503, 'El envío de correos aún no está configurado. Avisa al administrador.');
  }
  return {
    needsCode: true,
    challengeId: id,
    email: maskEmail(email),
    expiresInMin: config.otpTtlMin,
    ...(showCode ? { demoCode: code } : {}),
  };
}

/** Reenvía un código nuevo para el mismo desafío (máximo 3 reenvíos). */
export async function resendChallenge(challengeId) {
  const [c] = await query(
    `SELECT c.id, c.proposito, c.envios, c.usado_en, u.id AS uid, u.nombre, u.correo
       FROM codigos_verificacion c JOIN usuarios u ON u.id = c.usuario_id WHERE c.id = $1`,
    [challengeId],
  );
  if (!c || c.usado_en) throw badRequest('Ese código ya no está activo. Vuelve a empezar.');
  if (c.envios >= 4) throw new HttpError(429, 'Ya te enviamos varios códigos. Espera unos minutos y vuelve a empezar.');
  const code = String(crypto.randomInt(0, 1_000_000)).padStart(6, '0');
  await query(
    `UPDATE codigos_verificacion SET codigo_hash = $2, intentos = 0, envios = envios + 1, expira_en = now() + ($3 || ' minutes')::interval WHERE id = $1`,
    [c.id, codeHash(c.id, code), String(config.otpTtlMin)],
  );
  return deliver({ id: c.id, code, user: { id: c.uid, nombre: c.nombre, correo: c.correo }, purpose: c.proposito });
}

/**
 * Verifica el código. Si es correcto lo marca como usado (no se puede reutilizar) y devuelve el id del usuario.
 * Para operaciones también comprueba que se autorice exactamente lo mismo que se pidió.
 */
export async function verifyChallenge({ challengeId, code, purposes, userId = null, action = null, payload = null }) {
  const clean = String(code || '').replace(/\D/g, '');
  if (!challengeId || clean.length !== 6) throw badRequest('Escribe los 6 dígitos del código.', { fieldErrors: { code: 'Escribe los 6 dígitos del código.' } });

  const [c] = await query(
    `SELECT id, usuario_id, proposito, accion, payload_hash, codigo_hash, intentos, usado_en, (expira_en < now()) AS vencido
       FROM codigos_verificacion WHERE id = $1`,
    [challengeId],
  );
  const fail = (msg) => badRequest(msg, { fieldErrors: { code: msg }, code: 'OTP_INVALID' });
  if (!c || !purposes.includes(c.proposito) || (userId && c.usuario_id !== userId)) throw fail('Ese código no es válido. Pide uno nuevo.');
  if (c.usado_en) throw fail('Ese código ya se usó. Pide uno nuevo.');
  if (c.vencido) throw fail('El código venció. Pide uno nuevo.');
  if (c.intentos >= config.otpMaxAttempts) throw fail('Demasiados intentos con este código. Pide uno nuevo.');
  if (action && (c.accion !== action || c.payload_hash !== payloadHash(action, payload))) {
    throw fail('Este código era para otra operación. Pide uno nuevo.');
  }

  const ok = crypto.timingSafeEqual(Buffer.from(c.codigo_hash), Buffer.from(codeHash(c.id, clean)));
  if (!ok) {
    await query(`UPDATE codigos_verificacion SET intentos = intentos + 1 WHERE id = $1`, [c.id]);
    const left = config.otpMaxAttempts - c.intentos - 1;
    throw fail(left > 0 ? `El código no es correcto. Te queda${left === 1 ? '' : 'n'} ${left} intento${left === 1 ? '' : 's'}.` : 'Demasiados intentos con este código. Pide uno nuevo.');
  }
  // Marcar como usado de forma atómica (evita usar el mismo código dos veces a la vez)
  const used = await query(`UPDATE codigos_verificacion SET usado_en = now() WHERE id = $1 AND usado_en IS NULL RETURNING usuario_id`, [c.id]);
  if (!used.length) throw fail('Ese código ya se usó. Pide uno nuevo.');
  return { userId: c.usuario_id, purpose: c.proposito };
}
