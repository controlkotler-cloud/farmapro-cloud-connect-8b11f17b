-- Fix the trigger to allow admins to update user roles
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