// La app de Express se exporta sin "listen" para poder usarla igual en local
// (server.js) y, más adelante, dentro de una Netlify Function (serverless-http).
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { config } from './config.js';
import { requireAuth, requireAdmin } from './middleware/auth.js';
import { errorHandler, notFoundHandler } from './middleware/errors.js';
import authRoutes from './routes/auth.js';
import marketRoutes from './routes/market.js';
import walletRoutes from './routes/wallet.js';
import txRoutes from './routes/transactions.js';
import reportRoutes from './routes/reports.js';
import adminRoutes from './routes/admin.js';
import fundRoutes from './routes/funds.js';
import verificationRoutes from './routes/verification.js';

export function createApp() {
  const app = express();
  app.set('trust proxy', 1);
  app.use(helmet());
  app.use(cors({ origin: config.corsOrigin }));
  app.use(express.json({ limit: '20kb' }));

  app.get('/api/salud', (_req, res) => res.json({ ok: true, app: 'CUTTERPAY', time: new Date().toISOString() }));
  app.use('/api/auth', authRoutes);
  app.use('/api/mercado', marketRoutes);
  app.use('/api/fondos', fundRoutes);
  app.use('/api/billetera', requireAuth, walletRoutes);
  app.use('/api/transacciones', requireAuth, txRoutes);
  app.use('/api/reportes', requireAuth, reportRoutes);
  app.use('/api/verificacion', requireAuth, verificationRoutes);
  app.use('/api/admin', requireAuth, requireAdmin, adminRoutes);

  app.use('/api', notFoundHandler);
  app.use(errorHandler);
  return app;
}
