
-- =========================================================================
-- 1) profiles_self_editable_subscription_role
--    Extend block_unsafe_profile_updates to also protect 'role' column
-- =========================================================================
CREATE OR REPLACE FUNCTION public.block_unsafe_profile_updates()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF auth.jwt() ->> 'role' = 'service_role' THEN
    RETURN NEW;
  END IF;
  IF is_current_user_admin() THEN
    PERFORM log_security_event(
      'admin_action',
      jsonb_build_object(
        'action', 'profile_update',
        'admin_user_id', auth.uid(),
        'target_user_id', NEW.id,
        'changes', jsonb_build_object(
          'old_subscription_role', OLD.subscription_role,
          'new_subscription_role', NEW.subscription_role,
          'old_subscription_status', OLD.subscription_status,
          'new_subscription_status', NEW.subscription_status,
          'old_role', OLD.role,
          'new_role', NEW.role
        )
      ),
      auth.uid()
    );
    RETURN NEW;
  END IF;
  IF auth.uid() != NEW.id THEN
    RAISE EXCEPTION 'Permission denied: Cannot modify other users profiles';
  END IF;
  IF OLD.subscription_role IS DISTINCT FROM NEW.subscription_role OR
     OLD.subscription_status IS DISTINCT FROM NEW.subscription_status OR
     OLD.stripe_customer_id IS DISTINCT FROM NEW.stripe_customer_id OR
     OLD.trial_ends_at IS DISTINCT FROM NEW.trial_ends_at OR
     OLD.role IS DISTINCT FROM NEW.role THEN
    RAISE EXCEPTION 'Permission denied: Cannot modify sensitive profile attributes';
  END IF;
  RETURN NEW;
END;
$$;

-- =========================================================================
-- 2) promotions_admin_check_uses_profiles_subscription_role
--    Drop the spoofable policies; "Admins can manage all promotions" (ALL,
--    is_current_user_admin) already covers UPDATE + DELETE safely.
-- =========================================================================
DROP POLICY IF EXISTS "Admins can delete promotions" ON public.promotions;
DROP POLICY IF EXISTS "Admins can update promotions" ON public.promotions;

-- =========================================================================
-- 3) pharmacy_job_listings_plan_check_via_profiles_role
--    Base the plan check on the real subscriptions table, not the
--    client-editable profiles.subscription_role.
-- =========================================================================
CREATE OR REPLACE FUNCTION public.has_active_paid_subscription(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.subscriptions
     WHERE user_id = _user_id
       AND status IN ('active','trialing')
  ) OR public.is_current_user_admin();
$$;

REVOKE EXECUTE ON FUNCTION public.has_active_paid_subscription(uuid) FROM PUBLIC, anon;
GRANT  EXECUTE ON FUNCTION public.has_active_paid_subscription(uuid) TO authenticated, service_role;

-- job_listings: replace INSERT policy
DROP POLICY IF EXISTS "Premium users can create job listings" ON public.job_listings;
CREATE POLICY "Paid users can create job listings"
  ON public.job_listings
  FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() = employer_id
    AND public.has_active_paid_subscription(auth.uid())
  );

-- pharmacy_listings: replace INSERT policy
DROP POLICY IF EXISTS "Premium users can create pharmacy listings" ON public.pharmacy_listings;
CREATE POLICY "Paid users can create pharmacy listings"
  ON public.pharmacy_listings
  FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() = seller_id
    AND public.has_active_paid_subscription(auth.uid())
  );

-- pharmacy_listings: replace SELECT policy that gates via profiles.subscription_role
DROP POLICY IF EXISTS "Pharmacy listings access with conditional contact email" ON public.pharmacy_listings;
CREATE POLICY "Pharmacy listings access with conditional contact email"
  ON public.pharmacy_listings
  FOR SELECT
  USING (
    is_active = true
    AND (
      auth.uid() = seller_id
      OR public.is_current_user_admin()
      OR public.has_active_paid_subscription(auth.uid())
    )
  );

-- =========================================================================
-- 4) courses_course_modules_column_exposed
--    Revoke direct read of the JSONB course content column; serve only via
--    public.get_course_modules() RPC (which enforces premium/trial gating).
-- =========================================================================
REVOKE SELECT (course_modules) ON public.courses FROM anon, authenticated;

-- =========================================================================
-- 5) SUPA_function_search_path_mutable
--    Set search_path on the 7 flagged functions.
-- =========================================================================
ALTER FUNCTION public.delete_email(text, bigint)                SET search_path = public;
ALTER FUNCTION public.enqueue_email(text, jsonb)                SET search_path = public;
ALTER FUNCTION public.move_to_dlq(text, text, bigint, jsonb)    SET search_path = public;
ALTER FUNCTION public.read_email_batch(text, integer, integer)  SET search_path = public;
ALTER FUNCTION public.format_initials_label(text, text)         SET search_path = public;
ALTER FUNCTION public.set_forum_author_display_name()           SET search_path = public;
ALTER FUNCTION public.set_portal_holded_updated_at()            SET search_path = public;

-- =========================================================================
-- 6) SUPA_anon_security_definer_function_executable
--    SUPA_authenticated_security_definer_function_executable
--
--    Revoke EXECUTE from anon + authenticated on SECURITY DEFINER functions
--    that must never be called from client / signed-in user context.
--    These are backend/cron/trigger helpers only.
-- =========================================================================

-- Email queue plumbing: only pg_cron / edge functions (service_role) touch these
REVOKE EXECUTE ON FUNCTION public.enqueue_email(text, jsonb)                 FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.delete_email(text, bigint)                 FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.move_to_dlq(text, text, bigint, jsonb)     FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.read_email_batch(text, integer, integer)   FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.email_queue_dispatch()                     FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.email_queue_wake()                         FROM PUBLIC, anon, authenticated;

-- get_job_contact_email_rpc had PUBLIC EXECUTE; keep it only for authenticated
REVOKE EXECUTE ON FUNCTION public.get_job_contact_email_rpc(uuid) FROM PUBLIC, anon;

GRANT EXECUTE ON FUNCTION public.enqueue_email(text, jsonb)                 TO service_role;
GRANT EXECUTE ON FUNCTION public.delete_email(text, bigint)                 TO service_role;
GRANT EXECUTE ON FUNCTION public.move_to_dlq(text, text, bigint, jsonb)     TO service_role;
GRANT EXECUTE ON FUNCTION public.read_email_batch(text, integer, integer)   TO service_role;
GRANT EXECUTE ON FUNCTION public.email_queue_dispatch()                     TO service_role;
GRANT EXECUTE ON FUNCTION public.email_queue_wake()                         TO service_role;
