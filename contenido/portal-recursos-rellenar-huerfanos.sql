-- =====================================================================
-- farmapro portal — Reapuntar los 10 recursos HUÉRFANOS
-- =====================================================================
-- Apuntaban a https://farmapro.es/recursos/... (carpeta del WordPress que ya
-- no existe -> enlaces muertos). Se han creado sus descargables reales con la
-- estética farmapro en public/recursos/ (servidos en /recursos/...).
-- Se actualiza cada uno por su URL ANTIGUA (única) -> sin riesgo de tocar otro.
-- Idempotente. Ejecutar en el SQL Editor del portal.
-- =====================================================================

UPDATE public.resources SET file_url='/recursos/res-100-ideas-contenido.pdf', format='pdf', is_published=true
 WHERE file_url='https://farmapro.es/recursos/03-100-ideas-contenido.pdf';

UPDATE public.resources SET file_url='/recursos/res-checklist-instagram.pdf', format='pdf', is_published=true
 WHERE file_url='https://farmapro.es/recursos/02-checklist-instagram.pdf';

UPDATE public.resources SET file_url='/recursos/res-que-no-publicar-redes.pdf', format='pdf', is_published=true
 WHERE file_url='https://farmapro.es/recursos/09-guia-que-no-publicar.pdf';

UPDATE public.resources SET file_url='/recursos/res-calculadora-rentabilidad-lineal.xlsx', format='xls', is_published=true
 WHERE file_url='https://farmapro.es/recursos/calc_rent_lineal.html';

UPDATE public.resources SET file_url='/recursos/res-calendario-editorial-2026.xlsx', format='xls', is_published=true
 WHERE file_url='https://farmapro.es/recursos/04-calendario-editorial-2026.xlsx';

UPDATE public.resources SET file_url='/recursos/res-guia-reuniones-equipo.pdf', format='pdf', is_published=true
 WHERE file_url='https://farmapro.es/recursos/05-guia-reuniones-equipo.pdf';

UPDATE public.resources SET file_url='/recursos/res-protocolo-atencion-cliente.pdf', format='pdf', is_published=true
 WHERE file_url='https://farmapro.es/recursos/01-protocolo-atencion-cliente.pdf';

UPDATE public.resources SET file_url='/recursos/res-calculadora-rentabilidad-servicios.xlsx', format='xls', is_published=true
 WHERE file_url='https://farmapro.es/recursos/06-calculadora-rentabilidad.xlsx';

UPDATE public.resources SET file_url='/recursos/res-checklist-rgpd-redes.pdf', format='pdf', is_published=true
 WHERE file_url='https://farmapro.es/recursos/08-checklist-rgpd-redes.pdf';

UPDATE public.resources SET file_url='/recursos/res-guia-seo-local.pdf', format='pdf', is_published=true
 WHERE file_url='https://farmapro.es/recursos/07-guia-seo-local.pdf';

-- Verificación final (debe devolver 0 filas):
-- SELECT title, category, file_url FROM public.resources
--  WHERE file_url IS NULL OR file_url = '' OR file_url LIKE '%PENDIENTE%' OR file_url LIKE 'http%farmapro.es%'
--  ORDER BY category, title;
