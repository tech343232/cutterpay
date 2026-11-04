// Exige el código del correo para operaciones con dinero (compra, venta, invertir y retirar).
// El navegador manda el código en cabeceras: x-cp-desafio (id) y x-cp-codigo (6 dígitos).
import { verifyChallenge } from '../services/otp.js';
import { HttpError } from '../lib/errors.js';

/** Lo que se autoriza: moneda o fondo + monto. Se calcula igual al pedir el código y al confirmarlo. */
export function operationPayload(action, { params = {}, body = {} }) {
  const p = {};
  if (action.startsWith('crypto')) p.symbol = String(body.symbol || '').toUpperCase();
  else p.slug = String(params.slug || body.slug || '');
  for (const k of ['amountUsd', 'amount', 'quantity']) if (body[k] !== undefined) p[k] = Number(body[k]);
  if (body.all) p.all = true;
  return p;
}

export const requireOtp = (action) => async (req, _res, next) => {
  const challengeId = req.get('x-cp-desafio');
  const code = req.get('x-cp-codigo');
  if (!challengeId || !code) {
    throw new HttpError(428, 'Confirma esta operación con el código que te enviamos al correo.', { code: 'OTP_REQUIRED' });
  }
  await verifyChallenge({
    challengeId,
    code,
    purposes: ['operacion'],
    userId: req.user.id,
    action,
    payload: operationPayload(action, req),
  });
  next();
};
