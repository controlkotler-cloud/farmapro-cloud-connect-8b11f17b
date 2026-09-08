-- Copia de seguridad de la RPC ANTES del cambio de cuotas del 31-08-2026.
-- Para revertir: ejecutar este fichero tal cual (CREATE OR REPLACE).
-- Comportamiento anterior: limite mensual = el p_limit que pase la edge
-- function (IMAGES_PER_MONTH = 1), igual para todos los planes, por usuario.

CREATE OR REPLACE FUNCTION public.consume_image_credit_v2(p_limit integer)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_user uuid := auth.uid();
  v_period text := to_char(now() AT TIME ZONE 'UTC', 'YYYY-MM');
  v_used integer;
  v_balance integer;
  v_source text;
  v_monthly_left integer;
BEGIN
  IF v_user IS NULL THEN
    RAISE EXCEPTION 'Authentication required' USING ERRCODE = '28000';
  END IF;

  INSERT INTO public.ai_image_usage (user_id, period, used)
  VALUES (v_user, v_period, 0)
  ON CONFLICT (user_id, period) DO NOTHING;

  UPDATE public.ai_image_usage
     SET used = used + 1, updated_at = now()
   WHERE user_id = v_user AND period = v_period AND used < p_limit
  RETURNING used INTO v_used;

  IF v_used IS NOT NULL THEN
    v_source := 'monthly';
  ELSE
    UPDATE public.ai_image_credits
       SET balance = balance - 1, updated_at = now()
     WHERE user_id = v_user AND balance > 0
    RETURNING balance INTO v_balance;
    IF v_balance IS NULL THEN
      RAISE EXCEPTION 'Monthly image quota exceeded' USING ERRCODE = 'P0001';
    END IF;
    v_source := 'pack';
  END IF;

  SELECT GREATEST(p_limit - used, 0) INTO v_monthly_left
    FROM public.ai_image_usage WHERE user_id = v_user AND period = v_period;
  SELECT COALESCE(balance, 0) INTO v_balance
    FROM public.ai_image_credits WHERE user_id = v_user;

  RETURN jsonb_build_object(
    'remaining', COALESCE(v_monthly_left, 0) + COALESCE(v_balance, 0),
    'source', v_source
  );
END;
$function$;
