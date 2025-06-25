
-- Habilitar RLS para la tabla resources si no está habilitado
ALTER TABLE public.resources ENABLE ROW LEVEL SECURITY;

-- Eliminar políticas existentes que podrían estar causando conflictos
DROP POLICY IF EXISTS "Anyone can view resources" ON public.resources;
DROP POLICY IF EXISTS "Admins can manage resources" ON public.resources;

-- Política para que cualquiera pueda ver recursos (para la página pública)
CREATE POLICY "Public can view resources" ON public.resources
  FOR SELECT 
  TO public
  USING (true);

-- Política para que los administradores puedan gestionar recursos (crear, editar, eliminar)
CREATE POLICY "Admins can manage resources" ON public.resources
  FOR ALL 
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());
