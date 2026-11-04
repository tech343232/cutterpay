import { Router } from 'express';
import { query, tx } from '../db/index.js';
import { requireTrader } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { rechargeSchema } from '../../../shared/validation.js';
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

router.get('/recargas', async (req, res) => {
  const rows = await query(
    `SELECT id, monto_usd::float8 AS amount, tarjeta_ultimos4 AS last4, estado AS status, fecha AS date
       FROM recargas WHERE usuario_id = $1 ORDER BY fecha DESC LIMIT 20`,
    [req.user.id],
  );
  res.json({ items: rows });
});

export default router;
