import { Router } from 'express';
import { requireAuth, requireTrader } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { fundDepositSchema, fundWithdrawSchema } from '../../../shared/validation.js';
import { listFunds, getUserFunds, deposit, withdraw, listMovements } from '../services/funds.js';
import { audit } from '../services/audit.js';

const router = Router();

// Público: la landing muestra los fondos y la comparación con bancos
router.get('/', async (_req, res) => {
  res.json(await listFunds());
});

router.get('/mios', requireAuth, async (req, res) => {
  res.json(await getUserFunds(req.user.id));
});

router.get('/movimientos', requireAuth, async (req, res) => {
  res.json({ items: await listMovements(req.user.id) });
});

router.post('/:slug/invertir', requireAuth, requireTrader, validate(fundDepositSchema), async (req, res) => {
  const result = await deposit(req.user.id, req.params.slug, req.body.amount);
  audit(req.user.id, 'FONDO_DEPOSITO', req, { fondo: req.params.slug, monto: result.amount }).catch(() => {});
  res.status(201).json(result);
});

router.post('/:slug/retirar', requireAuth, requireTrader, validate(fundWithdrawSchema), async (req, res) => {
  const result = await withdraw(req.user.id, req.params.slug, req.body);
  audit(req.user.id, 'FONDO_RETIRO', req, { fondo: req.params.slug, monto: result.amount }).catch(() => {});
  res.status(201).json(result);
});

export default router;
