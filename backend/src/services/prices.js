// Motor de precios simulado.
// En vez de un temporizador fijo (que no existe en Netlify Functions), los precios
// se actualizan cuando alguien los consulta: se calculan los "ticks" de 5 s que
// pasaron desde la última actualización y se aplica un paseo aleatorio por cada uno.
import { tx } from '../db/index.js';
import { config } from '../config.js';
import { round8 } from '../lib/money.js';

const MAX_STEPS = 720; // máximo 1 hora de ticks acumulados
let lastRun = 0;

function step(p, base, vol) {
  const drift = ((base - p) / base) * 0.002; // tira suavemente hacia el precio base
  const next = p * (1 + (Math.random() * 2 - 1) * vol + drift);
  return Math.min(base * 2, Math.max(base * 0.5, next));
}

export async function refreshPrices() {
  const now = Date.now();
  if (now - lastRun < config.priceTickMs - 500) return;
  lastRun = now;

  await tx(async (q) => {
    const coins = await q.query(
      `SELECT id, precio_actual::float8 AS p, precio_base::float8 AS b, volatilidad::float8 AS v,
              (EXTRACT(EPOCH FROM (now() - actualizado_en)) * 1000)::float8 AS ms
         FROM criptomonedas WHERE activa FOR UPDATE`,
    );
    for (const c of coins) {
      const steps = Math.min(Math.floor(c.ms / config.priceTickMs), MAX_STEPS);
      if (steps < 1) continue;
      let p = c.p;
      for (let i = 0; i < steps; i++) p = step(p, c.b, c.v);
      p = round8(p);
      await q.query(`UPDATE criptomonedas SET precio_actual = $1, actualizado_en = now() WHERE id = $2`, [p, c.id]);
      await q.query(
        `INSERT INTO historial_precios (cripto_id, precio)
         SELECT $1, $2 WHERE NOT EXISTS (
           SELECT 1 FROM historial_precios WHERE cripto_id = $1 AND fecha > now() - interval '30 seconds')`,
        [c.id, p],
      );
    }
  });
}
