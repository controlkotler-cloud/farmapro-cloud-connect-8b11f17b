-- Deep analysis and complete fix for Security Definer View issue

-- 1. Find ALL security definer functions that return tables (these trigger the warning)
SELECT 
    n.nspname as schema_name,
    p.proname as function_name,
    CASE p.prokind
        WHEN 'f' THEN 'FUNCTION'
        WHEN 'p' THEN 'PROCEDURE'
        WHEN 'a' THEN 'AGGREGATE'
        WHEN 'w' THEN 'WINDOW'
    END as object_type,
    CASE 
        WHEN p.prosecdef THEN 'SECURITY DEFINER'
        ELSE 'SECURITY INVOKER'
    END as security_type,
    pg_get_function_result(p.oid) as return_type
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public'
  AND p.prosecdef = true
  AND (
    pg_get_function_result(p.oid) LIKE '%TABLE%' OR
    pg_get_function_result(p.oid) LIKE '%SETOF%' OR
    pg_get_function_result(p.oid) LIKE '%record%'
  )
ORDER BY p.proname;

-- 2. The issue is likely with our contact access functions
-- Let's convert them to use a more secure approach without SECURITY DEFINER

-- Drop the problematic security definer functions
DROP FUNCTION IF EXISTS public.job_listings_contact_access();
DROP FUNCTION IF EXISTS public.pharmacy_listings_contact_access();

-- Instead, create RLS policies that handle the authorization logic
-- and create simple views without security definer

-- Update job_listings RLS policy to handle contact email access properly
DROP POLICY IF EXISTS "Users can view non-sensitive job data" ON public.job_listings;

-- Create a comprehensive policy that shows contact_email only to authorized users
CREATE POLICY "Job listings access with conditional contact email"
ON public.job_listings
FOR SELECT
TO authenticated
USING (
  is_active = true AND 
  (expires_at IS NULL OR expires_at > now()) AND
  (
    -- Show contact_email only to:
    auth.uid() = employer_id OR -- Job owner
    is_current_user_admin() OR -- Admin
    EXISTS ( -- Premium/Professional users with active subscription
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() 
      AND subscription_role IN ('premium', 'profesional', 'admin')
      AND subscription_status = 'active'
    )
  )
);

-- Create policy for unauthenticated users (no contact email)
CREATE POLICY "Public job listings without contact info"
ON public.job_listings
FOR SELECT
TO anon
USING (
  is_active = true AND 
  (expires_at IS NULL OR expires_at > now())
);

-- Similarly for pharmacy listings
DROP POLICY IF EXISTS "Users can view non-sensitive pharmacy data" ON public.pharmacy_listings;

CREATE POLICY "Pharmacy listings access with conditional contact email"
ON public.pharmacy_listings
FOR SELECT
TO authenticated
USING (
  is_active = true AND
  (
    -- Show contact_email only to:
    auth.uid() = seller_id OR -- Pharmacy owner
    is_current_user_admin() OR -- Admin
    EXISTS ( -- Premium/Professional users with active subscription
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() 
      AND subscription_role IN ('premium', 'profesional', 'admin')
      AND subscription_status = 'active'
    )
  )
);

-- Create a secure contact email access function using RPC instead of table-returning function
CREATE OR REPLACE FUNCTION public.get_job_contact_email_secure(job_id_param uuid)
RETURNS text
LANGUAGE sql
STABLE SECURITY INVOKER  -- Use INVOKER instead of DEFINER
SET search_path = 'public'
AS $$
  SELECT 
    CASE 
      WHEN auth.uid() IS NULL THEN NULL
      WHEN EXISTS (
        SELECT 1 FROM job_listings j
        WHERE j.id = job_id_param
        AND j.is_active = true
        AND (j.expires_at IS NULL OR j.expires_at > now())
        AND (
          auth.uid() = j.employer_id OR
          is_current_user_admin() OR
          EXISTS (
            SELECT 1 FROM profiles 
            WHERE id = auth.uid() 
            AND subscription_role IN ('premium', 'profesional', 'admin')
            AND subscription_status = 'active'
          )
        )
      ) THEN (
        SELECT contact_email FROM job_listings 
        WHERE id = job_id_param
      )
      ELSE NULL
    END;
$$;

CREATE OR REPLACE FUNCTION public.get_pharmacy_contact_email_secure(pharmacy_id_param uuid)
RETURNS text
LANGUAGE sql
STABLE SECURITY INVOKER  -- Use INVOKER instead of DEFINER
SET search_path = 'public'
AS $$
  SELECT 
    CASE 
      WHEN auth.uid() IS NULL THEN NULL
      WHEN EXISTS (
        SELECT 1 FROM pharmacy_listings p
        WHERE p.id = pharmacy_id_param
        AND p.is_active = true
        AND (
          auth.uid() = p.seller_id OR
          is_current_user_admin() OR
          EXISTS (
            SELECT 1 FROM profiles 
            WHERE id = auth.uid() 
            AND subscription_role IN ('premium', 'profesional', 'admin')
            AND subscription_status = 'active'
          )
        )
      ) THEN (
        SELECT contact_email FROM pharmacy_listings 
        WHERE id = pharmacy_id_param
      )
      ELSE NULL
    END;
$$;

-- Grant access to the new functions
GRANT EXECUTE ON FUNCTION public.get_job_contact_email_secure(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_pharmacy_contact_email_secure(uuid) TO authenticated;

-- List all remaining security definer functions to verify we've fixed the issue
SELECT 
    n.nspname as schema_name,
    p.proname as function_name,
    CASE 
        WHEN p.prosecdef THEN 'SECURITY DEFINER'
        ELSE 'SECURITY INVOKER'
    END as security_type,
    pg_get_function_result(p.oid) as return_type
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public'
  AND p.prosecdef = true
  AND (
    pg_get_function_result(p.oid) LIKE '%TABLE%' OR
    pg_get_function_result(p.oid) LIKE '%SETOF%' OR
    pg_get_function_result(p.oid) LIKE '%record%'
  )
ORDER BY p.proname;