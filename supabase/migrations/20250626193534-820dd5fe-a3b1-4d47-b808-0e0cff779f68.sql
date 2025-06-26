
-- Crear función para verificar si el usuario actual es admin (solo si no existe)
CREATE OR REPLACE FUNCTION public.is_current_user_admin()
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() 
    AND subscription_role = 'admin'
  );
$$;

-- Habilitar RLS para todas las tablas que no lo tienen
ALTER TABLE public.admin_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.system_settings ENABLE ROW LEVEL SECURITY;

-- Políticas para admin_users
DROP POLICY IF EXISTS "Only admins can view admin users" ON public.admin_users;
DROP POLICY IF EXISTS "Only admins can manage admin users" ON public.admin_users;

CREATE POLICY "Only admins can view admin users" ON public.admin_users
  FOR SELECT 
  TO authenticated
  USING (public.is_current_user_admin());

CREATE POLICY "Only admins can manage admin users" ON public.admin_users
  FOR ALL 
  TO authenticated
  USING (public.is_current_user_admin())
  WITH CHECK (public.is_current_user_admin());

-- Políticas para system_settings
DROP POLICY IF EXISTS "Only admins can view system settings" ON public.system_settings;
DROP POLICY IF EXISTS "Only admins can manage system settings" ON public.system_settings;

CREATE POLICY "Only admins can view system settings" ON public.system_settings
  FOR SELECT 
  TO authenticated
  USING (public.is_current_user_admin());

CREATE POLICY "Only admins can manage system settings" ON public.system_settings
  FOR ALL 
  TO authenticated
  USING (public.is_current_user_admin())
  WITH CHECK (public.is_current_user_admin());

-- Políticas para promotions
DROP POLICY IF EXISTS "Anyone can view promotions" ON public.promotions;
DROP POLICY IF EXISTS "Public can view promotions" ON public.promotions;
DROP POLICY IF EXISTS "Public can view active promotions" ON public.promotions;
DROP POLICY IF EXISTS "Admins can manage promotions" ON public.promotions;
DROP POLICY IF EXISTS "Admins can manage all promotions" ON public.promotions;

CREATE POLICY "Public can view active promotions" ON public.promotions
  FOR SELECT 
  TO public
  USING (is_active = true);

CREATE POLICY "Admins can manage all promotions" ON public.promotions
  FOR ALL 
  TO authenticated
  USING (public.is_current_user_admin())
  WITH CHECK (public.is_current_user_admin());

-- Políticas para pharmacy_listings
DROP POLICY IF EXISTS "Users can view active pharmacy listings" ON public.pharmacy_listings;
DROP POLICY IF EXISTS "Users can create pharmacy listings" ON public.pharmacy_listings;
DROP POLICY IF EXISTS "Users can update own pharmacy listings" ON public.pharmacy_listings;
DROP POLICY IF EXISTS "Admins can manage pharmacy listings" ON public.pharmacy_listings;
DROP POLICY IF EXISTS "Public can view active pharmacy listings" ON public.pharmacy_listings;
DROP POLICY IF EXISTS "Premium users can create pharmacy listings" ON public.pharmacy_listings;
DROP POLICY IF EXISTS "Admins can manage all pharmacy listings" ON public.pharmacy_listings;

CREATE POLICY "Public can view active pharmacy listings" ON public.pharmacy_listings
  FOR SELECT 
  TO public
  USING (is_active = true);

CREATE POLICY "Premium users can create pharmacy listings" ON public.pharmacy_listings
  FOR INSERT 
  TO authenticated
  WITH CHECK (
    auth.uid() = seller_id AND
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() 
      AND (subscription_role IN ('premium', 'profesional', 'admin'))
    )
  );

CREATE POLICY "Users can update own pharmacy listings" ON public.pharmacy_listings
  FOR UPDATE 
  TO authenticated
  USING (auth.uid() = seller_id)
  WITH CHECK (auth.uid() = seller_id);

CREATE POLICY "Admins can manage all pharmacy listings" ON public.pharmacy_listings
  FOR ALL 
  TO authenticated
  USING (public.is_current_user_admin())
  WITH CHECK (public.is_current_user_admin());

-- Políticas para courses
DROP POLICY IF EXISTS "Anyone can view courses" ON public.courses;
DROP POLICY IF EXISTS "Public can view courses" ON public.courses;
DROP POLICY IF EXISTS "Admins can manage courses" ON public.courses;

CREATE POLICY "Public can view courses" ON public.courses
  FOR SELECT 
  TO public
  USING (true);

CREATE POLICY "Admins can manage courses" ON public.courses
  FOR ALL 
  TO authenticated
  USING (public.is_current_user_admin())
  WITH CHECK (public.is_current_user_admin());

-- Políticas para challenges
DROP POLICY IF EXISTS "Anyone can view challenges" ON public.challenges;
DROP POLICY IF EXISTS "Public can view active challenges" ON public.challenges;
DROP POLICY IF EXISTS "Admins can manage challenges" ON public.challenges;

CREATE POLICY "Public can view active challenges" ON public.challenges
  FOR SELECT 
  TO public
  USING (is_active = true);

CREATE POLICY "Admins can manage challenges" ON public.challenges
  FOR ALL 
  TO authenticated
  USING (public.is_current_user_admin())
  WITH CHECK (public.is_current_user_admin());

-- Crear función de seguridad para validar acceso a datos de usuario
CREATE OR REPLACE FUNCTION public.can_access_user_data(target_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
AS $$
  SELECT auth.uid() = target_user_id OR public.is_current_user_admin();
$$;

-- Políticas adicionales para mejorar la seguridad
-- Políticas para profiles
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;

CREATE POLICY "Users can view own profile" ON public.profiles
  FOR SELECT 
  TO authenticated
  USING (public.can_access_user_data(id));

CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE 
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Admins can manage all profiles" ON public.profiles
  FOR ALL 
  TO authenticated
  USING (public.is_current_user_admin())
  WITH CHECK (public.is_current_user_admin());

-- Políticas para course_enrollments
DROP POLICY IF EXISTS "Users can view own enrollments" ON public.course_enrollments;
DROP POLICY IF EXISTS "Users can manage own enrollments" ON public.course_enrollments;

CREATE POLICY "Users can manage own enrollments" ON public.course_enrollments
  FOR ALL 
  TO authenticated
  USING (public.can_access_user_data(user_id))
  WITH CHECK (auth.uid() = user_id);

-- Políticas para user_points
DROP POLICY IF EXISTS "Users can view all user points" ON public.user_points;
DROP POLICY IF EXISTS "Users can view own points" ON public.user_points;

CREATE POLICY "Users can view own points" ON public.user_points
  FOR SELECT 
  TO authenticated
  USING (public.can_access_user_data(user_id));

CREATE POLICY "System can manage user points" ON public.user_points
  FOR ALL 
  TO authenticated
  USING (public.is_current_user_admin())
  WITH CHECK (public.is_current_user_admin());

-- Políticas para user_challenge_progress
DROP POLICY IF EXISTS "Users can view all challenge progress" ON public.user_challenge_progress;
DROP POLICY IF EXISTS "Users can view own progress" ON public.user_challenge_progress;

CREATE POLICY "Users can view own progress" ON public.user_challenge_progress
  FOR SELECT 
  TO authenticated
  USING (public.can_access_user_data(user_id));

CREATE POLICY "Users can manage own progress" ON public.user_challenge_progress
  FOR ALL 
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Políticas para job_listings
DROP POLICY IF EXISTS "Users can view active job listings" ON public.job_listings;
DROP POLICY IF EXISTS "Premium users can create job listings" ON public.job_listings;
DROP POLICY IF EXISTS "Users can update own job listings" ON public.job_listings;
DROP POLICY IF EXISTS "Admins can manage job listings" ON public.job_listings;

CREATE POLICY "Public can view active job listings" ON public.job_listings
  FOR SELECT 
  TO public
  USING (is_active = true AND (expires_at IS NULL OR expires_at > now()));

CREATE POLICY "Premium users can create job listings" ON public.job_listings
  FOR INSERT 
  TO authenticated
  WITH CHECK (
    auth.uid() = employer_id AND
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() 
      AND (subscription_role IN ('premium', 'profesional', 'admin'))
    )
  );

CREATE POLICY "Users can update own job listings" ON public.job_listings
  FOR UPDATE 
  TO authenticated
  USING (auth.uid() = employer_id)
  WITH CHECK (auth.uid() = employer_id);

CREATE POLICY "Admins can manage all job listings" ON public.job_listings
  FOR ALL 
  TO authenticated
  USING (public.is_current_user_admin())
  WITH CHECK (public.is_current_user_admin());

-- Políticas para resource_downloads
DROP POLICY IF EXISTS "Users can view own downloads" ON public.resource_downloads;
DROP POLICY IF EXISTS "Users can create own downloads" ON public.resource_downloads;

CREATE POLICY "Users can manage own downloads" ON public.resource_downloads
  FOR ALL 
  TO authenticated
  USING (public.can_access_user_data(user_id))
  WITH CHECK (auth.uid() = user_id);
