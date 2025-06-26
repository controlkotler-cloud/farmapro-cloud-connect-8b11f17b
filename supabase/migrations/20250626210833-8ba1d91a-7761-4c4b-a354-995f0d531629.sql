
-- Primero actualizar las políticas que dependen de is_admin()
-- Actualizar política de recursos
DROP POLICY IF EXISTS "Admins can manage resources" ON public.resources;
CREATE POLICY "Admins can manage resources" ON public.resources
  FOR ALL 
  TO authenticated
  USING (public.is_current_user_admin())
  WITH CHECK (public.is_current_user_admin());

-- Actualizar política de eventos
DROP POLICY IF EXISTS "Admins can manage events" ON public.events;
CREATE POLICY "Admins can manage events" ON public.events
  FOR ALL 
  TO authenticated
  USING (public.is_current_user_admin())
  WITH CHECK (public.is_current_user_admin());

-- Actualizar política de trabajos
DROP POLICY IF EXISTS "Admins can manage all jobs" ON public.job_listings;
DROP POLICY IF EXISTS "Admins can manage all job listings" ON public.job_listings;
CREATE POLICY "Admins can manage all job listings" ON public.job_listings
  FOR ALL 
  TO authenticated
  USING (public.is_current_user_admin())
  WITH CHECK (public.is_current_user_admin());

-- Ahora eliminar las funciones duplicadas
DROP FUNCTION IF EXISTS public.promote_user_to_admin(text);
DROP FUNCTION IF EXISTS public.is_user_admin(uuid);
DROP FUNCTION IF EXISTS public.is_admin();
DROP FUNCTION IF EXISTS public.make_user_admin(text);

-- Optimizar función para calcular estadísticas de quiz
CREATE OR REPLACE FUNCTION public.calculate_quiz_stats(quiz_id_param uuid)
RETURNS TABLE(total_attempts bigint, total_users bigint, average_score numeric, pass_rate numeric)
LANGUAGE sql
STABLE
SET search_path = public
AS $$
  SELECT 
    COUNT(*) as total_attempts,
    COUNT(DISTINCT user_id) as total_users,
    ROUND(COALESCE(AVG(percentage), 0), 2) as average_score,
    ROUND(
      CASE 
        WHEN COUNT(*) > 0 THEN 
          (COUNT(*) FILTER (WHERE passed = true) * 100.0 / COUNT(*))
        ELSE 0 
      END, 2
    ) as pass_rate
  FROM public.quiz_attempts 
  WHERE quiz_id = quiz_id_param 
  AND completed_at IS NOT NULL;
$$;

-- Optimizar función para agregar puntos
CREATE OR REPLACE FUNCTION public.add_user_points(user_id uuid, points integer)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.user_points (user_id, total_points, level)
  VALUES (user_id, points, 1)
  ON CONFLICT (user_id) 
  DO UPDATE SET 
    total_points = public.user_points.total_points + points,
    level = GREATEST(1, (public.user_points.total_points + points) / 100),
    updated_at = NOW();
END;
$$;

-- Optimizar función para nuevos usuarios
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, pharmacy_name, position)
  VALUES (
    NEW.id, 
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    NEW.raw_user_meta_data->>'pharmacy_name',
    NEW.raw_user_meta_data->>'position'
  );
  
  INSERT INTO public.user_points (user_id, total_points, level)
  VALUES (NEW.id, 0, 1);
  
  RETURN NEW;
EXCEPTION
  WHEN others THEN
    RAISE WARNING 'Error creating user profile: %', SQLERRM;
    RETURN NEW;
END;
$$;
