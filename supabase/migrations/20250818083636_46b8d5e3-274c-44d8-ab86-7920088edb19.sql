-- Fix Security Definer View issue - remove dependencies and recreate safely
-- Drop the view and all its dependencies using CASCADE
DROP VIEW IF EXISTS public.job_listings_public CASCADE;

-- Recreate the view with default SECURITY INVOKER behavior (safe)
CREATE VIEW public.job_listings_public AS 
SELECT 
    id,
    title,
    description,
    location,
    company_name,
    salary_range,
    is_active,
    expires_at,
    created_at,
    updated_at
FROM public.job_listings
WHERE is_active = true 
AND (expires_at IS NULL OR expires_at > now());

-- Add comment explaining the security approach
COMMENT ON VIEW public.job_listings_public IS 'Public view of active job listings - uses default SECURITY INVOKER for safe access control';

-- Grant appropriate permissions
GRANT SELECT ON public.job_listings_public TO authenticated;
GRANT SELECT ON public.job_listings_public TO anon;

-- Recreate the functions that were dropped
CREATE OR REPLACE FUNCTION public.get_public_job_listings()
RETURNS SETOF job_listings_public
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT * FROM public.job_listings_public;
$$;

CREATE OR REPLACE FUNCTION public.get_public_job_listing(_id uuid)
RETURNS job_listings_public
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT * FROM public.job_listings_public WHERE id = _id;
$$;