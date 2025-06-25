
-- Primero, eliminemos cualquier política existente que pueda estar causando conflictos
DROP POLICY IF EXISTS "Admins can view all courses" ON public.courses;
DROP POLICY IF EXISTS "Admins can create courses" ON public.courses;
DROP POLICY IF EXISTS "Admins can update courses" ON public.courses;
DROP POLICY IF EXISTS "Admins can delete courses" ON public.courses;
DROP POLICY IF EXISTS "Authenticated users can view courses" ON public.courses;

-- Crear una función de utilidad para verificar si el usuario es admin
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() 
    AND subscription_role = 'admin'
  );
$$;

-- Ahora crear las políticas usando la función
CREATE POLICY "Admins can manage courses" ON public.courses
  FOR ALL 
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- Política separada para que usuarios autenticados puedan ver cursos
CREATE POLICY "Users can view courses" ON public.courses
  FOR SELECT 
  TO authenticated
  USING (true);

-- Política para usuarios anónimos (si necesario para la página pública)
CREATE POLICY "Public can view courses" ON public.courses
  FOR SELECT 
  TO anon
  USING (true);
