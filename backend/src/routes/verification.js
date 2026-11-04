// Pide el código del correo para autorizar una operación con dinero.
import { Router } from 'express';
import { z } from 'zod';
import { validate } from '../middleware/validate.js';
import { requireTrader } from '../middleware/auth.js';
import { forbidden } from '../lib/errors.js';
import { operationPayload } from '../middleware/otp.js';
import { createChallenge, resendChallenge } from '../services/otp.js';
import { tradeSchema, fundDepositSchema, fundWithdrawSchema, cashOutSchema, fieldErrors } from '../../../shared/validation.js';
import { query } from '../db/index.js';
import { badRequest } from '../lib/errors.js';
import { usd } from '../lib/money.js';

const router = Router();

const SCHEMAS = {
  'crypto-buy': tradeSchema,
  'crypto-sell': tradeSchema,
  'fund-invest': fundDepositSchema,
  'fund-withdraw': fundWithdrawSchema,
  'cash-out': cashOutSchema,
};

function describe(action, p) {
  const amount = p.all ? 'todo tu saldo' : usd(p.amountUsd ?? p.amount ?? 0);
  return {
    'crypto-buy': `Compra de ${p.symbol} por ${amount}${p.card ? ` con tarjeta ····${p.card}` : ''}`,
    'crypto-sell': `Venta de ${p.symbol} por ${amount}`,
    'fund-invest': `Inversión de ${amount} en un fondo`,
    'fund-withdraw': `Retiro de ${amount} de un fondo`,
    'cash-out': `Retiro de ${amount} de tu saldo`,
  }[action];
}

const bodySchema = z.object({
  action: z.enum(['crypto-buy', 'crypto-sell', 'fund-invest', 'fund-withdraw', 'cash-out']),
  slug: z.string().optional(),
  payload: z.record(z.any()),
});

router.post('/operacion', requireTrader, validate(bodySchema), async (req, res) => {
  const { action, slug, payload } = req.body;
  if ((action === 'fund-withdraw' || action === 'cash-out') && !req.user.dpi) {
    throw forbidden('Para retirar dinero primero verifica tu identidad con tu DPI.', { code: 'DPI_REQUIRED' });
  }
  const parsed = SCHEMAS[action].safeParse(payload);
  if (!parsed.success) {
    const errs = fieldErrors(parsed.error);
    throw badRequest(Object.values(errs)[0], { fieldErrors: errs });
  }
  const p = operationPayload(action, { params: { slug }, body: parsed.data });
  const [user] = await query(`SELECT id, nombre, correo FROM usuarios WHERE id = $1`, [req.user.id]);
  res.json(await createChallenge({ user, purpose: 'operacion', action, payload: p, detail: describe(action, p) }));
});

router.post('/reenviar', validate(z.object({ challengeId: z.string().uuid() })), async (req, res) => {
  res.json(await resendChallenge(req.body.challengeId));
});

export default router;
