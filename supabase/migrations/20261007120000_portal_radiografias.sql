-- 07-10-2026. Radiografía de tu ficha de Google dentro del portal (F3 del plan de captación).
-- EJECUTADO en producción vía query_database el 07-10-2026 (tabla nueva: comprobado antes
-- por information_schema, types.ts y migraciones que no existía ni había nombres parecidos).
--
-- Motivo: la Radiografía de farmapro.es enseña solo el titular y los 4 bloques; el informe
-- completo (14-15 puntos y comparativa con la zona) vive en el portal, tras crear cuenta gratis.
-- Cada usuario guarda aquí sus análisis: si pide el mismo cid en menos de 7 días se le enseña
-- el guardado y no se repite el análisis (cada uno cuesta unos 0,01 $ en DataForSEO).
-- Convención: igual que ai_creative_generations (user_id -> auth.users, RLS solo propio,
-- políticas TO authenticated, GRANT explícito).

CREATE TABLE IF NOT EXISTS public.portal_radiografias (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  cid text NOT NULL,
  title text,
  score integer,
  payload jsonb NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS portal_radiografias_user_cid_idx
  ON public.portal_radiografias (user_id, cid, created_at DESC);

ALTER TABLE public.portal_radiografias ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS portal_radiografias_own_select ON public.portal_radiografias;
CREATE POLICY portal_radiografias_own_select ON public.portal_radiografias
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS portal_radiografias_own_insert ON public.portal_radiografias;
CREATE POLICY portal_radiografias_own_insert ON public.portal_radiografias
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

GRANT SELECT, INSERT ON public.portal_radiografias TO authenticated;

-- Los privilegios por defecto de Supabase daban a anon y authenticated todo (incluido
-- TRUNCATE, que se salta la RLS). Se dejan solo los que usa la app.
REVOKE ALL ON public.portal_radiografias FROM anon;
REVOKE UPDATE, DELETE, TRUNCATE, REFERENCES, TRIGGER ON public.portal_radiografias FROM authenticated;
