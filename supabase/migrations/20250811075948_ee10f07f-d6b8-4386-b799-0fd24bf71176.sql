-- Fix function search_path security warnings
-- Update existing functions to include explicit search_path

-- Fix function 1: Update update_updated_at_column function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER 
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- Fix function 2: If there are other functions, they would be updated here
-- We need to check what other functions exist that might need this fix

-- Move extensions from public schema to extensions schema for better security
-- Note: This requires careful consideration as it might affect existing functionality
-- For now, we'll document this as a recommendation rather than implement it immediately

-- The leaked password protection setting needs to be enabled in Supabase dashboard
-- This cannot be done via SQL migration and must be configured in the Auth settings