-- =====================================================
-- CRITICAL SECURITY FIX: Separate Admin Roles Table
-- =====================================================
-- This migration fixes the privilege escalation risk by moving
-- admin role checks from the profiles table to a dedicated
-- user_roles table with stricter access controls.

-- Step 1: Create enum for roles
CREATE TYPE public.app_role AS ENUM ('admin', 'moderator', 'user');

-- Step 2: Create user_roles table
CREATE TABLE public.user_roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    role app_role NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE (user_id, role)
);

-- Enable RLS on user_roles
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Step 3: Create security definer function to check roles
-- This prevents recursive RLS issues
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  );
$$;

-- Step 4: Update is_current_user_admin to use user_roles table
CREATE OR REPLACE FUNCTION public.is_current_user_admin()
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT public.has_role(auth.uid(), 'admin'::app_role);
$$;

-- Step 5: Migrate existing admin users from profiles to user_roles
INSERT INTO public.user_roles (user_id, role)
SELECT id, 'admin'::app_role
FROM public.profiles
WHERE subscription_role = 'admin'
ON CONFLICT (user_id, role) DO NOTHING;

-- Also migrate from admin_users table
INSERT INTO public.user_roles (user_id, role)
SELECT user_id, 'admin'::app_role
FROM public.admin_users
WHERE user_id IS NOT NULL
ON CONFLICT (user_id, role) DO NOTHING;

-- Step 6: RLS Policies for user_roles table
-- Only admins can view all roles
CREATE POLICY "Admins can view all user roles"
ON public.user_roles
FOR SELECT
USING (public.has_role(auth.uid(), 'admin'::app_role));

-- Users can view their own roles
CREATE POLICY "Users can view own roles"
ON public.user_roles
FOR SELECT
USING (auth.uid() = user_id);

-- Only admins can manage roles
CREATE POLICY "Only admins can insert roles"
ON public.user_roles
FOR INSERT
WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Only admins can update roles"
ON public.user_roles
FOR UPDATE
USING (public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Only admins can delete roles"
ON public.user_roles
FOR DELETE
USING (public.has_role(auth.uid(), 'admin'::app_role));

-- Step 7: Create trigger to keep user_roles updated
CREATE OR REPLACE FUNCTION public.sync_admin_role_to_user_roles()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.subscription_role = 'admin' THEN
    -- Add admin role if not exists
    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.id, 'admin'::app_role)
    ON CONFLICT (user_id, role) DO NOTHING;
  ELSE
    -- Remove admin role if user is no longer admin
    DELETE FROM public.user_roles
    WHERE user_id = NEW.id AND role = 'admin'::app_role;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER sync_admin_role_trigger
AFTER INSERT OR UPDATE OF subscription_role ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION public.sync_admin_role_to_user_roles();

-- Step 8: Update admin_users table sync
CREATE OR REPLACE FUNCTION public.sync_admin_users_to_user_roles()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'INSERT' OR TG_OP = 'UPDATE' THEN
    -- Add admin role
    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.user_id, 'admin'::app_role)
    ON CONFLICT (user_id, role) DO NOTHING;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    -- Remove admin role
    DELETE FROM public.user_roles
    WHERE user_id = OLD.user_id AND role = 'admin'::app_role;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$;

CREATE TRIGGER sync_admin_users_trigger
AFTER INSERT OR UPDATE OR DELETE ON public.admin_users
FOR EACH ROW
EXECUTE FUNCTION public.sync_admin_users_to_user_roles();

-- Step 9: Add helper function to grant/revoke roles
CREATE OR REPLACE FUNCTION public.grant_user_role(_user_id UUID, _role app_role)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Only admins can grant roles
  IF NOT public.has_role(auth.uid(), 'admin'::app_role) THEN
    RAISE EXCEPTION 'Permission denied: Only admins can grant roles';
  END IF;
  
  INSERT INTO public.user_roles (user_id, role)
  VALUES (_user_id, _role)
  ON CONFLICT (user_id, role) DO NOTHING;
  
  -- Log the action
  PERFORM public.log_security_event(
    'admin_action',
    jsonb_build_object(
      'action', 'grant_role',
      'admin_user_id', auth.uid(),
      'target_user_id', _user_id,
      'role', _role
    ),
    auth.uid()
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.revoke_user_role(_user_id UUID, _role app_role)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Only admins can revoke roles
  IF NOT public.has_role(auth.uid(), 'admin'::app_role) THEN
    RAISE EXCEPTION 'Permission denied: Only admins can revoke roles';
  END IF;
  
  DELETE FROM public.user_roles
  WHERE user_id = _user_id AND role = _role;
  
  -- Log the action
  PERFORM public.log_security_event(
    'admin_action',
    jsonb_build_object(
      'action', 'revoke_role',
      'admin_user_id', auth.uid(),
      'target_user_id', _user_id,
      'role', _role
    ),
    auth.uid()
  );
END;
$$;