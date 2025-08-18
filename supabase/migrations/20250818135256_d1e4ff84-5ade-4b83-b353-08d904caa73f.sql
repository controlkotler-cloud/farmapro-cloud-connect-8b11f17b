-- Comprehensive fix for job listings security issues
-- Replace view with secure table and sync mechanism

-- 1. Drop existing view and recreate as table
DROP VIEW IF EXISTS public.job_listings_public CASCADE;

-- 2. Create job_listings_public as a secure table (no contact_email)
CREATE TABLE public.job_listings_public (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  company_name text NOT NULL,
  location text NOT NULL,
  description text NOT NULL,
  requirements text,
  salary_range text,
  is_active boolean DEFAULT true,
  expires_at timestamp with time zone,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  employer_id uuid
);

-- 3. Enable RLS on the new table
ALTER TABLE public.job_listings_public ENABLE ROW LEVEL SECURITY;

-- 4. Create explicit RLS policy for public access to active, non-expired jobs
CREATE POLICY "Public can view active job listings without contact info"
ON public.job_listings_public
FOR SELECT
USING (is_active = true AND (expires_at IS NULL OR expires_at > now()));

-- 5. Grant access to anonymous and authenticated users
GRANT SELECT ON public.job_listings_public TO anon;
GRANT SELECT ON public.job_listings_public TO authenticated;

-- 6. Create sync function to copy data from job_listings to job_listings_public
CREATE OR REPLACE FUNCTION public.sync_job_listings_public()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF TG_OP = 'INSERT' OR TG_OP = 'UPDATE' THEN
    INSERT INTO public.job_listings_public (
      id, title, company_name, location, description, requirements,
      salary_range, is_active, expires_at, created_at, updated_at, employer_id
    )
    VALUES (
      NEW.id, NEW.title, NEW.company_name, NEW.location, NEW.description,
      NEW.requirements, NEW.salary_range, NEW.is_active, NEW.expires_at,
      NEW.created_at, NEW.updated_at, NEW.employer_id
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
      updated_at = EXCLUDED.updated_at,
      employer_id = EXCLUDED.employer_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    DELETE FROM public.job_listings_public WHERE id = OLD.id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$;

-- 7. Create trigger to sync data automatically
CREATE TRIGGER sync_job_listings_public_trigger
  AFTER INSERT OR UPDATE OR DELETE ON public.job_listings
  FOR EACH ROW
  EXECUTE FUNCTION public.sync_job_listings_public();

-- 8. Initial sync of existing data
INSERT INTO public.job_listings_public (
  id, title, company_name, location, description, requirements,
  salary_range, is_active, expires_at, created_at, updated_at, employer_id
)
SELECT 
  id, title, company_name, location, description, requirements,
  salary_range, is_active, expires_at, created_at, updated_at, employer_id
FROM public.job_listings
ON CONFLICT (id) DO NOTHING;

-- 9. Remove any remaining public policies on the main job_listings table
DROP POLICY IF EXISTS "Public can view job listings" ON public.job_listings;
DROP POLICY IF EXISTS "Authenticated users can view job listings with conditional contact access" ON public.job_listings;