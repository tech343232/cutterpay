# LOG.md · Cerebro del proyecto CUTTERPAY

Aquí se anota cada petición y cada error del proyecto, por qué pasó y cómo se resolvió.
**Antes de empezar una tarea nueva se lee este archivo** para no repetir errores (ni los de CUTTERPAY ni los de las otras apps: SOHO, O.T.I.S, YODO, DUMO, DRUKY, FINIX).

## Cómo se usa

1. Cada petición nueva va **arriba** de «Peticiones» (pedido, entregado, pendiente).
2. Cada error nuevo va **arriba** de «Errores» (qué pasó, causa, solución, regla).
3. Si una regla se repite, se sube a «Reglas aprendidas».

## Reglas aprendidas

### Diseño y textos
- **Ningún párrafo termina con 1 o 2 palabras solas en la última línea.** Títulos con `text-wrap: balance`, párrafos con `text-wrap: pretty` (global en `index.css`). Si un texto sigue quedando cojo, se reescribe más corto. *(pedido del usuario, YODO)*
- **Todo lo que ve el usuario se escribe para principiantes**: se habla del resultado («ganas $7.25 por cada $100»), no de lo técnico. Lo técnico se queda en este log y en el código. *(O.T.I.S)*
- **Los encabezados muestran solo el nombre**; la explicación va en un «?» (`components/ui/Help.tsx`). *(SOHO)*
- **Flujos guiados paso a paso**: un paso abierto a la vez, con número y ✓ al completarlo (checkout `MoneyFlow`). *(SOHO)*
- **Comprar o invertir debe sentirse como una compra en línea**: monto en dólares → resumen tipo carrito → confirmación con celebración.
- **Solo modo oscuro.** Logo oficial «Aurora» (C cortada + moneda), animado. Morado `#9B8CFF` como acento.
- **Nada de `alert`, `confirm` o `prompt` nativos**: se usan diálogos propios. *(YODO)*
- **Ninguna pantalla muestra barra horizontal** y todo debe caber en un celular de **360 px**. *(YODO)*

### Técnica
- **Si aparece `EADDRINUSE`**, se busca qué proceso ocupa el puerto y se cierra antes de cambiar nada. Antes de reiniciar la base, se apagan los servidores. *(O.T.I.S + error 2026-11-03)*
- **Capturas de prueba**: rutas completas, sin variables dentro de comillas simples; para ver una parte se ocultan las demás en vez de desplazar. *(O.T.I.S)*
- **El precio y los saldos los calcula siempre el servidor**; el navegador solo manda qué y cuánto.
- **Toda operación de dinero va en una transacción SQL con `FOR UPDATE`.**
- **Pensado para Netlify**: nada de temporizadores en el servidor (precios e intereses se calculan según el tiempo que pasó); la base es PostgreSQL (PGlite en local, Neon en la nube).
- **Clases de Tailwind solo de la escala** (`/10`, `/15`, `h-12`, `h-14`); valores fuera de escala no generan CSS.

## Peticiones

### 2026-11-03 · Código por correo para entrar y para mover dinero
- Pedido: enviar un código al correo registrado para confirmar compras, ventas y retiros, y también al iniciar sesión (y verificar que el correo es real).
- Entregado: códigos de 6 dígitos (hash, 10 min, 5 intentos, un solo uso, atados a la operación exacta) en registro, login, compra, venta, invertir y retirar; casillas que aceptan pegar el código y reenvío con espera de 30 s; correo con diseño de marca; tabla `codigos_verificacion` con migración automática (local y Neon); cuentas demo muestran su código en pantalla.
- Pendiente: el usuario debe crear la contraseña de aplicación de Gmail y ponerla en Netlify.

### 2026-11-03 · Landing que convence + bienvenida con sonido
- Pedido: titular «Haz crecer tu dinero así de sencillo»; quitar «simulador» donde no hace falta; ordenar el comparador; motion graphic CSS directo en la landing; destacar beneficios y mostrar el problema de las cuentas del banco (dinero estancado); sonido al entrar a CUTTERPAY.
- Entregado: landing nueva (fondo animado, historia animada en el héroe con borde que gira, contador «desde que llegaste…», franja en movimiento, sección «tu dinero se está quedando dormido» con barras animadas, «despierta tu dinero» con beneficios y comparador, cómo funciona, cripto y cierre); comparador en 3 bloques (monto y plazo → resultado grande → CUTTERPAY / Banco tradicional); sonido de bienvenida + animación con logo, anillos y destellos al iniciar sesión o crear cuenta; textos sin «simulador/ficticio» (queda solo una nota corta en el pie).
- Pendiente: nada.

### 2026-11-03 · Fondos con rendimiento, compra simple, motion graphic y Netlify
- Pedido: aplicar las reglas de los LOG.md de todas las apps; sin palabras sueltas en los párrafos; revisar toda la plataforma. Nuevo enfoque: CUTTERPAY ofrece rendimiento efectivo anual en fondos en dólares para principiantes, con comparación contra bancos locales. Compra tan simple como una tienda en línea. Motion graphic en login y registro. Logo animado. Dejarlo en localhost y luego dar el paso a paso para Netlify desde GitHub.
- Entregado: 3 fondos (5.5%, 7.25%, 9.5%) con interés que crece cada segundo; comparador contra ahorro bancario, plazo fijo y dinero en casa; checkout de 3 pasos (Monto → Revisa → Listo) para fondos y cripto en dólares; historia animada de 4 escenas en login/registro; logo animado (entrada, respiración, brillo, reacción al mouse); landing nueva; LOG.md; adaptador PostgreSQL remoto, función de Netlify y `netlify.toml`.
- Pendiente: hacer el deploy en Netlify con la cuenta del usuario.

### 2026-11-03 · Plataforma completa en localhost
- Pedido: desarrollar todo en local; migración a Netlify después.
- Entregado: React + Express + PostgreSQL (PGlite), todas las pantallas del PDF, panel admin y reportes.
- Pendiente: nada.

### 2026-11-03 · Lógica, logo y marca
- Pedido: documento de lógica del MVP; logo profesional tipo ícono de app; todo en modo oscuro.
- Entregado: página de arquitectura publicada; logo «Aurora» elegido.
- Pendiente: nada.

## Errores

### 2026-11-03 · Netlify · «Algo salió mal en el servidor» al crear la cuenta en línea
- Qué pasó: en `cutterpay.netlify.app` toda la API respondía error; en local funcionaba.
- Causa (3 cosas): 1) Netlify empaqueta la función como **CommonJS** y ahí `import.meta.url` no existe → la función se caía al arrancar; 2) `serverless-http` entrega el cuerpo como **Buffer** y `express.json()` no lo lee → los formularios llegaban vacíos; 3) el límite de intentos no encontraba la IP y lanzaba error.
- Solución: `__dirname` cuando no hay `import.meta.url`; la función convierte el Buffer a JSON y pasa la IP de `x-nf-client-connection-ip`; el limitador usa esa IP con `validate: false`.
- Regla para el futuro: **antes de subir cambios del backend, se prueba el paquete como lo arma Netlify** (`esbuild --format=cjs` + llamar al `handler`). Además, Netlify deja el sitio protegido con login: hay que ponerlo en *Public* en Visitor access.

### 2026-11-03 · Landing · El texto del héroe no se veía en celular
- Qué pasó: la captura en 360 px mostraba el espacio del titular vacío.
- Causa: la animación de entrada empezaba en `opacity: 0`; si no corre (capturas, vistas previas, equipos lentos), el contenido queda invisible.
- Solución: las entradas solo desplazan (`y`, `scale`), nunca esconden.
- Regla para el futuro: **ningún contenido importante empieza con `opacity: 0`** ni depende de `whileInView` para verse.

### 2026-11-03 · Landing · Todo lo de abajo del héroe desaparecía
- Qué pasó: en la captura solo aparecía el héroe y el resto quedaba fuera.
- Causa: el contenedor del héroe tenía `min-h-screen` y ocupaba toda la altura de la ventana, empujando lo demás.
- Solución: se quitó `min-h-screen`; el héroe mide lo que mide su contenido.
- Regla para el futuro: el héroe nunca usa `100vh` / `min-h-screen`.

### 2026-11-03 · Backend · La base «no se reiniciaba» y seguían datos de prueba
- Qué pasó: después de `npm run db:reset`, la app mostraba compras de prueba anteriores.
- Causa: un servidor de prueba viejo seguía vivo en el puerto 3001 con la base en memoria; el servidor nuevo no podía arrancar y el proxy le hablaba al viejo.
- Solución: se cerró el proceso viejo, se reinició la base y `server.js` ahora avisa claro si el puerto está ocupado.
- Regla para el futuro: antes de reiniciar la base o levantar servidores, se revisa que no haya otro proceso en el puerto.

### 2026-11-03 · Frontend · Desborde horizontal en la landing (celular)
- Qué pasó: en 400 px la página se podía mover de lado.
- Causa: el resplandor decorativo con `-inset-8` y el encabezado con dos botones eran más anchos que la pantalla.
- Solución: `overflow-x: hidden` en el contenedor y en `body`; «Iniciar sesión» del encabezado solo desde `sm`.
- Regla para el futuro: todo efecto decorativo que se sale de su caja va dentro de un contenedor con `overflow-hidden`.

### 2026-11-03 · Frontend · Nombre duplicado `Wallet`
- Qué pasó: TypeScript falló porque el ícono `Wallet` de lucide y el tipo `Wallet` chocaban.
- Solución: el tipo se importa como `WalletData` donde también se usa el ícono.
- Regla para el futuro: los tipos que chocan con íconos se importan con alias.

### 2026-11-03 · Frontend · `baseUrl` en desuso (TypeScript 6)
- Qué pasó: VS Code marcó `baseUrl` como error.
- Solución: se quitó; `paths` funciona sin él.
