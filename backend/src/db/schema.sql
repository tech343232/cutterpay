-- =========================================================
--  CUTTERPAY · Esquema de base de datos (PostgreSQL)
--  Local: PGlite (PostgreSQL embebido) · Nube: Netlify DB / Neon
-- =========================================================

-- 1. Usuarios: datos personales, rol y estado de la cuenta
CREATE TABLE usuarios (
  id                SERIAL PRIMARY KEY,
  nombre            VARCHAR(80)  NOT NULL,
  correo            VARCHAR(120) NOT NULL UNIQUE,
  password_hash     VARCHAR(100) NOT NULL,
  dpi               VARCHAR(13),
  rol               VARCHAR(10)  NOT NULL DEFAULT 'usuario' CHECK (rol IN ('usuario', 'admin')),
  estado            VARCHAR(12)  NOT NULL DEFAULT 'activo'  CHECK (estado IN ('activo', 'suspendido', 'baja')),
  intentos_fallidos INTEGER      NOT NULL DEFAULT 0,
  bloqueado_hasta   TIMESTAMPTZ,
  ultimo_acceso     TIMESTAMPTZ,
  creado_en         TIMESTAMPTZ  NOT NULL DEFAULT now()
);

-- 2. Billeteras: saldo ficticio en dólares (1 por usuario)
CREATE TABLE billeteras (
  id             SERIAL PRIMARY KEY,
  usuario_id     INTEGER NOT NULL UNIQUE REFERENCES usuarios(id) ON DELETE CASCADE,
  saldo_usd      NUMERIC(18,2) NOT NULL DEFAULT 0 CHECK (saldo_usd >= 0),
  actualizado_en TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 3. Criptomonedas: catálogo con precio simulado
CREATE TABLE criptomonedas (
  id              SERIAL PRIMARY KEY,
  nombre          VARCHAR(40) NOT NULL,
  simbolo         VARCHAR(10) NOT NULL UNIQUE,
  color           VARCHAR(7)  NOT NULL,
  precio_actual   NUMERIC(18,8) NOT NULL CHECK (precio_actual > 0),
  precio_base     NUMERIC(18,8) NOT NULL CHECK (precio_base > 0),
  volatilidad     NUMERIC(6,4)  NOT NULL,
  activa          BOOLEAN NOT NULL DEFAULT TRUE,
  actualizado_en  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 4. Portafolio: cuánto tiene cada usuario de cada moneda (llave compuesta)
CREATE TABLE portafolio (
  usuario_id     INTEGER NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
  cripto_id      INTEGER NOT NULL REFERENCES criptomonedas(id),
  cantidad       NUMERIC(24,8) NOT NULL CHECK (cantidad >= 0),
  costo_promedio NUMERIC(18,8) NOT NULL,
  PRIMARY KEY (usuario_id, cripto_id)
);

-- 5. Transacciones: historial de compras y ventas
CREATE TABLE transacciones (
  id              SERIAL PRIMARY KEY,
  usuario_id      INTEGER NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
  cripto_id       INTEGER NOT NULL REFERENCES criptomonedas(id),
  tipo            VARCHAR(6) NOT NULL CHECK (tipo IN ('compra', 'venta')),
  cantidad        NUMERIC(24,8) NOT NULL CHECK (cantidad > 0),
  precio_unitario NUMERIC(18,8) NOT NULL,
  total_usd       NUMERIC(18,2) NOT NULL,
  ganancia_usd    NUMERIC(18,2),
  fecha           TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_tx_usuario_fecha ON transacciones (usuario_id, fecha DESC);
CREATE INDEX idx_tx_cripto_tipo   ON transacciones (cripto_id, tipo);

-- 6. Historial de precios: puntos para las gráficas
CREATE TABLE historial_precios (
  id        BIGSERIAL PRIMARY KEY,
  cripto_id INTEGER NOT NULL REFERENCES criptomonedas(id),
  precio    NUMERIC(18,8) NOT NULL,
  fecha     TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_hist_cripto_fecha ON historial_precios (cripto_id, fecha);

-- 7. Recargas: pasarela de pago simulada (solo se guardan los últimos 4 dígitos)
CREATE TABLE recargas (
  id               SERIAL PRIMARY KEY,
  usuario_id       INTEGER NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
  monto_usd        NUMERIC(18,2) NOT NULL CHECK (monto_usd > 0),
  tarjeta_ultimos4 CHAR(4) NOT NULL,
  estado           VARCHAR(10) NOT NULL CHECK (estado IN ('aprobada', 'rechazada')),
  fecha            TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 8. Auditoría: quién hizo qué y cuándo
CREATE TABLE auditoria (
  id         BIGSERIAL PRIMARY KEY,
  usuario_id INTEGER REFERENCES usuarios(id) ON DELETE SET NULL,
  accion     VARCHAR(40) NOT NULL,
  ip         VARCHAR(64),
  detalle    JSONB,
  fecha      TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_auditoria_fecha ON auditoria (fecha DESC);

-- =========================================================
--  Fondos con rendimiento (ahorro en dólares)
-- =========================================================

-- 9. Fondos: productos de inversión con rendimiento efectivo anual (simulado)
CREATE TABLE fondos (
  id                SERIAL PRIMARY KEY,
  nombre            VARCHAR(60)  NOT NULL,
  slug              VARCHAR(30)  NOT NULL UNIQUE,
  descripcion       VARCHAR(200) NOT NULL,
  rendimiento_anual NUMERIC(5,2) NOT NULL CHECK (rendimiento_anual > 0),
  riesgo            VARCHAR(6)   NOT NULL CHECK (riesgo IN ('bajo', 'medio', 'alto')),
  color             VARCHAR(7)   NOT NULL,
  activo            BOOLEAN      NOT NULL DEFAULT TRUE
);

-- 10. Inversiones en fondos: saldo que crece con el tiempo (interés compuesto continuo)
CREATE TABLE inversiones_fondo (
  usuario_id     INTEGER NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
  fondo_id       INTEGER NOT NULL REFERENCES fondos(id),
  saldo          NUMERIC(20,8) NOT NULL CHECK (saldo >= 0),
  aportado       NUMERIC(18,2) NOT NULL CHECK (aportado >= 0),
  actualizado_en TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (usuario_id, fondo_id)
);

-- 11. Movimientos de fondos: depósitos y retiros
CREATE TABLE movimientos_fondo (
  id         SERIAL PRIMARY KEY,
  usuario_id INTEGER NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
  fondo_id   INTEGER NOT NULL REFERENCES fondos(id),
  tipo       VARCHAR(8) NOT NULL CHECK (tipo IN ('deposito', 'retiro')),
  monto      NUMERIC(18,2) NOT NULL CHECK (monto > 0),
  ganancia   NUMERIC(18,2),
  fecha      TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_mov_fondo_usuario ON movimientos_fondo (usuario_id, fecha DESC);

-- 12. Tasas de referencia para comparar con la banca tradicional (en dólares)
CREATE TABLE tasas_referencia (
  id          SERIAL PRIMARY KEY,
  producto    VARCHAR(80) NOT NULL,
  tasa_anual  NUMERIC(5,2) NOT NULL CHECK (tasa_anual >= 0),
  nota        VARCHAR(160) NOT NULL
);
