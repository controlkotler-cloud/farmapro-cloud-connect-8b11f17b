
-- Enum fix: add 'past_due' if missing
ALTER TYPE public.subscription_status ADD VALUE IF NOT EXISTS 'past_due';

-- Holded invoices tracking
CREATE TABLE IF NOT EXISTS public.portal_holded_invoices (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  source_id TEXT NOT NULL UNIQUE,
  source_type TEXT NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  email TEXT,
  concept TEXT,
  total_eur NUMERIC(10,2) NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  holded_doc_id TEXT,
  error_message TEXT,
  meta JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT ALL ON public.portal_holded_invoices TO service_role;

ALTER TABLE public.portal_holded_invoices ENABLE ROW LEVEL SECURITY;

CREATE POLICY "service_role manages holded invoices"
  ON public.portal_holded_invoices FOR ALL
  TO service_role
  USING (true) WITH CHECK (true);

CREATE INDEX IF NOT EXISTS idx_portal_holded_invoices_user ON public.portal_holded_invoices(user_id);
CREATE INDEX IF NOT EXISTS idx_portal_holded_invoices_status ON public.portal_holded_invoices(status);

CREATE OR REPLACE FUNCTION public.set_portal_holded_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$;

DROP TRIGGER IF EXISTS trg_portal_holded_updated_at ON public.portal_holded_invoices;
CREATE TRIGGER trg_portal_holded_updated_at
  BEFORE UPDATE ON public.portal_holded_invoices
  FOR EACH ROW EXECUTE FUNCTION public.set_portal_holded_updated_at();

-- add_image_credits: atomic, applies pack credits against current month "used" counter.
CREATE OR REPLACE FUNCTION public.add_image_credits(p_user UUID, p_credits INTEGER)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_period TEXT := to_char(now() AT TIME ZONE 'UTC', 'YYYY-MM');
  v_used INTEGER;
BEGIN
  IF p_user IS NULL OR p_credits IS NULL OR p_credits <= 0 THEN
    RAISE EXCEPTION 'invalid arguments';
  END IF;

  INSERT INTO public.ai_image_usage (user_id, period, used)
  VALUES (p_user, v_period, 0)
  ON CONFLICT (user_id, period) DO NOTHING;

  UPDATE public.ai_image_usage
     SET used = used - p_credits, updated_at = now()
   WHERE user_id = p_user AND period = v_period
   RETURNING used INTO v_used;

  RETURN v_used;
END;
$$;

REVOKE ALL ON FUNCTION public.add_image_credits(UUID, INTEGER) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.add_image_credits(UUID, INTEGER) TO service_role;
