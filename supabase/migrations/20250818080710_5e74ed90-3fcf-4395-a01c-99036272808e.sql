-- CRITICAL SECURITY FIXES

-- 1. Block privilege escalation via profiles table updates
-- Create function to block unsafe profile updates
CREATE OR REPLACE FUNCTION public.block_unsafe_profile_updates()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Allow service role (system) updates
  IF auth.jwt() ->> 'role' = 'service_role' THEN
    RETURN NEW;
  END IF;
  
  -- Allow admin updates
  IF is_current_user_admin() THEN
    RETURN NEW;
  END IF;
  
  -- Block changes to sensitive fields for regular users
  IF OLD.subscription_role IS DISTINCT FROM NEW.subscription_role OR
     OLD.subscription_status IS DISTINCT FROM NEW.subscription_status OR
     OLD.stripe_customer_id IS DISTINCT FROM NEW.stripe_customer_id OR
     OLD.trial_ends_at IS DISTINCT FROM NEW.trial_ends_at THEN
    RAISE EXCEPTION 'Permission denied: Cannot modify sensitive profile attributes';
  END IF;
  
  RETURN NEW;
END;
$$;

-- Add trigger to profiles table
DROP TRIGGER IF EXISTS block_unsafe_profile_updates_trigger ON public.profiles;
CREATE TRIGGER block_unsafe_profile_updates_trigger
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.block_unsafe_profile_updates();

-- 2. Harden SECURITY DEFINER functions with proper search_path
CREATE OR REPLACE FUNCTION public.is_team_subscription_owner(subscription_id uuid, user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT owner_id = user_id FROM public.team_subscriptions WHERE id = subscription_id;
$$;

CREATE OR REPLACE FUNCTION public.is_active_team_member_of_subscription(subscription_id uuid, user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.team_members 
    WHERE team_id = subscription_id 
    AND user_id = $2 
    AND status = 'active'
  );
$$;

CREATE OR REPLACE FUNCTION public.get_public_job_listings()
RETURNS SETOF job_listings_public
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT * FROM public.job_listings_public;
$$;

CREATE OR REPLACE FUNCTION public.get_public_job_listing(_id uuid)
RETURNS job_listings_public
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT * FROM public.job_listings_public WHERE id = _id;
$$;

-- 3. Create secure audit logging function
CREATE OR REPLACE FUNCTION public.log_security_event(
  event_type text,
  details jsonb,
  user_id_param uuid DEFAULT auth.uid()
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Only allow authenticated users or service role
  IF auth.uid() IS NULL AND auth.jwt() ->> 'role' != 'service_role' THEN
    RAISE EXCEPTION 'Authentication required for security logging';
  END IF;
  
  INSERT INTO public.security_audit_log (event_type, user_id, details, timestamp)
  VALUES (event_type, user_id_param, details, now());
END;
$$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION public.log_security_event TO authenticated;

-- 4. Optional: Create function to get job contact email for authenticated users
CREATE OR REPLACE FUNCTION public.get_job_contact_email(job_id uuid)
RETURNS text
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT contact_email 
  FROM public.job_listings 
  WHERE id = job_id 
  AND is_active = true 
  AND (expires_at IS NULL OR expires_at > now())
  AND (
    auth.uid() = employer_id OR 
    is_current_user_admin() OR
    auth.uid() IS NOT NULL  -- Any authenticated user can see contact info
  );
$$;

GRANT EXECUTE ON FUNCTION public.get_job_contact_email TO authenticated;