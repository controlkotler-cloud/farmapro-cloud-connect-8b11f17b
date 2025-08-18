-- Security fixes migration

-- 1. Create strict team ownership function
CREATE OR REPLACE FUNCTION public.is_team_owner_strict(team_id_param uuid, user_id_param uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.team_subscriptions 
    WHERE id = team_id_param 
    AND owner_id = user_id_param 
    AND status = 'active'
  );
$$;

-- 2. Create public pharmacy listings table (no sensitive data)
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

-- 3. Enable RLS on public pharmacy listings
ALTER TABLE public.pharmacy_listings_public ENABLE ROW LEVEL SECURITY;

-- 4. Create policy for public pharmacy listings
CREATE POLICY "Public can view active pharmacy listings" 
ON public.pharmacy_listings_public 
FOR SELECT 
USING (is_active = true);

-- 5. Create sync trigger function
CREATE OR REPLACE FUNCTION public.sync_pharmacy_listings_public()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
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
$$;

-- 6. Create trigger for pharmacy listings sync
DROP TRIGGER IF EXISTS sync_pharmacy_listings_public_trigger ON public.pharmacy_listings;
CREATE TRIGGER sync_pharmacy_listings_public_trigger
  AFTER INSERT OR UPDATE OR DELETE ON public.pharmacy_listings
  FOR EACH ROW EXECUTE FUNCTION public.sync_pharmacy_listings_public();

-- 7. Remove public SELECT policies from sensitive tables
DROP POLICY IF EXISTS "Public can view active pharmacy listings" ON public.pharmacy_listings;
DROP POLICY IF EXISTS "Authenticated users can view pharmacy listings" ON public.pharmacy_listings;

-- 8. Create restricted policy for pharmacy listings
CREATE POLICY "Authenticated users can view pharmacy listings" 
ON public.pharmacy_listings 
FOR SELECT 
USING ((is_active = true) AND (auth.uid() IS NOT NULL));

-- 9. Tighten RLS on user_points - remove public access
DROP POLICY IF EXISTS "Users can view own points" ON public.user_points;
CREATE POLICY "Users can view own points only" 
ON public.user_points 
FOR SELECT 
USING (auth.uid() = user_id);

-- 10. Tighten RLS on user_challenge_progress
DROP POLICY IF EXISTS "Users can view own challenge progress" ON public.user_challenge_progress;
DROP POLICY IF EXISTS "Users can view own progress" ON public.user_challenge_progress;
DROP POLICY IF EXISTS "Users can view their own challenge progress" ON public.user_challenge_progress;

CREATE POLICY "Users can view own challenge progress only" 
ON public.user_challenge_progress 
FOR SELECT 
USING (auth.uid() = user_id);

-- 11. Create secure challenge progress update function
CREATE OR REPLACE FUNCTION public.update_challenge_progress(challenge_id_param uuid, points_earned_param integer DEFAULT 0)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
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
$$;

-- 12. Restrict promotion creation to admins only
DROP POLICY IF EXISTS "Only admins can create promotions" ON public.promotions;
CREATE POLICY "Only admins can create promotions" 
ON public.promotions 
FOR INSERT 
WITH CHECK (is_current_user_admin());

-- 13. Populate existing pharmacy listings into public table
INSERT INTO public.pharmacy_listings_public (
  id, title, location, description, price, surface_area,
  annual_revenue, is_active, created_at, updated_at, images_urls
)
SELECT 
  id, title, location, description, price, surface_area,
  annual_revenue, is_active, created_at, updated_at, images_urls
FROM public.pharmacy_listings
ON CONFLICT (id) DO NOTHING;