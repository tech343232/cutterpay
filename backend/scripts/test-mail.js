// Envía un correo de prueba con un código, para comprobar que Gmail está bien configurado.
//   npm run mail:test -- destino@correo.com
// Lee SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS y MAIL_FROM de backend/.env
import { sendCode, mailConfigured } from '../src/services/mailer.js';
import { config } from '../src/config.js';

const to = process.argv[2] || config.mail.user;
if (!mailConfigured) {
  console.error('Falta configurar el correo. Agrega SMTP_HOST, SMTP_PORT, SMTP_USER y SMTP_PASS en backend/.env');
  process.exit(1);
}
try {
  await sendCode({ to, name: 'Prueba', code: '482913', purpose: 'login', detail: null });
  console.log(`Listo: revisa la bandeja de ${to} (y la carpeta de spam).`);
} catch (e) {
  console.error('No se pudo enviar:', e.message);
  if (/Invalid login|BadCredentials|535/.test(e.message)) {
    console.error('Gmail rechazó la clave. Usa una "contraseña de aplicación" (myaccount.google.com/apppasswords), no tu contraseña normal.');
  }
  process.exit(1);
}
