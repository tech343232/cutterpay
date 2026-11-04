import { createApp } from './app.js';
import { config } from './config.js';
import { getDb, closeDb } from './db/index.js';

await getDb(); // crea tablas y datos de ejemplo la primera vez
const server = createApp().listen(config.port, () => {
  console.log(`\n  CUTTERPAY API lista en http://localhost:${config.port}/api/salud\n`);
});
server.on('error', async (err) => {
  if (err.code === 'EADDRINUSE') {
    console.error(`\n  El puerto ${config.port} ya está en uso. Cierra la otra ventana de CUTTERPAY o cambia PORT en backend/.env.\n`);
  } else {
    console.error(err);
  }
  await closeDb();
  process.exit(1);
});

const shutdown = async () => {
  server.close();
  await closeDb();
  process.exit(0);
};
process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
