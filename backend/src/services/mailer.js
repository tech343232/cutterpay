// Envío de correos con los códigos de verificación (SMTP: Gmail con contraseña de aplicación o Brevo).
import nodemailer from 'nodemailer';
import { config } from '../config.js';

export const mailConfigured = Boolean(config.mail.host && config.mail.user && config.mail.pass);

let transport = null;
function getTransport() {
  transport ??= nodemailer.createTransport({
    host: config.mail.host,
    port: config.mail.port,
    secure: config.mail.port === 465,
    auth: { user: config.mail.user, pass: config.mail.pass },
  });
  return transport;
}

const PURPOSE_TEXT = {
  registro: { subject: 'Confirma tu correo en CUTTERPAY', lead: 'Usa este código para confirmar que este correo es tuyo y activar tu cuenta.' },
  login: { subject: 'Tu código para entrar a CUTTERPAY', lead: 'Usa este código para terminar de iniciar sesión.' },
  operacion: { subject: 'Confirma tu operación en CUTTERPAY', lead: 'Usa este código para autorizar esta operación con tu dinero:' },
};

function html({ name, code, lead, detail }) {
  const digits = code.split('').map((d) => `<span style="display:inline-block;width:44px;height:56px;line-height:56px;margin:0 3px;border-radius:12px;background:#1C1829;border:1px solid #2A2540;font-size:30px;font-weight:800;color:#F4F2FF;">${d}</span>`).join('');
  return `<!doctype html><html><body style="margin:0;background:#0B0912;font-family:Segoe UI,Arial,sans-serif;color:#F4F2FF;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#0B0912;padding:32px 12px;"><tr><td align="center">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:480px;background:#14111E;border:1px solid #2A2540;border-radius:24px;padding:32px;">
      <tr><td style="font-size:26px;font-weight:800;letter-spacing:-1px;">cutter<span style="color:#C94BE0;">pay</span></td></tr>
      <tr><td style="padding-top:24px;font-size:18px;font-weight:700;">Hola, ${name}</td></tr>
      <tr><td style="padding-top:8px;font-size:15px;line-height:1.5;color:#A49DBF;">${lead}</td></tr>
      ${detail ? `<tr><td style="padding-top:12px;font-size:15px;font-weight:700;color:#F4F2FF;">${detail}</td></tr>` : ''}
      <tr><td align="center" style="padding:28px 0 8px;">${digits}</td></tr>
      <tr><td align="center" style="font-size:13px;color:#A49DBF;">Vence en ${config.otpTtlMin} minutos.</td></tr>
      <tr><td style="padding-top:28px;font-size:12px;line-height:1.5;color:#7C7596;border-top:1px solid #2A2540;">Si no fuiste tú, no compartas este código con nadie y cambia tu contraseña. CUTTERPAY nunca te pedirá este código por teléfono ni por chat.</td></tr>
    </table>
  </td></tr></table></body></html>`;
}

/** Envía el código. Si el correo no está configurado (solo en local), lo muestra en la consola. */
export async function sendCode({ to, name, code, purpose, detail }) {
  const t = PURPOSE_TEXT[purpose];
  if (!mailConfigured) {
    console.log(`\n[correo no configurado] Código para ${to} (${purpose}): ${code}\n`);
    return { sent: false };
  }
  await getTransport().sendMail({
    from: config.mail.from.includes('<') ? config.mail.from : `CUTTERPAY <${config.mail.from}>`,
    to,
    subject: `${code} · ${t.subject}`,
    text: `Hola, ${name}. ${t.lead} ${detail || ''}\n\nTu código: ${code}\nVence en ${config.otpTtlMin} minutos.\n\nSi no fuiste tú, no compartas este código.`,
    html: html({ name, code, lead: t.lead, detail }),
  });
  return { sent: true };
}
