import { query } from '../db/index.js';

export async function audit(userId, action, req, detail = null, q = null) {
  const run = q ? q.query : query;
  await run(`INSERT INTO auditoria (usuario_id, accion, ip, detalle) VALUES ($1,$2,$3,$4)`, [
    userId ?? null,
    action,
    req?.ip?.slice(0, 64) ?? null,
    detail ? JSON.stringify(detail) : null,
  ]);
}
