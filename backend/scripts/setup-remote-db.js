// Crea las tablas y los datos de ejemplo en la base de Netlify (Neon). Se corre UNA vez:
//   DATABASE_URL="postgres://..." npm run db:setup-remote
// Si la base ya tiene tablas, no toca nada (agrega --force para borrarla y empezar de cero).
import { getDb, closeDb, isRemote, schemaSql } from '../src/db/index.js';
import { seed } from '../src/db/seed.js';

if (!isRemote) {
  console.error('Falta DATABASE_URL. Cópiala de Netlify (Extensions → Neon → Connection string) y vuelve a intentar.');
  process.exit(1);
}

const db = await getDb();
const force = process.argv.includes('--force');
const [row] = await db.query(`SELECT to_regclass('public.usuarios') AS t`);

if (row.t && !force) {
  console.log('La base ya tiene tablas. No se cambió nada. Usa --force para reiniciarla.');
} else {
  if (row.t) {
    console.log('Borrando tablas anteriores…');
    await db.exec(`DROP SCHEMA public CASCADE; CREATE SCHEMA public;`);
  }
  console.log('Creando tablas…');
  await db.exec(schemaSql());
  console.log('Cargando datos de ejemplo (puede tardar un minuto)…');
  await seed(db);
  console.log('Listo. La base de Netlify ya tiene a Sofía, el admin, las monedas y los fondos.');
}
await closeDb();
