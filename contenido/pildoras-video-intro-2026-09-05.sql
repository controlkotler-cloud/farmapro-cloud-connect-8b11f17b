-- =====================================================================
-- farmapro portal - INTROS EN VIDEO DE LAS 8 PILDORAS (tanda 1)
-- Escrito el 05-09-2026. Piezas 5 a 12 de la jornada de grabacion,
-- editadas por Laura y subidas a Drive el 04-09-2026.
-- =====================================================================
-- Que hace
--   Rellena la clave `video_url` del UNICO modulo del JSONB
--   courses.course_modules de cada pildora. Es la clave que ya lee
--   ModuleContent.tsx para montar <ModuleVideoSection>: si tiene valor,
--   aparece el reproductor; si esta vacia, no se renderiza nada.
--   NO toca contenido, ni is_published, ni is_premium, ni quizzes.
--
-- Mapeo (por numero y tema; los 8 ficheros contenido/pildora-0N-*.md
-- coinciden uno a uno con las piezas 5..12 del guion de grabacion)
--   pieza 5  pildora 01 farmacia silenciosa      -> fp-pildora-farmacia-silenciosa
--   pieza 6  pildora 02 ficha de Google          -> fp-pildora-google-my-business
--   pieza 7  pildora 03 stock muerto             -> fp-pildora-stock-muerto
--   pieza 8  pildora 04 categorias responsables  -> fp-pildora-categorias-responsables
--   pieza 9  pildora 05 rentabilidad categorias  -> fp-pildora-rentabilidad-categorias
--   pieza 10 pildora 06 corner dermocosmetica    -> fp-pildora-corner-dermocosmetica
--   pieza 11 pildora 07 cliente que no vuelve    -> fp-pildora-cliente-que-no-vuelve
--   pieza 12 pildora 08 cinco palancas           -> fp-pildora-cinco-palancas
--
-- Formato de URL: https://drive.google.com/file/d/<ID>/view
--   Es lo que resuelve src/lib/videoEmbed.ts a un iframe /preview.
--   Los 8 ficheros verificados accesibles sin sesion el 05-09-2026
--   (control negativo incluido). La CSP del Worker ya permite
--   frame-src drive.google.com (desplegada, verificada 05-09-2026).
--
-- Idempotente: re-ejecutable. Solo escribe si el valor cambia.
-- Para revertir: mismo UPDATE con '' en vez de la URL.
-- =====================================================================

BEGIN;

WITH mapeo(slug, video_id) AS (
  VALUES
    ('fp-pildora-farmacia-silenciosa',     '1TXWLHtyNEBVoxwm5bOik-AjLzBnKhO-s'),
    ('fp-pildora-google-my-business',      '1TV0HIxk7t9eDCuOFJIYHjmaMXedi_69X'),
    ('fp-pildora-stock-muerto',            '1J0YphjYviq1B6jV5h2F4ezHfQeldNdDJ'),
    ('fp-pildora-categorias-responsables', '1IP69w-2tNBWDKXZJ-6EE4NLNn9RTH4Nl'),
    ('fp-pildora-rentabilidad-categorias', '1KNaJnY6h0rRSQBbOtHT6RW3bD3M-PWne'),
    ('fp-pildora-corner-dermocosmetica',   '1YKRExlr95WftEQX23vxtnGvFS_5Y2w2J'),
    ('fp-pildora-cliente-que-no-vuelve',   '1X1LW-t_p9lFe36ZiSJw15BCzQxOTj5Ak'),
    ('fp-pildora-cinco-palancas',          '1szcBg47dew9b1LFEhFPaC5VH4venCo9B')
)
UPDATE public.courses c
SET course_modules = jsonb_set(
      c.course_modules, '{0,video_url}',
      to_jsonb('https://drive.google.com/file/d/' || m.video_id || '/view'), true
    ),
    updated_at = now()
FROM mapeo m
WHERE c.slug = m.slug
  AND jsonb_array_length(c.course_modules) = 1
  AND coalesce(c.course_modules->0->>'video_url','') <>
      'https://drive.google.com/file/d/' || m.video_id || '/view';

-- Comprobacion: deben salir 8 filas, todas con URL /view
SELECT slug, course_modules->0->>'video_url' AS video
FROM public.courses WHERE slug LIKE 'fp-pildora%' ORDER BY slug;

COMMIT;
