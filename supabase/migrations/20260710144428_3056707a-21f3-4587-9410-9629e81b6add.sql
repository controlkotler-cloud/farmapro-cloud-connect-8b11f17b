
-- 1. Set security_invoker on remaining admin views (SUPA_security_definer_view)
ALTER VIEW public.v_rebotica_dashboard SET (security_invoker = true);
ALTER VIEW public.v_rebotica_consentimientos_diarios SET (security_invoker = true);

-- 2. Revoke column-level SELECT on courses.course_modules for anon/authenticated
--    (raw premium lesson content must only be reachable via get_course_modules RPC).
REVOKE SELECT (course_modules) ON public.courses FROM anon, authenticated, PUBLIC;

-- 3. Drop the unrestricted INSERT policy that lets any authenticated user
--    create job listings, defeating the premium gating.
DROP POLICY IF EXISTS "Authenticated users can create jobs" ON public.job_listings;
-- Also drop redundant/duplicate policies for clarity.
DROP POLICY IF EXISTS "Premium and admin users can create jobs" ON public.job_listings;
DROP POLICY IF EXISTS "Users can update own jobs" ON public.job_listings;
DROP POLICY IF EXISTS "Authors can update own jobs" ON public.job_listings;
-- Keep "Premium users can create job listings" (premium/profesional/admin gating)
-- Keep "Users can update own job listings" and "Admins can manage all job listings"

-- 4. Consolidate pharmacy_listings ownership to seller_id and standardize
--    admin checks on is_current_user_admin(). Drop inconsistent policies.
DROP POLICY IF EXISTS "Owners can create pharmacies" ON public.pharmacy_listings;
DROP POLICY IF EXISTS "Owners can update own pharmacies" ON public.pharmacy_listings;
DROP POLICY IF EXISTS "Admins can delete pharmacies" ON public.pharmacy_listings;
DROP POLICY IF EXISTS "Admins can delete pharmacy listings" ON public.pharmacy_listings;
DROP POLICY IF EXISTS "Admins can update pharmacy listings" ON public.pharmacy_listings;

-- Keep a single, standardized set: seller_id for ownership, is_current_user_admin() for admin.
CREATE POLICY "Sellers or admins can update pharmacy listings"
  ON public.pharmacy_listings
  FOR UPDATE
  USING (auth.uid() = seller_id OR public.is_current_user_admin())
  WITH CHECK (auth.uid() = seller_id OR public.is_current_user_admin());

CREATE POLICY "Sellers or admins can delete pharmacy listings"
  ON public.pharmacy_listings
  FOR DELETE
  USING (auth.uid() = seller_id OR public.is_current_user_admin());

-- Keep existing:
--   "Premium users can create pharmacy listings" (INSERT, seller_id + premium gating)
--   "Admins can manage all pharmacy listings" (ALL, is_current_user_admin)
--   "Pharmacy listings access with conditional contact email" (SELECT)
-- Remove the now-orphan "Users can update own pharmacy listings" (dup of new one).
DROP POLICY IF EXISTS "Users can update own pharmacy listings" ON public.pharmacy_listings;

-- 5. Fix mutable search_path on the last remaining function.
CREATE OR REPLACE FUNCTION public.rebotica_prizes_default_stock_restante()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF NEW.stock_restante IS NULL THEN
    NEW.stock_restante := NEW.stock_total;
  END IF;
  RETURN NEW;
END;
$$;

-- 6. Revoke EXECUTE from anon/authenticated on internal SECURITY DEFINER
--    helpers that are only meant to be called by RLS policies, triggers or
--    other SECURITY DEFINER functions. They remain callable by postgres and
--    service_role, and inlined by RLS as needed.
REVOKE EXECUTE ON FUNCTION public.can_access_contact_info()                  FROM anon, authenticated, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.can_access_lesson(uuid)                    FROM anon, authenticated, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.can_access_user_data(uuid)                 FROM anon, authenticated, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.can_view_thread_author(uuid)               FROM anon, authenticated, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.current_subscription_role()                FROM anon, authenticated, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, app_role)                   FROM anon, authenticated, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.is_active_team_member_of_subscription(uuid, uuid) FROM anon, authenticated, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.is_conversation_participant(uuid)          FROM anon, authenticated, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.is_current_user_admin()                    FROM anon, authenticated, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.is_email_admin(text)                       FROM anon, authenticated, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.is_paid_user(uuid)                         FROM anon, authenticated, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.is_team_member(uuid)                       FROM anon, authenticated, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.is_team_owner(uuid)                        FROM anon, authenticated, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.is_team_owner_strict(uuid, uuid)           FROM anon, authenticated, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.is_team_subscription_owner(uuid, uuid)     FROM anon, authenticated, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.job_is_active_and_visible(uuid)            FROM anon, authenticated, PUBLIC;

-- Additionally, anon has no reason to consume image credits (auth required in-body anyway).
REVOKE EXECUTE ON FUNCTION public.consume_image_credit(integer) FROM anon, PUBLIC;
