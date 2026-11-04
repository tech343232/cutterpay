# CUTTERPAY

Simulador de compra y venta de criptomonedas con dinero ficticio.
Proyecto final de Desarrollo Web · Universidad Mariano Gálvez de Guatemala.

## Arrancar en tu computadora

Requisito: **Node.js 20 o superior**. No hace falta instalar ninguna base de datos.

```bash
npm install      # instala frontend y backend
npm run dev      # levanta API (puerto 3001) y web (puerto 5173)
```

Abre **http://localhost:5173**

La primera vez se crea la base de datos sola, con datos de ejemplo.

### Cuentas de prueba

| Rol | Correo | Contraseña |
|---|---|---|
| Usuaria | sofia@cutterpay.com | Sofia2025! |
| Administrador | admin@cutterpay.com | Admin123! |
| Usuarios demo | andrea@, mariana@, diego@, lucia@, valeria@cutterpay.com | Demo1234! |
| Cuenta suspendida | carlos@cutterpay.com | Demo1234! |

Tarjetas de la pasarela simulada: `4242 4242 4242 4242` (aprobada) y `4000 0000 0000 0002` (rechazada), con cualquier fecha futura y CVC.

### Otros comandos

| Comando | Qué hace |
|---|---|
| `npm run db:reset` | Borra la base local y la vuelve a crear con los datos de ejemplo |
| `npm run db:export` | Genera `database/cutterpay.sql` (entregable "base de datos exportada") |
| `npm run build` | Compila el frontend para producción en `frontend/dist` |

## Estructura

```
CUTTERPAY/
├─ frontend/        React + Vite + TypeScript + Tailwind + Chart.js
│  └─ src/
│     ├─ pages/         una pantalla por archivo (admin/ aparte)
│     ├─ components/    ui/, layout/, brand/, charts/, trade/
│     ├─ hooks/         useApi (loading/error/datos), useMarket
│     ├─ context/       sesión (AuthContext) y avisos (ToastContext)
│     └─ lib/           api.ts, format.ts, chart.ts
├─ backend/         Node.js + Express
│  └─ src/
│     ├─ routes/        auth, mercado, billetera, transacciones, reportes, admin
│     ├─ services/      trading (compra/venta), prices (motor), wallet, audit
│     ├─ middleware/    auth (JWT + rol), validate (Zod), errors
│     └─ db/            schema.sql, seed.js, conexión
├─ shared/          validation.js: las MISMAS reglas Zod en front y back
└─ database/        cutterpay.sql exportado
```

## Decisiones técnicas

- **PostgreSQL** (permitido por el PDF). En local corre con **PGlite**, un PostgreSQL real embebido en Node: no se instala nada. En la nube se usará Netlify DB (Neon) con el mismo SQL.
- **El precio lo calcula el servidor.** El navegador solo envía moneda y cantidad, así nadie puede comprar a un precio inventado.
- **Compra y venta en una transacción SQL con `FOR UPDATE`.** O se guarda todo o nada, y dos clics rápidos no gastan el mismo saldo dos veces.
- **Motor de precios "perezoso".** En vez de un temporizador (que no existe en funciones serverless), los precios avanzan según el tiempo que pasó desde la última consulta, en pasos de 5 segundos.
- **Seguridad:** bcrypt, JWT de 2 horas, bloqueo de 15 minutos tras 5 intentos fallidos, límite de peticiones, helmet, CORS cerrado, consultas con parámetros y tabla de auditoría.
- **Modo oscuro únicamente**, por identidad de marca.

## Códigos de verificación por correo

Para entrar, crear la cuenta, comprar, vender, invertir o retirar, CUTTERPAY envía un **código de 6 dígitos** al correo del usuario (vence en 10 minutos, 5 intentos, un solo uso y solo sirve para esa operación exacta).

- Las cuentas de demostración (`@cutterpay.com`) no tienen buzón real: su código aparece en pantalla.
- En local, si no configuras el correo, el código también aparece en pantalla y en la consola del servidor.
- En Netlify hay que configurar el envío (Gmail): agrega estas variables en *Environment variables*:

| Variable | Valor |
|---|---|
| `SMTP_HOST` | `smtp.gmail.com` |
| `SMTP_PORT` | `465` |
| `SMTP_USER` | tu Gmail |
| `SMTP_PASS` | la «contraseña de aplicación» de 16 letras (myaccount.google.com/apppasswords; requiere verificación en 2 pasos) |
| `MAIL_FROM` | `CUTTERPAY <tu Gmail>` |

## Publicar en Netlify (desde GitHub)

El proyecto ya está listo para Netlify: `netlify.toml`, la función `netlify/functions/api.mjs` (la misma API de Express) y la conexión a PostgreSQL cuando existe `NETLIFY_DATABASE_URL` o `DATABASE_URL`.

1. **Subir a GitHub**: crea un repositorio vacío y, en la carpeta del proyecto:
   ```bash
   git add .
   git commit -m "CUTTERPAY MVP"
   git branch -M main
   git remote add origin https://github.com/TU-USUARIO/cutterpay.git
   git push -u origin main
   ```
   (`backend/.env` no se sube: está en `.gitignore`.)
2. **Crear el sitio**: en Netlify → *Add new project* → *Import an existing project* → *GitHub* → elige el repositorio. Netlify lee `netlify.toml` solo; no cambies nada y pulsa *Deploy*.
3. **Crear la base de datos**: en el sitio → *Extensions* → *Neon* → *Add database*. Netlify crea la variable `NETLIFY_DATABASE_URL`. Luego pulsa *Claim database* para pasarla a tu cuenta de Neon y que no se borre.
4. **Variables de entorno**: *Project configuration* → *Environment variables* → agrega `JWT_SECRET` con un texto largo y aleatorio:
   ```bash
   node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"
   ```
5. **Cargar tablas y datos de ejemplo** (una sola vez, desde tu PC). Copia la *connection string* de Neon y en PowerShell:
   ```powershell
   $env:DATABASE_URL="postgresql://usuario:clave@host/neondb?sslmode=require"
   npm run db:setup-remote
   ```
6. **Volver a publicar**: *Deploys* → *Trigger deploy* → *Clear cache and deploy site*. Abre tu URL `https://algo.netlify.app` y entra con Sofía o el admin.

Desde ahí, **cada `git push` a `main` publica solo**.

Si algo falla:
- `/api` responde 502 o error: revisa *Logs → Functions*. Si dice `relation "usuarios" does not exist`, falta el paso 5.
- La sesión se cierra sola después de publicar: es normal si cambiaste `JWT_SECRET`; vuelve a iniciar sesión.
- Para reiniciar la base de la nube: `npm run db:setup-remote -- --force`.
