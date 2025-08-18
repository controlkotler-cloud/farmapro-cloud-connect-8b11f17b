-- Fix Security Definer View issue by recreating job_listings_public view safely
-- Drop the existing view if it has security definer
DROP VIEW IF EXISTS public.job_listings_public;

-- Recreate the view without SECURITY DEFINER (using SECURITY INVOKER which is default)
CREATE VIEW public.job_listings_public 
SECURITY INVOKER  -- Explicitly set SECURITY INVOKER (this is the safe default)
AS 
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
COMMENT ON VIEW public.job_listings_public IS 'Public view of active job listings using SECURITY INVOKER for safe access control';

-- Grant appropriate permissions
GRANT SELECT ON public.job_listings_public TO authenticated;
GRANT SELECT ON public.job_listings_public TO anon;