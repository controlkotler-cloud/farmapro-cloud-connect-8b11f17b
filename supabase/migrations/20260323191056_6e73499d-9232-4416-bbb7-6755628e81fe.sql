
-- Add missing enum values
ALTER TYPE public.challenge_type ADD VALUE IF NOT EXISTS 'quiz_completed';
ALTER TYPE public.challenge_type ADD VALUE IF NOT EXISTS 'community_engagement';
