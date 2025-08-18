-- Final security fix: Remove public access from sensitive data

-- Drop the public views since they expose sensitive data
DROP VIEW IF EXISTS public.job_listings_public CASCADE;
DROP VIEW IF EXISTS public.pharmacy_listings_public CASCADE;

-- Remove any remaining public access to profiles by recreating policies
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;  
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can view own profile and admins can view all" ON public.profiles;
DROP POLICY IF EXISTS "Admins can manage all profiles" ON public.profiles;

CREATE POLICY "Users can view their own profile" 
ON public.profiles 
FOR SELECT 
USING (auth.uid() = id OR public.is_current_user_admin());

CREATE POLICY "Users can update their own profile" 
ON public.profiles 
FOR UPDATE 
USING (auth.uid() = id OR public.is_current_user_admin());

CREATE POLICY "Users can insert their own profile" 
ON public.profiles 
FOR INSERT 
WITH CHECK (auth.uid() = id);

CREATE POLICY "Admins can manage all profiles" 
ON public.profiles 
FOR ALL 
USING (public.is_current_user_admin());

-- Remove all public access from job_listings table
DROP POLICY IF EXISTS "Authenticated users can view job listings" ON public.job_listings;

CREATE POLICY "Authenticated users can view job listings" 
ON public.job_listings 
FOR SELECT 
USING (auth.uid() IS NOT NULL AND is_active = true);

-- Remove all public access from pharmacy_listings table  
DROP POLICY IF EXISTS "Authenticated users can view pharmacy listings" ON public.pharmacy_listings;

CREATE POLICY "Authenticated users can view pharmacy listings" 
ON public.pharmacy_listings 
FOR SELECT 
USING (auth.uid() IS NOT NULL AND is_active = true);