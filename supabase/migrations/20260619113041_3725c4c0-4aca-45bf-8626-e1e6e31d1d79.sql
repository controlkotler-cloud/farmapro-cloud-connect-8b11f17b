
-- 1. profiles: remove overly broad SELECT, expose safe public fields via view
DROP POLICY IF EXISTS "Users can view all profiles" ON public.profiles;

CREATE OR REPLACE VIEW public.profiles_public AS
SELECT id, full_name, avatar_url, pharmacy_name, position, bio, created_at
FROM public.profiles;

GRANT SELECT ON public.profiles_public TO authenticated, anon;

-- 2. job_listings: restrict base table SELECT to employer/admin; clients use job_listings_public
DROP POLICY IF EXISTS "Anyone can view active jobs" ON public.job_listings;
CREATE POLICY "Employers and admins can view job listings"
  ON public.job_listings FOR SELECT
  TO authenticated
  USING (auth.uid() = employer_id OR public.is_current_user_admin());

-- 3. pharmacy_listings: remove broad SELECT exposing financial/contact data
DROP POLICY IF EXISTS "Anyone can view active pharmacies" ON public.pharmacy_listings;
-- "Pharmacy listings access with conditional contact email" remains, gating to owner/admin/premium

-- 4. quiz_answers: fix overly permissive INSERT/SELECT
DROP POLICY IF EXISTS "Users can create quiz_answers" ON public.quiz_answers;
DROP POLICY IF EXISTS "Users can view own quiz_answers" ON public.quiz_answers;
CREATE POLICY "Users can insert own quiz_answers"
  ON public.quiz_answers FOR INSERT
  TO authenticated
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.quiz_attempts
    WHERE id = attempt_id AND user_id = auth.uid()
  ));
CREATE POLICY "Users can view own quiz_answers"
  ON public.quiz_answers FOR SELECT
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.quiz_attempts
    WHERE id = attempt_id AND user_id = auth.uid()
  ));

-- 5. security_audit_log: restrict INSERT to service_role only
DROP POLICY IF EXISTS "Secure audit log inserts only" ON public.security_audit_log;
CREATE POLICY "Service role can insert audit logs"
  ON public.security_audit_log FOR INSERT
  TO public
  WITH CHECK ((auth.jwt() ->> 'role') = 'service_role');

-- 6. system_settings: drop broad SELECT, admins-only remains
DROP POLICY IF EXISTS "Anyone can view settings" ON public.system_settings;

-- 7. coaching_reservas: document server-side-only access
COMMENT ON TABLE public.coaching_reservas IS
  'Server-side only access via edge functions using service_role. RLS enabled with no user-facing policies by design.';

-- 8. Lock down SECURITY DEFINER helper functions not meant to be called from clients
REVOKE EXECUTE ON FUNCTION public.anonymize_old_applications() FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.calculate_team_price(integer) FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.calculate_team_price_v2(integer, integer) FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.recompute_user_points(uuid) FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.add_user_points(uuid, integer) FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.log_security_event(text, jsonb, uuid) FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.grant_user_role(uuid, public.app_role) FROM anon;
REVOKE EXECUTE ON FUNCTION public.revoke_user_role(uuid, public.app_role) FROM anon;
REVOKE EXECUTE ON FUNCTION public.update_user_role_admin(uuid, public.user_role, public.subscription_status) FROM anon;
