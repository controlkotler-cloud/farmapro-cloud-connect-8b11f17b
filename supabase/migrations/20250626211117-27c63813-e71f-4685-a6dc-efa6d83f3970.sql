
-- Corregir los warnings de "Function Search Path Mutable" agregando SET search_path

-- Actualizar función generate_course_slug
CREATE OR REPLACE FUNCTION public.generate_course_slug()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF NEW.slug IS NULL OR NEW.slug = '' THEN
    NEW.slug := LOWER(
      TRIM(
        REGEXP_REPLACE(
          REGEXP_REPLACE(
            REGEXP_REPLACE(
              REGEXP_REPLACE(
                REGEXP_REPLACE(
                  REGEXP_REPLACE(
                    REGEXP_REPLACE(
                      REGEXP_REPLACE(
                        REGEXP_REPLACE(
                          REGEXP_REPLACE(NEW.title, '[áàäâã]', 'a', 'g'),
                          '[éèëê]', 'e', 'g'
                        ),
                        '[íìïî]', 'i', 'g'
                      ),
                      '[óòöôõ]', 'o', 'g'
                    ),
                    '[úùüû]', 'u', 'g'
                  ),
                  '[ñ]', 'n', 'g'
                ),
                '[ç]', 'c', 'g'
              ),
              '\s+', '-', 'g'
            ),
            '[^a-z0-9-]', '', 'g'
          ),
          '-+', '-', 'g'
        ),
        '-'
      )
    );
    
    -- Asegurar que no esté vacío
    IF NEW.slug = '' THEN
      NEW.slug := 'curso-' || EXTRACT(EPOCH FROM NOW())::text;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Actualizar función can_access_user_data (ya tenía SET search_path pero lo reforzamos)
CREATE OR REPLACE FUNCTION public.can_access_user_data(target_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT auth.uid() = target_user_id OR public.is_current_user_admin();
$$;

-- Actualizar función is_current_user_admin (ya tenía SET search_path pero lo reforzamos)
CREATE OR REPLACE FUNCTION public.is_current_user_admin()
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() 
    AND subscription_role = 'admin'
  );
$$;

-- Configurar Auth OTP con tiempo de expiración más corto (3600 segundos = 1 hora)
-- Esto se hace a nivel de configuración de Supabase, pero podemos sugerir el cambio
-- El usuario debe ir a Auth > Settings > Email templates y configurar OTP expiry a 3600

-- Para Leaked Password Protection, se debe habilitar en Auth > Settings > Password Protection
-- Esto es una configuración a nivel de proyecto que debe habilitarse manualmente
