-- =====================================================================
-- farmapro portal — corrección de contenido · 12-08-2026
-- APLICADO YA en producción (Cowork, vía MCP de Lovable). Se guarda como
-- registro de lo ejecutado y por si hay que reproducirlo o revertirlo.
--
-- Contexto: ninguno de los dos puntos era "contenido que falta". Los 34
-- cursos publicados tienen su contenido en el jsonb `courses.course_modules`
-- (la tabla `course_modules` es legado y está vacía para 13 de ellos), y los
-- 6 PDF de recursos ya estaban en `public/recursos/`. Solo faltaban los
-- metadatos que la UI lee.
-- =====================================================================


-- ---------------------------------------------------------------------
-- 1) total_lessons desincronizado (9 cursos, todos a 0)
--
-- En el jsonb cada módulo ES la unidad de contenido: sus claves son
-- {id, title, content, duration}; NO hay array `lessons` anidado. Por tanto
-- total_lessons = jsonb_array_length(course_modules). Esa igualdad ya se
-- cumplía en 25 de los 34 cursos; estos 9 se habían quedado a 0 y la tarjeta
-- del catálogo los mostraba como si no tuvieran nada.
-- ---------------------------------------------------------------------

update courses c
set total_lessons = jsonb_array_length(c.course_modules),
    updated_at    = now()
where c.course_modules is not null
  and jsonb_typeof(c.course_modules) = 'array'
  and c.total_lessons is distinct from jsonb_array_length(c.course_modules);

-- Filas afectadas: 9
--   atencion-farmaceutica-excelencia          0 -> 5
--   gestion-financiera-farmacia               0 -> 5
--   liderar-equipos-farmacia                  0 -> 5
--   gestion-stock-compras                     0 -> 4
--   verifactu-normativa-fiscal-farmacia-2026  0 -> 4
--   fidelizacion-experiencia-cliente          0 -> 4
--   rrhh-convenio-farmacia                    0 -> 4
--   farmacia-digital-presencia-online         0 -> 4
--   bienestar-equipo-burnout                  0 -> 4


-- ---------------------------------------------------------------------
-- 2) 6 recursos publicados con file_url vacío
--
-- Los PDF ya existían en public/recursos/ (van al build de Vite). Sin
-- file_url, Recursos.tsx hacía `a.href = ''`, el navegador se bajaba el
-- index.html de la SPA renombrado con el título del recurso, se registraba
-- la descarga y se restaba 1 de las 3 del plan Gratis.
--
-- El pack de textos tenía además format='docs' siendo un PDF: se normaliza.
-- ---------------------------------------------------------------------

update resources r
set file_url   = v.url,
    format     = 'pdf',
    updated_at = now()
from (values
  ('checklist-autoinspeccion-farmacia',           '/recursos/res-checklist-autoinspeccion.pdf'),
  ('guia-google-business-profile-farmacias-2026', '/recursos/res-google-business-profile-2026.pdf'),
  ('guia-venta-cruzada-farmacia',                 '/recursos/res-venta-cruzada-natural.pdf'),
  ('guia-whatsapp-business-farmacias',            '/recursos/res-whatsapp-business.pdf'),
  ('pack-textos-redes-30-dias-farmacia',          '/recursos/res-pack-textos-redes-30-dias.pdf'),
  ('protocolo-gestion-reclamaciones-lara',        '/recursos/res-protocolo-reclamaciones-lara.pdf')
) as v(slug, url)
where r.slug = v.slug
  and coalesce(trim(r.file_url), '') = '';

-- Filas afectadas: 6


-- ---------------------------------------------------------------------
-- VERIFICACIÓN (ejecutada tras aplicar: todo a 0 / 34 / 64)
-- ---------------------------------------------------------------------

select
  (select count(*) from courses
     where is_published
       and total_lessons is distinct from jsonb_array_length(course_modules)) as cursos_desincronizados,  -- 0
  (select count(*) from courses where is_published and total_lessons = 0)     as cursos_a_cero,           -- 0
  (select count(*) from resources
     where is_published and coalesce(trim(file_url), '') = '')                as recursos_sin_fichero,    -- 0
  (select count(*) from courses   where is_published)                         as cursos_publicados,       -- 34
  (select count(*) from resources where is_published)                         as recursos_publicados;     -- 64


-- ---------------------------------------------------------------------
-- REVERSIÓN (solo si hiciera falta deshacer)
-- ---------------------------------------------------------------------
-- update courses set total_lessons = 0
--  where slug in ('atencion-farmaceutica-excelencia','gestion-financiera-farmacia',
--                 'liderar-equipos-farmacia','gestion-stock-compras',
--                 'verifactu-normativa-fiscal-farmacia-2026','fidelizacion-experiencia-cliente',
--                 'rrhh-convenio-farmacia','farmacia-digital-presencia-online',
--                 'bienestar-equipo-burnout');
--
-- update resources set file_url = ''
--  where slug in ('checklist-autoinspeccion-farmacia','guia-google-business-profile-farmacias-2026',
--                 'guia-venta-cruzada-farmacia','guia-whatsapp-business-farmacias',
--                 'pack-textos-redes-30-dias-farmacia','protocolo-gestion-reclamaciones-lara');
-- update resources set format = 'docs' where slug = 'pack-textos-redes-30-dias-farmacia';


-- ---------------------------------------------------------------------
-- PENDIENTE RELACIONADO (no se toca aquí, sigue en el informe como C4b)
-- `quiz_attempts.total_questions` vale 0 en los 10 intentos existentes:
-- useQuiz.ts nunca escribe esa columna. Es un arreglo de código (Lovable),
-- no de datos.
-- ---------------------------------------------------------------------
