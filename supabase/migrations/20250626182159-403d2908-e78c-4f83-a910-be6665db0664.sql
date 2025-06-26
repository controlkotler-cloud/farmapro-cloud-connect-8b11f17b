
-- Crear políticas RLS para permitir a los administradores eliminar promociones
CREATE POLICY "Admins can delete promotions" ON public.promotions
  FOR DELETE 
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() 
      AND subscription_role = 'admin'
    )
  );

-- Crear políticas RLS para permitir a los administradores eliminar farmacias
CREATE POLICY "Admins can delete pharmacy listings" ON public.pharmacy_listings
  FOR DELETE 
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() 
      AND subscription_role = 'admin'
    )
  );

-- También asegurémonos de que los administradores pueden actualizar el estado
CREATE POLICY "Admins can update promotions" ON public.promotions
  FOR UPDATE 
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() 
      AND subscription_role = 'admin'
    )
  );

CREATE POLICY "Admins can update pharmacy listings" ON public.pharmacy_listings
  FOR UPDATE 
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() 
      AND subscription_role = 'admin'
    )
  );
