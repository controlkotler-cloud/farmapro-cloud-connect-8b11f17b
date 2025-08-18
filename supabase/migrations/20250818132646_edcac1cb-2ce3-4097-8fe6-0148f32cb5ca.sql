-- Comprehensive Security Fixes Migration

-- 1. Create trigger to block unsafe profile updates
CREATE OR REPLACE FUNCTION public.block_unsafe_profile_updates()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  -- Allow service role (system) updates
  IF auth.jwt() ->> 'role' = 'service_role' THEN
    RETURN NEW;
  END IF;
  
  -- Allow admin updates (admins can modify any user's subscription_role)
  IF is_current_user_admin() THEN
    RETURN NEW;
  END IF;
  
  -- For non-admin users, block changes to sensitive fields
  IF OLD.subscription_role IS DISTINCT FROM NEW.subscription_role OR
     OLD.subscription_status IS DISTINCT FROM NEW.subscription_status OR
     OLD.stripe_customer_id IS DISTINCT FROM NEW.stripe_customer_id OR
     OLD.trial_ends_at IS DISTINCT FROM NEW.trial_ends_at THEN
    RAISE EXCEPTION 'Permission denied: Cannot modify sensitive profile attributes';
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create the trigger
DROP TRIGGER IF EXISTS trigger_block_unsafe_profile_updates ON public.profiles;
CREATE TRIGGER trigger_block_unsafe_profile_updates
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.block_unsafe_profile_updates();

-- 2. Drop and recreate secure public listings
DROP VIEW IF EXISTS public.job_listings_public CASCADE;
DROP TABLE IF EXISTS public.pharmacy_listings_public CASCADE;

-- Create secure job_listings_public view (no sensitive data)
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

-- Create secure pharmacy_listings_public table (no sensitive data)
CREATE TABLE public.pharmacy_listings_public (
  id uuid PRIMARY KEY,
  title text NOT NULL,
  location text NOT NULL,
  description text NOT NULL,
  price numeric,
  surface_area integer,
  is_active boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  images_urls text[]
);

-- Enable RLS on pharmacy_listings_public
ALTER TABLE public.pharmacy_listings_public ENABLE ROW LEVEL SECURITY;

-- Create policy for public access to pharmacy listings
CREATE POLICY "Public can view active pharmacy listings"
ON public.pharmacy_listings_public
FOR SELECT
USING (is_active = true);

-- Create trigger to sync pharmacy_listings to pharmacy_listings_public (excluding annual_revenue)
CREATE OR REPLACE FUNCTION public.sync_pharmacy_listings_public()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  IF TG_OP = 'INSERT' OR TG_OP = 'UPDATE' THEN
    INSERT INTO public.pharmacy_listings_public (
      id, title, location, description, price, surface_area,
      is_active, created_at, updated_at, images_urls
    )
    VALUES (
      NEW.id, NEW.title, NEW.location, NEW.description, NEW.price,
      NEW.surface_area, NEW.is_active, NEW.created_at, NEW.updated_at, NEW.images_urls
    )
    ON CONFLICT (id) DO UPDATE SET
      title = EXCLUDED.title,
      location = EXCLUDED.location,
      description = EXCLUDED.description,
      price = EXCLUDED.price,
      surface_area = EXCLUDED.surface_area,
      is_active = EXCLUDED.is_active,
      updated_at = EXCLUDED.updated_at,
      images_urls = EXCLUDED.images_urls;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    DELETE FROM public.pharmacy_listings_public WHERE id = OLD.id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$;

-- Create the sync trigger
DROP TRIGGER IF EXISTS trigger_sync_pharmacy_listings_public ON public.pharmacy_listings;
CREATE TRIGGER trigger_sync_pharmacy_listings_public
  AFTER INSERT OR UPDATE OR DELETE ON public.pharmacy_listings
  FOR EACH ROW
  EXECUTE FUNCTION public.sync_pharmacy_listings_public();

-- 3. Add premium resource protection RLS policies
DROP POLICY IF EXISTS "Premium users can access premium resources" ON public.resources;
CREATE POLICY "Premium users can access premium resources"
ON public.resources
FOR SELECT
USING (
  (is_premium = false) OR 
  (is_premium = true AND auth.uid() IS NOT NULL AND EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() 
    AND subscription_role IN ('premium', 'profesional', 'admin')
  ))
);

-- 4. Improve team invitation validation function
CREATE OR REPLACE FUNCTION public.validate_team_invitation(team_id_param uuid, invitation_token_param text, user_email_param text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
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
    RAISE WARNING 'Invalid invitation: token % for email % in team %', invitation_token_param, user_email_param, team_id_param;
    RETURN FALSE;
  END IF;
  
  -- Check if invitation has expired
  IF invitation_record.expires_at < now() THEN
    RAISE WARNING 'Expired invitation: token % expired at %', invitation_token_param, invitation_record.expires_at;
    RETURN FALSE;
  END IF;
  
  -- Check if invitation is still pending
  IF invitation_record.status != 'pending' THEN
    RAISE WARNING 'Invalid invitation status: % for token %', invitation_record.status, invitation_token_param;
    RETURN FALSE;
  END IF;
  
  -- Get team details
  SELECT * INTO team_record
  FROM public.team_subscriptions
  WHERE id = team_id_param
  AND status = 'active';
  
  IF NOT FOUND THEN
    RAISE WARNING 'Team not found or inactive: %', team_id_param;
    RETURN FALSE;
  END IF;
  
  -- Check current member count vs max allowed
  SELECT COUNT(*) INTO current_member_count
  FROM public.team_members
  WHERE team_id = team_id_param
  AND status = 'active';
  
  IF current_member_count >= team_record.max_members THEN
    RAISE WARNING 'Team capacity exceeded: % active members, max %', current_member_count, team_record.max_members;
    RETURN FALSE;
  END IF;
  
  RETURN TRUE;
END;
$$;

-- 5. Add RLS policies requiring authentication for admin tables
DROP POLICY IF EXISTS "Public cannot access admin_users" ON public.admin_users;
DROP POLICY IF EXISTS "Public cannot access profiles" ON public.profiles;

-- Ensure all admin_users policies require authentication
DROP POLICY IF EXISTS "Only authenticated admins can view admin users" ON public.admin_users;
CREATE POLICY "Only authenticated admins can view admin users"
ON public.admin_users
FOR SELECT
TO authenticated
USING (is_current_user_admin());

DROP POLICY IF EXISTS "Only authenticated admins can manage admin users" ON public.admin_users;
CREATE POLICY "Only authenticated admins can manage admin users"
ON public.admin_users
FOR ALL
TO authenticated
USING (is_current_user_admin())
WITH CHECK (is_current_user_admin());

-- 6. Add security audit logging for admin actions
CREATE OR REPLACE FUNCTION public.log_admin_action()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  -- Log admin actions for auditing
  IF TG_OP = 'INSERT' THEN
    PERFORM public.log_security_event(
      'admin_action',
      jsonb_build_object(
        'action', 'INSERT',
        'table', TG_TABLE_NAME,
        'admin_user', auth.uid(),
        'new_data', to_jsonb(NEW)
      ),
      auth.uid()
    );
    RETURN NEW;
  ELSIF TG_OP = 'UPDATE' THEN
    PERFORM public.log_security_event(
      'admin_action',
      jsonb_build_object(
        'action', 'UPDATE',
        'table', TG_TABLE_NAME,
        'admin_user', auth.uid(),
        'old_data', to_jsonb(OLD),
        'new_data', to_jsonb(NEW)
      ),
      auth.uid()
    );
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    PERFORM public.log_security_event(
      'admin_action',
      jsonb_build_object(
        'action', 'DELETE',
        'table', TG_TABLE_NAME,
        'admin_user', auth.uid(),
        'deleted_data', to_jsonb(OLD)
      ),
      auth.uid()
    );
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$;

-- Add audit triggers to sensitive tables
DROP TRIGGER IF EXISTS trigger_audit_admin_users ON public.admin_users;
CREATE TRIGGER trigger_audit_admin_users
  AFTER INSERT OR UPDATE OR DELETE ON public.admin_users
  FOR EACH ROW
  EXECUTE FUNCTION public.log_admin_action();

DROP TRIGGER IF EXISTS trigger_audit_promotions ON public.promotions;
CREATE TRIGGER trigger_audit_promotions
  AFTER INSERT OR UPDATE OR DELETE ON public.promotions
  FOR EACH ROW
  EXECUTE FUNCTION public.log_admin_action();