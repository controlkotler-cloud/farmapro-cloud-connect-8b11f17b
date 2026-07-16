
CREATE TABLE IF NOT EXISTS public.portal_email_log (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  template TEXT NOT NULL,
  recipient TEXT NOT NULL,
  subject TEXT,
  status TEXT NOT NULL CHECK (status IN ('ok','error')),
  mailrelay_id TEXT,
  error TEXT,
  attempts INT NOT NULL DEFAULT 1,
  meta JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT ON public.portal_email_log TO authenticated;
GRANT ALL ON public.portal_email_log TO service_role;

ALTER TABLE public.portal_email_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can read portal_email_log"
  ON public.portal_email_log FOR SELECT
  TO authenticated
  USING (public.is_current_user_admin());

CREATE INDEX IF NOT EXISTS portal_email_log_recipient_idx ON public.portal_email_log (recipient);
CREATE INDEX IF NOT EXISTS portal_email_log_template_idx ON public.portal_email_log (template);
CREATE INDEX IF NOT EXISTS portal_email_log_created_idx ON public.portal_email_log (created_at DESC);
