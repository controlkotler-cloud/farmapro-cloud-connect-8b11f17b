
-- Eliminar la política existente para crear ofertas
DROP POLICY IF EXISTS "Authenticated users can create jobs" ON public.job_listings;

-- Crear nueva política que solo permite a usuarios premium y admin crear ofertas
CREATE POLICY "Premium and admin users can create jobs" ON public.job_listings
  FOR INSERT 
  TO authenticated
  WITH CHECK (
    auth.uid() = employer_id AND
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() 
      AND (subscription_role = 'premium' OR subscription_role = 'admin')
    )
  );
