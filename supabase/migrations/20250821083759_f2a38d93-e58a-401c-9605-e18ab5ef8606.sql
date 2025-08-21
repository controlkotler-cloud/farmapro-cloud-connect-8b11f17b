
-- 1) Crear/actualizar el trigger de sincronización para ofertas de empleo

-- Eliminar el trigger si existiera (seguro al volver a crear)
DROP TRIGGER IF EXISTS sync_job_listings_public_trigger ON public.job_listings;

-- Crear el trigger que mantiene job_listings_public sincronizada
CREATE TRIGGER sync_job_listings_public_trigger
AFTER INSERT OR UPDATE OR DELETE ON public.job_listings
FOR EACH ROW EXECUTE FUNCTION public.sync_job_listings_public();

-- 2) Backfill: poblar la tabla pública con los datos actuales
INSERT INTO public.job_listings_public (
  id,
  title,
  company_name,
  location,
  description,
  requirements,
  salary_range,
  is_active,
  expires_at,
  created_at,
  updated_at,
  employer_id
)
SELECT
  jl.id,
  jl.title,
  jl.company_name,
  jl.location,
  jl.description,
  jl.requirements,
  jl.salary_range,
  jl.is_active,
  jl.expires_at,
  jl.created_at,
  jl.updated_at,
  jl.employer_id
FROM public.job_listings jl
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
  employer_id = EXCLUDED.employer_id;

-- 3) Limpieza: eliminar registros de la tabla pública que ya no existan en la tabla principal
DELETE FROM public.job_listings_public jlp
WHERE NOT EXISTS (
  SELECT 1 FROM public.job_listings jl WHERE jl.id = jlp.id
);
