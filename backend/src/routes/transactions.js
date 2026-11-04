import { Router } from 'express';
import { query } from '../db/index.js';
import { requireTrader } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { tradeSchema } from '../../../shared/validation.js';
import { buy, sell } from '../services/trading.js';
import { audit } from '../services/audit.js';
import { requireOtp } from '../middleware/otp.js';

const router = Router();

router.post('/compra', requireTrader, validate(tradeSchema), requireOtp('crypto-buy'), async (req, res) => {
  const result = await buy(req.user.id, req.body.symbol, req.body);
  audit(req.user.id, 'COMPRA', req, { id: result.transaction.id, total: result.transaction.total }).catch(() => {});
  res.status(201).json(result);
});

router.post('/venta', requireTrader, validate(tradeSchema), requireOtp('crypto-sell'), async (req, res) => {
  const result = await sell(req.user.id, req.body.symbol, req.body);
  audit(req.user.id, 'VENTA', req, { id: result.transaction.id, total: result.transaction.total }).catch(() => {});
  res.status(201).json(result);
});

/** Historial paginado con filtros. Reutilizado por el admin para ver movimientos de un usuario. */
export async function listTransactions(userId, { tipo, cripto, page = 1, pageSize = 15 }) {
  const p = Math.max(1, Number(page) || 1);
  const size = Math.min(100, Math.max(5, Number(pageSize) || 15));
  const type = ['compra', 'venta'].includes(tipo) ? tipo : '';
  const coin = typeof cripto === 'string' ? cripto.toUpperCase() : '';
  const where = `t.usuario_id = $1 AND ($2 = '' OR t.tipo = $2) AND ($3 = '' OR c.simbolo = $3)`;
  const [{ total }] = await query(
    `SELECT COUNT(*)::int AS total FROM transacciones t JOIN criptomonedas c ON c.id = t.cripto_id WHERE ${where}`,
    [userId, type, coin],
  );
  const items = await query(
    `SELECT t.id, t.tipo AS type, c.simbolo AS symbol, c.nombre AS name, c.color,
            t.cantidad::float8 AS quantity, t.precio_unitario::float8 AS price,
            t.total_usd::float8 AS total, t.ganancia_usd::float8 AS gain, t.fecha AS date
       FROM transacciones t JOIN criptomonedas c ON c.id = t.cripto_id
      WHERE ${where} ORDER BY t.fecha DESC, t.id DESC LIMIT $4 OFFSET $5`,
    [userId, type, coin, size, (p - 1) * size],
  );
  return { items, total, page: p, pageSize: size, pages: Math.max(1, Math.ceil(total / size)) };
}

router.get('/', async (req, res) => {
  res.json(await listTransactions(req.user.id, req.query));
});

export default router;
