
-- Remove the over-permissive policy added in the previous migration
DROP POLICY IF EXISTS "Public profile fields readable for view" ON public.profiles;

-- Run the view with definer privileges so it can expose only the safe columns
-- to anon/authenticated without leaking sensitive base-table fields
ALTER VIEW public.profiles_public SET (security_invoker = false);
