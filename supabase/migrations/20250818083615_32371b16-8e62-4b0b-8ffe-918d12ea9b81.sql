-- Fix Security Definer View issue by recreating job_listings_public view safely
-- Drop the existing view
DROP VIEW IF EXISTS public.job_listings_public;

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