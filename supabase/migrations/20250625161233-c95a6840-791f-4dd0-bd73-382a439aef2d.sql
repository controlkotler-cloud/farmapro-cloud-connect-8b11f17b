
-- Habilitar RLS en la tabla courses si no está habilitado
ALTER TABLE public.courses ENABLE ROW LEVEL SECURITY;

-- Política para que los administradores puedan ver todos los cursos
CREATE POLICY "Admins can view all courses" ON public.courses
  FOR SELECT 
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.subscription_role = 'admin'
    )
  );

-- Política para que los administradores puedan crear cursos
CREATE POLICY "Admins can create courses" ON public.courses
  FOR INSERT 
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.subscription_role = 'admin'
    )
  );

-- Política para que los administradores puedan actualizar cursos
CREATE POLICY "Admins can update courses" ON public.courses
  FOR UPDATE 
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.subscription_role = 'admin'
    )
  );

-- Política para que los administradores puedan eliminar cursos
CREATE POLICY "Admins can delete courses" ON public.courses
  FOR DELETE 
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.subscription_role = 'admin'
    )
  );

-- Política para que todos los usuarios autenticados puedan ver cursos (para el frontend público)
CREATE POLICY "Authenticated users can view courses" ON public.courses
  FOR SELECT 
  USING (auth.role() = 'authenticated');
