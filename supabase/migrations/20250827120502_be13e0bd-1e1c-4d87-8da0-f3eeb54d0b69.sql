-- Add job_type and province columns to job_listings
ALTER TABLE public.job_listings 
ADD COLUMN job_type TEXT DEFAULT 'otros' CHECK (job_type IN ('adjunto_farmaceutico', 'tecnico', 'auxiliar', 'otros')),
ADD COLUMN province TEXT;

-- Update job_listings_public to include new fields
ALTER TABLE public.job_listings_public
ADD COLUMN job_type TEXT DEFAULT 'otros',
ADD COLUMN province TEXT;

-- Create job_applications table
CREATE TABLE public.job_applications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  job_id UUID NOT NULL REFERENCES public.job_listings(id) ON DELETE CASCADE,
  applicant_id UUID NOT NULL,
  applicant_name TEXT NOT NULL,
  applicant_email TEXT NOT NULL,
  summary TEXT NOT NULL,
  resume_url TEXT,
  consent_given BOOLEAN NOT NULL DEFAULT FALSE,
  applied_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(job_id, applicant_id)
);

-- Enable RLS on job_applications
ALTER TABLE public.job_applications ENABLE ROW LEVEL SECURITY;

-- RLS policies for job_applications
CREATE POLICY "Users can view own applications" 
ON public.job_applications 
FOR SELECT 
USING (auth.uid() = applicant_id);

CREATE POLICY "Users can create own applications" 
ON public.job_applications 
FOR INSERT 
WITH CHECK (auth.uid() = applicant_id AND consent_given = true);

CREATE POLICY "Job owners can view applications for their jobs" 
ON public.job_applications 
FOR SELECT 
USING (EXISTS (
  SELECT 1 FROM public.job_listings 
  WHERE id = job_applications.job_id 
  AND employer_id = auth.uid()
));

CREATE POLICY "Admins can view all applications" 
ON public.job_applications 
FOR ALL 
USING (is_current_user_admin());

-- Create storage bucket for resumes
INSERT INTO storage.buckets (id, name, public) 
VALUES ('job-resumes', 'job-resumes', false);

-- RLS policies for resume storage
CREATE POLICY "Users can upload their own resumes" 
ON storage.objects 
FOR INSERT 
WITH CHECK (
  bucket_id = 'job-resumes' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can view their own resumes" 
ON storage.objects 
FOR SELECT 
USING (
  bucket_id = 'job-resumes' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Job employers can view applicant resumes" 
ON storage.objects 
FOR SELECT 
USING (
  bucket_id = 'job-resumes' 
  AND EXISTS (
    SELECT 1 FROM public.job_applications ja
    JOIN public.job_listings jl ON ja.job_id = jl.id
    WHERE jl.employer_id = auth.uid()
    AND ja.resume_url = storage.objects.name
  )
);

CREATE POLICY "Admins can view all resumes" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'job-resumes' AND is_current_user_admin());

-- Update trigger for job_listings_public sync
CREATE OR REPLACE FUNCTION public.sync_job_listings_public()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $function$
BEGIN
  IF TG_OP = 'INSERT' OR TG_OP = 'UPDATE' THEN
    INSERT INTO public.job_listings_public (
      id, title, company_name, location, description, requirements,
      salary_range, is_active, expires_at, created_at, updated_at, 
      employer_id, job_type, province
    )
    VALUES (
      NEW.id, NEW.title, NEW.company_name, NEW.location, NEW.description,
      NEW.requirements, NEW.salary_range, NEW.is_active, NEW.expires_at,
      NEW.created_at, NEW.updated_at, NEW.employer_id, NEW.job_type, NEW.province
    )
    ON CONFLICT (id) DO UPDATE SET
      title = EXCLUDED.title,
      company_name = EXCLUDED.company_name,
      location = EXCLUDED.location,
      description = EXCLUDED.description,
      requirements = EXCLUDED.requirements,
      salary_range = EXCLUDED.salary_range,
      is_active = EXCLUDED.is_active,
      expires_at = EXCLUDED.expires_at,
      updated_at = EXCLUDED.updated_at,
      employer_id = EXCLUDED.employer_id,
      job_type = EXCLUDED.job_type,
      province = EXCLUDED.province;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    DELETE FROM public.job_listings_public WHERE id = OLD.id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$function$;

-- RPC function to submit job application
CREATE OR REPLACE FUNCTION public.submit_job_application(
  job_id_param UUID,
  summary_param TEXT,
  resume_url_param TEXT DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $function$
DECLARE
  app_id UUID;
  user_profile profiles%ROWTYPE;
BEGIN
  -- Check authentication
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Debes iniciar sesión para aplicar';
  END IF;
  
  -- Validate input
  IF summary_param IS NULL OR length(trim(summary_param)) = 0 THEN
    RAISE EXCEPTION 'El resumen es obligatorio';
  END IF;
  
  -- Get user profile
  SELECT * INTO user_profile FROM profiles WHERE id = auth.uid();
  IF user_profile.id IS NULL THEN
    RAISE EXCEPTION 'Perfil de usuario no encontrado';
  END IF;
  
  -- Check if job exists and is active
  IF NOT EXISTS (
    SELECT 1 FROM job_listings 
    WHERE id = job_id_param 
    AND is_active = true 
    AND (expires_at IS NULL OR expires_at > now())
  ) THEN
    RAISE EXCEPTION 'La oferta no está activa o ha expirado';
  END IF;
  
  -- Check if user already applied
  IF EXISTS (
    SELECT 1 FROM job_applications 
    WHERE job_id = job_id_param AND applicant_id = auth.uid()
  ) THEN
    RAISE EXCEPTION 'Ya has aplicado a esta oferta';
  END IF;
  
  -- Insert application
  INSERT INTO job_applications (
    job_id, applicant_id, applicant_name, applicant_email,
    summary, resume_url, consent_given
  )
  VALUES (
    job_id_param, auth.uid(), user_profile.full_name, user_profile.email,
    trim(summary_param), resume_url_param, true
  )
  RETURNING id INTO app_id;
  
  RETURN app_id;
END;
$function$;