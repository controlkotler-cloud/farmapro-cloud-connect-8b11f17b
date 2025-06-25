
-- Habilitar RLS para la tabla events si no está habilitado
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;

-- Eliminar políticas existentes que podrían estar causando conflictos
DROP POLICY IF EXISTS "Anyone can view events" ON public.events;
DROP POLICY IF EXISTS "Admins can manage events" ON public.events;
DROP POLICY IF EXISTS "Public can view events" ON public.events;

-- Política para que cualquiera pueda ver eventos (para la página pública)
CREATE POLICY "Public can view events" ON public.events
  FOR SELECT 
  TO public
  USING (true);

-- Política para que los administradores puedan gestionar eventos (crear, editar, eliminar)
CREATE POLICY "Admins can manage events" ON public.events
  FOR ALL 
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());
