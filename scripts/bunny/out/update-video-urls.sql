-- Generado por generar-cambios.py. Comprobar antes con:
-- SELECT m->>'id', m->>'video_url' FROM courses c, jsonb_array_elements(c.course_modules) m WHERE m ? 'video_url';
BEGIN;
-- B-5: fp-pildora-farmacia-silenciosa-l1
UPDATE courses c SET course_modules = (
  SELECT jsonb_agg(CASE WHEN m->>'id' = 'fp-pildora-farmacia-silenciosa-l1' THEN jsonb_set(m, '{video_url}', to_jsonb('https://iframe.mediadelivery.net/embed/748005/7e5af7cf-5257-4e7e-a407-839f0d0556b2'::text)) ELSE m END ORDER BY ord)
  FROM jsonb_array_elements(c.course_modules) WITH ORDINALITY AS t(m, ord)
) WHERE c.course_modules @> '[{"id":"fp-pildora-farmacia-silenciosa-l1"}]'::jsonb;
-- B-6: fp-pildora-google-my-business-l1
UPDATE courses c SET course_modules = (
  SELECT jsonb_agg(CASE WHEN m->>'id' = 'fp-pildora-google-my-business-l1' THEN jsonb_set(m, '{video_url}', to_jsonb('https://iframe.mediadelivery.net/embed/748005/1b7c0b54-019e-4759-9a86-2097a349a6ea'::text)) ELSE m END ORDER BY ord)
  FROM jsonb_array_elements(c.course_modules) WITH ORDINALITY AS t(m, ord)
) WHERE c.course_modules @> '[{"id":"fp-pildora-google-my-business-l1"}]'::jsonb;
-- B-7: fp-pildora-stock-muerto-l1
UPDATE courses c SET course_modules = (
  SELECT jsonb_agg(CASE WHEN m->>'id' = 'fp-pildora-stock-muerto-l1' THEN jsonb_set(m, '{video_url}', to_jsonb('https://iframe.mediadelivery.net/embed/748005/c1367b18-adab-4c15-91ed-6e631ee2242d'::text)) ELSE m END ORDER BY ord)
  FROM jsonb_array_elements(c.course_modules) WITH ORDINALITY AS t(m, ord)
) WHERE c.course_modules @> '[{"id":"fp-pildora-stock-muerto-l1"}]'::jsonb;
-- B-8: fp-pildora-categorias-responsables-l1
UPDATE courses c SET course_modules = (
  SELECT jsonb_agg(CASE WHEN m->>'id' = 'fp-pildora-categorias-responsables-l1' THEN jsonb_set(m, '{video_url}', to_jsonb('https://iframe.mediadelivery.net/embed/748005/9ac74311-274d-48d9-b9c2-eddead2da4b8'::text)) ELSE m END ORDER BY ord)
  FROM jsonb_array_elements(c.course_modules) WITH ORDINALITY AS t(m, ord)
) WHERE c.course_modules @> '[{"id":"fp-pildora-categorias-responsables-l1"}]'::jsonb;
-- B-9: fp-pildora-rentabilidad-categorias-l1
UPDATE courses c SET course_modules = (
  SELECT jsonb_agg(CASE WHEN m->>'id' = 'fp-pildora-rentabilidad-categorias-l1' THEN jsonb_set(m, '{video_url}', to_jsonb('https://iframe.mediadelivery.net/embed/748005/5f2e0234-d665-43f7-bfff-9b6c8f2930e8'::text)) ELSE m END ORDER BY ord)
  FROM jsonb_array_elements(c.course_modules) WITH ORDINALITY AS t(m, ord)
) WHERE c.course_modules @> '[{"id":"fp-pildora-rentabilidad-categorias-l1"}]'::jsonb;
-- B-10: fp-pildora-corner-dermocosmetica-l1
UPDATE courses c SET course_modules = (
  SELECT jsonb_agg(CASE WHEN m->>'id' = 'fp-pildora-corner-dermocosmetica-l1' THEN jsonb_set(m, '{video_url}', to_jsonb('https://iframe.mediadelivery.net/embed/748005/60171c64-b2aa-4a2f-b97d-87c76f1e96cd'::text)) ELSE m END ORDER BY ord)
  FROM jsonb_array_elements(c.course_modules) WITH ORDINALITY AS t(m, ord)
) WHERE c.course_modules @> '[{"id":"fp-pildora-corner-dermocosmetica-l1"}]'::jsonb;
-- B-11: fp-pildora-cliente-que-no-vuelve-l1
UPDATE courses c SET course_modules = (
  SELECT jsonb_agg(CASE WHEN m->>'id' = 'fp-pildora-cliente-que-no-vuelve-l1' THEN jsonb_set(m, '{video_url}', to_jsonb('https://iframe.mediadelivery.net/embed/748005/c0e105a6-ca3c-4138-bffb-1b0672c284f4'::text)) ELSE m END ORDER BY ord)
  FROM jsonb_array_elements(c.course_modules) WITH ORDINALITY AS t(m, ord)
) WHERE c.course_modules @> '[{"id":"fp-pildora-cliente-que-no-vuelve-l1"}]'::jsonb;
-- B-12: fp-pildora-cinco-palancas-l1
UPDATE courses c SET course_modules = (
  SELECT jsonb_agg(CASE WHEN m->>'id' = 'fp-pildora-cinco-palancas-l1' THEN jsonb_set(m, '{video_url}', to_jsonb('https://iframe.mediadelivery.net/embed/748005/dc567334-beb5-45b3-ab6b-24192a5ffbb0'::text)) ELSE m END ORDER BY ord)
  FROM jsonb_array_elements(c.course_modules) WITH ORDINALITY AS t(m, ord)
) WHERE c.course_modules @> '[{"id":"fp-pildora-cinco-palancas-l1"}]'::jsonb;
COMMIT;
