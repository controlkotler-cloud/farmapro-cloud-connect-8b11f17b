-- Mitigate email harvesting risk on job_listings
-- 1) Create a public-safe view without contact_email
CREATE OR REPLACE VIEW public.job_listings_public AS
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
WHERE is_active = true AND (expires_at IS NULL OR expires_at > now());

-- 2) Revoke public SELECT on job_listings by removing permissive public policies
DROP POLICY IF EXISTS "Public can view active job listings" ON public.job_listings;
DROP POLICY IF EXISTS "Public can view active jobs" ON public.job_listings;

-- 3) Allow authenticated users to view full job_listings (including contact_email) only when necessary
--    We'll scope it to authenticated users; owners and admins already covered.
CREATE POLICY "Authenticated users can view job listings"
ON public.job_listings
FOR SELECT
TO authenticated
USING (true);

-- 4) Allow everyone to query the safe view
ALTER VIEW public.job_listings_public OWNER TO postgres;
-- RLS does not apply to views, permissions are governed by policies on underlying table.
-- To safely expose the view, create a SECURITY DEFINER function wrapper to select from it.
CREATE OR REPLACE FUNCTION public.get_public_job_listings()
RETURNS SETOF public.job_listings_public
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO public
AS $$
  SELECT * FROM public.job_listings_public;
$$;

-- 5) Create a PostgREST exposed table-like function policy by granting execute to anon
GRANT EXECUTE ON FUNCTION public.get_public_job_listings TO anon, authenticated;

-- 6) Optional: function to get a single public job by id
CREATE OR REPLACE FUNCTION public.get_public_job_listing(_id uuid)
RETURNS public.job_listings_public
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO public
AS $$
  SELECT * FROM public.job_listings_public WHERE id = _id;
$$;
GRANT EXECUTE ON FUNCTION public.get_public_job_listing TO anon, authenticated;

-- Note: Frontend can call RPC get_public_job_listings / get_public_job_listing for public pages.
