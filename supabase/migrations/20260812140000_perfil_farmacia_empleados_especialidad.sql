-- Fase 1 de "perfil de farmacia" (decisión 12-08-2026): capturar en el
-- onboarding los 3 campos con valor claro tanto para personalizar contenido
-- como para conocer mejor a la audiencia (informes a patrocinadores,
-- segmentación comercial). La lógica de recomendación con estos datos queda
-- para fase 2; aquí solo se guarda el dato.
--
-- pharmacy_city YA EXISTE (columna sin usar desde antes) y se reutiliza para
-- la localización — no se toca aquí.

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS employees_count TEXT,
  ADD COLUMN IF NOT EXISTS specialty_areas TEXT[];

COMMENT ON COLUMN public.profiles.employees_count IS 'Rango de tamaño de equipo de la farmacia (ver EMPLOYEES_COUNT_OPTIONS en src/lib/pharmacyProfile.ts). Sin CHECK a nivel de BD, igual que position.';
COMMENT ON COLUMN public.profiles.specialty_areas IS 'Áreas de especialidad de la farmacia, multi-selección (ver SPECIALTY_OPTIONS en src/lib/pharmacyProfile.ts).';
