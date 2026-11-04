import jwt from 'jsonwebtoken';
import { config } from '../config.js';
import { query } from '../db/index.js';
import { HttpError, forbidden } from '../lib/errors.js';

export function signToken(user) {
  return jwt.sign({ sub: user.id, role: user.rol }, config.jwtSecret, { expiresIn: config.jwtExpires });
}

/** Exige un token válido y revisa el estado de la cuenta EN LA BASE en cada petición. */
export async function requireAuth(req, _res, next) {
  const header = req.get('authorization') || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  if (!token) throw new HttpError(401, 'Inicia sesión para continuar.');
  let payload;
  try {
    payload = jwt.verify(token, config.jwtSecret);
  } catch (e) {
    throw new HttpError(401, e.name === 'TokenExpiredError' ? 'Tu sesión expiró. Inicia sesión otra vez.' : 'Inicia sesión para continuar.');
  }
  const [user] = await query(`SELECT id, nombre, correo, rol, estado, dpi, onboarding_completado FROM usuarios WHERE id = $1`, [payload.sub]);
  if (!user) throw new HttpError(401, 'Inicia sesión para continuar.');
  if (user.estado === 'suspendido') throw forbidden('Tu cuenta está suspendida. Contacta al administrador.', { code: 'ACCOUNT_SUSPENDED' });
  if (user.estado === 'baja') throw forbidden('Esta cuenta fue dada de baja.', { code: 'ACCOUNT_CLOSED' });
  req.user = user;
  next();
}

export function requireAdmin(req, _res, next) {
  if (req.user?.rol !== 'admin') throw forbidden('Esta sección es solo para administradores.');
  next();
}

/** Para retirar dinero hay que haber verificado la identidad con el DPI. */
export function requireDpi(req, _res, next) {
  if (!req.user?.dpi) throw forbidden('Para retirar dinero primero verifica tu identidad con tu DPI.', { code: 'DPI_REQUIRED' });
  next();
}

export function requireTrader(req, _res, next) {
  if (req.user?.rol === 'admin') throw forbidden('La cuenta de administrador no opera monedas. Usa una cuenta de usuario.');
  next();
}
