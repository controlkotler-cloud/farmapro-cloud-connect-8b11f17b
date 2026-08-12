-- =====================================================================
-- REBOTICA · TANDA SQL 3 (RETROACTIVA) — rebotica_calendar_draws
--
-- Esta tabla YA EXISTE en producción: se creó por SQL directo el
-- 16-07-2026 como prerrequisito del prompt Lovable nº2 (backend
-- Rebotica: open-reward, redeem-reward, rebotica_cron_daily — commit
-- f47a62b, ya enviado y desplegado). Igual que otras piezas de Rebotica,
-- se aplicó sin migración versionada (patrón ya conocido: BD real puede
-- ir por delante del repo). Esta migración es RETROACTIVA: documenta el
-- esquema en el repo y refuerza índices/constraints con guardas
-- idempotentes, sin romper nada si la forma real difiere ligeramente.
--
-- Fuente de verdad del esquema: uso confirmado en rebotica_cron_daily()
-- (supabase/migrations/20260716163403_ee6a5efd-...sql), que hace
--   INSERT INTO rebotica_calendar_draws
--     (tipo, temporada, periodo, user_id, opening_id, prize_id, estado, meta)
-- y envuelve cada adjudicación en un BEGIN/EXCEPTION WHEN unique_violation.
--
-- Mecánica (sección 'CATÁLOGO v4 + MECÁNICA DE SORTEO',
-- impulso/memory/project_rebotica_portal.md, decisión 13-07):
--   Cada apertura del período = una papeleta. FUERA del sorteo instantáneo
--   (que solo sortea premios con peso > 0):
--     BAÚL: 1/MES — sorteo el último día de mes (30-09, 31-10, 30-11)
--       entre las rebotica_openings de ese mes natural.
--     GORDO: 1/TRIMESTRE — sorteo el 30-11 entre TODAS las aperturas de
--       la temporada (T1: 2026-otonio).
--   Exclusiones: el ganador de un baúl NO puede ganar el Gordo de la
--   misma temporada; nadie gana 2 baúles en la misma temporada. Todo lo
--   demás sigue participando en todo. → UNIQUE(temporada, user_id) sobre
--   esta tabla implementa AMBAS reglas de una sola vez (culaquier fila
--   previa del usuario en la temporada, sea baúl o Gordo, bloquea otra).
-- =====================================================================

-- 1. Tabla (no-op si ya existe en producción; documenta el esquema real
--    y sirve de base si se levanta un entorno nuevo desde cero)
CREATE TABLE IF NOT EXISTS public.rebotica_calendar_draws (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tipo TEXT NOT NULL CHECK (tipo IN ('baul', 'gordo')),
  temporada TEXT NOT NULL,
  periodo TEXT,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  opening_id UUID REFERENCES public.rebotica_openings(id) ON DELETE SET NULL,
  prize_id UUID REFERENCES public.rebotica_prizes(id) ON DELETE SET NULL,
  estado TEXT NOT NULL DEFAULT 'pendiente'
    CHECK (estado IN ('pendiente', 'enviado', 'entregado', 'reasignado')),
  drawn_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  meta JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.rebotica_calendar_draws IS
  'Adjudicaciones de premios de calendario (baul mensual, Gordo trimestral). Cada apertura del periodo es una papeleta; rebotica_cron_daily() sortea y registra aqui, fuera del sorteo instantaneo (peso=0 en rebotica_prizes). tipo/periodo/temporada + estado de entrega; ver CATALOGO v4 en impulso/memory/project_rebotica_portal.md.';

-- 2. Asegurar columnas sobre la tabla ya existente en producción
--    (defensivo: no-op si ya coinciden; NO fuerza CHECK/FK nuevos sobre
--    una tabla ya viva para no arriesgar fallo por datos existentes)
ALTER TABLE public.rebotica_calendar_draws ADD COLUMN IF NOT EXISTS tipo TEXT;
ALTER TABLE public.rebotica_calendar_draws ADD COLUMN IF NOT EXISTS temporada TEXT;
ALTER TABLE public.rebotica_calendar_draws ADD COLUMN IF NOT EXISTS periodo TEXT;
ALTER TABLE public.rebotica_calendar_draws ADD COLUMN IF NOT EXISTS user_id UUID;
ALTER TABLE public.rebotica_calendar_draws ADD COLUMN IF NOT EXISTS opening_id UUID;
ALTER TABLE public.rebotica_calendar_draws ADD COLUMN IF NOT EXISTS prize_id UUID;
ALTER TABLE public.rebotica_calendar_draws ADD COLUMN IF NOT EXISTS estado TEXT NOT NULL DEFAULT 'pendiente';
ALTER TABLE public.rebotica_calendar_draws ADD COLUMN IF NOT EXISTS drawn_at TIMESTAMPTZ NOT NULL DEFAULT now();
ALTER TABLE public.rebotica_calendar_draws ADD COLUMN IF NOT EXISTS meta JSONB;
ALTER TABLE public.rebotica_calendar_draws ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ NOT NULL DEFAULT now();

-- 3. Índices de consulta
CREATE INDEX IF NOT EXISTS idx_rebotica_calendar_draws_user_id
  ON public.rebotica_calendar_draws(user_id);
CREATE INDEX IF NOT EXISTS idx_rebotica_calendar_draws_temporada_tipo
  ON public.rebotica_calendar_draws(temporada, tipo);

-- 3.1 Índice único de negocio: máx. 1 adjudicación de calendario (baúl O
--     Gordo) por usuario y temporada. Envuelto en DO $$ para no abortar
--     el resto de la migración si ya hubiera duplicados en producción
--     (no debería: "sin envíos de prueba, primer sorteo real 30-09" a
--     fecha 16-07 según impulso/memory/project_rebotica_portal.md).
DO $$
BEGIN
  CREATE UNIQUE INDEX IF NOT EXISTS ux_rebotica_calendar_draws_temporada_user
    ON public.rebotica_calendar_draws (temporada, user_id);
EXCEPTION WHEN unique_violation THEN
  RAISE NOTICE 'rebotica_calendar_draws: hay (temporada,user_id) duplicados — revisar a mano antes de reintentar el indice unico.';
END $$;

-- 4. RLS: solo service_role (edges/cron leen y escriben con service
--    role; nadie más debe poder ver quién ganó qué antes del email de
--    aviso / reveal — sin policies para authenticated a propósito)
ALTER TABLE public.rebotica_calendar_draws ENABLE ROW LEVEL SECURITY;

-- ---------------------------------------------------------------------
-- 5. Fix bug bloqueante: rebotica_prizes_peso_check (tanda1, 09-07)
--    exige peso > 0, pero el catálogo v4 y el propio rebotica_cron_daily()
--    ya desplegado usan peso = 0 para marcar premios de calendario
--    (excluidos del sorteo instantáneo). Sin este fix, el INSERT de
--    "El baúl de la Rebotica" y "EL GORDO..." en
--    contenido/carga-rebotica-bienvenida-DRAFT.sql fallará contra este
--    CHECK en cuanto se ejecute.
-- ---------------------------------------------------------------------
ALTER TABLE public.rebotica_prizes DROP CONSTRAINT IF EXISTS rebotica_prizes_peso_check;
ALTER TABLE public.rebotica_prizes ADD CONSTRAINT rebotica_prizes_peso_check CHECK (peso >= 0);

-- ---------------------------------------------------------------------
-- Verificación (solo lectura — ejecutar tras aplicar y pegar resultado):
--
--   SELECT column_name, data_type, is_nullable, column_default
--     FROM information_schema.columns
--    WHERE table_schema='public' AND table_name='rebotica_calendar_draws'
--    ORDER BY ordinal_position;
--
--   SELECT indexname, indexdef FROM pg_indexes
--    WHERE schemaname='public' AND tablename='rebotica_calendar_draws';
--
--   SELECT relrowsecurity FROM pg_class WHERE relname='rebotica_calendar_draws';
--
--   SELECT conname, pg_get_constraintdef(oid) FROM pg_constraint
--    WHERE conrelid = 'public.rebotica_prizes'::regclass
--      AND conname = 'rebotica_prizes_peso_check';
--   -- esperado: CHECK ((peso >= 0))
--
--   SELECT count(*) FROM public.rebotica_calendar_draws; -- esperado: 0 (aún sin sorteos reales)
-- =====================================================================
