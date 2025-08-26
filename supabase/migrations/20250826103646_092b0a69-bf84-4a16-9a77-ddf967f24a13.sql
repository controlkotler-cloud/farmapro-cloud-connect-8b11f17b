-- Add beta mode control and student validity to profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS student_valid_until DATE;

-- Add system settings for beta mode and stripe payment links
INSERT INTO public.system_settings (key, value, category, description) 
VALUES 
  ('validation_mode', '"beta"', 'subscription', 'Controls whether to validate subscriptions with Stripe (beta/active)')
ON CONFLICT (key) DO NOTHING;

INSERT INTO public.system_settings (key, value, category, description) 
VALUES 
  ('stripe_student_payment_link', '""', 'subscription', 'Stripe Payment Link for Student plan')
ON CONFLICT (key) DO NOTHING;

INSERT INTO public.system_settings (key, value, category, description) 
VALUES 
  ('stripe_professional_payment_link', '""', 'subscription', 'Stripe Payment Link for Professional plan')
ON CONFLICT (key) DO NOTHING;

INSERT INTO public.system_settings (key, value, category, description) 
VALUES 
  ('stripe_premium_payment_link', '""', 'subscription', 'Stripe Payment Link for Premium plan')
ON CONFLICT (key) DO NOTHING;