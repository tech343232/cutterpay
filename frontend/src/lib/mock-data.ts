// La app usa la API real (backend/). Aquí solo quedan datos fijos de demostración.

/** Cuentas de prueba creadas por el seed de la base de datos. */
export const DEMO_ACCOUNTS = [
  { label: 'Sofía · usuaria de prueba', email: 'sofia@cutterpay.com', password: 'Sofia#Cutter2025-Invierte!' },
  { label: 'Administrador', email: 'admin@cutterpay.com', password: 'CutterAdmin#2025$Semilla!' },
]

/** Tarjetas de prueba de la pasarela simulada. */
export const TEST_CARDS = [
  { number: '4242 4242 4242 4242', result: 'Aprobada' },
  { number: '4000 0000 0000 0002', result: 'Rechazada' },
]

export const INITIAL_BALANCE = 1000
