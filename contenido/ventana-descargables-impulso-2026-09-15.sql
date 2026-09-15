-- Ventana abierta de los descargables de Impulso
-- ------------------------------------------------------------------
-- Decision de Francesc, 15-09-2026.
--
-- Impulso lleva desde N1 prometiendo descargables gratis, y desde que
-- existe el portal esa promesa se cumplia a medias: el fichero estatico
-- era publico (cualquiera con la URL lo bajaba, para siempre) pero la
-- pagina que lo anunciaba exigia cuenta, y una vez dentro consumia una
-- de las 3 descargas de por vida del plan Gratis.
--
-- El modelo nuevo: el descargable de la quincena vigente se baja SIN
-- cuenta hasta que sale la siguiente newsletter. A partir de ahi vive
-- solo dentro del portal. Y cuando alguien se da de alta para
-- conservarlo, ese descargable NO le gasta cupo: los de Impulso van
-- aparte del tope de 3.
--
-- Sin cron: la ventana se decide comparando open_until contra now() en
-- cada visita. Lo que no se ejecuta no se puede olvidar de ejecutar.
--
-- Idempotente: se puede correr dos veces sin romper nada.

BEGIN;

-- 1. Hasta cuando el recurso se descarga sin cuenta.
--    NULL = nunca estuvo abierto (comportamiento de siempre).
ALTER TABLE public.resources
  ADD COLUMN IF NOT EXISTS open_until timestamptz;

COMMENT ON COLUMN public.resources.open_until IS
  'Fin de la ventana publica: hasta esta fecha el recurso se descarga sin cuenta desde /descarga/<slug>. NULL = solo dentro del portal. Se compara contra now() en cada visita, no hay cron.';

-- 2. Marca de "esto salio en una newsletter de Impulso".
--    Exime del tope de 3 descargas del plan Gratis.
ALTER TABLE public.resources
  ADD COLUMN IF NOT EXISTS is_newsletter boolean NOT NULL DEFAULT false;

COMMENT ON COLUMN public.resources.is_newsletter IS
  'Descargable entregado con una newsletter Impulso. No consume el tope de 3 descargas del plan Gratis: se prometio gratis desde N1 y esa promesa manda.';

-- 3. De que numero viene, para poder auditar la serie y para el texto de
--    la pagina publica ("el descargable de la N28").
ALTER TABLE public.resources
  ADD COLUMN IF NOT EXISTS newsletter_ref text;

COMMENT ON COLUMN public.resources.newsletter_ref IS
  'Numero de la pieza editorial de origen: N28, C8... Solo informativo.';

-- 4. Indice para la pagina publica, que busca por slug entre los abiertos.
CREATE INDEX IF NOT EXISTS resources_open_window_idx
  ON public.resources (slug)
  WHERE open_until IS NOT NULL;

COMMIT;

-- ------------------------------------------------------------------
-- VERIFICACION (ejecutar y leer, no es parte de la migracion)
-- ------------------------------------------------------------------

-- Las tres columnas existen y con el tipo correcto:
SELECT column_name, data_type, column_default, is_nullable
FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'resources'
  AND column_name IN ('open_until', 'is_newsletter', 'newsletter_ref')
ORDER BY column_name;

-- Ningun recurso existente ha cambiado de comportamiento (todo a false/NULL):
SELECT count(*) AS total,
       count(*) FILTER (WHERE is_newsletter) AS marcados_newsletter,
       count(*) FILTER (WHERE open_until IS NOT NULL) AS con_ventana_abierta
FROM public.resources;

-- Recordatorio de la RLS vigente, que NO se toca: anon ya puede leer la
-- fila de un recurso publicado y no premium, que es justo lo que necesita
-- la pagina publica para pintar la ficha.
SELECT policyname, roles, cmd
FROM pg_policies
WHERE schemaname = 'public' AND tablename = 'resources'
ORDER BY policyname;
