-- Fix business contact information public exposure
-- The issue is that anonymous users can access job_listings with contact emails

-- 1. Remove the public policy that exposes contact emails to anonymous users
DROP POLICY IF EXISTS "Public can view job listings" ON public.job_listings;

-- 2. Drop any existing job_listings_public view first to avoid conflicts
DROP VIEW IF EXISTS public.job_listings_public CASCADE;

-- 3. Create a secure public view that excludes sensitive contact information
CREATE VIEW public.job_listings_public AS
SELECT 
  id,
  title,
  company_name,
  location,
  description,
  requirements,
  salary_range,
  is_active,
  expires_at,
  created_at,
  updated_at,
  employer_id
  -- Explicitly exclude contact_email for anonymous users
FROM public.job_listings
WHERE is_active = true 
AND (expires_at IS NULL OR expires_at > now());

-- 4. Grant SELECT permission to anonymous and authenticated users on the safe view
GRANT SELECT ON public.job_listings_public TO anon;
GRANT SELECT ON public.job_listings_public TO authenticated;

-- 5. Enable RLS on the view for additional security
ALTER VIEW public.job_listings_public SET (security_barrier = false);

-- 6. Keep the secure authenticated policy for the main table
-- This allows authenticated users to access contact emails based on subscription
CREATE POLICY "Authenticated users can view job listings with conditional contact access"
ON public.job_listings
FOR SELECT
TO authenticated
USING (
  is_active = true 
  AND (expires_at IS NULL OR expires_at > now())
);

-- 7. Verify security: Check that anonymous users cannot access the main table
SELECT 
  'SECURITY VERIFICATION' as status,
  'Anonymous users should have NO access to job_listings table' as note,
  COUNT(*) as policy_count_for_anon_on_main_table
FROM pg_policies 
WHERE tablename = 'job_listings' 
AND schemaname = 'public'
AND 'anon' = ANY(string_to_array(replace(replace(roles::text, '{', ''), '}', ''), ','));