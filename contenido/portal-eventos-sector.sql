-- =====================================================================
-- farmapro portal — EVENTOS DEL SECTOR (reales) · investigados 2026-06-19
-- =====================================================================
-- Eventos del sector farmacia (España). Gratis para ver (no son nuestros).
-- event_type mapeado al filtro del portal {webinar, conferencia, workshop, feria}:
--   congresos/jornadas -> conferencia ; salones/ferias -> feria ; online -> webinar.
-- CONFIRMADOS llevan fecha oficial. TENTATIVOS llevan "(fecha por confirmar)" en el
-- título y una fecha estimada por patrón histórico: ACTUALÍZALA cuando se anuncie.
-- registration_url = web oficial. is_published=true, is_premium=false.
-- Idempotente: borra por título antes de insertar.
-- =====================================================================

DELETE FROM public.events WHERE title IN (
  '24º Congreso Nacional Farmacéutico',
  'Infarma Barcelona 2027',
  'Farmaforum 2026',
  '71º Congreso Nacional SEFH',
  'Orto Medical Care 2026',
  'Dermo&Figital 2027 (fecha por confirmar)',
  'Eventofarma 2027 (fecha por confirmar)',
  'Congreso SEFAC 2027 (fecha por confirmar)',
  'Jornadas SEFAC 2027 (fecha por confirmar)',
  'DermoCOFM 2026 (fecha por confirmar)',
  'Farmaweek 2027 (fecha por confirmar)'
);

INSERT INTO public.events
  (title, description, event_type, start_date, end_date, is_online, location, registration_url, is_premium, is_published, is_featured)
VALUES
  -- ---------- CONFIRMADOS (fecha oficial) ----------
  ('24º Congreso Nacional Farmacéutico',
   'Congreso oficial del Consejo General: regulación, servicios asistenciales, digitalización y futuro de la profesión. Imprescindible.',
   'conferencia','2026-09-30T09:00:00+02:00','2026-10-02T18:00:00+02:00',false,'Oviedo','https://congresonacional.farmaceuticos.com/',false,true,true),

  ('Infarma Barcelona 2027',
   'El gran salón de la farmacia española: laboratorios, distribución, software de gestión, OTC, parafarmacia y servicios. El evento estrella del sector.',
   'feria','2027-03-16T09:00:00+01:00','2027-03-18T19:00:00+01:00',false,'Barcelona (Fira Gran Via)','https://www.infarma.es/',false,true,true),

  ('Farmaforum 2026',
   'Feria y foros de la industria farmacéutica (calidad, fabricación, tecnología). Útil sobre todo si trabajáis con proveedores/formulación.',
   'feria','2026-09-22T09:00:00+02:00','2026-09-23T18:00:00+02:00',false,'Madrid (IFEMA)','https://farmaforum.es/',false,true,false),

  ('71º Congreso Nacional SEFH',
   'Congreso de farmacia hospitalaria. Relevante para colaboración hospital-farmacia y terapias avanzadas.',
   'conferencia','2026-10-21T09:00:00+02:00','2026-10-23T18:00:00+02:00',false,'Las Palmas de Gran Canaria','https://71congreso.sefh.es/',false,true,false),

  ('Orto Medical Care 2026',
   'Feria de ortopedia, ayudas técnicas y movilidad. De interés si trabajáis la categoría de ortopedia.',
   'feria','2026-11-25T09:00:00+01:00','2026-11-27T18:00:00+01:00',false,'Madrid (IFEMA)','https://ortomedicalcare.com/',false,true,false),

  -- ---------- TENTATIVOS (edición sin anunciar; fecha por confirmar) ----------
  ('Dermo&Figital 2027 (fecha por confirmar)',
   'Jornada de dermocosmética + marketing digital del mostrador (redes, IA). La más afín al perfil farmapro. Fecha estimada por patrón histórico.',
   'conferencia','2027-03-01T09:30:00+01:00','2027-03-01T18:00:00+01:00',false,'Por confirmar','https://dermofigital.es/',false,true,false),

  ('Eventofarma 2027 (fecha por confirmar)',
   'Congreso centrado en gestión y rentabilidad de la oficina de farmacia vía servicios e innovación. Alta relevancia para el titular. Fecha estimada.',
   'conferencia','2027-05-28T09:30:00+02:00','2027-05-28T18:00:00+02:00',false,'Madrid','https://www.eventofarma.com/',false,true,false),

  ('Congreso SEFAC 2027 (fecha por confirmar)',
   'Núcleo de la farmacia comunitaria: servicios profesionales y práctica asistencial. SEFAC pasó a formato anual. Fecha estimada.',
   'conferencia','2027-05-15T09:30:00+02:00','2027-05-15T18:00:00+02:00',false,'Por confirmar','https://congreso-sefac.org/',false,true,false),

  ('Jornadas SEFAC 2027 (fecha por confirmar)',
   'Formación práctica para el farmacéutico comunitario repartida por toda España (muy accesible por proximidad). Fecha estimada.',
   'workshop','2027-03-01T16:00:00+01:00','2027-03-01T20:00:00+01:00',false,'Varias ciudades','https://www.sefac.org/',false,true,false),

  ('DermoCOFM 2026 (fecha por confirmar)',
   'Jornada de dermofarmacia del Colegio de Madrid. Alta relevancia dermo. Fecha estimada por patrón histórico (suele ser en octubre).',
   'conferencia','2026-10-15T09:30:00+02:00','2026-10-15T18:00:00+02:00',false,'Madrid','https://www.cofm.es/',false,true,false),

  ('Farmaweek 2027 (fecha por confirmar)',
   'Congreso online masivo: dermocosmética, OTC, gestión y comunicación digital. Accesible para todo el equipo. Fecha estimada.',
   'webinar','2027-02-24T09:30:00+01:00','2027-02-24T18:00:00+01:00',true,'Online','https://farmaweek.es/',false,true,false);

-- Verificación:
-- SELECT title, event_type, start_date, location FROM public.events
--  WHERE end_date >= now() ORDER BY is_featured DESC, start_date;
