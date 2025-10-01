-- ============================================
-- CRITICAL FIX: Secure admin_users table from email harvesting
-- ============================================

-- 1. Drop all existing policies on admin_users
DROP POLICY IF EXISTS "Only admins can manage admin users" ON public.admin_users;
DROP POLICY IF EXISTS "Only admins can view admin users" ON public.admin_users;
DROP POLICY IF EXISTS "Only authenticated admins can manage admin users" ON public.admin_users;
DROP POLICY IF EXISTS "Only authenticated admins can view admin users" ON public.admin_users;

-- 2. Ensure RLS is enabled (just to be explicit)
ALTER TABLE public.admin_users ENABLE ROW LEVEL SECURITY;

-- 3. Force RLS for table owner (prevents superuser bypass in certain contexts)
ALTER TABLE public.admin_users FORCE ROW LEVEL SECURITY;

-- 4. Create a single, comprehensive admin-only access policy
CREATE POLICY "Admin users table - admin only access"
ON public.admin_users
FOR ALL
TO authenticated
USING (
  -- Only allow if the current user is an admin
  public.is_current_user_admin()
)
WITH CHECK (
  -- Only allow modifications if the current user is an admin
  public.is_current_user_admin()
);

-- 5. Explicitly DENY all access to public/anon role (belt and suspenders approach)
-- This ensures unauthenticated users absolutely cannot access this table
CREATE POLICY "Admin users table - deny public access"
ON public.admin_users
AS RESTRICTIVE
FOR ALL
TO anon, public
USING (false);

-- 6. Create a secure helper function to check if an email is an admin
-- This allows checking admin status WITHOUT exposing the admin_users table
CREATE OR REPLACE FUNCTION public.is_email_admin(check_email text)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.admin_users 
    WHERE email = check_email
  );
$$;

-- 7. Revoke all default permissions from public role
REVOKE ALL ON public.admin_users FROM PUBLIC;
REVOKE ALL ON public.admin_users FROM anon;

-- 8. Grant only to authenticated users (will still be filtered by RLS)
GRANT SELECT ON public.admin_users TO authenticated;

-- 9. Log this critical security fix
INSERT INTO public.security_audit_log (event_type, details, user_id)
VALUES (
  'admin_action',
  jsonb_build_object(
    'action', 'admin_users_table_secured',
    'description', 'Applied comprehensive security policies to prevent admin email harvesting',
    'changes', jsonb_build_array(
      'Removed all existing policies',
      'Created single admin-only access policy',
      'Added restrictive policy to deny public access',
      'Forced RLS for table owner',
      'Revoked public permissions',
      'Created secure helper function for email checks'
    ),
    'severity', 'critical',
    'timestamp', NOW()
  ),
  NULL
);

-- 10. Add comment documenting the security requirements
COMMENT ON TABLE public.admin_users IS 
'CRITICAL SECURITY: This table contains admin user information including email addresses. 
Access is strictly limited to authenticated admin users only. 
Public/anonymous access is explicitly denied to prevent email harvesting attacks.
Use is_email_admin() function to check admin status without exposing the table.';