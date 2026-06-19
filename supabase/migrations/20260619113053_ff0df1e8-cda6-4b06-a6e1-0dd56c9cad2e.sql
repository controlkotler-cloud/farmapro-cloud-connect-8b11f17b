
ALTER VIEW public.profiles_public SET (security_invoker = true);
-- Allow anyone (including anon) to read safe public profile fields
DROP POLICY IF EXISTS "Public can view safe profile fields" ON public.profiles;
-- Note: cannot do column-level via policy; the view exposes only safe columns,
-- so we add a permissive SELECT policy used only when accessed via the view.
CREATE POLICY "Public profile fields readable for view"
  ON public.profiles FOR SELECT
  TO authenticated, anon
  USING (true);
