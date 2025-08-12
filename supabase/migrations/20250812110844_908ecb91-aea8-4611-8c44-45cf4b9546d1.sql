-- Strengthen profiles RLS: ensure non-admins can only view their own row explicitly
-- and keep separate admin access via existing admin policy.

-- 1) Drop the existing SELECT policy that used can_access_user_data
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;

-- 2) Recreate a stricter SELECT policy limited to self only
CREATE POLICY "Users can view own profile"
ON public.profiles
FOR SELECT
USING (auth.uid() = id);

-- Note: Admins retain full access via the existing policy
-- "Admins can manage all profiles" which applies to ALL commands using is_current_user_admin().