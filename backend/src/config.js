import 'dotenv/config';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const backendRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

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
