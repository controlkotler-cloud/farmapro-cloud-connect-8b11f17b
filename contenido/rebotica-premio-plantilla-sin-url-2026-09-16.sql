-- ============================================================================
-- La Rebotica · quitar la URL del fichero de la descripción del premio
-- "Plantilla exclusiva de la Rebotica"   (16-09-2026)
--
-- POR QUÉ. La descripción del premio terminaba en:
--   "Descárgalo aquí: portal.farmapro.es/recursos/vault-termometro-cliente-nps-k7q2.xlsx"
-- Es decir, PUBLICABA la URL exacta del fichero a todo el que abriese un cajón.
-- Mientras los recursos eran estáticos, eso bastaba para que cualquiera con esa
-- línea copiada se bajase la plantilla sin cuenta; el sufijo aleatorio del
-- nombre del fichero era precisamente el reconocimiento de que la única
-- protección era que nadie publicara la URL.
--
-- Desde el 15-09-2026 el fichero vive en el bucket privado `recursos-portal` y
-- se firma al pulsar (`rewardAction` en src/pages/Rebotica.tsx), así que la URL
-- ya no sirve de nada a un tercero. Se quita igualmente: enseñar rutas de
-- ficheros en un texto para el usuario no aporta y envejece mal.
--
-- El botón "Descargar la plantilla" se pinta JUSTO DEBAJO de esta descripción
-- (Rebotica.tsx, lista de premios), por eso el texto nuevo remite a él.
--
-- ALCANCE: 3 filas, las tres con el texto idéntico. Son el mismo premio clonado
-- en las campañas de septiembre, octubre y noviembre. No se despublica nada.
-- ============================================================================

-- ANTES (comprobación previa obligatoria):
SELECT id, titulo, descripcion FROM public.rebotica_prizes
WHERE descripcion LIKE '%/recursos/%';

UPDATE public.rebotica_prizes
SET descripcion = replace(
      descripcion,
      ' Descárgalo aquí: portal.farmapro.es/recursos/vault-termometro-cliente-nps-k7q2.xlsx',
      ' Lo descargas con el botón de aquí abajo.'
    ),
    updated_at = now()
WHERE descripcion LIKE '%/recursos/vault-termometro-cliente-nps-k7q2.xlsx%';

-- DESPUÉS: debe devolver 0 filas.
SELECT count(*) AS quedan_con_url FROM public.rebotica_prizes
WHERE descripcion LIKE '%/recursos/%';
