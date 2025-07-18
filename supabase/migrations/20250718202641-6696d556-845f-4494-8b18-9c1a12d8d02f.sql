-- Crear bucket de recursos si no existe
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('recursos', 'recursos', true, 10485760, ARRAY['application/pdf', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'])
ON CONFLICT (id) DO NOTHING;

-- Eliminar políticas existentes si existen
DROP POLICY IF EXISTS "Public Access" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload recursos" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can update recursos" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can delete recursos" ON storage.objects;

-- Crear políticas para el bucket recursos
CREATE POLICY "Public Access" ON storage.objects
FOR SELECT USING (bucket_id = 'recursos');

CREATE POLICY "Authenticated users can upload recursos" ON storage.objects
FOR INSERT WITH CHECK (bucket_id = 'recursos');

CREATE POLICY "Authenticated users can update recursos" ON storage.objects
FOR UPDATE USING (bucket_id = 'recursos');

CREATE POLICY "Authenticated users can delete recursos" ON storage.objects
FOR DELETE USING (bucket_id = 'recursos');