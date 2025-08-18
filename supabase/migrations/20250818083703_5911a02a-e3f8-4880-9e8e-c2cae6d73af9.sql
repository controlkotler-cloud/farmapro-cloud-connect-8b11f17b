-- Fix Security Definer functions by recreating them without SECURITY DEFINER where not needed
-- Only keep SECURITY DEFINER for functions that truly need elevated privileges

-- Fix get_public_job_listings - remove SECURITY DEFINER (not needed for public view)
CREATE OR REPLACE FUNCTION public.get_public_job_listings()
RETURNS SETOF job_listings_public
LANGUAGE sql
STABLE
SET search_path TO 'public'
AS $$
  SELECT * FROM public.job_listings_public;
$$;

-- Fix get_public_job_listing - remove SECURITY DEFINER (not needed for public view)
CREATE OR REPLACE FUNCTION public.get_public_job_listing(_id uuid)
RETURNS job_listings_public
LANGUAGE sql
STABLE
SET search_path TO 'public'
AS $$
  SELECT * FROM public.job_listings_public WHERE id = _id;
$$;

-- Keep get_job_contact_email with SECURITY DEFINER as it needs to access protected contact_email field
-- This one is legitimately needed for security

-- Add comments explaining the security approach
COMMENT ON FUNCTION public.get_public_job_listings IS 'Public function to get job listings - no SECURITY DEFINER needed';
COMMENT ON FUNCTION public.get_public_job_listing IS 'Public function to get single job listing - no SECURITY DEFINER needed';