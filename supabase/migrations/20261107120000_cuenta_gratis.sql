-- Cuenta gratis permanente (spec 2026-11-07). IDEMPOTENTE. NO aplicada: se ejecuta a mano.
-- Inofensiva mientras subscription.modo_gratis = 'muro' (valor sembrado aqui):
-- todo se comporta como hasta ahora. Para encender: UPDATE system_settings SET value='"permanente"'
-- WHERE key='modo_gratis'.

-- 1) Interruptor. UNIQUE(key) existe (system_settings_key_key), pero se usa NOT EXISTS por si acaso.
INSERT INTO public.system_settings (key, value, category, description)
SELECT 'modo_gratis', '"muro"'::jsonb, 'subscription',
       'Fin de prueba: "muro" (candado total, redirige a /precios) o "permanente" (cuenta gratis: herramienta de Impulso de la quincena y cajon de la Rebotica del mes)'
WHERE NOT EXISTS (SELECT 1 FROM public.system_settings WHERE key = 'modo_gratis');

-- 2) rebotica_open_cajon: igual que la version viva, salvo que NO devuelve
--    'prueba_terminada' cuando modo_gratis = 'permanente'. _source='reto' sigue
--    exigiendo reto completado (los retos estan bloqueados para la cuenta gratis, asi
--    que en la practica solo abre el cajon 'welcome' del mes).
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
  v_modo_gratis  text;
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

  -- Modo de la cuenta gratis: cualquier valor distinto de 'permanente' (o sin fila) = muro.
  SELECT COALESCE((SELECT s.value #>> '{}' FROM public.system_settings s WHERE s.key = 'modo_gratis' LIMIT 1), 'muro')
    INTO v_modo_gratis;

  -- Prueba gratis terminada (mismo criterio que getAccessState del frontend).
  -- Con la cuenta gratis permanente el cajon del mes sigue abierto: no se corta.
  IF v_modo_gratis <> 'permanente'
     AND v_role = 'freemium'
     AND NOT v_has_team
     AND v_created_at IS NOT NULL
     AND v_created_at < now() - interval '30 days'
     AND NOT EXISTS (SELECT 1 FROM public.profiles p2 WHERE p2.id = _user_id AND p2.trial_ends_at > now()) THEN
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

-- 3) D3: la cuenta gratis gasta SOLO saldo de pack (creditos de imagen ganados como
--    premio de la Rebotica) y nunca la cuota mensual. Mismo contrato que
--    consume_image_credit_v2 (jsonb {remaining, source:'pack'}); sin saldo lanza
--    'Monthly image quota exceeded' para que la edge lo trate como quota.
CREATE OR REPLACE FUNCTION public.consume_image_pack_credit()
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_user uuid := auth.uid();
  v_acct uuid;
  v_balance integer;
BEGIN
  IF v_user IS NULL THEN
    RAISE EXCEPTION 'Authentication required' USING ERRCODE = '28000';
  END IF;
  v_acct := public.image_billing_account(v_user);

  UPDATE public.ai_image_credits
     SET balance = balance - 1, updated_at = now()
   WHERE user_id = v_acct AND balance > 0
  RETURNING balance INTO v_balance;

  IF v_balance IS NULL THEN
    RAISE EXCEPTION 'Monthly image quota exceeded' USING ERRCODE = 'P0001';
  END IF;

  RETURN jsonb_build_object('remaining', v_balance, 'source', 'pack');
END; $function$;

REVOKE ALL ON FUNCTION public.consume_image_pack_credit() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.consume_image_pack_credit() TO authenticated, service_role;

-- get_course_modules, mi_oferta_mes_plus, notify_*: revisadas, SIN cambios. get_course_modules
-- ya devuelve '[]' al no-pagador sin prueba (los cursos quedan con candado, coherente con D1).

-- 4) La policy de SELECT de usuarios solo dejaba leer subscription.validation_mode:
--    sin esto el front y ai-portal-chat (cliente con JWT del usuario) leerian
--    siempre 'muro'. ALTER POLICY es idempotente.
ALTER POLICY "Ajustes no sensibles legibles por usuarios" ON public.system_settings
  USING ((category = ANY (ARRAY['section_visibility'::text, 'general'::text, 'regional'::text]))
         OR ((category = 'subscription'::text) AND (key = ANY (ARRAY['validation_mode'::text, 'modo_gratis'::text]))));
