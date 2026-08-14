-- =====================================================================
-- IAFarma v2 · 14-08-2026 — EJECUTADA EN PRODUCCIÓN el 14-08-2026 vía
-- query_database (MCP Lovable). Este fichero es el registro en el repo.
--
--  1) Créditos de pack SIN caducidad (decisión Francesc 14-08: "ya los ha
--     pagado, da igual cuándo los use"). Nueva tabla ai_image_credits con
--     saldo persistente; los saldos negativos históricos de ai_image_usage
--     (el viejo truco de restar el pack al contador mensual) se rescatan.
--  2) Refunds atómicos y correctos: refund_image_credit devuelve el crédito
--     a la fuente de la que salió (mensual o pack) — antes un fallo de la IA
--     quemaba el crédito de pack sin devolverlo. refund_text_credit ídem.
--  3) consume_image_credit_v2: gasta primero la imagen mensual del plan y
--     después el pack; devuelve jsonb {remaining, source}. La firma antigua
--     consume_image_credit(integer) queda como wrapper de compatibilidad.
--  4) ai_creative_usage: métrica de uso del asistente de texto (solo
--     metadatos: usuario, tipo, fecha) + base del tope diario anti-abuso.
--  5) profiles.iafarma_tone: el tono de comunicación deja de vivir solo en
--     localStorage y sincroniza entre dispositivos.
-- =====================================================================

-- ============ 1) Saldo persistente de packs ============
CREATE TABLE IF NOT EXISTS public.ai_image_credits (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  balance integer NOT NULL DEFAULT 0 CHECK (balance >= 0),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.ai_image_credits TO authenticated;
GRANT ALL ON public.ai_image_credits TO service_role;
ALTER TABLE public.ai_image_credits ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "ai_image_credits_own_select" ON public.ai_image_credits;
CREATE POLICY "ai_image_credits_own_select" ON public.ai_image_credits
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

-- Rescate: los saldos negativos de ai_image_usage (de cualquier mes, incluidos
-- los "caducados") eran créditos de pack sin gastar. Pasan al saldo persistente.
INSERT INTO public.ai_image_credits (user_id, balance)
SELECT user_id, SUM(-used) FROM public.ai_image_usage WHERE used < 0 GROUP BY user_id
ON CONFLICT (user_id) DO UPDATE
  SET balance = public.ai_image_credits.balance + EXCLUDED.balance, updated_at = now();
UPDATE public.ai_image_usage SET used = 0, updated_at = now() WHERE used < 0;

-- add_image_credits: misma firma (el webhook de Stripe no cambia), ahora
-- acredita el saldo persistente sin caducidad.
CREATE OR REPLACE FUNCTION public.add_image_credits(p_user uuid, p_credits integer)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_balance integer;
BEGIN
  IF p_user IS NULL OR p_credits IS NULL OR p_credits <= 0 THEN
    RAISE EXCEPTION 'invalid arguments';
  END IF;
  INSERT INTO public.ai_image_credits (user_id, balance)
  VALUES (p_user, p_credits)
  ON CONFLICT (user_id) DO UPDATE
    SET balance = public.ai_image_credits.balance + EXCLUDED.balance, updated_at = now()
  RETURNING balance INTO v_balance;
  RETURN v_balance;
END;
$$;
REVOKE ALL ON FUNCTION public.add_image_credits(uuid, integer) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.add_image_credits(uuid, integer) TO service_role;

-- ============ 2) Consumo con fuente ============
CREATE OR REPLACE FUNCTION public.consume_image_credit_v2(p_limit integer)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
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
      -- OJO: la edge detecta la cuota por la palabra 'quota' en el mensaje.
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
$$;
REVOKE EXECUTE ON FUNCTION public.consume_image_credit_v2(integer) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.consume_image_credit_v2(integer) TO authenticated;

-- Firma antigua: wrapper de compatibilidad (misma lógica, solo el restante).
CREATE OR REPLACE FUNCTION public.consume_image_credit(p_limit integer)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_result jsonb;
BEGIN
  v_result := public.consume_image_credit_v2(p_limit);
  RETURN (v_result->>'remaining')::integer;
END;
$$;
REVOKE EXECUTE ON FUNCTION public.consume_image_credit(integer) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.consume_image_credit(integer) TO authenticated;

-- ============ 3) Refunds atómicos ============
CREATE OR REPLACE FUNCTION public.refund_image_credit(p_user uuid, p_source text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_period text := to_char(now() AT TIME ZONE 'UTC', 'YYYY-MM');
BEGIN
  IF p_user IS NULL THEN RETURN; END IF;
  IF p_source = 'pack' THEN
    INSERT INTO public.ai_image_credits (user_id, balance)
    VALUES (p_user, 1)
    ON CONFLICT (user_id) DO UPDATE
      SET balance = public.ai_image_credits.balance + 1, updated_at = now();
  ELSE
    UPDATE public.ai_image_usage
       SET used = used - 1, updated_at = now()
     WHERE user_id = p_user AND period = v_period AND used > 0;
  END IF;
END;
$$;
REVOKE ALL ON FUNCTION public.refund_image_credit(uuid, text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.refund_image_credit(uuid, text) TO service_role;

CREATE OR REPLACE FUNCTION public.refund_text_credit(p_user uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_period text := to_char(now() AT TIME ZONE 'UTC', 'YYYY-MM');
BEGIN
  IF p_user IS NULL THEN RETURN; END IF;
  UPDATE public.ai_text_usage
     SET used = used - 1, updated_at = now()
   WHERE user_id = p_user AND period = v_period AND used > 0;
END;
$$;
REVOKE ALL ON FUNCTION public.refund_text_credit(uuid) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.refund_text_credit(uuid) TO service_role;

-- ============ 4) Métricas del asistente de texto ============
CREATE TABLE IF NOT EXISTS public.ai_creative_usage (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content_type text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS ai_creative_usage_user_time
  ON public.ai_creative_usage (user_id, created_at);
GRANT SELECT ON public.ai_creative_usage TO authenticated;
GRANT ALL ON public.ai_creative_usage TO service_role;
ALTER TABLE public.ai_creative_usage ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "ai_creative_usage_own_select" ON public.ai_creative_usage;
CREATE POLICY "ai_creative_usage_own_select" ON public.ai_creative_usage
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

-- ============ 5) Tono de IAFarma en el perfil ============
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS iafarma_tone text;
GRANT SELECT (iafarma_tone) ON public.profiles TO authenticated;
GRANT UPDATE (iafarma_tone) ON public.profiles TO authenticated;
