-- Comunidad: distinguir usuarios semilla (perfiles inventados para arrancar el
-- foro) de usuarios reales, y dar a los reales control sobre si su nombre
-- aparece completo o solo con iniciales al publicar un hilo/comentario.
--
-- Contexto (conversación 13-07): hoy TODO el contenido del foro está firmado
-- por perfiles inventados; aún no hay clientes reales y el equipo tampoco ha
-- escrito nada. El backfill de este fichero marca is_seed=true a todos los
-- autores que ya existen en forum_threads/forum_replies. A partir de aquí,
-- cualquier perfil nuevo nace con is_seed=false (usuario real).
--
-- Regla de negocio: usuarios semilla -> SIEMPRE iniciales, sin excepción.
-- Usuarios reales -> completo por defecto, pueden elegir iniciales por
-- publicación (y esa elección se recuerda como su preferencia).
-- Idempotente: se puede volver a ejecutar sin duplicar nada.

-- 1. Columnas nuevas
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS is_seed boolean NOT NULL DEFAULT false;

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS name_display_preference text NOT NULL DEFAULT 'full';

ALTER TABLE public.profiles
  DROP CONSTRAINT IF EXISTS profiles_name_display_preference_check;
ALTER TABLE public.profiles
  ADD CONSTRAINT profiles_name_display_preference_check
  CHECK (name_display_preference IN ('full', 'initials'));

ALTER TABLE public.forum_threads
  ADD COLUMN IF NOT EXISTS name_display_choice text,
  ADD COLUMN IF NOT EXISTS author_display_name text;

ALTER TABLE public.forum_threads
  DROP CONSTRAINT IF EXISTS forum_threads_name_display_choice_check;
ALTER TABLE public.forum_threads
  ADD CONSTRAINT forum_threads_name_display_choice_check
  CHECK (name_display_choice IS NULL OR name_display_choice IN ('full', 'initials'));

ALTER TABLE public.forum_replies
  ADD COLUMN IF NOT EXISTS name_display_choice text,
  ADD COLUMN IF NOT EXISTS author_display_name text;

ALTER TABLE public.forum_replies
  DROP CONSTRAINT IF EXISTS forum_replies_name_display_choice_check;
ALTER TABLE public.forum_replies
  ADD CONSTRAINT forum_replies_name_display_choice_check
  CHECK (name_display_choice IS NULL OR name_display_choice IN ('full', 'initials'));

-- 2. Formato de iniciales: "E.M. Farmacia en Barcelona". Nunca expone el
-- nombre real ni el nombre concreto de la farmacia (que también podría
-- identificar a la persona en una ciudad pequeña), solo iniciales + ciudad.
CREATE OR REPLACE FUNCTION public.format_initials_label(full_name text, city text)
RETURNS text
LANGUAGE plpgsql
IMMUTABLE
AS $$
DECLARE
  parts text[];
  initials text;
BEGIN
  IF full_name IS NULL OR btrim(full_name) = '' THEN
    RETURN 'Usuario farmapro';
  END IF;

  parts := regexp_split_to_array(btrim(full_name), '\s+');
  IF array_length(parts, 1) = 1 THEN
    initials := upper(left(parts[1], 1)) || '.';
  ELSE
    initials := upper(left(parts[1], 1)) || '.' || upper(left(parts[array_length(parts, 1)], 1)) || '.';
  END IF;

  IF city IS NOT NULL AND btrim(city) <> '' THEN
    RETURN initials || ' Farmacia en ' || btrim(city);
  END IF;

  RETURN initials || ' Farmacia';
END;
$$;

-- 3. Trigger: calcula author_display_name en el servidor a partir del perfil
-- real (nunca confía en texto libre del cliente: solo puede llegar el enum
-- name_display_choice). Los perfiles semilla SIEMPRE muestran iniciales, sea
-- cual sea el name_display_choice que llegue en el insert/update.
CREATE OR REPLACE FUNCTION public.set_forum_author_display_name()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
  prof RECORD;
  effective_choice text;
BEGIN
  SELECT full_name, pharmacy_city, is_seed, name_display_preference
  INTO prof
  FROM public.profiles
  WHERE id = NEW.author_id;

  effective_choice := CASE
    WHEN prof.is_seed THEN 'initials'
    ELSE COALESCE(NEW.name_display_choice, prof.name_display_preference, 'full')
  END;

  IF effective_choice = 'initials' THEN
    NEW.author_display_name := public.format_initials_label(prof.full_name, prof.pharmacy_city);
  ELSE
    NEW.author_display_name := NULL; -- NULL = usar profiles.full_name en vivo (comportamiento actual)
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_forum_threads_display_name ON public.forum_threads;
CREATE TRIGGER trg_forum_threads_display_name
  BEFORE INSERT OR UPDATE OF name_display_choice ON public.forum_threads
  FOR EACH ROW EXECUTE FUNCTION public.set_forum_author_display_name();

DROP TRIGGER IF EXISTS trg_forum_replies_display_name ON public.forum_replies;
CREATE TRIGGER trg_forum_replies_display_name
  BEFORE INSERT OR UPDATE OF name_display_choice ON public.forum_replies
  FOR EACH ROW EXECUTE FUNCTION public.set_forum_author_display_name();

-- 4. Backfill: marcar como semilla a todos los perfiles que ya han escrito en
-- el foro (hoy, el 100%, confirmado por Francesc 13-07).
UPDATE public.profiles
SET is_seed = true
WHERE id IN (
  SELECT author_id FROM public.forum_threads
  UNION
  SELECT author_id FROM public.forum_replies
);

-- 5. Recalcular author_display_name en el contenido ya publicado por esos
-- perfiles semilla. Idempotente: solo toca filas cuyo autor sea is_seed.
UPDATE public.forum_threads t
SET author_display_name = public.format_initials_label(p.full_name, p.pharmacy_city)
FROM public.profiles p
WHERE p.id = t.author_id AND p.is_seed;

UPDATE public.forum_replies r
SET author_display_name = public.format_initials_label(p.full_name, p.pharmacy_city)
FROM public.profiles p
WHERE p.id = r.author_id AND p.is_seed;
