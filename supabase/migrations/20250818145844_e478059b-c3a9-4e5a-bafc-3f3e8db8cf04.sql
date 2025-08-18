-- Fix Critical: Profiles privilege escalation
-- Drop the existing trigger and function
DROP TRIGGER IF EXISTS block_unsafe_profile_updates_trigger ON public.profiles;
DROP FUNCTION IF EXISTS public.block_unsafe_profile_updates();

-- Create improved security function with better role checking
CREATE OR REPLACE FUNCTION public.block_unsafe_profile_updates()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Allow service role (system) updates
  IF auth.jwt() ->> 'role' = 'service_role' THEN
    RETURN NEW;
  END IF;
  
  -- Ensure user can only update their own profile
  IF auth.uid() != NEW.id THEN
    RAISE EXCEPTION 'Permission denied: Cannot modify other users profiles';
  END IF;
  
  -- For authenticated users, block changes to sensitive fields unless they're admin
  IF NOT is_current_user_admin() THEN
    IF OLD.subscription_role IS DISTINCT FROM NEW.subscription_role OR
       OLD.subscription_status IS DISTINCT FROM NEW.subscription_status OR
       OLD.stripe_customer_id IS DISTINCT FROM NEW.stripe_customer_id OR
       OLD.trial_ends_at IS DISTINCT FROM NEW.trial_ends_at THEN
      RAISE EXCEPTION 'Permission denied: Cannot modify sensitive profile attributes';
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Recreate the trigger
CREATE TRIGGER block_unsafe_profile_updates_trigger
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.block_unsafe_profile_updates();

-- Fix High: Premium access gating - Update contact email functions to check active subscription
CREATE OR REPLACE FUNCTION public.get_job_contact_email_rpc(job_id uuid)
RETURNS text
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT 
    CASE 
      WHEN auth.uid() IS NULL THEN NULL
      WHEN NOT EXISTS (
        SELECT 1 FROM job_listings 
        WHERE id = job_id 
        AND is_active = true 
        AND (expires_at IS NULL OR expires_at > now())
      ) THEN NULL
      WHEN EXISTS (
        SELECT 1 FROM job_listings 
        WHERE id = job_id 
        AND auth.uid() = employer_id
      ) THEN (SELECT contact_email FROM job_listings WHERE id = job_id)
      WHEN is_current_user_admin() THEN (SELECT contact_email FROM job_listings WHERE id = job_id)
      WHEN EXISTS (
        SELECT 1 FROM profiles 
        WHERE id = auth.uid() 
        AND subscription_role IN ('premium', 'profesional', 'admin')
        AND subscription_status = 'active'  -- Add active subscription check
      ) THEN (SELECT contact_email FROM job_listings WHERE id = job_id)
      ELSE NULL
    END;
$$;

CREATE OR REPLACE FUNCTION public.get_pharmacy_contact_email_secure(pharmacy_id_param uuid)
RETURNS text
LANGUAGE sql
STABLE
SET search_path TO 'public'
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
            AND subscription_status = 'active'  -- Add active subscription check
          )
        )
      ) THEN (
        SELECT contact_email FROM pharmacy_listings 
        WHERE id = pharmacy_id_param
      )
      ELSE NULL
    END;
$$;

-- Fix Medium: Add security logging for sensitive operations
CREATE OR REPLACE FUNCTION public.log_contact_email_access()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Log when someone accesses contact information
  IF TG_OP = 'SELECT' AND auth.uid() IS NOT NULL THEN
    PERFORM public.log_security_event(
      'content_access',
      jsonb_build_object(
        'action', 'CONTACT_EMAIL_ACCESS',
        'table', TG_TABLE_NAME,
        'user_id', auth.uid(),
        'target_record', COALESCE(NEW.id::text, OLD.id::text),
        'timestamp', now()
      ),
      auth.uid()
    );
  END IF;
  RETURN COALESCE(NEW, OLD);
END;
$$;