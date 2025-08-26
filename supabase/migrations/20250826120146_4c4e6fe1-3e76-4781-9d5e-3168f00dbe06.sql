-- Add enum for team member roles
CREATE TYPE team_member_role AS ENUM ('premium', 'profesional');

-- Add member_role column to team_members table
ALTER TABLE public.team_members 
ADD COLUMN member_role team_member_role NOT NULL DEFAULT 'profesional';

-- Create new function for calculating team price with separate premium/professional counts
CREATE OR REPLACE FUNCTION public.calculate_team_price_v2(premium_count integer, professional_count integer)
RETURNS integer
LANGUAGE sql
STABLE
SET search_path TO 'public'
AS $function$
  SELECT (
    -- Premium members (39€ each) + Professional members (29€ each)
    (premium_count * 3900) + (professional_count * 2900)
  ) * 85 / 100; -- Apply 15% discount
$function$;