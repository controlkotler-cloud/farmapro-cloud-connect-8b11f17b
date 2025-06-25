
-- Habilitar RLS para la tabla job_listings si no está habilitado
ALTER TABLE public.job_listings ENABLE ROW LEVEL SECURITY;

-- Eliminar políticas existentes que podrían estar causando conflictos
DROP POLICY IF EXISTS "Users can view active job listings" ON public.job_listings;
DROP POLICY IF EXISTS "Users can create job listings" ON public.job_listings;
DROP POLICY IF EXISTS "Users can update own job listings" ON public.job_listings;
DROP POLICY IF EXISTS "Admins can manage job listings" ON public.job_listings;
DROP POLICY IF EXISTS "Public can view active jobs" ON public.job_listings;

-- Política para que cualquiera pueda ver ofertas activas (para la página pública)
CREATE POLICY "Public can view active jobs" ON public.job_listings
  FOR SELECT 
  TO public
  USING (is_active = true);

-- Política para que usuarios autenticados puedan crear ofertas
CREATE POLICY "Authenticated users can create jobs" ON public.job_listings
  FOR INSERT 
  TO authenticated
  WITH CHECK (auth.uid() = employer_id);

-- Política para que los propietarios puedan editar sus ofertas
CREATE POLICY "Users can update own jobs" ON public.job_listings
  FOR UPDATE 
  TO authenticated
  USING (auth.uid() = employer_id)
  WITH CHECK (auth.uid() = employer_id);

-- Política para que los administradores puedan gestionar todas las ofertas
CREATE POLICY "Admins can manage all jobs" ON public.job_listings
  FOR ALL 
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());
