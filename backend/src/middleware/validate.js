import { fieldErrors } from '../../../shared/validation.js';
import { badRequest } from '../lib/errors.js';

/** Valida req.body con un esquema Zod compartido; responde 422 con el error de cada campo. */
export const validate = (schema) => (req, _res, next) => {
  const result = schema.safeParse(req.body ?? {});
  if (!result.success) {
    const errors = fieldErrors(result.error);
    throw badRequest(Object.values(errors)[0] || 'Revisa los datos del formulario.', { fieldErrors: errors });
  }
  req.body = result.data;
  next();
};
