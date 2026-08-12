# Prompt Lovable · rediseño landing /rebotica (v2 · 13-07-2026)

> Pegar en el chat de Lovable del portal (farmapro-cloud-farm) **adjuntando** `landing-rebotica-propuesta.html` (versión retocada por Francesc 13-07) como referencia visual. Decisiones incorporadas: SIN planes ni precios (gratis-first) · SIN bloque de deontología · SIN mención a productos de partners en los premios · partner al pie de la página.

```
Rediseña por completo la página pública /rebotica (src/pages/Rebotica.tsx) siguiendo el
HTML adjunto como referencia visual y de estructura. Es un rediseño VISUAL: conserva
intacta la lógica existente (elección de cajón sin cuenta con persistencia, apertura solo
con registro, ruta /rebotica/bases-legales, y el TODO comentado de open-reward tal cual).

Estructura y contenido (del HTML adjunto, respetar los textos EXACTOS):
1. Hero en dos columnas: titular "Cada quincena, un cajón. Dentro, siempre hay premio.",
   CTA primario "Elegir mi cajón gratis" + secundario "Ver cómo funciona", microcopy
   "Sin tarjeta. Eliges sin cuenta; para abrirlo, te registras gratis", 3 chips de
   confianza (7.500+ profesionales, 1 de cada 6 farmacias, 100% de cajones con premio).
   A la derecha, cajonera 3x3 de madera estilo botica con placas de SIGLAS como las
   cajoneras reales de farmacia: A-C, D-F, G-I, J-L, M-O, P-R, S-T, U-V, W-X. El cajón
   S-T va entreabierto con brillo dorado animado; hover desliza el cajón y clic lleva al CTA.
   BAJO LA CAJONERA: placa "El cajón de esta quincena lo presenta" con el LOGO DEL PARTNER
   VISIBLE en chip blanco enlazado a su web (como en el HTML; se oculta si no hay partner).
2. Franja oscura con cuenta atrás real al próximo jueves de quincena 08:00 + la misma
   presencia del partner con LOGO VISIBLE en chip blanco (oculta si no hay partner).
   El logo del partner debe verse igual de presente que en la demo eOnbox: hero, franja y pie.
3. "Cómo funciona" en 3 pasos, con el subtítulo "La trastienda de la farmacia es donde
   pasan las cosas buenas. Aquí también."
4. "Lo que puede tocarte": 6 tarjetas con etiqueta de frecuencia (siempre / a veces /
   sorteo mensual): Masterclass exclusivas ("Sesiones que no están en el catálogo: solo
   salen del cajón."), Plantillas "solo cajón", Meses de Plus gratis, Un curso premium
   para ti, Multiplicadores y extras, y El Baúl ("Un baúl de verdad, lleno de regalos,
   camino de la puerta de una farmacia. Cada cajón que abres ese mes es una participación:
   lo sorteamos una vez al mes."). Debajo, tarjeta ancha oscura de EL GORDO: "Una vez por
   temporada, entre todas las aperturas del trimestre, sorteamos una Auditoría Farmacia
   Silenciosa completa: visita, informe y plan de acción." con sello "valorada en 360 €+".
5. FAQ de 4 preguntas (textos del HTML) con acordeón.
6. CTA final oscuro "El siguiente cajón ya tiene tu nombre en el rótulo."
7. AL PIE (antes del footer): bloque "Partner de la quincena" centrado, con tarjeta
   blanca "El cajón de esta quincena lo presenta" + hueco de logo enlazado, y el texto:
   "¿Tienes una marca del sector? Cada quincena, un solo partner presenta el cajón ante
   miles de profesionales de farmacia. Sin subastas, sin banners, sin ruido: tu logo y el
   enlace a tu web. Escríbenos: somos@farmapro.es".
8. Footer con enlaces a bases legales y privacidad.

IMPORTANTE: no hay bloque de deontología, no se mencionan medicamentos, no se mencionan
productos de partners como premio, y NO hay planes, precios ni comparativas de suscripción.

Estilo: paleta farmapro (fondo #FBFBF7, tinta #0B0F0B, lima #A3D338 / #7BB121 / #EAF5D0),
maderas cálidas para la cajonera, tipografías del portal. Animaciones sobrias: reveal al
hacer scroll, pulso del cajón entreabierto, hover de tarjetas. Responsive (la cajonera a
ancho completo en móvil). NO toques ninguna otra ruta ni componente compartido.
```

## Verificación tras publicar
portal.farmapro.es/rebotica: cajonera con siglas A-C…W-X, cuenta atrás corriendo, El Baúl como sorteo mensual y EL GORDO trimestral, partner al pie con somos@farmapro.es, sin precios ni deontología, y la elección de cajón sigue pidiendo registro para abrir.
