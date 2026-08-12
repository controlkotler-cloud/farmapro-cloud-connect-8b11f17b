-- =====================================================================
-- farmapro portal — Rellenar los 8 recursos que estaban SIN contenido
-- =====================================================================
-- Estos recursos ya existían en la BD con file_url vacío. Se han creado sus
-- descargables reales con la estética farmapro (en public/recursos/, servidos
-- en /recursos/...). Aquí solo se actualiza su file_url y formato por id.
-- Idempotente (UPDATE por id). Ejecutar en el SQL Editor del portal.
-- =====================================================================

UPDATE public.resources SET file_url='/recursos/res-google-business-profile-2026.pdf', format='pdf', is_published=true
 WHERE id='e08ab61a-983b-41f7-a741-1e1e6e108313';  -- Guía Google Business Profile 2026

UPDATE public.resources SET file_url='/recursos/res-pack-textos-redes-30-dias.pdf', format='pdf', is_published=true
 WHERE id='47fb754f-13fd-4e0a-b6a7-d5f8092ff69f';  -- Pack 30 días de textos para redes

UPDATE public.resources SET file_url='/recursos/res-checklist-autoinspeccion.pdf', format='pdf', is_published=true
 WHERE id='6721bf7b-dc33-4904-bca9-49064ce3b499';  -- Checklist de autoinspección

UPDATE public.resources SET file_url='/recursos/res-venta-cruzada-natural.pdf', format='pdf', is_published=true
 WHERE id='adf3652a-82ff-458a-9370-2e6e783a78ff';  -- Venta cruzada natural

UPDATE public.resources SET file_url='/recursos/res-protocolo-reclamaciones-lara.pdf', format='pdf', is_published=true
 WHERE id='dfbfb428-7742-4a05-88b6-51e2c7861a39';  -- Protocolo LARA de reclamaciones

UPDATE public.resources SET file_url='/recursos/res-whatsapp-business.pdf', format='pdf', is_published=true
 WHERE id='fe7d328c-3ec7-49e6-a70e-56d9469467d3';  -- WhatsApp Business para farmacias

UPDATE public.resources SET file_url='/recursos/res-plan-formacion-anual.xlsx', format='xls', is_published=true
 WHERE id='30635e11-1023-4532-9bc0-6e616765364c';  -- Plan de formación anual del equipo

UPDATE public.resources SET file_url='/recursos/res-cuadro-mando-financiero.xlsx', format='xls', is_published=true
 WHERE id='81091632-5566-4148-81a4-834c598dd4a2';  -- Cuadro de mando financiero mensual

-- Verificación (¿queda algún recurso sin contenido real?):
-- SELECT title, category, file_url FROM public.resources
--  WHERE file_url IS NULL OR file_url = '' OR file_url LIKE '%PENDIENTE%'
--  ORDER BY category, title;
