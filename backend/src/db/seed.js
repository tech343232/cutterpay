// Datos iniciales: 3 monedas con 7 días de historial, un admin, Sofía y
// varios usuarios demo con transacciones reales para que los reportes tengan datos.
import bcrypt from 'bcryptjs';
import { config } from '../config.js';
import { round2, round8 } from '../lib/money.js';

// PRNG determinístico: el seed siempre genera los mismos datos
function mulberry32(a) {
  return () => {
    a |= 0; a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export const COINS = [
  { name: 'Bitcoin', symbol: 'BTC', color: '#F7931A', base: 68420.5, vol: 0.004 },
  { name: 'Ethereum', symbol: 'ETH', color: '#627EEA', base: 3512.8, vol: 0.006 },
  { name: 'Dogecoin', symbol: 'DOGE', color: '#C2A633', base: 0.1642, vol: 0.012 },
];

export const FUNDS = [
  {
    name: 'Ahorro Flexible', slug: 'flexible', rate: 5.5, risk: 'bajo', color: '#4FD1A5',
    desc: 'Tu dinero crece todos los días y lo retiras cuando quieras, sin plazos ni multas.',
  },
  {
    name: 'Meta Plus', slug: 'plus', rate: 7.25, risk: 'bajo', color: '#9B8CFF',
    desc: 'Para una meta de algunos meses. Rinde más que el ahorro flexible y también lo retiras cuando quieras.',
  },
  {
    name: 'Crecimiento', slug: 'crecimiento', rate: 9.5, risk: 'medio', color: '#FF6FB5',
    desc: 'Para pensar a largo plazo. En la vida real su rendimiento puede variar; aquí es fijo para que aprendas.',
  },
];

// Tasas referenciales para comparar (aproximadas, con fines educativos)
export const REFERENCE_RATES = [
  { product: 'Cuenta de ahorro en dólares', rate: 0.75, note: 'Promedio referencial aproximado de bancos en Guatemala. Varía según el banco.' },
  { product: 'Plazo fijo en dólares (12 meses)', rate: 3.5, note: 'Referencial aproximado. Tu dinero queda congelado hasta que termina el plazo.' },
  { product: 'Dinero guardado en casa', rate: 0, note: 'No gana nada y con la inflación pierde valor cada año.' },
];

const DAY = 86400000;
const STEP = 30 * 60 * 1000; // un punto cada 30 min
const DAYS = 7;

const USERS = [
  { name: 'Sofía del Carmen Ramírez Sagastume', email: 'sofia@cutterpay.com', password: 'Sofia#Cutter2025-Invierte!', dpi: '3012456780101', trades: 'sofia' },
  { name: 'Andrea Lucía López', email: 'andrea@cutterpay.com', password: 'Demo1234!', trades: 18 },
  { name: 'Mariana Pérez Gómez', email: 'mariana@cutterpay.com', password: 'Demo1234!', trades: 11 },
  { name: 'Diego Morales', email: 'diego@cutterpay.com', password: 'Demo1234!', trades: 24 },
  { name: 'Lucía Herrera', email: 'lucia@cutterpay.com', password: 'Demo1234!', trades: 7 },
  { name: 'Carlos Méndez', email: 'carlos@cutterpay.com', password: 'Demo1234!', trades: 9, status: 'suspendido' },
  { name: 'Valeria Castillo', email: 'valeria@cutterpay.com', password: 'Demo1234!', trades: 4 },
];

export async function seed(db) {
  const rand = mulberry32(20251103);
  const now = Date.now();
  const start = now - DAYS * DAY;
  const points = Math.floor((DAYS * DAY) / STEP);

  // ---------- Monedas + historial ----------
  const series = {};
  for (const c of COINS) {
    let p = c.base * (0.93 + rand() * 0.06);
    const pts = [];
    for (let i = 0; i <= points; i++) {
      const drift = ((c.base - p) / c.base) * 0.02;
      p = p * (1 + (rand() * 2 - 1) * c.vol * 2.2 + drift);
      pts.push({ t: start + i * STEP, p: round8(p) });
    }
    const last = pts[pts.length - 1].p;
    const [row] = await db.query(
      `INSERT INTO criptomonedas (nombre, simbolo, color, precio_actual, precio_base, volatilidad)
       VALUES ($1,$2,$3,$4,$5,$6) RETURNING id`,
      [c.name, c.symbol, c.color, last, c.base, c.vol],
    );
    c.id = row.id;
    series[c.symbol] = pts;

    // inserción por lotes
    for (let i = 0; i < pts.length; i += 100) {
      const chunk = pts.slice(i, i + 100);
      const values = chunk.map((_, j) => `($1, $${j * 2 + 2}, $${j * 2 + 3})`).join(',');
      const params = [c.id];
      chunk.forEach((pt) => params.push(pt.p, new Date(pt.t).toISOString()));
      await db.query(`INSERT INTO historial_precios (cripto_id, precio, fecha) VALUES ${values}`, params);
    }
  }
  const priceAt = (symbol, t) => {
    const pts = series[symbol];
    const idx = Math.min(pts.length - 1, Math.max(0, Math.round((t - start) / STEP)));
    return pts[idx].p;
  };

  // ---------- Fondos y tasas de referencia ----------
  for (const f of FUNDS) {
    const [row] = await db.query(
      `INSERT INTO fondos (nombre, slug, descripcion, rendimiento_anual, riesgo, color) VALUES ($1,$2,$3,$4,$5,$6) RETURNING id`,
      [f.name, f.slug, f.desc, f.rate, f.risk, f.color],
    );
    f.id = row.id;
  }
  for (const r of REFERENCE_RATES) {
    await db.query(`INSERT INTO tasas_referencia (producto, tasa_anual, nota) VALUES ($1,$2,$3)`, [r.product, r.rate, r.note]);
  }

  // ---------- Admin ----------
  const adminHash = await bcrypt.hash('CutterAdmin#2025$Semilla!', 10);
  await db.query(
    `INSERT INTO usuarios (nombre, correo, password_hash, rol, creado_en) VALUES ($1,$2,$3,'admin',$4)`,
    ['Admin CUTTERPAY', 'admin@cutterpay.com', adminHash, new Date(start - DAY).toISOString()],
  );

  // ---------- Usuarios con operaciones ----------
  for (const [ui, u] of USERS.entries()) {
    const created = start + ui * 3600000 * 5;
    const hash = await bcrypt.hash(u.password, 10);
    const [row] = await db.query(
      `INSERT INTO usuarios (nombre, correo, password_hash, dpi, estado, creado_en, ultimo_acceso)
       VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING id`,
      [u.name, u.email, hash, u.dpi || null, u.status || 'activo', new Date(created).toISOString(), new Date(now - rand() * DAY).toISOString()],
    );
    const userId = row.id;
    const st = { balance: config.initialBalance, hold: {}, avg: {} };
    const txs = [];

    const doTrade = (type, symbol, qty, t) => {
      const price = priceAt(symbol, t);
      qty = round8(qty);
      if (qty <= 0) return;
      const total = round2(qty * price);
      if (type === 'compra') {
        if (total < 1 || total > st.balance) return;
        const h = st.hold[symbol] || 0;
        st.avg[symbol] = (h * (st.avg[symbol] || 0) + qty * price) / (h + qty);
        st.hold[symbol] = round8(h + qty);
        st.balance = round2(st.balance - total);
        txs.push({ type, symbol, qty, price, total, gain: null, t });
      } else {
        const h = st.hold[symbol] || 0;
        if (qty > h) return;
        const gain = round2(qty * (price - st.avg[symbol]));
        st.hold[symbol] = round8(h - qty);
        st.balance = round2(st.balance + total);
        txs.push({ type, symbol, qty, price, total, gain, t });
      }
    };

    if (u.trades === 'sofia') {
      // La historia de Sofía del documento de lógica
      // Con $1,000 de prueba: compras pequeñas, como haría una principiante
      doTrade('compra', 'BTC', 0.004, now - 2.6 * DAY);
      doTrade('compra', 'ETH', 0.06, now - 2.1 * DAY);
      doTrade('venta', 'BTC', 0.0015, now - 1.2 * DAY);
      doTrade('compra', 'DOGE', 700, now - 0.7 * DAY);
      doTrade('venta', 'ETH', 0.02, now - 0.3 * DAY);
    } else {
      const times = Array.from({ length: u.trades }, () => created + rand() * (now - created - 3600000)).sort((a, b) => a - b);
      for (const t of times) {
        const coin = COINS[Math.floor(rand() * COINS.length)];
        const h = st.hold[coin.symbol] || 0;
        if (h > 0 && rand() < 0.4) {
          doTrade('venta', coin.symbol, h * (0.3 + rand() * 0.6), t);
        } else {
          const spend = st.balance * (0.05 + rand() * 0.18);
          doTrade('compra', coin.symbol, spend / priceAt(coin.symbol, t), t);
        }
      }
    }

    const coinId = (s) => COINS.find((c) => c.symbol === s).id;
    for (const x of txs) {
      await db.query(
        `INSERT INTO transacciones (usuario_id, cripto_id, tipo, cantidad, precio_unitario, total_usd, ganancia_usd, fecha)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8)`,
        [userId, coinId(x.symbol), x.type, x.qty, x.price, x.total, x.gain, new Date(x.t).toISOString()],
      );
    }
    // Depósitos en fondos (crecen solos desde la fecha del depósito)
    const deposits = [];
    if (u.trades === 'sofia') {
      deposits.push({ slug: 'flexible', amount: 150, t: now - 3 * DAY }, { slug: 'plus', amount: 80, t: now - 1.5 * DAY });
    } else if (st.balance > 50 && rand() < 0.85) {
      const f = FUNDS[Math.floor(rand() * FUNDS.length)];
      deposits.push({ slug: f.slug, amount: round2(st.balance * (0.1 + rand() * 0.2)), t: created + rand() * (now - created) });
    }
    for (const d of deposits) {
      if (d.amount > st.balance) continue;
      const f = FUNDS.find((x) => x.slug === d.slug);
      st.balance = round2(st.balance - d.amount);
      const iso = new Date(d.t).toISOString();
      await db.query(
        `INSERT INTO inversiones_fondo (usuario_id, fondo_id, saldo, aportado, actualizado_en) VALUES ($1,$2,$3,$3,$4)`,
        [userId, f.id, d.amount, iso],
      );
      await db.query(`INSERT INTO movimientos_fondo (usuario_id, fondo_id, tipo, monto, fecha) VALUES ($1,$2,'deposito',$3,$4)`, [userId, f.id, d.amount, iso]);
    }

    await db.query(`INSERT INTO billeteras (usuario_id, saldo_usd) VALUES ($1,$2)`, [userId, st.balance]);
    for (const [s, q] of Object.entries(st.hold)) {
      if (q > 0) {
        await db.query(
          `INSERT INTO portafolio (usuario_id, cripto_id, cantidad, costo_promedio) VALUES ($1,$2,$3,$4)`,
          [userId, coinId(s), q, round8(st.avg[s])],
        );
      }
    }
    await db.query(`INSERT INTO auditoria (usuario_id, accion, detalle, fecha) VALUES ($1,'REGISTRO',$2,$3)`, [
      userId, JSON.stringify({ saldoInicial: config.initialBalance }), new Date(created).toISOString(),
    ]);
  }
  await db.query(`INSERT INTO billeteras (usuario_id, saldo_usd) SELECT id, 0 FROM usuarios WHERE rol='admin'`);
}
