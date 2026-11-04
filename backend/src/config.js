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
  // Correo (códigos de verificación). Funciona con Gmail (contraseña de aplicación) o Brevo.
  mail: {
    host: process.env.SMTP_HOST || '',
    port: Number(process.env.SMTP_PORT || 465),
    user: process.env.SMTP_USER || '',
    pass: (process.env.SMTP_PASS || '').replace(/\s+/g, ''),
    from: process.env.MAIL_FROM || process.env.SMTP_USER || '',
  },
  // Las cuentas de demostración (@cutterpay.com) no tienen buzón real: su código se muestra en pantalla.
  demoEmailDomain: (process.env.DEMO_EMAIL_DOMAIN || 'cutterpay.com').toLowerCase(),
  otpTtlMin: 10,
  otpMaxAttempts: 5,
  // Reglas del simulador
  priceTickMs: 5000,
  maxLoginAttempts: 5,
  lockMinutes: 15,
};
