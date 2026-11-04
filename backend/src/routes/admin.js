import { Router } from 'express';
import { query } from '../db/index.js';
import { validate } from '../middleware/validate.js';
import { userStatusSchema, coinToggleSchema } from '../../../shared/validation.js';
import { refreshPrices } from '../services/prices.js';
import { getWallet } from '../services/wallet.js';
import { audit } from '../services/audit.js';
import { listTransactions } from './transactions.js';
import { activityByDay } from './reports.js';
import { notFound, forbidden } from '../lib/errors.js';

const router = Router();

// ---------- Usuarios ----------
router.get('/usuarios', async (req, res) => {
  await refreshPrices();
  const search = String(req.query.q || '').trim();
  const status = ['activo', 'suspendido', 'baja'].includes(req.query.estado) ? req.query.estado : '';
  const rows = await query(
    `SELECT u.id, u.nombre AS name, u.correo AS email, u.rol AS role, u.estado AS status,
            u.creado_en AS "createdAt", u.ultimo_acceso AS "lastLogin",
            COALESCE(b.saldo_usd, 0)::float8 AS balance,
            COALESCE(t.n, 0)::int AS "txCount", COALESCE(t.vol, 0)::float8 AS volume,
            COALESCE((SELECT SUM(p.cantidad * c.precio_actual) FROM portafolio p
                       JOIN criptomonedas c ON c.id = p.cripto_id WHERE p.usuario_id = u.id), 0)::float8 AS "cryptoValue"
       FROM usuarios u
       LEFT JOIN billeteras b ON b.usuario_id = u.id
       LEFT JOIN (SELECT usuario_id, COUNT(*) AS n, SUM(total_usd) AS vol FROM transacciones GROUP BY usuario_id) t
              ON t.usuario_id = u.id
      WHERE ($1::text = '' OR u.nombre ILIKE '%' || $1::text || '%' OR u.correo ILIKE '%' || $1::text || '%')
        AND ($2::text = '' OR u.estado = $2::text)
      ORDER BY u.rol DESC, u.creado_en DESC`,
    [search, status],
  );
  res.json({ items: rows });
});

router.get('/usuarios/:id', async (req, res) => {
  await refreshPrices();
  const id = Number(req.params.id);
  const [u] = await query(
    `SELECT id, nombre AS name, correo AS email, dpi, rol AS role, estado AS status,
            creado_en AS "createdAt", ultimo_acceso AS "lastLogin" FROM usuarios WHERE id = $1`,
    [id],
  );
  if (!u) throw notFound('Ese usuario no existe.');
  const [wallet, txs, log] = await Promise.all([
    getWallet(id),
    listTransactions(id, req.query),
    query(`SELECT accion AS action, ip, fecha AS date FROM auditoria WHERE usuario_id = $1 ORDER BY fecha DESC LIMIT 10`, [id]),
  ]);
  res.json({ user: u, wallet, transactions: txs, audit: log });
});

router.patch('/usuarios/:id/estado', validate(userStatusSchema), async (req, res) => {
  const id = Number(req.params.id);
  if (id === req.user.id) throw forbidden('No puedes cambiar el estado de tu propia cuenta.');
  const [u] = await query(`SELECT id, rol, estado, nombre FROM usuarios WHERE id = $1`, [id]);
  if (!u) throw notFound('Ese usuario no existe.');
  if (u.rol === 'admin') throw forbidden('No se puede cambiar el estado de otro administrador.');
  await query(`UPDATE usuarios SET estado = $1 WHERE id = $2`, [req.body.status, id]);
  const action = { activo: 'REACTIVACION', suspendido: 'SUSPENSION', baja: 'BAJA' }[req.body.status];
  await audit(req.user.id, action, req, { usuarioAfectado: id, antes: u.estado, despues: req.body.status });
  res.json({ id, status: req.body.status, name: u.nombre });
});

// ---------- Monedas ----------
router.patch('/monedas/:id', validate(coinToggleSchema), async (req, res) => {
  const [c] = await query(
    `UPDATE criptomonedas SET activa = $1, actualizado_en = now() WHERE id = $2 RETURNING id, simbolo AS symbol, activa AS active`,
    [req.body.active, Number(req.params.id)],
  );
  if (!c) throw notFound('Esa moneda no existe.');
  await audit(req.user.id, c.active ? 'MONEDA_ACTIVADA' : 'MONEDA_PAUSADA', req, { moneda: c.symbol });
  res.json(c);
});

// ---------- Reportes ----------
router.get('/reportes/resumen', async (_req, res) => {
  await refreshPrices();
  const [[users], [money], [txs], activity] = await Promise.all([
    query(`SELECT COUNT(*) FILTER (WHERE rol = 'usuario')::int AS total,
                  COUNT(*) FILTER (WHERE rol = 'usuario' AND estado = 'activo')::int AS active,
                  COUNT(*) FILTER (WHERE estado = 'suspendido')::int AS suspended,
                  COUNT(*) FILTER (WHERE estado = 'baja')::int AS closed,
                  COUNT(*) FILTER (WHERE rol = 'usuario' AND creado_en >= now() - interval '7 days')::int AS "newThisWeek"
             FROM usuarios`),
    query(`SELECT (SELECT COALESCE(SUM(saldo_usd), 0) FROM billeteras)::float8 AS "walletUsd",
                  (SELECT COALESCE(SUM(p.cantidad * c.precio_actual), 0) FROM portafolio p JOIN criptomonedas c ON c.id = p.cripto_id)::float8 AS "cryptoUsd",
                  (SELECT COALESCE(SUM(monto_usd), 0) FROM recargas WHERE estado = 'aprobada')::float8 AS "rechargedUsd",
                  (SELECT COALESCE(SUM(i.saldo * power(1 + f.rendimiento_anual / 100, EXTRACT(EPOCH FROM (now() - i.actualizado_en)) / 31536000)), 0)
                     FROM inversiones_fondo i JOIN fondos f ON f.id = i.fondo_id)::float8 AS "fundsUsd"`),
    query(`SELECT COUNT(*)::int AS total,
                  COUNT(*) FILTER (WHERE tipo = 'compra')::int AS buys,
                  COUNT(*) FILTER (WHERE tipo = 'venta')::int AS sells,
                  COALESCE(SUM(total_usd) FILTER (WHERE tipo = 'compra'), 0)::float8 AS "buyUsd",
                  COALESCE(SUM(total_usd) FILTER (WHERE tipo = 'venta'), 0)::float8 AS "sellUsd",
                  COUNT(*) FILTER (WHERE fecha >= current_date)::int AS today
             FROM transacciones`),
    activityByDay(30),
  ]);
  res.json({ users, money, transactions: txs, activity });
});

router.get('/reportes/monedas', async (_req, res) => {
  const rows = await query(
    `SELECT c.id, c.nombre AS name, c.simbolo AS symbol, c.color, c.activa AS active, c.precio_actual::float8 AS price,
            COUNT(t.id) FILTER (WHERE t.tipo = 'compra')::int AS buys,
            COUNT(t.id) FILTER (WHERE t.tipo = 'venta')::int AS sells,
            COALESCE(SUM(t.cantidad) FILTER (WHERE t.tipo = 'compra'), 0)::float8 AS "buyQty",
            COALESCE(SUM(t.cantidad) FILTER (WHERE t.tipo = 'venta'), 0)::float8 AS "sellQty",
            COALESCE(SUM(t.total_usd) FILTER (WHERE t.tipo = 'compra'), 0)::float8 AS "buyUsd",
            COALESCE(SUM(t.total_usd) FILTER (WHERE t.tipo = 'venta'), 0)::float8 AS "sellUsd"
       FROM criptomonedas c LEFT JOIN transacciones t ON t.cripto_id = c.id
      GROUP BY c.id ORDER BY c.id`,
  );
  const top = (key) => [...rows].sort((a, b) => b[key] - a[key])[0] || null;
  res.json({ items: rows, mostBought: top('buyUsd'), mostSold: top('sellUsd') });
});

router.get('/reportes/fondos', async (_req, res) => {
  const rows = await query(
    `SELECT f.id, f.nombre AS name, f.slug, f.color, f.rendimiento_anual::float8 AS rate,
            COUNT(DISTINCT i.usuario_id) FILTER (WHERE i.saldo > 0)::int AS investors,
            COALESCE((SELECT SUM(x.saldo * power(1 + f.rendimiento_anual / 100, EXTRACT(EPOCH FROM (now() - x.actualizado_en)) / 31536000))
                        FROM inversiones_fondo x WHERE x.fondo_id = f.id), 0)::float8 AS aum,
            COALESCE((SELECT SUM(m.monto) FROM movimientos_fondo m WHERE m.fondo_id = f.id AND m.tipo = 'deposito'), 0)::float8 AS deposits,
            COALESCE((SELECT SUM(m.monto) FROM movimientos_fondo m WHERE m.fondo_id = f.id AND m.tipo = 'retiro'), 0)::float8 AS withdrawals
       FROM fondos f LEFT JOIN inversiones_fondo i ON i.fondo_id = f.id
      GROUP BY f.id ORDER BY f.rendimiento_anual`,
  );
  res.json({ items: rows });
});

router.get('/reportes/top-usuarios', async (req, res) => {
  const limit = Math.min(50, Math.max(3, Number(req.query.limite) || 10));
  const rows = await query(
    `SELECT u.id, u.nombre AS name, u.correo AS email, u.estado AS status,
            COUNT(t.id)::int AS "txCount",
            COUNT(t.id) FILTER (WHERE t.tipo = 'compra')::int AS buys,
            COUNT(t.id) FILTER (WHERE t.tipo = 'venta')::int AS sells,
            COALESCE(SUM(t.total_usd), 0)::float8 AS volume,
            MAX(t.fecha) AS "lastTx"
       FROM usuarios u JOIN transacciones t ON t.usuario_id = u.id
      GROUP BY u.id ORDER BY "txCount" DESC, volume DESC LIMIT $1`,
    [limit],
  );
  res.json({ items: rows });
});

router.get('/reportes/actividad', async (req, res) => {
  const days = Math.min(90, Math.max(7, Number(req.query.dias) || 30));
  res.json({ items: await activityByDay(days) });
});

router.get('/auditoria', async (_req, res) => {
  const rows = await query(
    `SELECT a.id, a.accion AS action, a.ip, a.detalle AS detail, a.fecha AS date, u.nombre AS "userName"
       FROM auditoria a LEFT JOIN usuarios u ON u.id = a.usuario_id ORDER BY a.fecha DESC LIMIT 50`,
  );
  res.json({ items: rows });
});

export default router;
