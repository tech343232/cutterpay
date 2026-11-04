// Perfil del usuario: verificación de identidad con DPI (se pide al retirar dinero).
import { Router } from 'express';
import { query } from '../db/index.js';
import { validate } from '../middleware/validate.js';
import { dpiSchema } from '../../../shared/validation.js';
import { badRequest } from '../lib/errors.js';
import { audit } from '../services/audit.js';

const router = Router();

router.post('/dpi', validate(dpiSchema), async (req, res) => {
  const { dpi } = req.body;
  const [taken] = await query(`SELECT id FROM usuarios WHERE dpi = $1 AND id <> $2`, [dpi, req.user.id]);
  if (taken) {
    const msg = 'Ese DPI ya está registrado en otra cuenta.';
    throw badRequest(msg, { fieldErrors: { dpi: msg } });
  }
  await query(`UPDATE usuarios SET dpi = $1 WHERE id = $2`, [dpi, req.user.id]);
  await audit(req.user.id, 'DPI_VERIFICADO', req, { ultimos4: dpi.slice(-4) });
  res.json({ ok: true, hasDpi: true });
});

// La guía de bienvenida se muestra una sola vez
router.post('/onboarding', async (req, res) => {
  await query(`UPDATE usuarios SET onboarding_completado = TRUE WHERE id = $1`, [req.user.id]);
  res.json({ ok: true });
});

export default router;
