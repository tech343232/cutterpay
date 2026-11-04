import 'dotenv/config';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

// En Netlify el código se empaqueta como CommonJS y import.meta.url no existe: se usa __dirname.
const here = typeof __dirname !== 'undefined' ? __dirname : path.dirname(fileURLToPath(import.meta.url));
const backendRoot = path.resolve(here, '..');

export const config = {
  port: Number(process.env.PORT || 3001),
  jwtSecret: process.env.JWT_SECRET || 'dev-only-secret-change-me',
  jwtExpires: process.env.JWT_EXPIRES || '2h',
  corsOrigin: (process.env.CORS_ORIGIN || process.env.URL || 'http://localhost:5173').split(',').map((s) => s.trim()),
  initialBalance: Number(process.env.INITIAL_BALANCE || 10000),
  pgDataDir: path.resolve(backendRoot, process.env.PGDATA_DIR || './.data/pgdata'),
  // Reglas del simulador
  priceTickMs: 5000,
  maxLoginAttempts: 5,
  lockMinutes: 15,
};
