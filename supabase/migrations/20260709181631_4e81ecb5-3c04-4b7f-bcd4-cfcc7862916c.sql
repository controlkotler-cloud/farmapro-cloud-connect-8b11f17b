
-- Stripe portal migration: add founder flag + cycle to subscriptions, unique on stripe_subscription_id
ALTER TABLE public.subscriptions
  ADD COLUMN IF NOT EXISTS is_founder boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS cycle text;

CREATE UNIQUE INDEX IF NOT EXISTS subscriptions_stripe_subscription_id_key
  ON public.subscriptions(stripe_subscription_id)
  WHERE stripe_subscription_id IS NOT NULL;

-- Public read-only view of founder count (for the pricing page).
CREATE OR REPLACE VIEW public.founder_count AS
  SELECT COUNT(*)::int AS spots_taken
    FROM public.subscriptions
   WHERE is_founder = true
     AND status = 'active';

GRANT SELECT ON public.founder_count TO anon, authenticated;
