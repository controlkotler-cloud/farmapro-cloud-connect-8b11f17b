-- Security hardening migration

-- 1. Harden contact email access functions
DROP FUNCTION IF EXISTS public.get_job_contact_email(uuid);
DROP FUNCTION IF EXISTS public.get_pharmacy_contact_email(uuid);

-- Create more secure job contact email function
CREATE OR REPLACE FUNCTION public.get_job_contact_email(job_id uuid)
RETURNS text
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $function$
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
$function$;

-- Create more secure pharmacy contact email function
CREATE OR REPLACE FUNCTION public.get_pharmacy_contact_email(pharmacy_id uuid)
RETURNS text
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $function$
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
$function$;

-- 2. Secure team invitations with proper validation
-- Add missing columns to team_members if they don't exist
ALTER TABLE public.team_members 
ADD COLUMN IF NOT EXISTS expires_at timestamp with time zone DEFAULT (now() + interval '7 days'),
ADD COLUMN IF NOT EXISTS invited_email text;

-- Update existing records to have proper expiration
UPDATE public.team_members 
SET expires_at = created_at + interval '7 days'
WHERE expires_at IS NULL;

-- Create team invitation validation function
CREATE OR REPLACE FUNCTION public.validate_team_invitation(
  team_id_param uuid,
  invitation_token_param text,
  user_email_param text
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  invitation_record record;
  team_record record;
  current_member_count integer;
BEGIN
  -- Get invitation details
  SELECT * INTO invitation_record
  FROM public.team_members
  WHERE team_id = team_id_param
  AND invitation_token = invitation_token_param
  AND (invited_email = user_email_param OR email = user_email_param);
  
  -- Check if invitation exists and is valid
  IF NOT FOUND THEN
    RETURN FALSE;
  END IF;
  
  -- Check if invitation has expired
  IF invitation_record.expires_at < now() THEN
    RETURN FALSE;
  END IF;
  
  -- Check if invitation is still pending
  IF invitation_record.status != 'pending' THEN
    RETURN FALSE;
  END IF;
  
  -- Get team details
  SELECT * INTO team_record
  FROM public.team_subscriptions
  WHERE id = team_id_param
  AND status = 'active';
  
  IF NOT FOUND THEN
    RETURN FALSE;
  END IF;
  
  -- Check current member count vs max allowed
  SELECT COUNT(*) INTO current_member_count
  FROM public.team_members
  WHERE team_id = team_id_param
  AND status = 'active';
  
  IF current_member_count >= team_record.max_members THEN
    RETURN FALSE;
  END IF;
  
  RETURN TRUE;
END;
$function$;

-- 3. Add security logging for sensitive operations
INSERT INTO public.security_audit_log (event_type, user_id, details)
VALUES (
  'security_hardening',
  NULL,
  jsonb_build_object(
    'description', 'Applied security hardening migration',
    'changes', jsonb_build_array(
      'Restricted contact email access to owners, admins, and premium users',
      'Added team invitation validation with expiration',
      'Enhanced security logging'
    ),
    'timestamp', now()
  )
);

-- 4. Update RLS policies for stricter access control
-- Ensure profiles table is properly secured
DROP POLICY IF EXISTS "Public profiles are viewable" ON public.profiles;
CREATE POLICY "Users can view own profile and admins can view all"
ON public.profiles
FOR SELECT
USING (auth.uid() = id OR is_current_user_admin());

-- Ensure admin_users table is fully secured
DROP POLICY IF EXISTS "Public can view admin users" ON public.admin_users;

-- 5. Add function to check premium access for contact info
CREATE OR REPLACE FUNCTION public.can_access_contact_info()
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $function$
  SELECT auth.uid() IS NOT NULL AND (
    is_current_user_admin() OR
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() 
      AND subscription_role IN ('premium', 'profesional', 'admin')
    )
  );
$function$;