-- =====================================================
-- COMPREHENSIVE SECURITY FIXES (WITH CASCADE)
-- =====================================================

-- 1. Drop dependent functions first, then the views
DROP FUNCTION IF EXISTS public.get_public_job_listings();
DROP FUNCTION IF EXISTS public.get_public_job_listing(uuid);
DROP VIEW IF EXISTS job_listings_public CASCADE;
DROP VIEW IF EXISTS pharmacy_listings_public CASCADE;

-- 2. Create secure public tables for listings without sensitive data
CREATE TABLE IF NOT EXISTS public.job_listings_safe (
  id uuid PRIMARY KEY,
  title text NOT NULL,
  company_name text NOT NULL,
  location text NOT NULL,
  description text NOT NULL,
  requirements text,
  salary_range text,
  is_active boolean DEFAULT true,
  expires_at timestamp with time zone,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.pharmacy_listings_safe (
  id uuid PRIMARY KEY,
  title text NOT NULL,
  location text NOT NULL,
  description text NOT NULL,
  price numeric,
  surface_area integer,
  annual_revenue numeric,
  is_active boolean DEFAULT true,
  images_urls text[],
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Enable RLS on safe tables
ALTER TABLE public.job_listings_safe ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pharmacy_listings_safe ENABLE ROW LEVEL SECURITY;

-- 3. Create sync functions to maintain safe tables
CREATE OR REPLACE FUNCTION public.sync_job_listings_safe()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'INSERT' OR TG_OP = 'UPDATE' THEN
    INSERT INTO public.job_listings_safe (
      id, title, company_name, location, description, requirements,
      salary_range, is_active, expires_at, created_at, updated_at
    )
    VALUES (
      NEW.id, NEW.title, NEW.company_name, NEW.location, NEW.description,
      NEW.requirements, NEW.salary_range, NEW.is_active, NEW.expires_at,
      NEW.created_at, NEW.updated_at
    )
    ON CONFLICT (id) DO UPDATE SET
      title = EXCLUDED.title,
      company_name = EXCLUDED.company_name,
      location = EXCLUDED.location,
      description = EXCLUDED.description,
      requirements = EXCLUDED.requirements,
      salary_range = EXCLUDED.salary_range,
      is_active = EXCLUDED.is_active,
      expires_at = EXCLUDED.expires_at,
      updated_at = EXCLUDED.updated_at;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    DELETE FROM public.job_listings_safe WHERE id = OLD.id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$;

CREATE OR REPLACE FUNCTION public.sync_pharmacy_listings_safe()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'INSERT' OR TG_OP = 'UPDATE' THEN
    INSERT INTO public.pharmacy_listings_safe (
      id, title, location, description, price, surface_area,
      annual_revenue, is_active, images_urls, created_at, updated_at
    )
    VALUES (
      NEW.id, NEW.title, NEW.location, NEW.description, NEW.price,
      NEW.surface_area, NEW.annual_revenue, NEW.is_active, NEW.images_urls,
      NEW.created_at, NEW.updated_at
    )
    ON CONFLICT (id) DO UPDATE SET
      title = EXCLUDED.title,
      location = EXCLUDED.location,
      description = EXCLUDED.description,
      price = EXCLUDED.price,
      surface_area = EXCLUDED.surface_area,
      annual_revenue = EXCLUDED.annual_revenue,
      is_active = EXCLUDED.is_active,
      images_urls = EXCLUDED.images_urls,
      updated_at = EXCLUDED.updated_at;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    DELETE FROM public.pharmacy_listings_safe WHERE id = OLD.id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$;

-- 4. Create sync triggers
DROP TRIGGER IF EXISTS sync_job_listings_safe_trigger ON public.job_listings;
CREATE TRIGGER sync_job_listings_safe_trigger
  AFTER INSERT OR UPDATE OR DELETE ON public.job_listings
  FOR EACH ROW EXECUTE FUNCTION public.sync_job_listings_safe();

DROP TRIGGER IF EXISTS sync_pharmacy_listings_safe_trigger ON public.pharmacy_listings;
CREATE TRIGGER sync_pharmacy_listings_safe_trigger
  AFTER INSERT OR UPDATE OR DELETE ON public.pharmacy_listings
  FOR EACH ROW EXECUTE FUNCTION public.sync_pharmacy_listings_safe();

-- 5. Create secure RLS policies for safe tables (public read, no sensitive data)
CREATE POLICY "Public can view active job listings (no contact info)" 
ON public.job_listings_safe 
FOR SELECT 
USING (is_active = true AND (expires_at IS NULL OR expires_at > now()));

CREATE POLICY "Public can view active pharmacy listings (no contact info)" 
ON public.pharmacy_listings_safe 
FOR SELECT 
USING (is_active = true);

-- 6. Create replacement functions for the dropped ones
CREATE OR REPLACE FUNCTION public.get_safe_job_listings()
RETURNS SETOF job_listings_safe
LANGUAGE sql
STABLE
SET search_path = public
AS $$
  SELECT * FROM public.job_listings_safe WHERE is_active = true;
$$;

CREATE OR REPLACE FUNCTION public.get_safe_job_listing(_id uuid)
RETURNS job_listings_safe
LANGUAGE sql
STABLE
SET search_path = public
AS $$
  SELECT * FROM public.job_listings_safe WHERE id = _id AND is_active = true;
$$;

CREATE OR REPLACE FUNCTION public.get_safe_pharmacy_listings()
RETURNS SETOF pharmacy_listings_safe
LANGUAGE sql
STABLE
SET search_path = public
AS $$
  SELECT * FROM public.pharmacy_listings_safe WHERE is_active = true;
$$;

-- 7. Restrict access to admin_users table (CRITICAL FIX)
DROP POLICY IF EXISTS "Only admins can view admin users" ON public.admin_users;
CREATE POLICY "Only admins can view admin users" 
ON public.admin_users 
FOR SELECT 
USING (is_current_user_admin());

-- 8. Restrict profiles access (CRITICAL FIX)
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Admins can manage all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;

CREATE POLICY "Users can view own profile" 
ON public.profiles 
FOR SELECT 
USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" 
ON public.profiles 
FOR UPDATE 
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

CREATE POLICY "Admins can manage all profiles" 
ON public.profiles 
FOR ALL 
USING (is_current_user_admin())
WITH CHECK (is_current_user_admin());

-- 9. Secure team_members table (CRITICAL FIX)
DROP POLICY IF EXISTS "Team owners can manage members" ON public.team_members;
DROP POLICY IF EXISTS "Team members can view other members" ON public.team_members;

CREATE POLICY "Team owners can manage members" 
ON public.team_members 
FOR ALL 
USING (
  team_id IN (
    SELECT id FROM team_subscriptions 
    WHERE owner_id = auth.uid() AND status = 'active'
  )
)
WITH CHECK (
  team_id IN (
    SELECT id FROM team_subscriptions 
    WHERE owner_id = auth.uid() AND status = 'active'
  )
);

CREATE POLICY "Team members can view team info" 
ON public.team_members 
FOR SELECT 
USING (
  team_id IN (
    SELECT team_id FROM team_members 
    WHERE user_id = auth.uid() AND status = 'active'
  ) OR
  team_id IN (
    SELECT id FROM team_subscriptions 
    WHERE owner_id = auth.uid()
  )
);

-- 10. Secure premium content access
DROP POLICY IF EXISTS "Public can view courses" ON public.courses;
DROP POLICY IF EXISTS "Users can view courses" ON public.courses;

CREATE POLICY "Users can view free courses" 
ON public.courses 
FOR SELECT 
USING (is_premium = false);

CREATE POLICY "Premium users can view premium courses" 
ON public.courses 
FOR SELECT 
USING (
  is_premium = true AND 
  auth.uid() IS NOT NULL AND
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = auth.uid() 
    AND subscription_role IN ('premium', 'profesional', 'admin')
  )
);

CREATE POLICY "Admins can manage courses" 
ON public.courses 
FOR ALL 
USING (is_current_user_admin())
WITH CHECK (is_current_user_admin());

-- 11. Secure resources access
DROP POLICY IF EXISTS "Public can view resources" ON public.resources;

CREATE POLICY "Users can view free resources" 
ON public.resources 
FOR SELECT 
USING (is_premium = false);

CREATE POLICY "Premium users can view premium resources" 
ON public.resources 
FOR SELECT 
USING (
  is_premium = true AND 
  auth.uid() IS NOT NULL AND
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = auth.uid() 
    AND subscription_role IN ('premium', 'profesional', 'admin')
  )
);

CREATE POLICY "Admins can manage resources" 
ON public.resources 
FOR ALL 
USING (is_current_user_admin())
WITH CHECK (is_current_user_admin());

-- 12. Secure forum content - require authentication
DROP POLICY IF EXISTS "Anyone can view forum categories" ON public.forum_categories;
DROP POLICY IF EXISTS "Authenticated users can view forum categories" ON public.forum_categories;

CREATE POLICY "Authenticated users can view forum categories" 
ON public.forum_categories 
FOR SELECT 
USING (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "Authenticated users can view forum threads" ON public.forum_threads;
DROP POLICY IF EXISTS "Users can view all threads" ON public.forum_threads;

CREATE POLICY "Authenticated users can view forum threads" 
ON public.forum_threads 
FOR SELECT 
USING (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "Authenticated users can view forum replies" ON public.forum_replies;
DROP POLICY IF EXISTS "Users can view all replies" ON public.forum_replies;

CREATE POLICY "Authenticated users can view forum replies" 
ON public.forum_replies 
FOR SELECT 
USING (auth.uid() IS NOT NULL);

-- 13. Harden team invitation system
CREATE OR REPLACE FUNCTION public.validate_team_invitation(
  team_id_param uuid,
  invitation_token_param text,
  email_param text
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  invitation_record record;
  current_member_count integer;
  max_allowed_members integer;
BEGIN
  -- Get invitation details
  SELECT tm.*, ts.max_members, ts.status as team_status
  INTO invitation_record
  FROM team_members tm
  JOIN team_subscriptions ts ON ts.id = tm.team_id
  WHERE tm.team_id = team_id_param 
    AND tm.invitation_token = invitation_token_param
    AND tm.email = email_param
    AND tm.status = 'pending';

  -- Check if invitation exists and team is active
  IF NOT FOUND OR invitation_record.team_status != 'active' THEN
    RETURN false;
  END IF;

  -- Check invitation expiry (7 days)
  IF invitation_record.invited_at < now() - interval '7 days' THEN
    RETURN false;
  END IF;

  -- Check team capacity
  SELECT COUNT(*) INTO current_member_count
  FROM team_members
  WHERE team_id = team_id_param AND status = 'active';

  IF current_member_count >= invitation_record.max_members THEN
    RETURN false;
  END IF;

  RETURN true;
END;
$$;

-- 14. Populate safe tables with existing data
INSERT INTO public.job_listings_safe (
  id, title, company_name, location, description, requirements,
  salary_range, is_active, expires_at, created_at, updated_at
)
SELECT 
  id, title, company_name, location, description, requirements,
  salary_range, is_active, expires_at, created_at, updated_at
FROM public.job_listings
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.pharmacy_listings_safe (
  id, title, location, description, price, surface_area,
  annual_revenue, is_active, images_urls, created_at, updated_at
)
SELECT 
  id, title, location, description, price, surface_area,
  annual_revenue, is_active, images_urls, created_at, updated_at
FROM public.pharmacy_listings
ON CONFLICT (id) DO NOTHING;