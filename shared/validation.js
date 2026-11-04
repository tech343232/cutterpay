// Esquemas de validación compartidos por el frontend y el backend.
// El navegador los usa para mostrar errores al instante; el servidor los usa
// otra vez para rechazar cualquier dato que llegue mal (nunca se confía en el cliente).
import { z } from 'zod';

export const LIMITS = {
  minTradeUsd: 1,
  maxDecimals: 8,
  rechargeMin: 10,
  rechargeMax: 5000,
};

const hasMaxDecimals = (v, max) => {
  const scaled = v * 10 ** max;
  return Math.abs(Math.round(scaled) - scaled) < 1e-6;
};

export const nameField = z
  .string({ required_error: 'Escribe tu nombre.' })
  .trim()
  .min(3, 'El nombre debe tener al menos 3 letras.')
  .max(80, 'El nombre puede tener máximo 80 caracteres.')
  .regex(/^[\p{L} .'-]+$/u, 'El nombre solo puede tener letras y espacios.');

export const emailField = z
  .string({ required_error: 'Escribe tu correo.' })
  .trim()
  .toLowerCase()
  .max(120, 'El correo es demasiado largo.')
  .email('Escribe un correo válido, por ejemplo sofia@correo.com.');

export const passwordField = z
  .string({ required_error: 'Escribe una contraseña.' })
  .min(8, 'La contraseña necesita al menos 8 caracteres.')
  .max(72, 'La contraseña puede tener máximo 72 caracteres.')
  .regex(/[A-Z]/, 'Agrega al menos una letra mayúscula.')
  .regex(/\d/, 'Agrega al menos un número.');

export const registerSchema = z.object({
  name: nameField,
  email: emailField,
  password: passwordField,
});

/**
 * DPI de Guatemala: 13 dígitos = 8 de número + 1 verificador + 2 de departamento (01–22) + 2 de municipio.
 * Se pide la primera vez que la persona quiere retirar dinero.
 */
export const dpiSchema = z.object({
  dpi: z
    .string({ required_error: 'Escribe tu DPI.' })
    .transform((s) => s.replace(/[\s-]/g, ''))
    .refine((s) => /^\d{13}$/.test(s), 'El DPI tiene 13 dígitos. Escríbelo sin espacios ni guiones.')
    .refine((s) => {
      const dept = Number(s.slice(9, 11))
      const muni = Number(s.slice(11, 13))
      return dept >= 1 && dept <= 22 && muni >= 1
    }, 'Ese DPI no es válido. Revisa los últimos 4 dígitos (departamento y municipio).'),
})

export const loginSchema = z.object({
  email: emailField,
  password: z.string({ required_error: 'Escribe tu contraseña.' }).min(1, 'Escribe tu contraseña.'),
});

export const quantityField = z.coerce
  .number({ invalid_type_error: 'Usa solo números, por ejemplo 0.05.' })
  .refine((v) => Number.isFinite(v), 'Usa solo números, por ejemplo 0.05.')
  .refine((v) => v > 0, 'La cantidad debe ser mayor a 0.')
  .refine((v) => v <= 1e9, 'Esa cantidad es demasiado grande.')
  .refine((v) => hasMaxDecimals(v, LIMITS.maxDecimals), 'Máximo 8 decimales.');

const usdField = (min, minMsg) =>
  z.coerce
    .number({ invalid_type_error: 'Escribe un monto en dólares, por ejemplo 50.' })
    .refine((v) => Number.isFinite(v), 'Escribe un monto en dólares, por ejemplo 50.')
    .refine((v) => v >= min, minMsg)
    .refine((v) => v <= 10_000_000, 'Ese monto es demasiado grande.')
    .refine((v) => hasMaxDecimals(v, 2), 'Usa máximo 2 decimales (centavos).');

const luhnOk = (digits) => {
  let sum = 0;
  let dbl = false;
  for (let i = digits.length - 1; i >= 0; i--) {
    let d = Number(digits[i]);
    if (dbl) { d *= 2; if (d > 9) d -= 9; }
    sum += d;
    dbl = !dbl;
  }
  return sum % 10 === 0;
};

/** Datos de una tarjeta de crédito o débito (pasarela simulada). */
export const cardSchema = z.object({
  holder: z.string({ required_error: 'Escribe el nombre en la tarjeta.' }).trim().min(3, 'Escribe el nombre como aparece en la tarjeta.').max(80),
  cardNumber: z
    .string({ required_error: 'Escribe el número de la tarjeta.' })
    .transform((s) => s.replace(/\s+/g, ''))
    .refine((s) => /^\d{16}$/.test(s), 'La tarjeta debe tener 16 dígitos.')
    .refine((s) => luhnOk(s), 'Ese número de tarjeta no es válido. Revisa los dígitos.'),
  expiry: z
    .string({ required_error: 'Escribe la fecha de vencimiento.' })
    .trim()
    .regex(/^(0[1-9]|1[0-2])\/\d{2}$/, 'Usa el formato MM/AA.')
    .refine((s) => {
      const [mm, yy] = s.split('/').map(Number);
      return new Date(2000 + yy, mm, 1) > new Date();
    }, 'La tarjeta está vencida.'),
  cvc: z.string({ required_error: 'Escribe el CVC.' }).trim().regex(/^\d{3}$/, 'El CVC tiene 3 dígitos.'),
});

/** Compra o venta de cripto: por cantidad de moneda o por monto en dólares (como una tienda). */
export const tradeSchema = z
  .object({
    symbol: z.string().trim().toUpperCase().min(2).max(10),
    quantity: quantityField.optional(),
    amountUsd: usdField(LIMITS.minTradeUsd, `El mínimo es $${LIMITS.minTradeUsd}.`).optional(),
    all: z.boolean().optional(),
    // Pagar con tarjeta en el mismo paso de la compra
    card: cardSchema.optional(),
  })
  .refine((d) => d.quantity !== undefined || d.amountUsd !== undefined || d.all, {
    message: 'Escribe cuánto quieres comprar o vender.',
    path: ['amountUsd'],
  });

/** Invertir en un fondo */
export const fundDepositSchema = z.object({
  amount: usdField(LIMITS.minTradeUsd, `Puedes invertir desde $${LIMITS.minTradeUsd}.`),
});

/** Retirar de un fondo: un monto o todo */
export const fundWithdrawSchema = z
  .object({
    amount: usdField(0.01, 'Escribe cuánto quieres retirar.').optional(),
    all: z.boolean().optional(),
  })
  .refine((d) => d.amount !== undefined || d.all, { message: 'Escribe cuánto quieres retirar.', path: ['amount'] });

const luhn = (digits) => {
  let sum = 0;
  let dbl = false;
  for (let i = digits.length - 1; i >= 0; i--) {
    let d = Number(digits[i]);
    if (dbl) {
      d *= 2;
      if (d > 9) d -= 9;
    }
    sum += d;
    dbl = !dbl;
  }
  return sum % 10 === 0;
};

export const rechargeSchema = z.object({
  amount: z.coerce
    .number({ invalid_type_error: 'Escribe un monto en dólares.' })
    .min(LIMITS.rechargeMin, `La recarga mínima es de $${LIMITS.rechargeMin}.`)
    .max(LIMITS.rechargeMax, `La recarga máxima es de $${LIMITS.rechargeMax.toLocaleString('en-US')}.`)
    .refine((v) => hasMaxDecimals(v, 2), 'Usa máximo 2 decimales.'),
  holder: nameField,
  cardNumber: z
    .string()
    .transform((s) => s.replace(/\s+/g, ''))
    .refine((s) => /^\d{16}$/.test(s), 'La tarjeta debe tener 16 dígitos.')
    .refine((s) => luhn(s), 'Ese número de tarjeta no es válido. Revisa los dígitos.'),
  expiry: z
    .string()
    .trim()
    .regex(/^(0[1-9]|1[0-2])\/\d{2}$/, 'Usa el formato MM/AA.')
    .refine((s) => {
      const [mm, yy] = s.split('/').map(Number);
      const end = new Date(2000 + yy, mm, 1);
      return end > new Date();
    }, 'La tarjeta está vencida.'),
  cvc: z.string().trim().regex(/^\d{3}$/, 'El CVC tiene 3 dígitos.'),
});

/** Retirar dinero del saldo: a billetera digital, cuenta de banco o efectivo en cajero sin tarjeta. */
export const CASHOUT_BANKS = ['Banco Industrial', 'Banrural', 'BAM', 'G&T Continental', 'BAC Credomatic', 'Banco Promerica']
export const cashOutSchema = z.discriminatedUnion('method', [
  z.object({
    method: z.literal('billetera'),
    amount: usdField(10, 'Puedes retirar desde $10.'),
    phone: z.string().transform((s) => s.replace(/\D/g, '')).refine((s) => /^\d{8}$/.test(s), 'El número tiene 8 dígitos.'),
  }),
  z.object({
    method: z.literal('banco'),
    amount: usdField(10, 'Puedes retirar desde $10.'),
    bank: z.enum(CASHOUT_BANKS, { errorMap: () => ({ message: 'Elige tu banco.' }) }),
    account: z.string().transform((s) => s.replace(/[\s-]/g, '')).refine((s) => /^\d{6,20}$/.test(s), 'El número de cuenta tiene entre 6 y 20 dígitos.'),
    holder: nameField,
  }),
  z.object({
    method: z.literal('cajero'),
    amount: usdField(10, 'Puedes retirar desde $10.').refine((v) => v <= 400, 'En cajero puedes retirar hasta $400 por vez.').refine((v) => Number.isInteger(v), 'En cajero el monto debe ser entero (sin centavos).'),
  }),
])

export const userStatusSchema = z.object({
  status: z.enum(['activo', 'suspendido', 'baja'], {
    errorMap: () => ({ message: 'Estado no válido.' }),
  }),
});

export const coinToggleSchema = z.object({
  active: z.boolean({ invalid_type_error: 'Indica si la moneda está activa.' }),
});

/** Convierte un ZodError en { campo: mensaje } para mostrar junto a cada input. */
export function fieldErrors(zodError) {
  const out = {};
  for (const issue of zodError.issues) {
    const key = issue.path.join('.') || '_';
    if (!out[key]) out[key] = issue.message;
  }
  return out;
}
