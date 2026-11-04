# LOG.md · Cerebro del proyecto CUTTERPAY

Aquí se anota cada petición y cada error del proyecto, por qué pasó y cómo se resolvió.
**Antes de empezar una tarea nueva se lee este archivo** para no repetir errores.

## Cómo se usa

1. Cada petición nueva va **arriba** de «Peticiones» (pedido, entregado, pendiente).
2. Cada error nuevo va **arriba** de «Errores» (qué pasó, causa, solución, regla).
3. Si una regla se repite, se sube a «Reglas aprendidas».

## Reglas aprendidas

### Diseño y textos
- **Textos neutros en género** para el usuario («Te damos la bienvenida», no «Bienvenida/o»).
- **Íconos que no confunden**: acciones generales (comprar) con íconos generales (bolsa), nunca el logo de una moneda específica.
- **Ningún texto plano**: base en gris (`text-muted`), lo importante en **negrita blanca** y la frase protagonista con `.cp-mark` (subrayado degradado). 
- **Siempre usar SVG propios animados con CSS** (trazos que se dibujan con `pathLength=1` + `stroke-dashoffset`, `transform-box: fill-box` para escalar partes). Degradados de trazos finos con `gradientUnits="userSpaceOnUse"`.
- **Pensado para personas de 40+ en celular**: letra base 17.5 px en pantallas ≤ 640 px, nada menor a 13 px, gris secundario `186 180 210`, botones de 56 px de alto. Nunca bajar estos tamaños.
- **CUTTERPAY es un simulador de monedas digitales con las 3 del PDF: Bitcoin, Ethereum y Dogecoin (saldo de prueba $1,000)**. Lo que pide el PDF se respeta tal cual; la propuesta propia va en la forma (promesa, perfiles, diseño), no en cambiar requisitos según el PDF del curso. Los fondos de ahorro son una opción secundaria dentro de la app; nunca protagonistas de la landing.
- **Ningún párrafo termina con 1 o 2 palabras solas en la última línea.** Títulos con `text-wrap: balance`, párrafos con `text-wrap: pretty` (global en `index.css`). Si un texto sigue quedando cojo, se reescribe más corto.
- **Todo lo que ve el usuario se escribe para principiantes**: se habla del resultado («ganas $7.25 por cada $100»), no de lo técnico. Lo técnico se queda en este log y en el código.
- **Los encabezados muestran solo el nombre**; la explicación va en un «?» (`components/ui/Help.tsx`).
- **Flujos guiados paso a paso**: un paso abierto a la vez, con número y ✓ al completarlo (checkout `MoneyFlow`).
- **Comprar o invertir debe sentirse como una compra en línea**: monto en dólares → resumen tipo carrito → confirmación con celebración.
- **Solo modo oscuro.** Logo oficial «Aurora» (C cortada + moneda), animado. Morado `#9B8CFF` como acento.
- **Nada de `alert`, `confirm` o `prompt` nativos**: se usan diálogos propios.
- **Ninguna pantalla muestra barra horizontal** y todo debe caber en un celular de **360 px**.

### Técnica
- **Las cuadrículas usan `grid-cols-[minmax(0,1fr)]`** (también en las columnas `xl:`): con `1fr` o sin columnas, una tabla o gráfica ancha hace crecer la tarjeta más que la pantalla.
- **Revisión móvil automática**: página temporal que abre cada ruta en un marco de 360 px y mide qué se sale; se borra antes de subir (lleva tokens).
- **Si aparece `EADDRINUSE`**, se busca qué proceso ocupa el puerto y se cierra antes de cambiar nada. Antes de reiniciar la base, se apagan los servidores.
- **Capturas de prueba**: rutas completas, sin variables dentro de comillas simples; para ver una parte se ocultan las demás en vez de desplazar.
- **El precio y los saldos los calcula siempre el servidor**; el navegador solo manda qué y cuánto.
- **Toda operación de dinero va en una transacción SQL con `FOR UPDATE`.**
- **Pensado para Netlify**: nada de temporizadores en el servidor (precios e intereses se calculan según el tiempo que pasó); la base es PostgreSQL (PGlite en local, Neon en la nube).
- **Clases de Tailwind solo de la escala** (`/10`, `/15`, `h-12`, `h-14`); valores fuera de escala no generan CSS.

## Peticiones

### 2026-11-03 · Pagar con tarjeta al comprar, autocompletar en tester y presentación animada
- Pedido: no obligar a recargar saldo antes de comprar: al comprar se pide la tarjeta (crédito o débito); en modo tester un botón autocompleta la tarjeta de prueba (y los datos de login y recarga); luego siempre se pide el código del correo para evitar fraudes, en tester y usuario. Presentación con motion graphics, flujo de registro con código, cómo comprar, pagar con tarjeta, retirar y métodos de pago a futuro.
- Entregado: `tradeSchema.card` + cobro de la tarjeta dentro de la misma transacción de compra (recarga aprobada + compra; tarjeta 4000…0002 rechazada); el código del correo autoriza también esa tarjeta; checkout con «¿Cómo quieres pagar? Mi saldo / Tarjeta» (si no alcanza, tarjeta por defecto) y «Autocompletar con tarjeta de prueba» en cuentas @cutterpay.com; recarga con botón de autocompletar; botones «Autocompletar» en /login/tester y /login/admin. Presentación de 16 diapositivas con fondo de aurora vivo, celulares animados (registro, compra, retiro), tarjeta animada y entradas escalonadas.
- Pendiente: nada.

### 2026-11-03 · Retiro propio, logins separados, fondos visuales y precios sin asustar
- Pedido: pestaña de retiro (billetera digital, cuenta bancaria local, efectivo en cajero sin tarjeta); un login por tipo (usuario, tester, admin) con la contraseña semilla del admin oculta tras advertencia; contraseña larga para Sofía; paneles con menos texto y más visual; precios de monedas que no asusten («desde $1»); pie centrado en celular; párrafos centrados balanceados.
- Entregado: tabla `retiros` + `POST /billetera/retirar` (DPI + código del correo atado al destino; cajero: código 8 dígitos + PIN, 24 h, enteros hasta $400); Billetera en pestañas Retirar / Recargar / Movimientos con ilustraciones SVG animadas; `/login` (usuario, sin cuentas), `/login/tester` (Sofía visible) y `/login/admin` (semilla oculta con advertencia de no compartir pantalla); claves nuevas `Sofia#Cutter2025-Invierte!` y `CutterAdmin#2025$Semilla!` (local y Neon); tarjeta de fondo con anillo animado y chips; selector de moneda con «Empieza desde $1» y «una moneda entera vale… tú compras un pedacito».
- Pendiente: nada.

### 2026-11-03 · Comprar: primero qué moneda, guía de primera compra e íconos claros
- Pedido: al tocar «Comprar monedas digitales» debe preguntar qué moneda y cuánto; todo pensado para principiantes y para crear hábito; guía (onboarding) la primera vez para comprar su primera cripto; el botón de comprar no debe llevar el ícono de Bitcoin para no confundir.
- Entregado: paso «¿Qué moneda quieres comprar?» dentro del checkout (explicación simple, «Recomendada para empezar», cuánto se mueve, cambiar moneda); guía de 4 pasos (bienvenida → qué es una moneda digital → elige → con cuánto empiezas) que termina en la compra real con $10/$25/$50 y mensaje «¡Compraste tu primera moneda digital! Vuelve mañana…»; se muestra una sola vez (columna `onboarding_completado`, demo ya marcadas); íconos: bolsa de compras en el botón y monedas en «En cripto».
- Pendiente: nada.

### 2026-11-03 · Textos con negritas/subrayado y CTA del pie llamativo
- Pedido: el «Crear cuenta» del pie debe verse llamativo; los textos no deben ser planos: negritas, subrayado y contraste blanco/gris para dar protagonismo.
- Entregado: clase `.cp-mark` (negrita blanca + subrayado con degradado que se dibuja al cargar; `.ok` en verde); dentro de textos grises toda negrita se vuelve blanca; frases clave marcadas en héroe, monedas, problema, beneficios, pasos, perfiles, cierre y pie; pie con botón degradado con brillo + «Ya tengo cuenta».
- Pendiente: nada.

### 2026-11-03 · 3 links para entrar
- Pedido: links para entrar como usuario público, como administrador y para probar compras.
- Entregado: página pública (`/`), prueba directa como Sofía (`/demo/usuario`) y admin directo (`/demo/admin`); entran sin escribir correo, contraseña ni código y solo funcionan con las cuentas de demostración. Probados en vivo.
- Pendiente: nada.

### 2026-11-03 · Respetar el PDF (Dogecoin), héroe sin huecos en PC y créditos
- Pedido: volver a Dogecoin porque así lo dice el PDF (la propuesta va en la forma, no en cambiar requisitos); quitar el espacio vacío del héroe en PC para que se vea sofisticado; en el pie decir quién lo creó (Sofía), de qué trabajo es, la universidad y el nombre del proyecto.
- Entregado: BTC, ETH y DOGE otra vez (bases local y Neon regeneradas); héroe alineado arriba con fila «Mercado en vivo» en PC; pie con proyecto, «Creado por Sofía del Carmen Ramírez Sagastume», «Proyecto Final · Desarrollo Web · Facultad de Ingeniería · Universidad Mariano Gálvez de Guatemala» y accesos.
- Pendiente: nada.

### 2026-11-03 · ¿Para quién es CUTTERPAY? (3 perfiles)
- Pedido: mostrar para quién es ideal CUTTERPAY con 3 perfiles (profesional cansado de depender de su sueldo, independiente que quiere otra fuente de ingresos, dueño de negocio que quiere invertir sus ganancias), 3 dolores de cada uno desde el ángulo de nuevas fuentes de ingreso y dinero estancado; usar SVG animados con CSS en todo.
- Entregado: sección `components/landing/Personas.tsx` con ilustración SVG propia por perfil (maletín con monedas que salen, laptop con barras y tendencia, tienda con monedas que se apilan), trazos que se dibujan solos, hover con borde animado, 3 dolores + solución por perfil y botón «Quiero que mi dinero trabaje».
- Pendiente: nada.

### 2026-11-03 · Solana en lugar de Dogecoin, $1,000 de prueba y nueva promesa
- Pedido: el héroe debe hablar de generar una nueva fuente de ingresos y poner a trabajar el dinero en monedas digitales; cambiar Dogecoin por Solana con una línea de por qué invertir y desde cuánto; saldo de prueba de $1,000 en vez de $10,000.
- Entregado: monedas BTC, ETH y SOL (base, landing, historia animada, filtros); «Las 3 monedas digitales más conocidas del mundo. Empieza a invertir desde solo $1.»; nueva promesa; saldo inicial $1,000 (config, .env, textos); seed de Sofía ajustado a compras pequeñas; base local y Neon regeneradas.
- Pendiente: nada.

### 2026-11-03 · Celular legible para 40+ y primera pantalla con logo grande
- Pedido: la versión móvil debe leerse fácil para personas de 40 años; la promesa centrada en celular; logo de CUTTERPAY grande y centrado con animación CSS en el ícono y en el nombre.
- Entregado: en celular la letra base pasa a 17.5 px (todo crece ~10%), texto chico mínimo 13 px, gris secundario con más contraste; héroe móvil centrado con logo de 112 px animado y nombre con brillo que recorre las letras; botones a lo ancho. Prueba 360 px: 14/14 sin desborde.
- Pendiente: nada.

### 2026-11-03 · Todo enfocado en monedas digitales (como pide el PDF)
- Pedido: la landing trataba la cripto como algo extra («¿Quieres más emoción?»). El proyecto del PDF es de criptomonedas: el mensaje debe ser «haz crecer tu dinero así de sencillo con monedas digitales», para el principiante que tiene sus dólares quietos en el banco, destacando Bitcoin, Ethereum y Dogecoin.
- Entregado: landing nueva centrada en las 3 monedas (tarjetas con explicación simple, precio en vivo, cuánto compras con $10 y cuánto se mueve cada una), problema del banco contra «la moneda que más subió hoy» con datos en vivo, beneficios y pasos de compra; historia animada contada con compra de Bitcoin; en el Inicio la acción principal es «Comprar monedas digitales» y los fondos pasan a segundo plano; Cripto va antes que Fondos en el menú.
- Pendiente: nada.

### 2026-11-03 · DPI solo al retirar + todo responsive
- Pedido: quitar el DPI del registro y pedirlo dentro, para retirar dinero; que todo funcione desde el celular.
- Entregado: registro con nombre, correo y contraseña; paso «Verifica tu identidad» la primera vez que se retira de un fondo (DPI guatemalteco: 13 dígitos, departamento 01–22 y municipio válidos, único por cuenta); el servidor bloquea retiros sin DPI. Prueba automática de las 14 pantallas en 360 px: todas sin desborde; cuadrículas con `minmax(0,1fr)`.
- Pendiente: nada.

### 2026-11-03 · Registro más estético con imágenes generadas por IA
- Pedido: el registro no se veía atractivo; agregar motion graphic e imágenes sofisticadas (generadas con IA) para que un principiante se sienta apegado desde el primer minuto.
- Entregado: 3 ilustraciones 3D generadas con IA (`frontend/public/img/`: grow, shield, gift; 35–43 KB cada una), componente `FloatingArt` (flota, halo que respira, partículas); registro dentro de tarjeta de vidrio con borde animado, pasos «Tus datos → Confirma tu correo → ¡A invertir!» y banner de regalo; escudo 3D en el paso del código; ilustraciones dentro de la historia animada.
- Pendiente: nada.

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

### 2026-11-03 · Registro · "El envío de correos aún no está configurado"
- Qué pasó: en Netlify nadie podía crear cuenta porque faltan las variables SMTP de Gmail.
- Solución: mientras el correo no esté configurado, el código se muestra en pantalla con el aviso «Versión beta»; con las variables SMTP puestas, el código solo llega al correo.
- Regla para el futuro: una función opcional sin configurar nunca bloquea el registro; avisa y sigue.

### 2026-11-03 · Responsive · Logins de tester/admin y pestañas de Billetera se salían en celular
- Qué pasó: en 360 px /login/tester medía 490 px, /login/admin 421 px y las pestañas de Billetera 426 px.
- Causa: la cuadrícula del login (`grid` sin columnas) toma el ancho mínimo de su contenido, y el encabezado de credenciales no podía partirse; las pestañas tenían íconos + texto + mucho relleno.
- Solución: `grid-cols-[minmax(0,1fr)]` y `min-w-0` en AuthLayout, encabezado con `flex-wrap`, pestañas sin íconos en celular y con menos relleno; botón «?» de 24 px en celular.
- Regla para el futuro: **toda pantalla nueva entra a la prueba de 360 px** (incluidas /login/tester y /login/admin) antes de subirla.

### 2026-11-03 · Backend · Retiro a cajero fallaba (código 42P08)
- Causa: PostgreSQL no pudo deducir el tipo de `$5` usado a la vez como valor y dentro de `CASE`.
- Solución: calcular la fecha de vencimiento en Node y pasarla como parámetro aparte.
- Regla para el futuro: no reutilizar el mismo parámetro `$n` en contextos de tipo distinto; calcular en Node.

### 2026-11-03 · Diseño · Texto de la solución partido en columnas
- Causa: el párrafo era `flex`; al meter negritas el texto quedó en varios nodos y cada uno se volvió una columna.
- Solución: envolver el texto en un `<span>` dentro del contenedor flex.
- Regla para el futuro: en un contenedor `flex` con ícono + texto, el texto siempre va dentro de su propio `<span>`.

### 2026-11-03 · Scripts · `npm run db:setup-remote -- --force` no reiniciaba la nube
- Causa: el script raíz pasa los argumentos a otro `npm run`, y npm se queda con `--force` como opción suya.
- Solución: ejecutar directo `node scripts/setup-remote-db.js --force` dentro de `backend`; README corregido.
- Regla para el futuro: argumentos de scripts que se reenvían entre workspaces se prueban ejecutando el script de Node directo.

### 2026-11-03 · Backend · El registro en línea decía «Algo salió mal en el servidor»
- Qué pasó: al crear cuenta en Netlify salía un error genérico.
- Causa: el envío de correos aún no estaba configurado y el servidor respondía 503 con un mensaje claro, pero el manejador de errores ocultaba TODO mensaje 5xx.
- Solución: los `HttpError` llevan `expose = true` y su mensaje se muestra; si alguien se registró sin confirmar el correo, al volver a registrarse se le reenvía el código.
- Regla para el futuro: los avisos pensados para el usuario se muestran siempre, aunque sean 5xx; solo se ocultan los errores inesperados.

### 2026-11-03 · Diseño · Recuadro negro alrededor de las imágenes 3D
- Causa: `mix-blend-mode: screen` no funciona dentro de un contenedor animado (crea su propio contexto).
- Solución: máscara radial que desvanece los bordes de la imagen.
- Regla para el futuro: imágenes con fondo oscuro → máscara radial además del modo de mezcla.

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
