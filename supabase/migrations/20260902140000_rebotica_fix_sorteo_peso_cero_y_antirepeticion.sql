-- ============================================================================
-- Rebotica · 02-09-2026 · BUG CRÍTICO del sorteo + anti-repetición de premios
-- ----------------------------------------------------------------------------
-- (Migración retroactiva: el SQL ya está ejecutado en producción.)
--
-- EL BUG. `rebotica_pick_and_consume_prize` ordenaba por `-ln(random())/peso`
-- sin filtrar `peso > 0`. Desde que existen premios de calendario con peso 0
-- (El Baúl y El Gordo, doctrina del 13-07), esa división daba 22012
-- "division by zero" en CADA llamada. La edge `open-reward` captura el error
-- de la RPC y responde 409 "Sin stock de premios disponible ahora mismo".
-- Es decir: el 10-09 NADIE habría podido abrir un cajón. Detectado el 02-09
-- ejecutando el SELECT del sorteo contra la campaña real.
--
-- EL AÑADIDO. Tercer parámetro opcional `p_user_id`. Cuando quien llama lo
-- pasa, un premio de tipo 'contenido' (masterclass del vault, plantilla
-- exclusiva) no se repite ni a la misma persona ni a nadie de su misma
-- farmacia. Con la firma de dos argumentos que usa hoy la edge, el parámetro
-- llega NULL y la regla no se aplica: por eso hay que actualizar `open-reward`
-- para que pase `p_user_id: user.id` (decisión Francesc 02-09: cajonera
-- mensual, así que un usuario abre varios cajones por temporada y la
-- repetición pasa a ser posible).
--
-- OJO al desplegar: hubo que hacer DROP de la sobrecarga de 2 argumentos. Si
-- se quedan las dos, PostgreSQL resuelve la llamada de la edge a la antigua y
-- el bug sigue vivo (mismo patrón que el "RPC retos 400 por overload huérfano").
-- ============================================================================

DROP FUNCTION IF EXISTS public.rebotica_pick_and_consume_prize(uuid, text);

CREATE OR REPLACE FUNCTION public.rebotica_pick_and_consume_prize(
  p_campaign_id uuid,
  p_tier text,
  p_user_id uuid DEFAULT NULL
)
 RETURNS uuid
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_prize_id uuid;
  v_team uuid;
BEGIN
  IF p_user_id IS NOT NULL THEN
    SELECT team_id INTO v_team
      FROM public.team_members
     WHERE user_id = p_user_id
       AND status = 'active'
     LIMIT 1;
  END IF;

  SELECT pr.id INTO v_prize_id
    FROM public.rebotica_prizes pr
   WHERE pr.campaign_id = p_campaign_id
     AND pr.stock_restante > 0
     AND pr.tier IN ('todos', p_tier)
     AND pr.peso > 0
     AND (
       p_user_id IS NULL
       OR pr.tipo <> 'contenido'
       OR NOT EXISTS (
            SELECT 1
              FROM public.rebotica_openings o
             WHERE o.prize_id = pr.id
               AND (
                 o.user_id = p_user_id
                 OR (
                   v_team IS NOT NULL
                   AND EXISTS (
                     SELECT 1 FROM public.team_members tm
                      WHERE tm.user_id = o.user_id
                        AND tm.team_id = v_team
                        AND tm.status = 'active'
                   )
                 )
               )
          )
     )
   ORDER BY -ln(random()) / pr.peso
   LIMIT 1
   FOR UPDATE SKIP LOCKED;

  IF v_prize_id IS NULL THEN
    RETURN NULL;
  END IF;

  UPDATE public.rebotica_prizes
     SET stock_restante = stock_restante - 1,
         updated_at = now()
   WHERE id = v_prize_id;

  RETURN v_prize_id;
END;
$function$;

-- Prueba (no consume stock):
--   BEGIN;
--   SELECT p.titulo FROM rebotica_prizes p
--    WHERE p.id = rebotica_pick_and_consume_prize(
--      (SELECT id FROM rebotica_campaigns LIMIT 1), 'gratis');
--   ROLLBACK;
