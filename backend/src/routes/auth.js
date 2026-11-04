import { Router } from 'express';
import bcrypt from 'bcryptjs';
import rateLimit from 'express-rate-limit';
import { query, tx } from '../db/index.js';
import { config } from '../config.js';
import { validate } from '../middleware/validate.js';
import { requireAuth, signToken } from '../middleware/auth.js';
import { registerSchema, loginSchema } from '../../../shared/validation.js';
import { HttpError, badRequest, forbidden } from '../lib/errors.js';
import { audit } from '../services/audit.js';
import { createChallenge, verifyChallenge, resendChallenge } from '../services/otp.js';
import { z } from 'zod';

const router = Router();

// Máximo 30 intentos de login/registro por IP cada 15 minutos
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 30,
  standardHeaders: true,
  legacyHeaders: false,
  // En Netlify la IP llega por cabecera; si faltara, no se rompe la petición
  keyGenerator: (req) => req.ip || req.get('x-nf-client-connection-ip') || 'sin-ip',
  validate: false,
  message: { error: 'Demasiadas solicitudes desde tu red. Espera unos minutos e intenta de nuevo.' },
});

const publicUser = (u) => ({ id: u.id, name: u.nombre, email: u.correo, role: u.rol, status: u.estado });

router.post('/registro', authLimiter, validate(registerSchema), async (req, res) => {
  const { name, email, dpi, password } = req.body;
  const [exists] = await query(`SELECT 1 FROM usuarios WHERE correo = $1`, [email]);
  if (exists) {
    const msg = 'Ese correo ya tiene una cuenta. ¿Quieres iniciar sesión?';
    throw badRequest(msg, { fieldErrors: { email: msg } });
  }
  const hash = await bcrypt.hash(password, 10);
  const user = await tx(async (q) => {
    const [u] = await q.query(
      `INSERT INTO usuarios (nombre, correo, password_hash, dpi, ultimo_acceso) VALUES ($1,$2,$3,$4, now()) RETURNING *`,
      [name, email, hash, dpi || null],
    );
    await q.query(`INSERT INTO billeteras (usuario_id, saldo_usd) VALUES ($1,$2)`, [u.id, config.initialBalance]);
    await audit(u.id, 'REGISTRO', req, { saldoInicial: config.initialBalance }, q);
    return u;
  });
  // La cuenta queda creada; para entrar hay que confirmar el correo con el código
  res.status(201).json(await createChallenge({ user, purpose: 'registro' }));
});

router.post('/login', authLimiter, validate(loginSchema), async (req, res) => {
  const { email, password } = req.body;
  const [u] = await query(
    `SELECT *, (bloqueado_hasta > now()) AS bloqueado,
            CEIL(EXTRACT(EPOCH FROM (bloqueado_hasta - now())) / 60)::int AS minutos
       FROM usuarios WHERE correo = $1`,
    [email],
  );
  const wrong = new HttpError(401, 'Correo o contraseña incorrectos.');
  if (!u) throw wrong;
  if (u.bloqueado) {
    throw new HttpError(429, `Demasiados intentos. Vuelve a intentar en ${u.minutos} minuto${u.minutos === 1 ? '' : 's'}.`);
  }
  const ok = await bcrypt.compare(password, u.password_hash);
  if (!ok) {
    const attempts = u.intentos_fallidos + 1;
    if (attempts >= config.maxLoginAttempts) {
      await query(
        `UPDATE usuarios SET intentos_fallidos = 0, bloqueado_hasta = now() + ($2 || ' minutes')::interval WHERE id = $1`,
        [u.id, String(config.lockMinutes)],
      );
      await audit(u.id, 'BLOQUEO_LOGIN', req, { intentos: attempts });
      throw new HttpError(429, `Demasiados intentos. Vuelve a intentar en ${config.lockMinutes} minutos.`);
    }
    await query(`UPDATE usuarios SET intentos_fallidos = $2 WHERE id = $1`, [u.id, attempts]);
    await audit(u.id, 'LOGIN_FALLIDO', req, { intentos: attempts });
    const left = config.maxLoginAttempts - attempts;
    throw new HttpError(401, `Correo o contraseña incorrectos. Te quedan ${left} intento${left === 1 ? '' : 's'}.`);
  }
  if (u.estado === 'suspendido') throw forbidden('Tu cuenta está suspendida. Contacta al administrador.', { code: 'ACCOUNT_SUSPENDED' });
  if (u.estado === 'baja') throw forbidden('Esta cuenta fue dada de baja.', { code: 'ACCOUNT_CLOSED' });

  await query(`UPDATE usuarios SET intentos_fallidos = 0, bloqueado_hasta = NULL WHERE id = $1`, [u.id]);
  // Contraseña correcta: segundo paso con el código enviado al correo
  res.json(await createChallenge({ user: u, purpose: 'login' }));
});

const verifySchema = z.object({ challengeId: z.string().uuid('Vuelve a empezar.'), code: z.string() });

// Paso 2 del login y del registro: código del correo → sesión
router.post('/verificar', authLimiter, validate(verifySchema), async (req, res) => {
  const { userId, purpose } = await verifyChallenge({ ...req.body, purposes: ['registro', 'login'] });
  const [u] = await query(`UPDATE usuarios SET correo_verificado = TRUE, ultimo_acceso = now() WHERE id = $1 RETURNING *`, [userId]);
  if (u.estado === 'suspendido') throw forbidden('Tu cuenta está suspendida. Contacta al administrador.', { code: 'ACCOUNT_SUSPENDED' });
  if (u.estado === 'baja') throw forbidden('Esta cuenta fue dada de baja.', { code: 'ACCOUNT_CLOSED' });
  await audit(u.id, purpose === 'registro' ? 'CORREO_VERIFICADO' : 'LOGIN', req);
  res.json({ token: signToken(u), user: publicUser(u), firstTime: purpose === 'registro' });
});

router.post('/reenviar', authLimiter, validate(z.object({ challengeId: z.string().uuid() })), async (req, res) => {
  res.json(await resendChallenge(req.body.challengeId));
});

router.get('/yo', requireAuth, (req, res) => {
  res.json({ user: publicUser(req.user) });
});

export default router;
