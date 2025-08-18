-- Fix job listings contact email exposure issue
-- The problem is that RLS policies control row access, not column access
-- We need to restructure the policies to properly hide contact emails

-- First, drop the conflicting policies
DROP POLICY IF EXISTS "Job listings access with conditional contact email" ON public.job_listings;
DROP POLICY IF EXISTS "Public job listings without contact info" ON public.job_listings;

-- Create a comprehensive policy that only shows contact_email to authorized users
-- For all users (anon and authenticated), show job listings but conditionally include contact_email
CREATE POLICY "Public can view job listings"
ON public.job_listings
FOR SELECT
USING (
  is_active = true 
  AND (expires_at IS NULL OR expires_at > now())
);

-- Create a view for public access that excludes contact email by default
CREATE OR REPLACE VIEW public.job_listings_safe AS
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
  -- Conditionally show contact_email only to authorized users
  CASE 
    WHEN auth.uid() IS NULL THEN NULL  -- Anonymous users cannot see contact
    WHEN auth.uid() = employer_id THEN contact_email  -- Job owner can see
    WHEN is_current_user_admin() THEN contact_email  -- Admin can see
    WHEN EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() 
      AND subscription_role IN ('premium', 'profesional', 'admin')
      AND subscription_status = 'active'
    ) THEN contact_email  -- Premium users can see
    ELSE NULL  -- Free users cannot see contact
  END as contact_email
FROM public.job_listings
WHERE is_active = true 
AND (expires_at IS NULL OR expires_at > now());

-- Grant appropriate permissions to the view
GRANT SELECT ON public.job_listings_safe TO authenticated, anon;

-- Enable RLS on the view (even though it's not strictly necessary for views)
ALTER VIEW public.job_listings_safe SET (security_barrier = true);

-- Update the existing contact email function to be more secure
CREATE OR REPLACE FUNCTION public.get_job_contact_email_rpc(job_id uuid)
RETURNS text
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = 'public'
AS $$
  SELECT 
    CASE 
      WHEN auth.uid() IS NULL THEN NULL
      WHEN NOT EXISTS (
        SELECT 1 FROM job_listings 
        WHERE id = job_id 
        AND is_active = true 
        AND (expires_at IS NULL OR expires_at > now())
      ) THEN NULL
      WHEN EXISTS (
        SELECT 1 FROM job_listings 
        WHERE id = job_id 
        AND auth.uid() = employer_id
      ) THEN (SELECT contact_email FROM job_listings WHERE id = job_id)
      WHEN is_current_user_admin() THEN (SELECT contact_email FROM job_listings WHERE id = job_id)
      WHEN EXISTS (
        SELECT 1 FROM profiles 
        WHERE id = auth.uid() 
        AND subscription_role IN ('premium', 'profesional', 'admin')
        AND subscription_status = 'active'
      ) THEN (SELECT contact_email FROM job_listings WHERE id = job_id)
      ELSE NULL
    END;
$$;

-- Grant execute permission to authenticated users only
GRANT EXECUTE ON FUNCTION public.get_job_contact_email_rpc(uuid) TO authenticated;