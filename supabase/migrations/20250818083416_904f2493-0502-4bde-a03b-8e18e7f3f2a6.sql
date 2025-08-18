-- Fix infinite recursion in admin_users RLS policies
-- Remove the problematic policy that references admin_users from within admin_users
DROP POLICY IF EXISTS "Only admins can access admin_users" ON public.admin_users;

-- Keep only the safe policies that use the security definer function
-- This policy is already safe as it uses is_current_user_admin() function
-- DROP POLICY IF EXISTS "Only admins can view admin users" ON public.admin_users;
-- DROP POLICY IF EXISTS "Only admins can manage admin users" ON public.admin_users;

-- The existing policies using is_current_user_admin() are safe and sufficient:
-- 1. "Only admins can view admin users" - uses security definer function
-- 2. "Only admins can manage admin users" - uses security definer function

-- Add a comment to explain the security approach
COMMENT ON TABLE public.admin_users IS 'Admin users table with RLS policies using security definer functions to prevent recursion';