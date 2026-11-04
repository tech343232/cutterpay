import { query } from '../db/index.js';
import { round2 } from '../lib/money.js';
import { getUserFunds } from './funds.js';

/** Saldo + cripto + fondos, todo valuado a este momento. */
export async function getWallet(userId) {
  const [[w], rows, funds] = await Promise.all([
    query(`SELECT saldo_usd::float8 AS balance FROM billeteras WHERE usuario_id = $1`, [userId]),
    query(
      `SELECT c.simbolo AS symbol, c.nombre AS name, c.color, c.precio_actual::float8 AS price,
              p.cantidad::float8 AS quantity, p.costo_promedio::float8 AS "avgCost"
         FROM portafolio p JOIN criptomonedas c ON c.id = p.cripto_id
        WHERE p.usuario_id = $1 AND p.cantidad > 0 ORDER BY c.id`,
      [userId],
    ),
    getUserFunds(userId),
  ]);
  const holdings = rows.map((h) => {
    const value = round2(h.quantity * h.price);
    const cost = round2(h.quantity * h.avgCost);
    return { ...h, value, cost, pnl: round2(value - cost), pnlPct: cost > 0 ? ((value - cost) / cost) * 100 : 0 };
  });
  const cryptoValue = round2(holdings.reduce((a, h) => a + h.value, 0));
  const invested = round2(holdings.reduce((a, h) => a + h.cost, 0));
  const balance = w?.balance ?? 0;
  return {
    balance,
    holdings,
    cryptoValue,
    invested,
    unrealized: round2(cryptoValue - invested),
    funds,
    fundsValue: funds.value,
    totalValue: round2(balance + cryptoValue + funds.value),
  };
}
