
-- Añadir campo slug a la tabla courses
ALTER TABLE public.courses ADD COLUMN slug text;

-- Crear índice único para el slug
CREATE UNIQUE INDEX courses_slug_unique ON public.courses(slug);

-- Generar slugs para los cursos existentes basados en sus títulos
UPDATE public.courses 
SET slug = LOWER(
  REGEXP_REPLACE(
    REGEXP_REPLACE(
      REGEXP_REPLACE(title, '[áàäâ]', 'a', 'g'),
      '[éèëê]', 'e', 'g'
    ),
    '[^a-z0-9\s-]', '', 'g'
  )
)
WHERE slug IS NULL;

-- Hacer que el slug sea obligatorio después de generar los valores
ALTER TABLE public.courses ALTER COLUMN slug SET NOT NULL;

-- Función para generar slug automáticamente en nuevos cursos
CREATE OR REPLACE FUNCTION generate_course_slug()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.slug IS NULL OR NEW.slug = '' THEN
    NEW.slug := LOWER(
      REGEXP_REPLACE(
        REGEXP_REPLACE(
          REGEXP_REPLACE(
            REGEXP_REPLACE(NEW.title, '[áàäâ]', 'a', 'g'),
            '[éèëê]', 'e', 'g'
          ),
          '[íìïî]', 'i', 'g'
        ),
        '[óòöô]', 'o', 'g'
      )
    );
    NEW.slug := REGEXP_REPLACE(
      REGEXP_REPLACE(NEW.slug, '[úùüû]', 'u', 'g'),
      '[^a-z0-9\s-]', '', 'g'
    );
    NEW.slug := REGEXP_REPLACE(NEW.slug, '\s+', '-', 'g');
    NEW.slug := TRIM(BOTH '-' FROM NEW.slug);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Crear trigger para generar slug automáticamente
CREATE TRIGGER generate_course_slug_trigger
  BEFORE INSERT OR UPDATE ON public.courses
  FOR EACH ROW
  EXECUTE FUNCTION generate_course_slug();
