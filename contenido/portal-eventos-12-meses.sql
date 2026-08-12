-- =====================================================================
-- farmapro portal — Programa de EVENTOS próximos 12 meses (jul 2026 – jun 2027)
-- =====================================================================
-- 16 eventos (webinars, workshops, un curso en directo, una conferencia y una feria),
-- enfoque NEGOCIO de farmacia (nada clínico), alineados con la temporada.
-- event_type ∈ {webinar, conferencia, workshop, feria, curso} (coincide con el filtro).
-- is_published=true; end_date en el futuro (requisito de useEvents).
-- registration_url queda NULL: añade el enlace de inscripción cuando lo tengas.
-- Idempotente: borra por título antes de insertar. Ejecutar en el SQL Editor del portal.
-- =====================================================================

DELETE FROM public.events WHERE title IN (
  'Prepara el verano: campaña de protección solar y dermo',
  'Escaparate de verano que para a la gente',
  'Vuelta al cole: campañas que funcionan en la farmacia',
  'Google Business Profile de tu farmacia, paso a paso',
  'Fidelización: que tus clientes vuelvan más a menudo',
  'Tendencias de gestión para la farmacia 2027',
  'Redes sociales sin morir en el intento',
  'Monta tu calendario de contenidos 2027',
  'Cierre de año: KPIs y rentabilidad de tu farmacia',
  'Plan de marketing anual de la farmacia',
  'Venta cruzada ética en el mostrador',
  'Encuentro farmapro del sector (presencial)',
  'Liderar tu equipo: del compañero al referente',
  'Campaña de alergias primaverales: prepárate con tiempo',
  'Servicio de cesación tabáquica: monta tu propuesta',
  'Prepara el verano 2027 y repaso del año'
);

INSERT INTO public.events
  (title, description, event_type, start_date, end_date, is_online, location, is_premium, is_published, is_featured)
VALUES
  ('Prepara el verano: campaña de protección solar y dermo',
   'Cómo montar la campaña de verano en tu farmacia: surtido, escaparate, formación exprés del equipo y medición. Sin promesas de salud.',
   'webinar','2026-07-09T17:00:00+02:00','2026-07-09T18:30:00+02:00',true,'Online',false,true,true),

  ('Escaparate de verano que para a la gente',
   'Taller práctico para diseñar un escaparate de temporada que llame la atención y se traduzca en visitas. Traer ideas de tu farmacia.',
   'workshop','2026-07-23T17:00:00+02:00','2026-07-23T18:30:00+02:00',true,'Online',false,true,false),

  ('Vuelta al cole: campañas que funcionan en la farmacia',
   'Ideas y calendario para la campaña de septiembre: categorías, comunicación y acciones en el mostrador.',
   'webinar','2026-09-10T17:00:00+02:00','2026-09-10T18:30:00+02:00',false,'Online',false,true,false),

  ('Google Business Profile de tu farmacia, paso a paso',
   'Curso en directo para crear y optimizar tu ficha de Google: horarios, fotos, reseñas y publicaciones. Acompañamiento práctico.',
   'curso','2026-09-24T17:00:00+02:00','2026-09-24T19:00:00+02:00',true,'Online',true,true,false),

  ('Fidelización: que tus clientes vuelvan más a menudo',
   'Estrategias de fidelización para farmacia de barrio: segmentación sencilla, campañas y recurrencia.',
   'webinar','2026-10-08T17:00:00+02:00','2026-10-08T18:30:00+02:00',false,'Online',false,true,false),

  ('Tendencias de gestión para la farmacia 2027',
   'Conferencia con visión de sector: hacia dónde va la gestión de la farmacia y cómo prepararse.',
   'conferencia','2026-10-22T17:00:00+02:00','2026-10-22T19:00:00+02:00',true,'Online',false,true,false),

  ('Redes sociales sin morir en el intento',
   'Marco realista para llevar las redes de la farmacia con poco tiempo: qué publicar, cuándo y cómo medir.',
   'webinar','2026-11-12T17:00:00+01:00','2026-11-12T18:30:00+01:00',false,'Online',false,true,false),

  ('Monta tu calendario de contenidos 2027',
   'Taller para dejar listo el calendario editorial del año: efemérides, temporadas y reparto de tareas del equipo.',
   'workshop','2026-11-26T17:00:00+01:00','2026-11-26T18:30:00+01:00',true,'Online',true,true,false),

  ('Cierre de año: KPIs y rentabilidad de tu farmacia',
   'Qué números mirar para cerrar el año y planificar el siguiente: márgenes, ticket medio y categorías.',
   'webinar','2026-12-10T17:00:00+01:00','2026-12-10T18:30:00+01:00',false,'Online',false,true,false),

  ('Plan de marketing anual de la farmacia',
   'Arranca el año con un plan de marketing claro: objetivos, campañas por trimestre y presupuesto. Plantillas incluidas.',
   'webinar','2027-01-14T17:00:00+01:00','2027-01-14T18:30:00+01:00',false,'Online',false,true,true),

  ('Venta cruzada ética en el mostrador',
   'Taller para entrenar la recomendación complementaria partiendo de la necesidad del cliente, sin presionar y respetando la deontología.',
   'workshop','2027-02-11T17:00:00+01:00','2027-02-11T18:30:00+01:00',true,'Online',false,true,false),

  ('Encuentro farmapro del sector (presencial)',
   'Jornada presencial para titulares y equipos: ponencias, casos reales y networking del sector farmacia.',
   'feria','2027-03-05T09:30:00+01:00','2027-03-05T18:00:00+01:00',false,'Madrid (sede por confirmar)',false,true,false),

  ('Liderar tu equipo: del compañero al referente',
   'Webinar de liderazgo para responsables de farmacia: comunicación, delegación y motivación del equipo.',
   'webinar','2027-03-18T17:00:00+01:00','2027-03-18T18:30:00+01:00',false,'Online',false,true,false),

  ('Campaña de alergias primaverales: prepárate con tiempo',
   'Cómo organizar la campaña de primavera en la farmacia: surtido, consejo de uso y comunicación, sin promesas de salud.',
   'webinar','2027-04-15T17:00:00+02:00','2027-04-15T18:30:00+02:00',false,'Online',false,true,false),

  ('Servicio de cesación tabáquica: monta tu propuesta',
   'Cómo estructurar y comunicar un servicio de ayuda para dejar de fumar en tu farmacia (enfoque de servicio y negocio).',
   'webinar','2027-05-13T17:00:00+02:00','2027-05-13T18:30:00+02:00',true,'Online',true,true,false),

  ('Prepara el verano 2027 y repaso del año',
   'Cerramos el ciclo: campaña de verano y repaso de lo aprendido durante el año en el portal.',
   'webinar','2027-06-10T17:00:00+02:00','2027-06-10T18:30:00+02:00',false,'Online',false,true,false);

-- Verificación:
-- SELECT title, event_type, start_date, is_premium FROM public.events
--  WHERE end_date >= now() ORDER BY is_featured DESC, start_date;
