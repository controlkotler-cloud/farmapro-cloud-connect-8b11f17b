-- 20260910200000_rebotica_open_cajon_atomico.sql
--
-- EL BUG (detectado 10-09-2026 midiendo si desplegar `open-reward` podía cortar a un usuario).
-- Abrir un cajón eran TRES pasos separados dentro de la edge function `open-reward`:
--
--   1. RPC `rebotica_pick_and_consume_prize` -> sortea y DESCUENTA `stock_restante`.
--   2. SELECT a `rebotica_prizes` para leer `caducidad_dias` y calcular `expires_at`.
--   3. INSERT en `rebotica_openings`.
--
-- Cada paso es una transacción distinta. Si la edge muere entre el 1 y el 3 (un despliegue,
-- un timeout, un throw, o simplemente el doble clic de un usuario: dos peticiones pasan el
-- SELECT de idempotencia, las dos consumen stock y una revienta con unique violation), el
-- stock queda consumido y NO existe apertura. El usuario pierde su cajón y una unidad de
-- premio desaparece sin registro. Nadie se enteraría: no hay rastro que auditar.
--
-- EL ARREGLO. Los tres pasos pasan a UNA función de BD, `rebotica_open_cajon`, que corre en
-- una sola transacción: si el INSERT falla, Postgres revierte también el descuento de stock.
-- La edge queda con una única llamada RPC. Se añaden dos cosas que la edge no podía hacer:
--
--   * `pg_advisory_xact_lock` por (usuario, campaña, source): serializa el doble clic, que
--     era el camino MÁS probable al descuadre, no un fallo exótico de red.
--   * el check del derecho a apertura extra por reto ocurre DENTRO de la misma transacción
--     que el consumo, así que ya no pueden desincronizarse.
--
-- Y CIERRA UN AGUJERO ABIERTO HOY MISMO. Al ampliar el UNIQUE a (user_id, campaign_id,
-- source) esta mañana, `open-reward` pasó a aceptar de un usuario con sesión los sources
-- 'quincena', 'aniversario' y 'equipo' (están en su VALID_SOURCES desde julio porque
-- coinciden con el CHECK de la columna): tres premios extra por campaña con un simple POST.
-- La función nueva solo admite los dos sources que una persona puede pedir de verdad:
-- 'welcome' y 'reto'.
--
-- `rebotica_pick_and_consume_prize` NO se toca ni se borra: sigue siendo la única fuente de
-- verdad del sorteo (peso > 0, tier, anti-repetición de 'contenido') y ahora se la llama
-- desde dentro. Sigue disponible para pruebas manuales y para el cron de calendario.
--
-- Escrita idempotente: las migraciones de este repo NO se ejecutan solas, se corren a mano
-- con `query_database` del MCP de Lovable y pueden repetirse sin daño.
--
-- ORDEN DE EJECUCIÓN: este SQL primero, la edge después. La función nueva es aditiva; con la
-- edge vieja todavía desplegada nadie la llama y no cambia nada.

-- ---------------------------------------------------------------------------
-- 0. Sin sobrecargas huérfanas
-- ---------------------------------------------------------------------------
-- Misma trampa que costó el "RPC retos 400 por overload huérfano" y el DROP de la firma de
-- 2 argumentos de `rebotica_pick_and_consume_prize`: si queda una versión con otra firma,
-- PostgreSQL puede resolver la llamada a la antigua y el arreglo no se aplica. Se borra
-- cualquier `rebotica_open_cajon` previa, sea cual sea su firma.
DO $$
DECLARE r record;
BEGIN
  FOR r IN
    SELECT p.oid::regprocedure AS sig
      FROM pg_proc p
      JOIN pg_namespace n ON n.oid = p.pronamespace
     WHERE n.nspname = 'public'
       AND p.proname IN ('rebotica_open_cajon', 'rebotica_opening_json', 'rebotica_prize_json')
  LOOP
    EXECUTE format('DROP FUNCTION %s', r.sig);
  END LOOP;
END $$;

-- ---------------------------------------------------------------------------
-- 1. Dos ayudas para no repetir la forma de la respuesta
-- ---------------------------------------------------------------------------
-- Devuelven exactamente los campos que el front de /rebotica ya consume (`data.prize.titulo`
-- y compañía), así que la respuesta de la edge no cambia de forma. NULL si el id es NULL o
-- no existe: `prize_id` es nullable en `rebotica_openings` (los sorteos de calendario).
-- SECURITY INVOKER a propósito: llamadas desde dentro de `rebotica_open_cajon` corren ya con
-- los permisos de su definer, y si alguien las llamase por su cuenta le aplicaría su RLS.

CREATE FUNCTION public.rebotica_prize_json(_prize_id uuid)
RETURNS jsonb
LANGUAGE sql
STABLE
SET search_path TO 'public'
AS $function$
  SELECT jsonb_build_object(
    'id',                  pr.id,
    'titulo',              pr.titulo,
    'descripcion',         pr.descripcion,
    'tipo',                pr.tipo,
    'valor_percibido_eur', pr.valor_percibido_eur,
    'partner_id',          pr.partner_id
  )
  FROM public.rebotica_prizes pr
  WHERE pr.id = _prize_id;
$function$;

CREATE FUNCTION public.rebotica_opening_json(_opening_id uuid)
RETURNS jsonb
LANGUAGE sql
STABLE
SET search_path TO 'public'
AS $function$
  SELECT jsonb_build_object(
    'id',           o.id,
    'opened_at',    o.opened_at,
    'expires_at',   o.expires_at,
    'redeemed_at',  o.redeemed_at,
    'fulfilled_at', o.fulfilled_at,
    'reward_type',  o.reward_type,
    'source',       o.source
  )
  FROM public.rebotica_openings o
  WHERE o.id = _opening_id;
$function$;

REVOKE ALL ON FUNCTION public.rebotica_prize_json(uuid)   FROM PUBLIC;
REVOKE ALL ON FUNCTION public.rebotica_opening_json(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.rebotica_prize_json(uuid)   TO service_role;
GRANT EXECUTE ON FUNCTION public.rebotica_opening_json(uuid) TO service_role;

-- ---------------------------------------------------------------------------
-- 2. Apertura del cajón, atómica
-- ---------------------------------------------------------------------------
-- Devuelve jsonb en vez de lanzar excepciones para los estados de negocio, porque la edge
-- necesita distinguirlos con códigos HTTP distintos (404 campaña inexistente, 409 fuera de
-- ventana / sin stock / reto sin completar). Los errores REALES (un fallo del sorteo, por
-- ejemplo) sí se dejan propagar a propósito: que la edge devuelva 500 con el mensaje de
-- Postgres. Enmascararlos como "sin stock" fue lo que tuvo el sorteo roto e invisible desde
-- el 13-07 hasta el 02-09-2026.
CREATE OR REPLACE FUNCTION public.rebotica_open_cajon(
  _user_id     uuid,
  _campaign_id uuid DEFAULT NULL,
  _source      text DEFAULT 'welcome'
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  -- Fecha en hora de Madrid, no UTC. La edge usaba `new Date().toISOString()`, es decir la
  -- fecha UTC: entre las 00:00 y las 02:00 de Madrid una campaña que empieza hoy todavía no
  -- se consideraba abierta. `quincena_inicio`/`quincena_fin` son fechas del calendario de una
  -- farmacia española, así que manda Madrid. Es el mismo criterio que ya usa
  -- `rebotica_extra_opening_available`.
  v_today        date := (now() AT TIME ZONE 'Europe/Madrid')::date;

  v_campaign_id  uuid;
  v_estado       text;
  v_inicio       date;
  v_fin          date;

  v_role         text;
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

  -- SOLO los dos sources que puede pedir una persona desde /rebotica. El CHECK de la
  -- columna admite además 'quincena', 'aniversario' y 'equipo', pero esas aperturas las
  -- escriben otros caminos (sorteos de equipo y de calendario), nunca una petición del
  -- usuario. Esto es un agujero abierto HOY, 10-09-2026, al ampliar el UNIQUE a
  -- (user_id, campaign_id, source): hasta esta mañana el UNIQUE(user_id, campaign_id)
  -- bloqueaba la segunda apertura fuese cual fuese el source; desde el cambio, cualquiera
  -- con sesión podía llamar a la edge con source='quincena', 'aniversario' y 'equipo' y
  -- llevarse TRES premios extra por campaña. Verificado que nada del repo llama a
  -- `open-reward` con esos tres valores: el único sitio es src/pages/Rebotica.tsx, que
  -- manda 'welcome' o 'reto'.
  IF _source IS NULL OR _source NOT IN ('welcome', 'reto') THEN
    RETURN jsonb_build_object('ok', false, 'error', 'source_invalido');
  END IF;

  -- ---- Campaña -----------------------------------------------------------
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
    -- Sin campaign_id: la campaña activa cuya ventana incluye hoy; si hubiera varias, la de
    -- `quincena_inicio` más reciente (misma regla que tenía la edge).
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

  -- ---- Serialización por usuario/campaña/source --------------------------
  -- El doble clic era el camino más corto al descuadre: dos peticiones simultáneas pasaban
  -- las dos el check de idempotencia. Este lock (de transacción, se suelta solo al terminar)
  -- hace que la segunda espere y encuentre ya la apertura de la primera.
  PERFORM pg_advisory_xact_lock(
    hashtextextended(_user_id::text || ':' || v_campaign_id::text || ':' || _source, 0)
  );

  -- ---- Idempotencia ------------------------------------------------------
  -- UNIQUE(user_id, campaign_id, source) desde el 10-09-2026: una apertura por source, así
  -- que la extra por reto convive con la de bienvenida.
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

  -- ---- Derecho a apertura extra por reto ---------------------------------
  -- Dentro de la transacción: el derecho y el consumo ya no pueden desincronizarse.
  IF _source = 'reto'
     AND NOT public.rebotica_extra_opening_available(_user_id, v_campaign_id) THEN
    RETURN jsonb_build_object('ok', false, 'error', 'reto_no_completado');
  END IF;

  -- ---- Tier del usuario --------------------------------------------------
  -- El gating va por `subscription_role`, nunca por `role` (que es el rol de app).
  SELECT p.subscription_role INTO v_role
    FROM public.profiles p
   WHERE p.id = _user_id;
  v_role := COALESCE(v_role, 'freemium');

  SELECT EXISTS (
    SELECT 1 FROM public.team_members tm
     WHERE tm.user_id = _user_id AND tm.status = 'active'
  ) INTO v_has_team;

  v_tier := CASE
              WHEN v_has_team OR v_role = 'equipo' THEN 'equipo'
              WHEN v_role = 'freemium'             THEN 'gratis'
              ELSE 'plus'
            END;

  -- ---- Sorteo + descuento de stock ---------------------------------------
  -- `rebotica_pick_and_consume_prize` usa FOR UPDATE SKIP LOCKED: bajo contención puede
  -- volver NULL sin que se haya agotado el stock. Se reintenta, igual que hacía la edge.
  FOR v_attempt IN 1..5 LOOP
    v_prize_id := public.rebotica_pick_and_consume_prize(v_campaign_id, v_tier, _user_id);
    EXIT WHEN v_prize_id IS NOT NULL;
  END LOOP;

  IF v_prize_id IS NULL THEN
    -- Nada escrito todavía: devolver aquí no deja rastro que revertir.
    RETURN jsonb_build_object('ok', false, 'error', 'sin_stock');
  END IF;

  -- ---- Apertura ----------------------------------------------------------
  -- A partir de aquí, si algo revienta se revierte TAMBIÉN el descuento de stock de arriba.
  -- Eso es todo el arreglo.
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

  -- Se relee la fila en vez de usar RETURNING de todas las columnas: el trigger AFTER INSERT
  -- `trg_rebotica_fulfil_opening` canjea al instante los premios automáticos, y RETURNING
  -- devolvería el estado ANTERIOR a ese canje (redeemed_at/fulfilled_at en NULL).
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

-- Nunca a `authenticated`: la función recibe `_user_id` como parámetro y es SECURITY
-- DEFINER, así que un usuario logueado podría abrir el cajón de otro. Solo service_role,
-- es decir solo la edge function.
REVOKE ALL ON FUNCTION public.rebotica_open_cajon(uuid, uuid, text) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.rebotica_open_cajon(uuid, uuid, text) FROM authenticated;
GRANT EXECUTE ON FUNCTION public.rebotica_open_cajon(uuid, uuid, text) TO service_role;
