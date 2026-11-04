// Actualiza las contraseñas de las cuentas de demostración sin borrar datos.
//   Local:  node scripts/set-demo-passwords.js
//   Neon:   DATABASE_URL="..." node scripts/set-demo-passwords.js
import bcrypt from 'bcryptjs';
import { query, closeDb } from '../src/db/index.js';

const ACCOUNTS = [
  ['sofia@cutterpay.com', 'Sofia#Cutter2025-Invierte!'],
  ['admin@cutterpay.com', 'CutterAdmin#2025$Semilla!'],
];
for (const [email, pass] of ACCOUNTS) {
  const rows = await query(`UPDATE usuarios SET password_hash = $2, intentos_fallidos = 0, bloqueado_hasta = NULL WHERE correo = $1 RETURNING correo`, [email, await bcrypt.hash(pass, 10)]);
  console.log(rows.length ? `Actualizada: ${email}` : `No existe: ${email}`);
}
await closeDb();
