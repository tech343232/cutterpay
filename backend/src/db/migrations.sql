-- Cambios que se aplican solos sobre una base existente (local o Neon). Todo es idempotente.

-- Correo verificado con código
ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS correo_verificado BOOLEAN NOT NULL DEFAULT FALSE;

-- Guía de bienvenida (primera compra) ya vista
ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS onboarding_completado BOOLEAN NOT NULL DEFAULT FALSE;
-- Las cuentas de demostración ya conocen la plataforma
UPDATE usuarios SET onboarding_completado = TRUE WHERE correo LIKE '%@cutterpay.com' AND onboarding_completado = FALSE;

-- Un DPI solo puede pertenecer a una cuenta
CREATE UNIQUE INDEX IF NOT EXISTS ux_usuarios_dpi ON usuarios (dpi) WHERE dpi IS NOT NULL;

-- 14. Retiros de dinero (simulados): billetera digital, banco o cajero sin tarjeta
CREATE TABLE IF NOT EXISTS retiros (
  id           SERIAL PRIMARY KEY,
  usuario_id   INTEGER NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
  metodo       VARCHAR(10) NOT NULL CHECK (metodo IN ('billetera', 'banco', 'cajero')),
  monto_usd    NUMERIC(18,2) NOT NULL CHECK (monto_usd > 0),
  destino      VARCHAR(80) NOT NULL,
  codigo_retiro VARCHAR(12),
  pin          CHAR(4),
  vence_en     TIMESTAMPTZ,
  estado       VARCHAR(12) NOT NULL DEFAULT 'completado',
  fecha        TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_retiros_usuario ON retiros (usuario_id, fecha DESC);

-- 13. Códigos de verificación por correo (login, registro y operaciones con dinero)
CREATE TABLE IF NOT EXISTS codigos_verificacion (
  id           VARCHAR(36)  PRIMARY KEY,
  usuario_id   INTEGER      NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
  proposito    VARCHAR(10)  NOT NULL CHECK (proposito IN ('registro', 'login', 'operacion')),
  accion       VARCHAR(20),
  payload_hash VARCHAR(64),
  codigo_hash  VARCHAR(64)  NOT NULL,
  intentos     INTEGER      NOT NULL DEFAULT 0,
  envios       INTEGER      NOT NULL DEFAULT 1,
  expira_en    TIMESTAMPTZ  NOT NULL,
  usado_en     TIMESTAMPTZ,
  creado_en    TIMESTAMPTZ  NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_codigos_usuario ON codigos_verificacion (usuario_id, creado_en DESC);
