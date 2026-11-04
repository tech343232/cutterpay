// Reportes personales del usuario (historial por usuario, balance general y gráficas)
import { Router } from 'express';
import { query } from '../db/index.js';
import { refreshPrices } from '../services/prices.js';
import { getWallet } from '../services/wallet.js';

const router = Router();

export async function activityByDay(days, userId = null) {
  return query(
    `SELECT to_char(d.dia, 'YYYY-MM-DD') AS day,
            COUNT(t.id) FILTER (WHERE t.tipo = 'compra')::int AS buys,
            COUNT(t.id) FILTER (WHERE t.tipo = 'venta')::int AS sells,
            COALESCE(SUM(t.total_usd) FILTER (WHERE t.tipo = 'compra'), 0)::float8 AS "buyUsd",
            COALESCE(SUM(t.total_usd) FILTER (WHERE t.tipo = 'venta'), 0)::float8 AS "sellUsd"
       FROM generate_series(current_date - ($1::int - 1), current_date, interval '1 day') AS d(dia)
       LEFT JOIN transacciones t ON t.fecha::date = d.dia::date AND ($2::int IS NULL OR t.usuario_id = $2::int)
      GROUP BY d.dia ORDER BY d.dia`,
    [days, userId],
  );
}

router.get('/mios', async (req, res) => {
  await refreshPrices();
  const uid = req.user.id;
  const days = Math.min(90, Math.max(7, Number(req.query.dias) || 30));
  const [wallet, activity, byCoin, [totals], recharges] = await Promise.all([
    getWallet(uid),
    activityByDay(days, uid),
    query(
      `SELECT c.simbolo AS symbol, c.color,
              COALESCE(SUM(t.total_usd) FILTER (WHERE t.tipo = 'compra'), 0)::float8 AS "buyUsd",
              COALESCE(SUM(t.total_usd) FILTER (WHERE t.tipo = 'venta'), 0)::float8 AS "sellUsd",
              COUNT(t.id)::int AS count
         FROM criptomonedas c LEFT JOIN transacciones t ON t.cripto_id = c.id AND t.usuario_id = $1
        GROUP BY c.id ORDER BY c.id`,
      [uid],
    ),
    query(
      `SELECT COUNT(*)::int AS count,
              COUNT(*) FILTER (WHERE tipo = 'compra')::int AS buys,
              COUNT(*) FILTER (WHERE tipo = 'venta')::int AS sells,
              COALESCE(SUM(ganancia_usd), 0)::float8 AS realized
         FROM transacciones WHERE usuario_id = $1`,
      [uid],
    ),
    query(`SELECT COALESCE(SUM(monto_usd), 0)::float8 AS total FROM recargas WHERE usuario_id = $1 AND estado = 'aprobada'`, [uid]),
  ]);
  const [fundGains] = await query(`SELECT COALESCE(SUM(ganancia), 0)::float8 AS realized FROM movimientos_fondo WHERE usuario_id = $1 AND tipo = 'retiro'`, [uid]);
  res.json({
    wallet,
    activity,
    byCoin,
    totals: { ...totals, recharged: recharges[0].total, fundsRealized: fundGains.realized },
  });
});

export default router;
