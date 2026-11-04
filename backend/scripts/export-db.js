// Exporta la base completa (estructura + datos) a database/cutterpay.sql
// Es el entregable "Base de datos exportada". Se puede importar en cualquier PostgreSQL (o Neon).
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { query, closeDb } from '../src/db/index.js';

const here = path.dirname(fileURLToPath(import.meta.url));
const out = path.resolve(here, '../../database/cutterpay.sql');
const TABLES = ['usuarios', 'billeteras', 'criptomonedas', 'portafolio', 'transacciones', 'historial_precios', 'recargas', 'auditoria', 'fondos', 'inversiones_fondo', 'movimientos_fondo', 'tasas_referencia', 'codigos_verificacion'];

const lit = (v) => {
  if (v === null || v === undefined) return 'NULL';
  if (typeof v === 'number' || typeof v === 'bigint') return String(v);
  if (typeof v === 'boolean') return v ? 'TRUE' : 'FALSE';
  if (v instanceof Date) return `'${v.toISOString()}'`;
  if (typeof v === 'object') return `'${JSON.stringify(v).replace(/'/g, "''")}'`;
  return `'${String(v).replace(/'/g, "''")}'`;
};

let sql = `-- CUTTERPAY · exportación de la base de datos\n-- Generado: ${new Date().toISOString()}\n-- Motor: PostgreSQL\n\n`;
sql += TABLES.slice().reverse().map((t) => `DROP TABLE IF EXISTS ${t} CASCADE;`).join('\n') + '\n\n';
sql += fs.readFileSync(path.resolve(here, '../src/db/schema.sql'), 'utf8') + '\n';
sql += fs.readFileSync(path.resolve(here, '../src/db/migrations.sql'), 'utf8') + '\n';

for (const t of TABLES) {
  const rows = await query(`SELECT * FROM ${t} ORDER BY 1`);
  if (!rows.length) continue;
  const cols = Object.keys(rows[0]);
  sql += `\n-- ${t} (${rows.length} filas)\n`;
  for (let i = 0; i < rows.length; i += 200) {
    const chunk = rows.slice(i, i + 200);
    sql += `INSERT INTO ${t} (${cols.join(', ')}) VALUES\n` + chunk.map((r) => `  (${cols.map((c) => lit(r[c])).join(', ')})`).join(',\n') + ';\n';
  }
  if (cols.includes('id')) sql += `SELECT setval(pg_get_serial_sequence('${t}', 'id'), (SELECT MAX(id) FROM ${t}));\n`;
}

fs.mkdirSync(path.dirname(out), { recursive: true });
fs.writeFileSync(out, sql);
await closeDb();
console.log('Exportado en', out);
