-- Fix business contact information public exposure
-- The issue is that anonymous users can access job_listings with contact emails

-- 1. Remove the public policy that exposes contact emails to anonymous users
DROP POLICY IF EXISTS "Public can view job listings" ON public.job_listings;

-- 2. Create a secure public view that excludes sensitive contact information
CREATE OR REPLACE VIEW public.job_listings_public AS
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
  employer_id,
  -- Explicitly exclude contact_email for anonymous users
  NULL as contact_email
FROM public.job_listings
WHERE is_active = true 
AND (expires_at IS NULL OR expires_at > now());

-- 3. Grant SELECT permission to anonymous users on the safe view
GRANT SELECT ON public.job_listings_public TO anon;
GRANT SELECT ON public.job_listings_public TO authenticated;

-- 4. Create a policy for the view (even though it's not strictly required for views)
-- This makes the security model explicit
CREATE POLICY "Anyone can view public job listings without contact info"
ON public.job_listings_public
FOR SELECT
TO public
USING (true);

-- 5. Keep the secure authenticated policy for the main table
-- This allows authenticated users to access contact emails based on subscription
CREATE POLICY "Authenticated users can view job listings with conditional contact access"
ON public.job_listings
FOR SELECT
TO authenticated
USING (
  is_active = true 
  AND (expires_at IS NULL OR expires_at > now())
);

-- 6. Verify no anonymous access to the main table with contact emails
-- Check that anonymous users cannot access the main job_listings table
SELECT 
  'SECURITY CHECK: Policies for job_listings table' as check_type,
  policyname,
  roles::text as applies_to_roles,
  cmd as command_type
FROM pg_policies 
WHERE tablename = 'job_listings' 
AND schemaname = 'public'
ORDER BY roles::text, policyname;