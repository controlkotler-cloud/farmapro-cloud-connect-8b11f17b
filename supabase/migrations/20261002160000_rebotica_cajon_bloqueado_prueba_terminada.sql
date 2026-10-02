-- Rebotica: una cuenta gratis con la prueba de 30 días terminada no abre cajones.
-- Reporte Francesc 02-10-2026: con su cuenta gratis caducada entró en /rebotica
-- y el cajón le dio premio. El corte del plan gratis solo vivía en el frontend
-- (getAccessState en src/lib/plans.ts: freemium + created_at > 30 días).
-- Mismo criterio aquí; las plazas de un equipo activo no se cortan.
-- La reapertura de un cajón ya abierto ('already') sigue devolviéndolo.
-- Idempotente: CREATE OR REPLACE con la definición en vivo + el bloque nuevo.

CREATE OR REPLACE FUNCTION public.rebotica_open_cajon(_user_id uuid, _campaign_id uuid DEFAULT NULL::uuid, _source text DEFAULT 'welcome'::text)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_today        date := (now() AT TIME ZONE 'Europe/Madrid')::date;
  v_campaign_id  uuid;
  v_estado       text;
  v_inicio       date;
  v_fin          date;
  v_role         text;
  v_created_at   timestamptz;
  v_has_team     boolean;
  v_tier         text;
  v_prize_id     uuid;
  v_caducidad    integer;
  v_attempt      integer;
  v_opening_id   uuid;
  v_prize_json   jsonb;
  v_opening_json jsonb;
BEGIN
  IF _user_id IS NULL THEN
    RETURN jsonb_build_object('ok', false, 'error', 'user_invalido');
  END IF;

  IF _source IS NULL OR _source NOT IN ('welcome', 'reto') THEN
    RETURN jsonb_build_object('ok', false, 'error', 'source_invalido');
  END IF;

  IF _campaign_id IS NOT NULL THEN
    SELECT c.id, c.estado, c.quincena_inicio, c.quincena_fin
      INTO v_campaign_id, v_estado, v_inicio, v_fin
      FROM public.rebotica_campaigns c
     WHERE c.id = _campaign_id;

    IF v_campaign_id IS NULL THEN
      RETURN jsonb_build_object('ok', false, 'error', 'campana_no_encontrada');
    END IF;
    IF v_estado <> 'activa' THEN
      RETURN jsonb_build_object('ok', false, 'error', 'campana_no_activa');
    END IF;
    IF v_inicio > v_today OR v_fin < v_today THEN
      RETURN jsonb_build_object('ok', false, 'error', 'campana_fuera_de_ventana');
    END IF;
  ELSE
    SELECT c.id INTO v_campaign_id
      FROM public.rebotica_campaigns c
     WHERE c.estado = 'activa'
       AND c.quincena_inicio <= v_today
       AND c.quincena_fin    >= v_today
     ORDER BY c.quincena_inicio DESC
     LIMIT 1;

    IF v_campaign_id IS NULL THEN
      RETURN jsonb_build_object('ok', false, 'error', 'sin_campana_activa');
    END IF;
  END IF;

  PERFORM pg_advisory_xact_lock(
    hashtextextended(_user_id::text || ':' || v_campaign_id::text || ':' || _source, 0)
  );

  SELECT o.id INTO v_opening_id
    FROM public.rebotica_openings o
   WHERE o.user_id = _user_id
     AND o.campaign_id = v_campaign_id
     AND o.source = _source
   ORDER BY o.opened_at ASC
   LIMIT 1;

  IF v_opening_id IS NOT NULL THEN
    RETURN jsonb_build_object(
      'ok', true,
      'already', true,
      'campaign_id', v_campaign_id,
      'opening', public.rebotica_opening_json(v_opening_id),
      'prize', public.rebotica_prize_json(
                 (SELECT o.prize_id FROM public.rebotica_openings o WHERE o.id = v_opening_id)
               )
    );
  END IF;

  IF _source = 'reto'
     AND NOT public.rebotica_extra_opening_available(_user_id, v_campaign_id) THEN
    RETURN jsonb_build_object('ok', false, 'error', 'reto_no_completado');
  END IF;

  SELECT p.subscription_role, p.created_at INTO v_role, v_created_at
    FROM public.profiles p
   WHERE p.id = _user_id;
  v_role := COALESCE(v_role, 'freemium');

  SELECT EXISTS (
    SELECT 1 FROM public.team_members tm
     WHERE tm.user_id = _user_id AND tm.status = 'active'
  ) INTO v_has_team;

  -- Prueba gratis terminada (mismo criterio que getAccessState del frontend).
  IF v_role = 'freemium'
     AND NOT v_has_team
     AND v_created_at IS NOT NULL
     AND v_created_at < now() - interval '30 days' THEN
    RETURN jsonb_build_object('ok', false, 'error', 'prueba_terminada');
  END IF;

  v_tier := CASE
              WHEN v_has_team OR v_role = 'equipo' THEN 'equipo'
              WHEN v_role = 'freemium'             THEN 'gratis'
              ELSE 'plus'
            END;

  FOR v_attempt IN 1..5 LOOP
    v_prize_id := public.rebotica_pick_and_consume_prize(v_campaign_id, v_tier, _user_id);
    EXIT WHEN v_prize_id IS NOT NULL;
  END LOOP;

  IF v_prize_id IS NULL THEN
    RETURN jsonb_build_object('ok', false, 'error', 'sin_stock');
  END IF;

  SELECT COALESCE(pr.caducidad_dias, 7) INTO v_caducidad
    FROM public.rebotica_prizes pr
   WHERE pr.id = v_prize_id;

  INSERT INTO public.rebotica_openings (user_id, campaign_id, prize_id, expires_at, source)
  VALUES (
    _user_id,
    v_campaign_id,
    v_prize_id,
    now() + make_interval(days => COALESCE(v_caducidad, 7)),
    _source
  )
  RETURNING id INTO v_opening_id;

  v_opening_json := public.rebotica_opening_json(v_opening_id);
  v_prize_json   := public.rebotica_prize_json(v_prize_id);

  RETURN jsonb_build_object(
    'ok', true,
    'already', false,
    'campaign_id', v_campaign_id,
    'opening', v_opening_json,
    'prize', v_prize_json
  );
END;
$function$;
