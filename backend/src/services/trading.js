// El corazón del simulador: comprar y vender.
// El precio SIEMPRE sale de la base de datos (nunca del navegador) y todo ocurre
// dentro de una transacción con FOR UPDATE: si algo falla, no se descuenta nada.
import { tx } from '../db/index.js';
import { refreshPrices } from './prices.js';
import { HttpError, badRequest, notFound } from '../lib/errors.js';
import { round2, round8, usd, qtyText } from '../lib/money.js';
import { LIMITS } from '../../../shared/validation.js';

async function lockCoin(q, symbol) {
  const [coin] = await q.query(
    `SELECT id, nombre, simbolo, precio_actual::float8 AS price, activa FROM criptomonedas WHERE simbolo = $1`,
    [symbol],
  );
  if (!coin) throw notFound('Esa moneda no existe.');
  if (!coin.activa) throw new HttpError(409, `${coin.simbolo} está pausada por el administrador. Intenta más tarde.`);
  return coin;
}

function toResult(row, coin, balance) {
  return {
    transaction: {
      id: row.id,
      type: row.tipo,
      symbol: coin.simbolo,
      quantity: Number(row.cantidad),
      price: Number(row.precio_unitario),
      total: Number(row.total_usd),
      gain: row.ganancia_usd == null ? null : Number(row.ganancia_usd),
      date: row.fecha,
    },
    balance,
  };
}

export const DECLINED_TEST_CARD = '4000000000000002';

export async function buy(userId, symbol, { quantity, amountUsd, card }) {
  await refreshPrices();
  return tx(async (q) => {
    const coin = await lockCoin(q, symbol);
    const [w] = await q.query(`SELECT saldo_usd::float8 AS bal FROM billeteras WHERE usuario_id = $1 FOR UPDATE`, [userId]);
    // Compra "como en una tienda": si llega un monto en dólares, el servidor calcula la cantidad
    const qty = amountUsd !== undefined ? Math.floor((amountUsd / coin.price) * 1e8) / 1e8 : round8(quantity);
    const total = round2(qty * coin.price);
    if (total < LIMITS.minTradeUsd) throw badRequest(`La compra mínima es de ${usd(LIMITS.minTradeUsd)}.`, { fieldErrors: { quantity: `La compra mínima es de ${usd(LIMITS.minTradeUsd)}.` } });
    if (card) {
      // Pago con tarjeta (simulado): el cobro entra al saldo y se usa en esta misma compra
      const last4 = card.cardNumber.slice(-4);
      if (card.cardNumber === DECLINED_TEST_CARD) {
        throw new HttpError(402, `El banco rechazó la tarjeta terminada en ${last4}. Prueba con otra tarjeta.`, { fieldErrors: { cardNumber: 'Tarjeta rechazada por el banco.' } });
      }
      await q.query(`UPDATE billeteras SET saldo_usd = saldo_usd + $1, actualizado_en = now() WHERE usuario_id = $2`, [total, userId]);
      await q.query(`INSERT INTO recargas (usuario_id, monto_usd, tarjeta_ultimos4, estado) VALUES ($1,$2,$3,'aprobada')`, [userId, total, last4]);
      w.bal = round2(w.bal + total);
    }
    if (total > w.bal) {
      const msg = `Te faltan ${usd(total - w.bal)} para esta compra.`;
      throw badRequest(msg, { fieldErrors: { quantity: msg } });
    }
    await q.query(`UPDATE billeteras SET saldo_usd = saldo_usd - $1, actualizado_en = now() WHERE usuario_id = $2`, [total, userId]);
    await q.query(
      `INSERT INTO portafolio (usuario_id, cripto_id, cantidad, costo_promedio) VALUES ($1,$2,$3,$4)
       ON CONFLICT (usuario_id, cripto_id) DO UPDATE SET
         costo_promedio = CASE WHEN portafolio.cantidad + EXCLUDED.cantidad = 0 THEN EXCLUDED.costo_promedio
           ELSE (portafolio.cantidad * portafolio.costo_promedio + EXCLUDED.cantidad * EXCLUDED.costo_promedio)
                / (portafolio.cantidad + EXCLUDED.cantidad) END,
         cantidad = portafolio.cantidad + EXCLUDED.cantidad`,
      [userId, coin.id, qty, coin.price],
    );
    const [row] = await q.query(
      `INSERT INTO transacciones (usuario_id, cripto_id, tipo, cantidad, precio_unitario, total_usd)
       VALUES ($1,$2,'compra',$3,$4,$5) RETURNING *`,
      [userId, coin.id, qty, coin.price, total],
    );
    return toResult(row, coin, round2(w.bal - total));
  });
}

export async function sell(userId, symbol, { quantity, amountUsd, all }) {
  await refreshPrices();
  return tx(async (q) => {
    const coin = await lockCoin(q, symbol);
    const [pos] = await q.query(
      `SELECT cantidad::float8 AS qty, costo_promedio::float8 AS avg FROM portafolio
        WHERE usuario_id = $1 AND cripto_id = $2 FOR UPDATE`,
      [userId, coin.id],
    );
    if (!pos || pos.qty <= 0) {
      const msg = `No tienes ${coin.simbolo} para vender.`;
      throw badRequest(msg, { fieldErrors: { quantity: msg } });
    }
    const qty = all ? pos.qty : amountUsd !== undefined ? Math.min(pos.qty, Math.ceil((amountUsd / coin.price) * 1e8) / 1e8) : round8(quantity);
    if (amountUsd !== undefined && !all && amountUsd > round2(pos.qty * coin.price) + 0.01) {
      const msg = `Solo tienes ${usd(pos.qty * coin.price)} en ${coin.simbolo}.`;
      throw badRequest(msg, { fieldErrors: { amountUsd: msg } });
    }
    if (qty > pos.qty + 1e-9) {
      const msg = `Solo tienes ${qtyText(pos.qty)} ${coin.simbolo} para vender.`;
      throw badRequest(msg, { fieldErrors: { quantity: msg } });
    }
    const total = round2(qty * coin.price);
    const gain = round2(qty * (coin.price - pos.avg));
    const [w] = await q.query(
      `UPDATE billeteras SET saldo_usd = saldo_usd + $1, actualizado_en = now() WHERE usuario_id = $2
       RETURNING saldo_usd::float8 AS bal`,
      [total, userId],
    );
    const remaining = round8(pos.qty - qty);
    if (remaining <= 0) {
      await q.query(`DELETE FROM portafolio WHERE usuario_id = $1 AND cripto_id = $2`, [userId, coin.id]);
    } else {
      await q.query(`UPDATE portafolio SET cantidad = $1 WHERE usuario_id = $2 AND cripto_id = $3`, [remaining, userId, coin.id]);
    }
    const [row] = await q.query(
      `INSERT INTO transacciones (usuario_id, cripto_id, tipo, cantidad, precio_unitario, total_usd, ganancia_usd)
       VALUES ($1,$2,'venta',$3,$4,$5,$6) RETURNING *`,
      [userId, coin.id, qty, coin.price, total, gain],
    );
    return toResult(row, coin, w.bal);
  });
}
