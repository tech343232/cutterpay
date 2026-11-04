// Netlify Function: la misma app de Express que corre en local, ahora como función serverless.
// netlify.toml redirige /api/* hacia aquí.
import serverless from 'serverless-http';
import { createApp } from '../../backend/src/app.js';

const app = createApp();

// Netlify puede entregar la ruta como /.netlify/functions/api/...; se normaliza a /api/...
const handler = serverless((req, res) => {
  if (req.url.startsWith('/.netlify/functions/api')) {
    req.url = '/api' + req.url.slice('/.netlify/functions/api'.length);
  }
  return app(req, res);
});

export { handler };
