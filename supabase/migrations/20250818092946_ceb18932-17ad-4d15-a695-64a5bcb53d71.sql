-- Fix critical security issues

-- 1. Create secure function to verify team ownership
CREATE OR REPLACE FUNCTION public.is_team_owner_strict(team_id_param uuid, user_id_param uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $function$
  SELECT EXISTS (
    SELECT 1 FROM public.team_subscriptions 
    WHERE id = team_id_param 
    AND owner_id = user_id_param 
    AND status = 'active'
  );
$function$;

-- 2. Drop any Security Definer views and create secure public tables for pharmacy listings
DROP VIEW IF EXISTS public.pharmacy_listings_public CASCADE;

-- Create secure public table for pharmacy listings (without contact emails)
CREATE TABLE IF NOT EXISTS public.pharmacy_listings_public (
  id uuid PRIMARY KEY,
  title text NOT NULL,
  location text NOT NULL,
  description text NOT NULL,
  price numeric,
  surface_area integer,
  annual_revenue numeric,
  is_active boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  images_urls text[]
);

-- Enable RLS on the public table
ALTER TABLE public.pharmacy_listings_public ENABLE ROW LEVEL SECURITY;

-- Allow public read access to active listings only
CREATE POLICY "Public can view active pharmacy listings"
ON public.pharmacy_listings_public
FOR SELECT
USING (is_active = true);

-- 3. Create trigger to sync data from main table to public table
CREATE OR REPLACE FUNCTION public.sync_pharmacy_listings_public()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  IF TG_OP = 'INSERT' OR TG_OP = 'UPDATE' THEN
    INSERT INTO public.pharmacy_listings_public (
      id, title, location, description, price, surface_area,
      annual_revenue, is_active, created_at, updated_at, images_urls
    )
    VALUES (
      NEW.id, NEW.title, NEW.location, NEW.description, NEW.price,
      NEW.surface_area, NEW.annual_revenue, NEW.is_active,
      NEW.created_at, NEW.updated_at, NEW.images_urls
    )
    ON CONFLICT (id) DO UPDATE SET
      title = EXCLUDED.title,
      location = EXCLUDED.location,
      description = EXCLUDED.description,
      price = EXCLUDED.price,
      surface_area = EXCLUDED.surface_area,
      annual_revenue = EXCLUDED.annual_revenue,
      is_active = EXCLUDED.is_active,
      updated_at = EXCLUDED.updated_at,
      images_urls = EXCLUDED.images_urls;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    DELETE FROM public.pharmacy_listings_public WHERE id = OLD.id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$function$;

-- Create trigger on main pharmacy table
DROP TRIGGER IF EXISTS sync_pharmacy_public_trigger ON public.pharmacy_listings;
CREATE TRIGGER sync_pharmacy_public_trigger
  AFTER INSERT OR UPDATE OR DELETE ON public.pharmacy_listings
  FOR EACH ROW
  EXECUTE FUNCTION public.sync_pharmacy_listings_public();

-- 4. Remove public SELECT policies from main pharmacy_listings table
DROP POLICY IF EXISTS "Public can view pharmacy listings without contact info" ON public.pharmacy_listings;
DROP POLICY IF EXISTS "Authenticated users can view full pharmacy listings" ON public.pharmacy_listings;

-- Only allow authenticated users to see full listings with restrictions
CREATE POLICY "Authenticated users can view pharmacy listings"
ON public.pharmacy_listings
FOR SELECT
USING (is_active = true AND auth.uid() IS NOT NULL);

-- 5. Tighten RLS on user_points table - remove user mutations
DROP POLICY IF EXISTS "Users can insert own points" ON public.user_points;
DROP POLICY IF EXISTS "Users can update own points" ON public.user_points;

-- Only allow viewing own points and admin management
CREATE POLICY "Users can view own points only"
ON public.user_points
FOR SELECT
USING (auth.uid() = user_id);

-- 6. Tighten RLS on user_challenge_progress - remove direct user mutations
DROP POLICY IF EXISTS "Users can insert own challenge progress" ON public.user_challenge_progress;
DROP POLICY IF EXISTS "Users can update own challenge progress" ON public.user_challenge_progress;
DROP POLICY IF EXISTS "System can update user challenge progress" ON public.user_challenge_progress;
DROP POLICY IF EXISTS "Users can manage own progress" ON public.user_challenge_progress;

-- Only allow viewing own progress
CREATE POLICY "Users can view own challenge progress only"
ON public.user_challenge_progress
FOR SELECT
USING (auth.uid() = user_id);

-- Admin can manage all challenge progress
CREATE POLICY "Admins can manage all challenge progress"
ON public.user_challenge_progress
FOR ALL
USING (is_current_user_admin())
WITH CHECK (is_current_user_admin());

-- 7. Create secure function for updating challenge progress
CREATE OR REPLACE FUNCTION public.update_challenge_progress(
  challenge_id_param uuid,
  points_earned_param integer DEFAULT 0
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  user_id_val uuid := auth.uid();
BEGIN
  -- Check if user is authenticated
  IF user_id_val IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;

  -- Update or insert challenge progress
  INSERT INTO public.user_challenge_progress (
    user_id, challenge_id, current_count, points_earned, completed_at
  )
  VALUES (
    user_id_val, challenge_id_param, 1, points_earned_param, now()
  )
  ON CONFLICT (user_id, challenge_id) DO UPDATE SET
    current_count = user_challenge_progress.current_count + 1,
    points_earned = user_challenge_progress.points_earned + points_earned_param,
    completed_at = CASE 
      WHEN user_challenge_progress.completed_at IS NULL THEN now()
      ELSE user_challenge_progress.completed_at
    END;

  -- Sync user points
  PERFORM public.add_user_points(user_id_val, points_earned_param);
END;
$function$;

-- 8. Fix promotions policy - only admins can insert
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON public.promotions;

CREATE POLICY "Only admins can create promotions"
ON public.promotions
FOR INSERT
WITH CHECK (is_current_user_admin());

-- 9. Sync existing pharmacy data to public table
INSERT INTO public.pharmacy_listings_public (
  id, title, location, description, price, surface_area,
  annual_revenue, is_active, created_at, updated_at, images_urls
)
SELECT 
  id, title, location, description, price, surface_area,
  annual_revenue, is_active, created_at, updated_at, images_urls
FROM public.pharmacy_listings
WHERE is_active = true
ON CONFLICT (id) DO NOTHING;