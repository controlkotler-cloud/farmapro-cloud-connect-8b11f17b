-- =====================================================================
-- IAFarma marca · 14-08-2026 — EJECUTADA EN PRODUCCIÓN el 14-08-2026 vía
-- query_database (MCP Lovable). Registro en el repo.
--
--  1) Colores corporativos y logo de la farmacia en profiles: la paleta fija
--     manda sobre la variación automática y el logo se superpone (cliente)
--     de forma opcional en cada imagen generada.
--  2) Bucket público iafarma-logos: cada usuario sube su logo a su carpeta
--     ({user_id}/logo.png); lectura pública (es material público de la
--     farmacia: va en sus propias piezas de redes).
-- =====================================================================

ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS iafarma_brand_primary text;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS iafarma_brand_secondary text;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS iafarma_logo_url text;
GRANT SELECT (iafarma_brand_primary, iafarma_brand_secondary, iafarma_logo_url) ON public.profiles TO authenticated;
GRANT UPDATE (iafarma_brand_primary, iafarma_brand_secondary, iafarma_logo_url) ON public.profiles TO authenticated;

INSERT INTO storage.buckets (id, name, public)
VALUES ('iafarma-logos', 'iafarma-logos', true)
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "iafarma_logos_upload_own" ON storage.objects;
CREATE POLICY "iafarma_logos_upload_own" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'iafarma-logos' AND (storage.foldername(name))[1] = auth.uid()::text);

DROP POLICY IF EXISTS "iafarma_logos_update_own" ON storage.objects;
CREATE POLICY "iafarma_logos_update_own" ON storage.objects
  FOR UPDATE TO authenticated
  USING (bucket_id = 'iafarma-logos' AND (storage.foldername(name))[1] = auth.uid()::text)
  WITH CHECK (bucket_id = 'iafarma-logos' AND (storage.foldername(name))[1] = auth.uid()::text);

DROP POLICY IF EXISTS "iafarma_logos_select_own" ON storage.objects;
CREATE POLICY "iafarma_logos_select_own" ON storage.objects
  FOR SELECT TO authenticated
  USING (bucket_id = 'iafarma-logos');
