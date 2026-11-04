export function notFoundHandler(req, res) {
  res.status(404).json({ error: `La ruta ${req.method} ${req.path} no existe.` });
}

// eslint-disable-next-line no-unused-vars
export function errorHandler(err, _req, res, _next) {
  if (err.type === 'entity.parse.failed') {
    return res.status(400).json({ error: 'Los datos enviados no tienen un formato válido.' });
  }
  const status = err.status || 500;
  if (status >= 500 && !err.expose) console.error('[error]', err);
  res.status(status).json({
    error: status >= 500 && !err.expose ? 'Algo salió mal en el servidor. Intenta de nuevo en unos segundos.' : err.message,
    ...(err.fieldErrors ? { fieldErrors: err.fieldErrors } : {}),
    ...(err.code ? { code: err.code } : {}),
  });
}
