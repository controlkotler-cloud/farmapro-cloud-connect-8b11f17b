
-- Add missing columns to job_listings
ALTER TABLE public.job_listings ADD COLUMN IF NOT EXISTS employer_id uuid;

-- Add missing columns to job_applications 
ALTER TABLE public.job_applications ADD COLUMN IF NOT EXISTS consent_given boolean DEFAULT false;
