import { Router } from 'express';
import { query, tx } from '../db/index.js';
import { requireTrader } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { rechargeSchema, cashOutSchema } from '../../../shared/validation.js';
import crypto from 'node:crypto';
import { requireDpi } from '../middleware/auth.js';
import { requireOtp } from '../middleware/otp.js';
import { badRequest } from '../lib/errors.js';
import { usd } from '../lib/money.js';
import { refreshPrices } from '../services/prices.js';
import { getWallet } from '../services/wallet.js';
import { audit } from '../services/audit.js';
import { HttpError } from '../lib/errors.js';
import { round2 } from '../lib/money.js';

const router = Router();
const DECLINED_TEST_CARD = '4000000000000002';
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

router.get('/', async (req, res) => {
  await refreshPrices();
  res.json(await getWallet(req.user.id));
});

// Pasarela de pago SIMULADA: no se cobra dinero real ni se guarda la tarjeta completa.
router.post('/recargar', requireTrader, validate(rechargeSchema), async (req, res) => {
  const { amount, cardNumber } = req.body;
  const last4 = cardNumber.slice(-4);
  await sleep(900); // simula la respuesta del banco

  if (cardNumber === DECLINED_TEST_CARD) {
    await query(`INSERT INTO recargas (usuario_id, monto_usd, tarjeta_ultimos4, estado) VALUES ($1,$2,$3,'rechazada')`, [req.user.id, amount, last4]);
    await audit(req.user.id, 'RECARGA_RECHAZADA', req, { monto: amount, tarjeta: last4 });
    throw new HttpError(402, 'El banco rechazó la tarjeta terminada en ' + last4 + '. Prueba con otra tarjeta.');
  }

  const balance = await tx(async (q) => {
    const [w] = await q.query(
      `UPDATE billeteras SET saldo_usd = saldo_usd + $1, actualizado_en = now() WHERE usuario_id = $2 RETURNING saldo_usd::float8 AS bal`,
      [round2(amount), req.user.id],
    );
    await q.query(`INSERT INTO recargas (usuario_id, monto_usd, tarjeta_ultimos4, estado) VALUES ($1,$2,$3,'aprobada')`, [req.user.id, amount, last4]);
    await audit(req.user.id, 'RECARGA', req, { monto: amount, tarjeta: last4 }, q);
    return w.bal;
  });
  res.status(201).json({ balance, amount, last4 });
});

// Retirar dinero (simulado): requiere DPI verificado y el código del correo
router.post('/retirar', requireTrader, requireDpi, validate(cashOutSchema), requireOtp('cash-out'), async (req, res) => {
  const b = req.body;
  const amount = round2(b.amount);
  const destino =
    b.method === 'billetera' ? `Billetera digital ····${b.phone.slice(-4)}`
    : b.method === 'banco' ? `${b.bank} ····${b.account.slice(-4)}`
    : 'Efectivo en cajero sin tarjeta';
  // Para cajero: código de retiro de 8 dígitos + PIN de 4, válidos 24 horas
  const code = b.method === 'cajero' ? String(crypto.randomInt(0, 1e8)).padStart(8, '0') : null;
  const pin = b.method === 'cajero' ? String(crypto.randomInt(0, 1e4)).padStart(4, '0') : null;

  const out = await tx(async (q) => {
    const [w] = await q.query(`SELECT saldo_usd::float8 AS bal FROM billeteras WHERE usuario_id = $1 FOR UPDATE`, [req.user.id]);
    if (amount > w.bal) {
      const msg = `Solo tienes ${usd(w.bal)} disponibles para retirar.`;
      throw badRequest(msg, { fieldErrors: { amount: msg } });
    }
    const [nw] = await q.query(
      `UPDATE billeteras SET saldo_usd = saldo_usd - $1, actualizado_en = now() WHERE usuario_id = $2 RETURNING saldo_usd::float8 AS bal`,
      [amount, req.user.id],
    );
    const [r] = await q.query(
      `INSERT INTO retiros (usuario_id, metodo, monto_usd, destino, codigo_retiro, pin, vence_en)
       VALUES ($1,$2,$3,$4,$5,$6,$7)
       RETURNING id, fecha, vence_en`,
      [req.user.id, b.method, amount, destino, code, pin, code ? new Date(Date.now() + 24 * 3600 * 1000).toISOString() : null],
    );
    await audit(req.user.id, 'RETIRO', req, { metodo: b.method, monto: amount, destino }, q);
    return { id: r.id, date: r.fecha, expiresAt: r.vence_en, balance: nw.bal };
  });
  res.status(201).json({ ...out, method: b.method, amount, destination: destino, code, pin });
});

router.get('/retiros', async (req, res) => {
  const rows = await query(
    `SELECT id, metodo AS method, monto_usd::float8 AS amount, destino AS destination, codigo_retiro AS code, pin,
            vence_en AS "expiresAt", estado AS status, fecha AS date
       FROM retiros WHERE usuario_id = $1 ORDER BY fecha DESC LIMIT 20`,
    [req.user.id],
  );
  res.json({ items: rows });
});

router.get('/recargas', async (req, res) => {
  const rows = await query(
    `SELECT id, monto_usd::float8 AS amount, tarjeta_ultimos4 AS last4, estado AS status, fecha AS date
       FROM recargas WHERE usuario_id = $1 ORDER BY fecha DESC LIMIT 20`,
    [req.user.id],
  );
  res.json({ items: rows });
});

export default router;
