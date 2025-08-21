
-- 1) Política RLS: día de expiración inclusivo en job_listings_public
ALTER TABLE public.job_listings_public ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public can view active job listings without contact info" ON public.job_listings_public;

CREATE POLICY "Public can view active job listings without contact info"
  ON public.job_listings_public
  FOR SELECT
  USING (
    is_active = true
    AND (expires_at IS NULL OR expires_at::date >= current_date)
  );

-- 2) Trigger para normalizar expires_at a fin de día en job_listings
CREATE OR REPLACE FUNCTION public.normalize_job_expires_at()
RETURNS trigger
LANGUAGE plpgsql
AS $function$
BEGIN
  -- Si no hay expiración, no tocamos nada (permite ofertas sin fecha fin)
  IF NEW.expires_at IS NULL THEN
    RETURN NEW;
  END IF;

  -- Normalizar a fin de día: 23:59:59 del día indicado
  NEW.expires_at := date_trunc('day', NEW.expires_at) + interval '1 day' - interval '1 second';
  RETURN NEW;
END;
$function$;

DROP TRIGGER IF EXISTS set_job_expires_end_of_day ON public.job_listings;

CREATE TRIGGER set_job_expires_end_of_day
BEFORE INSERT OR UPDATE ON public.job_listings
FOR EACH ROW
EXECUTE FUNCTION public.normalize_job_expires_at();

-- 3) Backfill: poner fin de día a registros existentes que estén a medianoche
UPDATE public.job_listings
SET expires_at = date_trunc('day', expires_at) + interval '1 day' - interval '1 second',
    updated_at = now()
WHERE expires_at IS NOT NULL
  AND (expires_at::time = '00:00:00'::time);
