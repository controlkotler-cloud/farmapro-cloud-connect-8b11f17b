-- Fix critical security issues by adding proper RLS policies

-- 1. Secure admin_users table - only admins can see admin users
ALTER TABLE public.admin_users ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Only admins can view admin users" 
ON public.admin_users 
FOR SELECT 
USING (public.is_current_user_admin());

CREATE POLICY "Only admins can manage admin users" 
ON public.admin_users 
FOR ALL 
USING (public.is_current_user_admin());

-- 2. Secure profiles table - users can only see their own profile, admins can see all
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

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

-- 3. Secure team_members table - only team owners and members can see team data
ALTER TABLE public.team_members ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Team owners can manage their team members" 
ON public.team_members 
FOR ALL 
USING (
  public.is_team_owner_strict(team_id, auth.uid()) OR 
  public.is_current_user_admin()
);

CREATE POLICY "Team members can view team info" 
ON public.team_members 
FOR SELECT 
USING (
  public.is_team_owner_strict(team_id, auth.uid()) OR 
  user_id = auth.uid() OR
  public.is_current_user_admin()
);

-- 4. Secure job_listings - remove public access, only authenticated users can see non-sensitive data
ALTER TABLE public.job_listings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view job listings" 
ON public.job_listings 
FOR SELECT 
USING (auth.uid() IS NOT NULL AND is_active = true);

CREATE POLICY "Employers can manage their job listings" 
ON public.job_listings 
FOR ALL 
USING (auth.uid() = employer_id OR public.is_current_user_admin());

-- 5. Secure pharmacy_listings - remove public access, only authenticated users can see non-sensitive data
ALTER TABLE public.pharmacy_listings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view pharmacy listings" 
ON public.pharmacy_listings 
FOR SELECT 
USING (auth.uid() IS NOT NULL AND is_active = true);

CREATE POLICY "Sellers can manage their pharmacy listings" 
ON public.pharmacy_listings 
FOR ALL 
USING (auth.uid() = seller_id OR public.is_current_user_admin());