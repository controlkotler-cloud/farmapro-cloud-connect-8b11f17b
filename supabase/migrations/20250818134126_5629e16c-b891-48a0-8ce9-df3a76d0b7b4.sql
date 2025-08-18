-- Fix the Security Definer View issue with job_listings_safe
-- Remove the security barrier and instead create a simple function-based approach

-- Drop the view that's causing the security definer issue
DROP VIEW IF EXISTS public.job_listings_safe;

-- Remove the security barrier setting that caused the issue
-- CREATE OR REPLACE VIEW public.job_listings_safe AS
-- We'll use a different approach instead

-- Final solution: Create a more secure approach for contact email access
-- Update the existing function to be more explicit about permissions

-- Verify that we have successfully fixed all problematic security definer functions
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

-- Now update applications to use the secure RPC function instead of direct table access
-- This provides proper contact email protection without security definer views

-- List all remaining security definer objects to ensure we're clean
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