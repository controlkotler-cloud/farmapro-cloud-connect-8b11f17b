-- 08-09-2026. Historial ligero de textos generados en IAFarma.
-- EJECUTADO en producción vía query_database el 08-09-2026 (tabla nueva, sin filas previas).
--
-- Motivo: al salir de IAFarma y volver, el usuario no veía nada de lo generado
-- (prueba de Francesc con cuenta free). La edge `ai-creative-assistant` solo
-- registra metadatos en `ai_creative_usage` (sin contenido, a propósito). El
-- cliente guarda aquí cada texto terminado. Solo lo lee/borra su dueño y se
-- podan los que pasen de 50 por usuario.

CREATE TABLE IF NOT EXISTS public.ai_creative_generations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content_type text NOT NULL,
  brief text,
  output text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS ai_creative_generations_user_created_idx
  ON public.ai_creative_generations (user_id, created_at DESC);

ALTER TABLE public.ai_creative_generations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS ai_creative_generations_own_select ON public.ai_creative_generations;
CREATE POLICY ai_creative_generations_own_select ON public.ai_creative_generations
  FOR SELECT TO authenticated USING (auth.uid() = user_id);
DROP POLICY IF EXISTS ai_creative_generations_own_insert ON public.ai_creative_generations;
CREATE POLICY ai_creative_generations_own_insert ON public.ai_creative_generations
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS ai_creative_generations_own_delete ON public.ai_creative_generations;
CREATE POLICY ai_creative_generations_own_delete ON public.ai_creative_generations
  FOR DELETE TO authenticated USING (auth.uid() = user_id);

GRANT SELECT, INSERT, DELETE ON public.ai_creative_generations TO authenticated;

-- Poda: cada usuario conserva sus 50 textos más recientes.
CREATE OR REPLACE FUNCTION public.prune_ai_creative_generations() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  DELETE FROM public.ai_creative_generations
   WHERE user_id = NEW.user_id
     AND id IN (SELECT id FROM public.ai_creative_generations
                 WHERE user_id = NEW.user_id ORDER BY created_at DESC OFFSET 50);
  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS trg_prune_ai_creative_generations ON public.ai_creative_generations;
CREATE TRIGGER trg_prune_ai_creative_generations
  AFTER INSERT ON public.ai_creative_generations
  FOR EACH ROW EXECUTE FUNCTION public.prune_ai_creative_generations();
