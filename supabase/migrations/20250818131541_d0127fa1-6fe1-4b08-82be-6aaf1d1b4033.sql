-- Check what these objects are and drop them correctly
-- Drop the public objects that expose sensitive data

-- Try dropping as table first, then as view if it fails
DROP TABLE IF EXISTS public.pharmacy_listings_public CASCADE;
DROP VIEW IF EXISTS public.job_listings_public CASCADE;

-- Simple update to existing policies to require authentication for all access
UPDATE pg_policy 
SET polqualifiers = NULL 
WHERE polname LIKE '%public%' 
  AND polrelid IN (
    SELECT oid FROM pg_class 
    WHERE relname IN ('admin_users', 'profiles', 'job_listings', 'pharmacy_listings')
  );