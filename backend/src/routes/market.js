import { Router } from 'express';
import { query } from '../db/index.js';
import { refreshPrices } from '../services/prices.js';
import { notFound } from '../lib/errors.js';

const router = Router();

// Precios públicos (solo lectura): los usa también la landing
router.get('/', async (_req, res) => {
  await refreshPrices();
  const rows = await query(
    `SELECT c.id, c.nombre AS name, c.simbolo AS symbol, c.color, c.activa AS active,
            c.precio_actual::float8 AS price, c.actualizado_en AS "updatedAt",
            COALESCE((SELECT h.precio::float8 FROM historial_precios h
                       WHERE h.cripto_id = c.id AND h.fecha >= now() - interval '24 hours'
                       ORDER BY h.fecha ASC LIMIT 1), c.precio_actual::float8) AS open24h,
            (SELECT MAX(h.precio)::float8 FROM historial_precios h WHERE h.cripto_id = c.id AND h.fecha >= now() - interval '24 hours') AS high24h,
            (SELECT MIN(h.precio)::float8 FROM historial_precios h WHERE h.cripto_id = c.id AND h.fecha >= now() - interval '24 hours') AS low24h,
            (SELECT COALESCE(array_agg(x.precio::float8 ORDER BY x.fecha), '{}') FROM (
               SELECT precio, fecha FROM historial_precios WHERE cripto_id = c.id AND fecha >= now() - interval '24 hours'
               ORDER BY fecha) x) AS spark
       FROM criptomonedas c ORDER BY c.id`,
  );
  res.json({
    coins: rows.map((c) => ({
      ...c,
      high24h: Math.max(c.high24h ?? c.price, c.price),
      low24h: Math.min(c.low24h ?? c.price, c.price),
      change24h: c.open24h ? ((c.price - c.open24h) / c.open24h) * 100 : 0,
      spark: [...(c.spark || []).filter((_, i, a) => i % 3 === 0 || i === a.length - 1), c.price],
    })),
    serverTime: new Date().toISOString(),
  });
});

const RANGES = { '24h': '24 hours', '7d': '7 days' };

router.get('/:symbol/historial', async (req, res) => {
  await refreshPrices();
  const range = RANGES[req.query.rango] ? req.query.rango : '24h';
  const [coin] = await query(`SELECT id, precio_actual::float8 AS price FROM criptomonedas WHERE simbolo = $1`, [
    String(req.params.symbol).toUpperCase(),
  ]);
  if (!coin) throw notFound('Esa moneda no existe.');
  const points = await query(
    `SELECT fecha AS t, precio::float8 AS p FROM historial_precios
      WHERE cripto_id = $1 AND fecha >= now() - $2::interval ORDER BY fecha`,
    [coin.id, RANGES[range]],
  );
  points.push({ t: new Date(), p: coin.price });
  res.json({ range, points });
});

export default router;
