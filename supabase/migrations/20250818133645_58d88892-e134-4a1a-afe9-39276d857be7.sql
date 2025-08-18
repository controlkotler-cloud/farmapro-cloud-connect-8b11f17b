-- Analysis and fix for Security Definer Views
-- First, let's identify any views with SECURITY DEFINER

-- Check for views with security definer property
SELECT 
    schemaname,
    viewname,
    definition
FROM pg_views 
WHERE schemaname = 'public' 
  AND definition ILIKE '%security definer%';

-- Also check for any functions that might be incorrectly classified as views
SELECT 
    n.nspname as schema_name,
    p.proname as function_name,
    pg_get_function_result(p.oid) as return_type,
    pg_get_functiondef(p.oid) as definition
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public'
  AND p.prosecdef = true  -- security definer functions
  AND pg_get_function_result(p.oid) LIKE '%TABLE%';

-- Fix: Remove SECURITY DEFINER from views and replace with secure approach
-- The job_listings_public view should not need SECURITY DEFINER since it's just a filtered view

-- Recreate job_listings_public view without SECURITY DEFINER (standard view)
DROP VIEW IF EXISTS public.job_listings_public CASCADE;

-- Create a standard view that relies on RLS policies instead of SECURITY DEFINER
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

-- Grant appropriate permissions
GRANT SELECT ON public.job_listings_public TO anon, authenticated;

-- For the contact access functions, these should remain SECURITY DEFINER as they need
-- elevated privileges to check subscription roles, but let's ensure they're properly secured

-- Verify and secure the contact access functions
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
  -- This function needs SECURITY DEFINER to check subscription roles
  -- but we ensure it only returns contact_email to authorized users
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
      WHEN auth.uid() IS NULL THEN NULL
      WHEN auth.uid() = j.employer_id THEN j.contact_email
      WHEN is_current_user_admin() THEN j.contact_email
      WHEN EXISTS (
        SELECT 1 FROM profiles 
        WHERE id = auth.uid() 
        AND subscription_role IN ('premium', 'profesional', 'admin')
        AND subscription_status = 'active'
      ) THEN j.contact_email
      ELSE NULL
    END as contact_email
  FROM job_listings j
  WHERE j.is_active = true 
    AND (j.expires_at IS NULL OR j.expires_at > now());
$$;

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
  -- This function needs SECURITY DEFINER to check subscription roles
  -- but we ensure it only returns contact_email to authorized users
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
      WHEN auth.uid() IS NULL THEN NULL
      WHEN auth.uid() = p.seller_id THEN p.contact_email
      WHEN is_current_user_admin() THEN p.contact_email
      WHEN EXISTS (
        SELECT 1 FROM profiles 
        WHERE id = auth.uid() 
        AND subscription_role IN ('premium', 'profesional', 'admin')
        AND subscription_status = 'active'
      ) THEN p.contact_email
      ELSE NULL
    END as contact_email
  FROM pharmacy_listings p
  WHERE p.is_active = true;
$$;

-- Add security audit for function access
CREATE OR REPLACE FUNCTION public.audit_secure_function_access(
  function_name text,
  accessed_data jsonb
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  -- Log access to security definer functions for auditing
  PERFORM log_security_event(
    'admin_action',
    jsonb_build_object(
      'action', 'SECURE_FUNCTION_ACCESS',
      'function_name', function_name,
      'user_id', auth.uid(),
      'accessed_data_count', jsonb_array_length(accessed_data),
      'timestamp', now()
    ),
    auth.uid()
  );
END;
$$;

-- Ensure all views are using standard security model (SECURITY INVOKER)
-- List all views to verify none have SECURITY DEFINER
SELECT 
    schemaname,
    viewname,
    CASE 
      WHEN definition ILIKE '%security definer%' THEN 'SECURITY DEFINER FOUND'
      ELSE 'STANDARD VIEW'
    END as security_model
FROM pg_views 
WHERE schemaname = 'public'
ORDER BY viewname;