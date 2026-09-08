-- IAFarma — correcciones de la revisión del 07-09-2026.
--
-- OJO: este fichero es RETROACTIVO. El SQL ya está aplicado en producción
-- (ejecutado con query_database el 07-09-2026); añadirlo a migrations/ no
-- ejecuta nada. Se versiona porque la lógica de créditos del rework del 31-08
-- se instaló directa en BD sin migración, y auditar leyendo el repo daba un
-- resultado equivocado. Todo es idempotente.
--
-- Qué corrige:
--  1. El tope diario dejaba de bloquear los packs comprados (los packs no
--     tienen tope diario). Afectaba a plan Equipo: se le vendía un pack que no
--     desbloqueaba nada hasta el día siguiente.
--  2. Distingue el error de tope DIARIO del de cuota MENSUAL agotada, para que
--     la edge function pueda decir cuál de los dos es.
--  3. El reembolso ya no devuelve tick diario cuando el consumo salió de un
--     pack (donde nunca se incrementó): regalaba cuota diaria.
--  4. Sube los topes de texto para que "texto ilimitado" sea cierto.
--  5. Acreditación de packs idempotente por sesión de Stripe.

-- 1-2 ------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.consume_image_credit_v2(p_limit integer)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_user uuid := auth.uid();
  v_acct uuid;
  v_period text := to_char(now() AT TIME ZONE 'UTC', 'YYYY-MM');
  v_day    text := to_char(now() AT TIME ZONE 'UTC', 'YYYY-MM-DD');
  v_month_limit integer; v_day_limit integer;
  v_month_used integer; v_used integer; v_balance integer;
  v_source text; v_monthly_left integer; v_day_blocked boolean := false;
BEGIN
  IF v_user IS NULL THEN
    RAISE EXCEPTION 'Authentication required' USING ERRCODE = '28000';
  END IF;

  -- p_limit se ignora a proposito: manda la BD (ver image_limits_for_role).
  v_acct        := public.image_billing_account(v_user);
  v_month_limit := public.image_month_limit(v_user);
  v_day_limit   := public.image_day_limit(v_user);

  INSERT INTO public.ai_image_usage (user_id, period, used)
  VALUES (v_acct, v_period, 0) ON CONFLICT (user_id, period) DO NOTHING;

  SELECT used INTO v_month_used
    FROM public.ai_image_usage WHERE user_id = v_acct AND period = v_period;

  IF v_month_used < v_month_limit THEN
    -- Va a gastar cuota INCLUIDA: aqui si aplica el tope diario.
    INSERT INTO public.ai_image_usage (user_id, period, used)
    VALUES (v_acct, v_day, 0) ON CONFLICT (user_id, period) DO NOTHING;

    UPDATE public.ai_image_usage
       SET used = used + 1, updated_at = now()
     WHERE user_id = v_acct AND period = v_day AND used < v_day_limit
    RETURNING used INTO v_used;

    IF v_used IS NULL THEN
      -- Tope diario agotado. NO se corta aqui: los packs comprados no tienen
      -- tope diario, asi que se deja caer al saldo de packs (fix 07-09-2026).
      v_day_blocked := true;
    ELSE
      UPDATE public.ai_image_usage
         SET used = used + 1, updated_at = now()
       WHERE user_id = v_acct AND period = v_period AND used < v_month_limit
      RETURNING used INTO v_used;

      IF v_used IS NULL THEN
        -- Carrera: alguien del equipo gasto la ultima entre medias. Se devuelve
        -- el tick diario y se cae al saldo de packs.
        UPDATE public.ai_image_usage SET used = GREATEST(used - 1, 0), updated_at = now()
         WHERE user_id = v_acct AND period = v_day;
      ELSE
        v_source := 'monthly';
      END IF;
    END IF;
  END IF;

  IF v_source IS NULL THEN
    -- Cuota incluida agotada (o tope diario alcanzado): se tira de packs
    -- comprados, que no tienen tope diario.
    UPDATE public.ai_image_credits
       SET balance = balance - 1, updated_at = now()
     WHERE user_id = v_acct AND balance > 0
    RETURNING balance INTO v_balance;

    IF v_balance IS NULL THEN
      -- Sin packs. El motivo real decide el mensaje que vera el usuario.
      IF v_day_blocked THEN
        RAISE EXCEPTION 'Daily image quota exceeded' USING ERRCODE = 'P0001';
      ELSE
        RAISE EXCEPTION 'Monthly image quota exceeded' USING ERRCODE = 'P0001';
      END IF;
    END IF;
    v_source := 'pack';
  END IF;

  SELECT GREATEST(v_month_limit - used, 0) INTO v_monthly_left
    FROM public.ai_image_usage WHERE user_id = v_acct AND period = v_period;
  SELECT COALESCE(balance, 0) INTO v_balance
    FROM public.ai_image_credits WHERE user_id = v_acct;

  RETURN jsonb_build_object(
    'remaining', COALESCE(v_monthly_left, 0) + COALESCE(v_balance, 0),
    'source', v_source
  );
END; $function$;

-- 3 --------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.refund_image_credit(p_user uuid, p_source text)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_acct uuid;
  v_period text := to_char(now() AT TIME ZONE 'UTC', 'YYYY-MM');
  v_day    text := to_char(now() AT TIME ZONE 'UTC', 'YYYY-MM-DD');
BEGIN
  IF p_user IS NULL THEN RETURN; END IF;
  v_acct := public.image_billing_account(p_user);

  IF p_source = 'pack' THEN
    -- El consumo desde pack NO incrementa el contador diario: no hay tick que devolver.
    INSERT INTO public.ai_image_credits (user_id, balance)
    VALUES (v_acct, 1)
    ON CONFLICT (user_id) DO UPDATE
      SET balance = public.ai_image_credits.balance + 1, updated_at = now();
  ELSE
    UPDATE public.ai_image_usage SET used = GREATEST(used - 1, 0), updated_at = now()
     WHERE user_id = v_acct AND period = v_day AND used > 0;
    UPDATE public.ai_image_usage SET used = GREATEST(used - 1, 0), updated_at = now()
     WHERE user_id = v_acct AND period = v_period AND used > 0;
  END IF;
END; $function$;

-- 4 --------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.text_limits_for_role(p_role text)
 RETURNS TABLE(day_limit integer, month_limit integer)
 LANGUAGE sql
 IMMUTABLE
AS $function$
  SELECT
    CASE
      WHEN p_role = 'admin' THEN 500
      WHEN p_role = 'equipo' THEN 200   -- compartido por farmacia (10 personas)
      WHEN p_role IN ('plus','premium','profesional') THEN 100
      ELSE 2
    END,
    CASE
      WHEN p_role = 'admin' THEN 5000
      WHEN p_role = 'equipo' THEN 2000  -- compartido por farmacia
      WHEN p_role IN ('plus','premium','profesional') THEN 1000
      ELSE 2
    END;
$function$;

-- 5 --------------------------------------------------------------------------
-- Registro de acreditaciones de packs. La PK es la referencia del pago
-- (session.id de Stripe): un reintento del webhook no vuelve a sumar.
CREATE TABLE IF NOT EXISTS public.ai_image_credit_grants (
  ref        text PRIMARY KEY,
  user_id    uuid NOT NULL,
  credits    integer NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.ai_image_credit_grants ENABLE ROW LEVEL SECURITY;
-- Sin políticas: solo service_role (el webhook) entra aquí.
REVOKE ALL ON public.ai_image_credit_grants FROM anon, authenticated;

CREATE OR REPLACE FUNCTION public.add_image_credits_once(p_user uuid, p_credits integer, p_ref text)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_balance integer;
  v_inserted boolean := false;
BEGIN
  IF p_user IS NULL OR p_credits IS NULL OR p_credits <= 0 OR p_ref IS NULL OR p_ref = '' THEN
    RAISE EXCEPTION 'invalid arguments';
  END IF;

  INSERT INTO public.ai_image_credit_grants (ref, user_id, credits)
  VALUES (p_ref, p_user, p_credits)
  ON CONFLICT (ref) DO NOTHING;

  GET DIAGNOSTICS v_inserted = ROW_COUNT;

  IF NOT v_inserted THEN
    -- Ya acreditado en un intento anterior: no se suma otra vez.
    SELECT COALESCE(balance, 0) INTO v_balance
      FROM public.ai_image_credits WHERE user_id = p_user;
    RETURN jsonb_build_object('granted', false, 'balance', COALESCE(v_balance, 0));
  END IF;

  INSERT INTO public.ai_image_credits (user_id, balance)
  VALUES (p_user, p_credits)
  ON CONFLICT (user_id) DO UPDATE
    SET balance = public.ai_image_credits.balance + EXCLUDED.balance, updated_at = now()
  RETURNING balance INTO v_balance;

  RETURN jsonb_build_object('granted', true, 'balance', v_balance);
END; $function$;

REVOKE ALL ON FUNCTION public.add_image_credits_once(uuid, integer, text) FROM public, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.add_image_credits_once(uuid, integer, text) TO service_role;
