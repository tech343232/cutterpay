// Netlify Function: la misma app de Express que corre en local, ahora como función serverless.
// netlify.toml redirige /api/* hacia aquí.
import serverless from 'serverless-http';
import { createApp } from '../../backend/src/app.js';

const app = createApp();

const handler = serverless((req, res) => {
  // Netlify puede entregar la ruta como /.netlify/functions/api/...; se normaliza a /api/...
  if (req.url.startsWith('/.netlify/functions/api')) {
    req.url = '/api' + req.url.slice('/.netlify/functions/api'.length);
  }
  // serverless-http entrega el cuerpo como Buffer y express.json() no lo vuelve a leer: se convierte aquí.
  if (Buffer.isBuffer(req.body)) {
    const text = req.body.toString('utf8');
    if (!text) req.body = {};
    else if ((req.headers['content-type'] || '').includes('application/json')) {
      try {
        req.body = JSON.parse(text);
      } catch {
        req.body = {};
      }
    }
  }
  // IP real del visitante (para el límite de intentos y la auditoría)
  if (!req.headers['x-forwarded-for'] && req.headers['x-nf-client-connection-ip']) {
    req.headers['x-forwarded-for'] = req.headers['x-nf-client-connection-ip'];
  }
  return app(req, res);
});

export { handler };
