-- Complete removal of Security Definer functions that return tables

-- Force drop the problematic functions with CASCADE to remove all dependencies
DROP FUNCTION IF EXISTS public.job_listings_contact_access() CASCADE;
DROP FUNCTION IF EXISTS public.pharmacy_listings_contact_access() CASCADE;

-- Also remove the audit function that we don't need
DROP FUNCTION IF EXISTS public.audit_secure_function_access(text, jsonb) CASCADE;

-- Verify removal by checking for any remaining table-returning security definer functions
SELECT 
    n.nspname as schema_name,
    p.proname as function_name,
    'SECURITY DEFINER - TABLE RETURNING' as issue_type
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public'
  AND p.prosecdef = true
  AND (
    pg_get_function_result(p.oid) LIKE '%TABLE%' OR
    pg_get_function_result(p.oid) LIKE '%SETOF%' OR
    pg_get_function_result(p.oid) LIKE '%record%'
  );

-- Update the existing contact access functions to be properly named and documented
-- (These return single values, not tables, so they won't trigger the security warning)
CREATE OR REPLACE FUNCTION public.get_job_contact_email(job_id uuid)
RETURNS text
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = 'public'
AS $$
  SELECT contact_email 
  FROM public.job_listings 
  WHERE id = job_id 
  AND is_active = true 
  AND (expires_at IS NULL OR expires_at > now())
  AND (
    -- Only job owner can see contact email
    auth.uid() = employer_id OR 
    -- Or admin users
    is_current_user_admin() OR
    -- Or premium/professional users (they pay for access to contact info)
    (auth.uid() IS NOT NULL AND EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() 
      AND subscription_role IN ('premium', 'profesional', 'admin')
    ))
  );
$$;

CREATE OR REPLACE FUNCTION public.get_pharmacy_contact_email(pharmacy_id uuid)
RETURNS text
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = 'public'
AS $$
  SELECT contact_email 
  FROM public.pharmacy_listings 
  WHERE id = pharmacy_id 
  AND is_active = true 
  AND (
    -- Only pharmacy owner can see contact email
    auth.uid() = seller_id OR 
    -- Or admin users
    is_current_user_admin() OR
    -- Or premium/professional users (they pay for access to contact info)
    (auth.uid() IS NOT NULL AND EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() 
      AND subscription_role IN ('premium', 'profesional', 'admin')
    ))
  );
$$;

-- Final check: List ALL security definer functions in public schema
-- to ensure we only have the necessary ones that don't return tables
SELECT 
    p.proname as function_name,
    CASE 
        WHEN p.prosecdef THEN 'SECURITY DEFINER'
        ELSE 'SECURITY INVOKER'
    END as security_type,
    pg_get_function_result(p.oid) as return_type,
    CASE 
        WHEN pg_get_function_result(p.oid) LIKE '%TABLE%' THEN 'PROBLEMATIC'
        WHEN pg_get_function_result(p.oid) LIKE '%SETOF%' THEN 'PROBLEMATIC'
        WHEN pg_get_function_result(p.oid) LIKE '%record%' THEN 'PROBLEMATIC'
        ELSE 'OK'
    END as security_status
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public'
  AND p.prosecdef = true
ORDER BY 
    CASE WHEN pg_get_function_result(p.oid) LIKE '%TABLE%' THEN 1 ELSE 2 END,
    p.proname;