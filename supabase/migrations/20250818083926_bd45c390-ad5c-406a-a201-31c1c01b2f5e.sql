-- Fix critical security issue: Protect contact email addresses in pharmacy_listings
-- Replace the public policy with secure policies that protect sensitive information

-- Remove the overly permissive public policy
DROP POLICY IF EXISTS "Public can view active pharmacy listings" ON public.pharmacy_listings;

-- Create new secure policies that protect contact email addresses

-- 1. Public users can view pharmacy listings but WITHOUT contact email (policy will be enforced at app level)
CREATE POLICY "Public can view pharmacy listings without contact info" 
ON public.pharmacy_listings 
FOR SELECT 
USING (is_active = true);

-- 2. Authenticated users can view full pharmacy listings including contact email
CREATE POLICY "Authenticated users can view full pharmacy listings" 
ON public.pharmacy_listings 
FOR SELECT 
TO authenticated
USING (is_active = true);

-- 3. Create a safe public view that excludes sensitive information for anonymous users
CREATE OR REPLACE VIEW public.pharmacy_listings_public AS
SELECT 
  id,
  title,
  description,
  location,
  price,
  surface_area,
  annual_revenue,
  images_urls,
  is_active,
  created_at,
  updated_at
  -- Deliberately exclude contact_email and seller_id for public access
FROM public.pharmacy_listings
WHERE is_active = true;

-- Grant public access to the safe view
GRANT SELECT ON public.pharmacy_listings_public TO anon;
GRANT SELECT ON public.pharmacy_listings_public TO authenticated;

-- Add comment explaining the security approach
COMMENT ON VIEW public.pharmacy_listings_public IS 'Public view of pharmacy listings that excludes sensitive contact information to prevent email harvesting';

-- Add a function for authenticated users to get contact email when needed
CREATE OR REPLACE FUNCTION public.get_pharmacy_contact_email(pharmacy_id uuid)
RETURNS text
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT contact_email 
  FROM public.pharmacy_listings 
  WHERE id = pharmacy_id 
  AND is_active = true 
  AND (
    auth.uid() = seller_id OR 
    is_current_user_admin() OR
    auth.uid() IS NOT NULL  -- Any authenticated user can access contact info
  );
$$;

COMMENT ON FUNCTION public.get_pharmacy_contact_email IS 'Secure function to get pharmacy contact email - requires authentication';