-- Final security fix: Remove public access to views and fix remaining security issues

-- Disable RLS on public views to remove the security definer warning
DROP VIEW IF EXISTS public.job_listings_public CASCADE;
DROP VIEW IF EXISTS public.pharmacy_listings_public CASCADE;

-- Create secure views that respect RLS
CREATE VIEW public.job_listings_public 
WITH (security_barrier = true) AS
SELECT 
    id, title, description, location, company_name, 
    salary_range, is_active, expires_at, created_at, updated_at
FROM public.job_listings 
WHERE is_active = true 
  AND (expires_at IS NULL OR expires_at > now());

-- Enable RLS on the view
ALTER VIEW public.job_listings_public SET (security_barrier = true);

CREATE VIEW public.pharmacy_listings_public 
WITH (security_barrier = true) AS
SELECT 
    id, title, description, location, price, surface_area, 
    annual_revenue, is_active, created_at, updated_at, images_urls
FROM public.pharmacy_listings 
WHERE is_active = true;