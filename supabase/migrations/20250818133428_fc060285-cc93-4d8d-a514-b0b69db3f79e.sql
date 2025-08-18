-- Fix remaining RLS policies to secure contact email access

-- Update job_listings policies to properly restrict contact email access
DROP POLICY IF EXISTS "Authenticated users can view job listings" ON public.job_listings;
CREATE POLICY "Users can view non-sensitive job data"
ON public.job_listings
FOR SELECT
TO authenticated
USING (true);

-- Create separate policy for contact email access (premium/admin only)
CREATE OR REPLACE FUNCTION public.job_listings_contact_access()
RETURNS TABLE (
  id uuid,
  title text,
  company_name text,
  location text,
  description text,
  requirements text,
  salary_range text,
  is_active boolean,
  expires_at timestamp with time zone,
  created_at timestamp with time zone,
  updated_at timestamp with time zone,
  contact_email text
)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = 'public'
AS $$
  SELECT 
    j.id,
    j.title,
    j.company_name,
    j.location,
    j.description,
    j.requirements,
    j.salary_range,
    j.is_active,
    j.expires_at,
    j.created_at,
    j.updated_at,
    CASE 
      WHEN auth.uid() = j.employer_id OR is_current_user_admin() OR EXISTS (
        SELECT 1 FROM profiles 
        WHERE id = auth.uid() 
        AND subscription_role IN ('premium', 'profesional', 'admin')
      ) THEN j.contact_email
      ELSE NULL
    END as contact_email
  FROM job_listings j
  WHERE j.is_active = true 
    AND (j.expires_at IS NULL OR j.expires_at > now());
$$;

-- Update pharmacy_listings policies to properly restrict contact email access  
DROP POLICY IF EXISTS "Authenticated users can view pharmacy listings" ON public.pharmacy_listings;
CREATE POLICY "Users can view non-sensitive pharmacy data"
ON public.pharmacy_listings
FOR SELECT
TO authenticated
USING (true);

-- Create separate function for pharmacy contact access (premium/admin only)
CREATE OR REPLACE FUNCTION public.pharmacy_listings_contact_access()
RETURNS TABLE (
  id uuid,
  title text,
  location text,
  description text,
  price numeric,
  surface_area integer,
  annual_revenue numeric,
  is_active boolean,
  created_at timestamp with time zone,
  updated_at timestamp with time zone,
  images_urls text[],
  contact_email text
)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = 'public'
AS $$
  SELECT 
    p.id,
    p.title,
    p.location,
    p.description,
    p.price,
    p.surface_area,
    p.annual_revenue,
    p.is_active,
    p.created_at,
    p.updated_at,
    p.images_urls,
    CASE 
      WHEN auth.uid() = p.seller_id OR is_current_user_admin() OR EXISTS (
        SELECT 1 FROM profiles 
        WHERE id = auth.uid() 
        AND subscription_role IN ('premium', 'profesional', 'admin')
      ) THEN p.contact_email
      ELSE NULL
    END as contact_email
  FROM pharmacy_listings p
  WHERE p.is_active = true;
$$;

-- Remove public access from contact email columns by updating the view
DROP VIEW IF EXISTS public.job_listings_public CASCADE;
CREATE VIEW public.job_listings_public AS
SELECT 
  id,
  title,
  description,
  location,
  company_name,
  salary_range,
  requirements,
  is_active,
  expires_at,
  created_at,
  updated_at
FROM public.job_listings
WHERE is_active = true 
  AND (expires_at IS NULL OR expires_at > now());

-- Grant access to the secure functions
GRANT EXECUTE ON FUNCTION public.job_listings_contact_access() TO authenticated;
GRANT EXECUTE ON FUNCTION public.pharmacy_listings_contact_access() TO authenticated;

-- Add additional security logging
CREATE OR REPLACE FUNCTION public.log_contact_access()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  -- Log contact email access attempts
  IF TG_OP = 'SELECT' AND auth.uid() IS NOT NULL THEN
    PERFORM public.log_security_event(
      'admin_action',
      jsonb_build_object(
        'action', 'CONTACT_ACCESS',
        'table', TG_TABLE_NAME,
        'user_id', auth.uid(),
        'accessed_record', NEW.id
      ),
      auth.uid()
    );
  END IF;
  RETURN NEW;
END;
$$;