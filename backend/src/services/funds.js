// Fondos con rendimiento efectivo anual (simulado).
// El saldo crece con interés compuesto continuo: valor = saldo × (1 + tasa)^(años transcurridos).
// Solo se guarda el saldo y la fecha de la última actualización; el valor de "ahora" se calcula al leer.
import { query, tx } from '../db/index.js';
import { HttpError, badRequest, notFound } from '../lib/errors.js';
import { round2, usd } from '../lib/money.js';

const YEAR_SEC = 365 * 24 * 3600;

export const growth = (saldo, ratePct, seconds) => saldo * Math.pow(1 + ratePct / 100, seconds / YEAR_SEC);
/** Cuánto gana por segundo ese saldo (para que el contador del navegador avance en vivo). */
export const perSecond = (value, ratePct) => (value * Math.log(1 + ratePct / 100)) / YEAR_SEC;

export async function listFunds() {
  const [funds, rates] = await Promise.all([
    query(
      `SELECT f.id, f.nombre AS name, f.slug, f.descripcion AS description, f.rendimiento_anual::float8 AS rate,
              f.riesgo AS risk, f.color, f.activo AS active,
              COUNT(i.usuario_id)::int AS investors
         FROM fondos f LEFT JOIN inversiones_fondo i ON i.fondo_id = f.id AND i.saldo > 0
        GROUP BY f.id ORDER BY f.rendimiento_anual`,
    ),
    query(`SELECT producto AS product, tasa_anual::float8 AS rate, nota AS note FROM tasas_referencia ORDER BY tasa_anual DESC`),
  ]);
  return { funds, referenceRates: rates };
}

/** Posiciones del usuario en cada fondo, valuadas a este segundo. */
export async function getUserFunds(userId, q = null) {
  const run = q ? q.query : query;
  const rows = await run(
    `SELECT f.id AS "fundId", f.slug, f.nombre AS name, f.color, f.rendimiento_anual::float8 AS rate,
            i.saldo::float8 AS saldo, i.aportado::float8 AS invested,
            EXTRACT(EPOCH FROM (now() - i.actualizado_en))::float8 AS sec
       FROM inversiones_fondo i JOIN fondos f ON f.id = i.fondo_id
      WHERE i.usuario_id = $1 AND i.saldo > 0 ORDER BY f.rendimiento_anual`,
    [userId],
  );
  const positions = rows.map((r) => {
    const value = growth(r.saldo, r.rate, Math.max(0, r.sec));
    return {
      fundId: r.fundId, slug: r.slug, name: r.name, color: r.color, rate: r.rate,
      invested: r.invested,
      value,
      gain: value - r.invested,
      perSecond: perSecond(value, r.rate),
    };
  });
  const value = positions.reduce((a, p) => a + p.value, 0);
  const invested = positions.reduce((a, p) => a + p.invested, 0);
  return {
    positions,
    value,
    invested,
    gain: value - invested,
    perSecond: positions.reduce((a, p) => a + p.perSecond, 0),
    serverTime: new Date().toISOString(),
  };
}

async function lockPosition(q, userId, slug) {
  const [fund] = await q.query(`SELECT id, nombre, rendimiento_anual::float8 AS rate, activo FROM fondos WHERE slug = $1`, [slug]);
  if (!fund) throw notFound('Ese fondo no existe.');
  const [pos] = await q.query(
    `SELECT saldo::float8 AS saldo, aportado::float8 AS invested,
            EXTRACT(EPOCH FROM (now() - actualizado_en))::float8 AS sec
       FROM inversiones_fondo WHERE usuario_id = $1 AND fondo_id = $2 FOR UPDATE`,
    [userId, fund.id],
  );
  const value = pos ? growth(pos.saldo, fund.rate, Math.max(0, pos.sec)) : 0;
  return { fund, pos, value };
}

export async function deposit(userId, slug, amount) {
  return tx(async (q) => {
    const { fund, pos, value } = await lockPosition(q, userId, slug);
    if (!fund.activo) throw new HttpError(409, `${fund.nombre} no está recibiendo dinero por ahora.`);
    const [w] = await q.query(`SELECT saldo_usd::float8 AS bal FROM billeteras WHERE usuario_id = $1 FOR UPDATE`, [userId]);
    const amt = round2(amount);
    if (amt > w.bal) {
      const msg = `Te faltan ${usd(amt - w.bal)}. Tu saldo disponible es ${usd(w.bal)}.`;
      throw badRequest(msg, { fieldErrors: { amount: msg } });
    }
    const newSaldo = value + amt;
    const newInvested = round2((pos?.invested ?? 0) + amt);
    await q.query(
      `INSERT INTO inversiones_fondo (usuario_id, fondo_id, saldo, aportado, actualizado_en) VALUES ($1,$2,$3,$4, now())
       ON CONFLICT (usuario_id, fondo_id) DO UPDATE SET saldo = EXCLUDED.saldo, aportado = EXCLUDED.aportado, actualizado_en = now()`,
      [userId, fund.id, newSaldo, newInvested],
    );
    const [nw] = await q.query(
      `UPDATE billeteras SET saldo_usd = saldo_usd - $1, actualizado_en = now() WHERE usuario_id = $2 RETURNING saldo_usd::float8 AS bal`,
      [amt, userId],
    );
    await q.query(`INSERT INTO movimientos_fondo (usuario_id, fondo_id, tipo, monto) VALUES ($1,$2,'deposito',$3)`, [userId, fund.id, amt]);
    return { fund: fund.nombre, amount: amt, fundValue: newSaldo, balance: nw.bal, yearlyGain: round2(amt * (fund.rate / 100)) };
  });
}

export async function withdraw(userId, slug, { amount, all }) {
  return tx(async (q) => {
    const { fund, pos, value } = await lockPosition(q, userId, slug);
    if (!pos || value < 0.01) {
      const msg = `No tienes dinero en ${fund.nombre}.`;
      throw badRequest(msg, { fieldErrors: { amount: msg } });
    }
    const available = Math.floor(value * 100) / 100;
    const amt = all ? available : round2(amount);
    if (amt > available + 0.001) {
      const msg = `Solo tienes ${usd(available)} en ${fund.nombre}.`;
      throw badRequest(msg, { fieldErrors: { amount: msg } });
    }
    const remaining = Math.max(0, value - amt);
    // La parte aportada baja en la misma proporción que el saldo
    const remainingInvested = round2(pos.invested * (remaining / value));
    const gain = round2(amt - (pos.invested - remainingInvested));
    if (remaining < 0.005) {
      await q.query(`DELETE FROM inversiones_fondo WHERE usuario_id = $1 AND fondo_id = $2`, [userId, fund.id]);
    } else {
      await q.query(
        `UPDATE inversiones_fondo SET saldo = $1, aportado = $2, actualizado_en = now() WHERE usuario_id = $3 AND fondo_id = $4`,
        [remaining, remainingInvested, userId, fund.id],
      );
    }
    const [nw] = await q.query(
      `UPDATE billeteras SET saldo_usd = saldo_usd + $1, actualizado_en = now() WHERE usuario_id = $2 RETURNING saldo_usd::float8 AS bal`,
      [amt, userId],
    );
    await q.query(`INSERT INTO movimientos_fondo (usuario_id, fondo_id, tipo, monto, ganancia) VALUES ($1,$2,'retiro',$3,$4)`, [
      userId, fund.id, amt, gain,
    ]);
    return { fund: fund.nombre, amount: amt, gain, fundValue: remaining, balance: nw.bal };
  });
}

export async function listMovements(userId, limit = 50) {
  return query(
    `SELECT m.id, m.tipo AS type, m.monto::float8 AS amount, m.ganancia::float8 AS gain, m.fecha AS date,
            f.nombre AS fund, f.slug, f.color
       FROM movimientos_fondo m JOIN fondos f ON f.id = m.fondo_id
      WHERE m.usuario_id = $1 ORDER BY m.fecha DESC LIMIT $2`,
    [userId, limit],
  );
}
