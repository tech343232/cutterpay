// Borra la base local y la vuelve a crear con los datos de ejemplo.
import fs from 'node:fs';
import { config } from '../src/config.js';
import { getDb, closeDb } from '../src/db/index.js';

fs.rmSync(config.pgDataDir, { recursive: true, force: true });
await getDb();
await closeDb();
console.log('Base de datos reiniciada con datos de ejemplo.');
