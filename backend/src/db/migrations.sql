-- Cambios que se aplican solos sobre una base existente (local o Neon). Todo es idempotente.

-- Correo verificado con código
ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS correo_verificado BOOLEAN NOT NULL DEFAULT FALSE;

-- Guía de bienvenida (primera compra) ya vista
ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS onboarding_completado BOOLEAN NOT NULL DEFAULT FALSE;
-- Las cuentas de demostración ya conocen la plataforma
UPDATE usuarios SET onboarding_completado = TRUE WHERE correo LIKE '%@cutterpay.com' AND onboarding_completado = FALSE;

-- Un DPI solo puede pertenecer a una cuenta
CREATE UNIQUE INDEX IF NOT EXISTS ux_usuarios_dpi ON usuarios (dpi) WHERE dpi IS NOT NULL;

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
