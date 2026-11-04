// Conexión a la base de datos con la misma interfaz en local y en la nube:
//   query(sql, params) → filas      tx(fn) → transacción (todo o nada)
// - Local (sin DATABASE_URL): PGlite, un PostgreSQL real embebido en Node. No se instala nada.
// - Netlify (con NETLIFY_DATABASE_URL o DATABASE_URL): PostgreSQL en Neon con el driver "pg".
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { config } from '../config.js';
import { seed } from './seed.js';

const here = (() => {
  try {
    return path.dirname(fileURLToPath(import.meta.url));
  } catch {
    return __dirname; // Netlify empaqueta en CommonJS: ahí import.meta.url no existe
  }
})();
// Neon agrega "channel_binding=require" a la cadena; el driver "pg" no lo necesita, así que se quita.
const REMOTE_URL = (process.env.NETLIFY_DATABASE_URL || process.env.DATABASE_URL || '')
  .trim()
  .replace(/^["']|["']$/g, '')
  .replace(/([?&])channel_binding=[^&]*(&|$)/, (_, sep, end) => (end ? sep : ''))
  .replace(/[?&]$/, '')
  // Neon tiene certificado válido: verify-full es lo que require hace hoy en pg, sin el aviso
  .replace(/sslmode=require/, 'sslmode=verify-full');
export const isRemote = Boolean(REMOTE_URL);

let dbPromise = null;

function readSql(name) {
  // En Netlify el archivo se incluye con "included_files"; si no está, se busca junto al código
  const candidates = [path.join(here, name), path.resolve(process.cwd(), 'backend/src/db', name)];
  const file = candidates.find((f) => fs.existsSync(f));
  if (!file) throw new Error(`No se encontró ${name}`);
  return fs.readFileSync(file, 'utf8');
}
export const schemaSql = () => readSql('schema.sql');
export const migrationsSql = () => readSql('migrations.sql');

/** Aplica los cambios nuevos de la base (idempotente). */
async function migrate(api) {
  await api.exec(migrationsSql());
}

// ---------- PGlite (local) ----------
async function initLocal() {
  const { PGlite } = await import('@electric-sql/pglite');
  fs.mkdirSync(config.pgDataDir, { recursive: true });
  const db = new PGlite(config.pgDataDir);
  await db.waitReady;
  const wrap = (conn) => ({ query: async (sql, params = []) => (await conn.query(sql, params)).rows });
  const api = {
    query: (sql, params) => wrap(db).query(sql, params),
    tx: (fn) => db.transaction((t) => fn(wrap(t))),
    exec: (sql) => db.exec(sql),
    close: () => db.close(),
  };
  await ensureSchema(api);
  await migrate(api);
  return api;
}

// ---------- PostgreSQL remoto (Netlify DB / Neon) ----------
async function initRemote() {
  const { default: pg } = await import('pg');
  const pool = new pg.Pool({
    connectionString: REMOTE_URL,
    ssl: REMOTE_URL.includes('localhost') ? false : { rejectUnauthorized: false },
    max: 3,
    idleTimeoutMillis: 10_000,
  });
  const api = {
    query: async (sql, params = []) => (await pool.query(sql, params)).rows,
    tx: async (fn) => {
      const client = await pool.connect();
      try {
        await client.query('BEGIN');
        const result = await fn({ query: async (sql, params = []) => (await client.query(sql, params)).rows });
        await client.query('COMMIT');
        return result;
      } catch (e) {
        await client.query('ROLLBACK').catch(() => {});
        throw e;
      } finally {
        client.release();
      }
    },
    exec: (sql) => pool.query(sql),
    close: () => pool.end(),
  };
  // En la nube no se siembra automáticamente (tardaría demasiado en una función):
  // se usa una vez "npm run db:setup-remote". Los cambios pequeños sí se aplican al arrancar.
  const [row] = await api.query(`SELECT to_regclass('public.usuarios') AS t`);
  if (row.t) await migrate(api);
  return api;
}

async function ensureSchema(api) {
  const [row] = await api.query(`SELECT to_regclass('public.usuarios') AS t`);
  if (!row.t) {
    console.log('[db] Base vacía: creando tablas y datos de ejemplo…');
    await api.exec(schemaSql());
    await seed(api);
    console.log('[db] Lista.');
  }
}

export function getDb() {
  if (!dbPromise) dbPromise = isRemote ? initRemote() : initLocal();
  return dbPromise;
}

/** Ejecuta una consulta y devuelve las filas. Siempre con parámetros $1, $2… (evita inyección SQL). */
export async function query(sql, params = []) {
  return (await getDb()).query(sql, params);
}

/** Ejecuta varias consultas en una sola transacción: o se guardan todas o ninguna. */
export async function tx(fn) {
  return (await getDb()).tx(fn);
}

export async function closeDb() {
  if (!dbPromise) return;
  const db = await dbPromise;
  await db.close();
  dbPromise = null;
}

export { ensureSchema, migrate };
