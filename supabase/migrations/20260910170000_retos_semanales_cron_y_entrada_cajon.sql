-- 20260910170000_retos_semanales_cron_y_entrada_cajon.sql
--
-- Tres cosas que van juntas porque tocan el mismo circuito (decisión Francesc 10-09-2026,
-- canon de cadencia en farmapro-portal/docs/PLAN-CONTENIDO-Y-CAPTACION-Q4-2026.md):
--
--   1. Retroactivo: `challenges.is_weekly` existía en la BD real sin migración que lo creara.
--   2. El "Reto de la semana" deja de depender del botón manual de Admin → Retos: un cron
--      lo activa cada lunes a las 06:00 UTC (08:00 en Madrid) rotando plantillas, y caduca
--      el de la semana anterior.
--   3. Quien completa el reto semanal gana una APERTURA EXTRA del cajón del mes.
--
-- Escrita idempotente: las migraciones de este repo NO se ejecutan solas, se corren a mano
-- con query_database del MCP de Lovable y pueden repetirse.

-- ---------------------------------------------------------------------------
-- 1. Retroactivo
-- ---------------------------------------------------------------------------
ALTER TABLE public.challenges
  ADD COLUMN IF NOT EXISTS is_weekly boolean NOT NULL DEFAULT false;

-- ---------------------------------------------------------------------------
-- 2. Rotación de plantillas
-- ---------------------------------------------------------------------------
-- `rotation_order` NULL = fuera de la rotación automática. Se deja NULL a propósito en las
-- plantillas de tipo `community_engagement` y `special`: NADA en la app incrementa esos tipos
-- (verificado por dos vías el 10-09-2026: el `switch` de `countRealActions` en
-- src/utils/challengeUtils.ts no los contempla, y ninguna de las 11 llamadas a
-- `updateChallengeProgress` del front pasa esos valores). Un reto así no se puede completar.
ALTER TABLE public.weekly_challenge_templates
  ADD COLUMN IF NOT EXISTS rotation_order integer,
  ADD COLUMN IF NOT EXISTS last_used_at timestamptz;

UPDATE public.weekly_challenge_templates SET rotation_order = v.ord
FROM (VALUES
  ('Semana del Conocimiento', 1),
  ('Semana de Recursos',      2),
  ('Semana del Experto',      3),
  ('Semana de Dermo',         4),
  ('Semana de Gestión',       5)
) AS v(nombre, ord)
WHERE public.weekly_challenge_templates.name = v.nombre
  AND public.weekly_challenge_templates.rotation_order IS DISTINCT FROM v.ord;

-- El reto vivo hoy (Semana del Experto, 07→13-09) ya se ha usado: que el lunes 14 salga otro.
UPDATE public.weekly_challenge_templates t
SET last_used_at = COALESCE(t.last_used_at, now())
WHERE t.name = 'Semana del Experto';

-- ---------------------------------------------------------------------------
-- 3. Activación automática del reto de la semana
-- ---------------------------------------------------------------------------
-- Replica lo que hacía el botón "Activar esta semana" de
-- src/components/admin/challenges/WeeklyTemplatesManagement.tsx, con tres cosas que el botón
-- no hacía: no duplica si ya hay reto de esta semana, desactiva el de la semana pasada y
-- reparte las plantillas en vez de coger siempre la misma.
CREATE OR REPLACE FUNCTION public.activate_weekly_challenge()
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_week_start date;
  v_week_end   date;
  v_tpl        RECORD;
  v_id         uuid;
BEGIN
  -- Lunes de la semana en curso en hora de Madrid (el cron corre en UTC).
  v_week_start := (date_trunc('week', (now() AT TIME ZONE 'Europe/Madrid')))::date;
  v_week_end   := v_week_start + 6;

  -- Caduca todo reto semanal cuya ventana ya pasó.
  UPDATE public.challenges
  SET is_active = false
  WHERE is_weekly AND is_active AND end_date IS NOT NULL AND end_date < v_week_start;

  -- Ya hay reto de esta semana: nada que hacer (la función es idempotente y se puede
  -- llamar a mano sin miedo).
  SELECT id INTO v_id
  FROM public.challenges
  WHERE is_weekly AND start_date = v_week_start
  ORDER BY created_at DESC
  LIMIT 1;

  IF v_id IS NOT NULL THEN
    UPDATE public.challenges SET is_active = true WHERE id = v_id AND NOT is_active;
    RETURN v_id;
  END IF;

  -- Plantilla menos usada de las que SÍ se pueden completar.
  SELECT * INTO v_tpl
  FROM public.weekly_challenge_templates
  WHERE is_active AND rotation_order IS NOT NULL
  ORDER BY last_used_at ASC NULLS FIRST, rotation_order ASC
  LIMIT 1;

  IF v_tpl IS NULL THEN
    RAISE WARNING 'activate_weekly_challenge: no hay plantillas en rotación';
    RETURN NULL;
  END IF;

  INSERT INTO public.challenges
    (title, name, description, type, target_count, points_reward, points,
     is_active, is_weekly, start_date, end_date)
  VALUES
    (v_tpl.name, v_tpl.name, v_tpl.description, v_tpl.type, v_tpl.target_count,
     v_tpl.points_reward, v_tpl.points_reward,
     true, true, v_week_start, v_week_end)
  RETURNING id INTO v_id;

  UPDATE public.weekly_challenge_templates SET last_used_at = now() WHERE id = v_tpl.id;

  RETURN v_id;
END;
$function$;

REVOKE ALL ON FUNCTION public.activate_weekly_challenge() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.activate_weekly_challenge() TO service_role;

-- Cron: lunes 06:00 UTC = 08:00 en Madrid (07:00 en horario de invierno).
SELECT cron.unschedule('portal-reto-semanal')
WHERE EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'portal-reto-semanal');

SELECT cron.schedule('portal-reto-semanal', '0 6 * * 1', $cron$SELECT public.activate_weekly_challenge();$cron$);

-- ---------------------------------------------------------------------------
-- 4. Apertura extra del cajón por completar el reto
-- ---------------------------------------------------------------------------
-- El UNIQUE histórico era (user_id, campaign_id): un cajón por usuario y campaña, sin hueco
-- para una apertura extra. Se amplía con `source`, que ya admite 'reto' en su CHECK. No hay
-- ningún ON CONFLICT sobre esta tabla (verificado en las 4 edge functions que la tocan y en
-- las 6 funciones PL/pgSQL que la nombran), así que ampliarlo no rompe nada: el open-reward
-- desplegado hoy sigue encontrando la apertura previa y devolviendo `already: true`.
CREATE UNIQUE INDEX IF NOT EXISTS rebotica_openings_user_campaign_source_key
  ON public.rebotica_openings (user_id, campaign_id, source);

ALTER TABLE public.rebotica_openings
  DROP CONSTRAINT IF EXISTS rebotica_openings_user_id_campaign_id_key;

-- ¿Tiene este usuario derecho a una apertura extra en esta campaña?
-- Sí si completó un reto SEMANAL dentro de la ventana de la campaña y no ha gastado todavía
-- su apertura de tipo 'reto'. Una sola extra por campaña, por diseño.
CREATE OR REPLACE FUNCTION public.rebotica_extra_opening_available(_user_id uuid, _campaign_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_challenge_progress ucp
    JOIN public.challenges c  ON c.id = ucp.challenge_id AND c.is_weekly
    JOIN public.rebotica_campaigns camp ON camp.id = _campaign_id
    WHERE ucp.user_id = _user_id
      AND ucp.completed_at IS NOT NULL
      AND (ucp.completed_at AT TIME ZONE 'Europe/Madrid')::date
          BETWEEN camp.quincena_inicio AND camp.quincena_fin
  )
  AND NOT EXISTS (
    SELECT 1 FROM public.rebotica_openings o
    WHERE o.user_id = _user_id AND o.campaign_id = _campaign_id AND o.source = 'reto'
  );
$function$;

REVOKE ALL ON FUNCTION public.rebotica_extra_opening_available(uuid, uuid) FROM PUBLIC;
-- Solo la edge function (service_role). Con EXECUTE para `authenticated` cualquier usuario
-- con sesión podía preguntar por el uuid de otro; el front no la necesita porque usa la RPC
-- sin argumentos de abajo. REVOKE aplicado en producción el 10-09-2026.
REVOKE EXECUTE ON FUNCTION public.rebotica_extra_opening_available(uuid, uuid) FROM anon, authenticated;
GRANT EXECUTE ON FUNCTION public.rebotica_extra_opening_available(uuid, uuid) TO service_role;

-- 6) La que llama el front: resuelve la campaña abierta y el usuario ella misma, para que la
-- página no tenga que manejar ids de campaña. `rebotica_campaign_abierta` devuelve
-- {abierta, inicio, fin} y no trae el id, así que no sirve aquí.
CREATE OR REPLACE FUNCTION public.rebotica_extra_opening_status()
 RETURNS jsonb
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  SELECT COALESCE(
    (
      SELECT jsonb_build_object(
        'disponible', public.rebotica_extra_opening_available(auth.uid(), c.id),
        'reto', (
          SELECT ch.title
          FROM public.user_challenge_progress ucp
          JOIN public.challenges ch ON ch.id = ucp.challenge_id AND ch.is_weekly
          WHERE ucp.user_id = auth.uid()
            AND ucp.completed_at IS NOT NULL
            AND (ucp.completed_at AT TIME ZONE 'Europe/Madrid')::date
                BETWEEN c.quincena_inicio AND c.quincena_fin
          ORDER BY ucp.completed_at DESC
          LIMIT 1
        )
      )
      FROM public.rebotica_campaigns c
      WHERE auth.uid() IS NOT NULL
        AND c.estado = 'activa'
        AND c.quincena_inicio <= (now() AT TIME ZONE 'Europe/Madrid')::date
        AND c.quincena_fin >= (now() AT TIME ZONE 'Europe/Madrid')::date
      ORDER BY c.quincena_inicio DESC
      LIMIT 1
    ),
    jsonb_build_object('disponible', false)
  );
$function$;

REVOKE ALL ON FUNCTION public.rebotica_extra_opening_status() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.rebotica_extra_opening_status() TO authenticated, service_role;

-- `open-reward` YA está desplegada con los dos cambios (commit fccbea8, verificado por diff):
-- su SELECT de idempotencia filtra por `source` y, con `source='reto'`, comprueba el derecho
-- con `rebotica_extra_opening_available` y responde 409 si no lo hay.
