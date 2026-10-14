-- ============================================================================
-- Píldoras de octubre 2026 (14-10-2026): 17-A y 17-B, vídeos de Alejandro.
--
-- Vídeos: Drive 17-A 1WN0Gtdr1tXTnC2vYkY1XjH-Fgt4fZoGq y 17-B
-- 1cKBeXYxnpWQrHEF-Glz9enaMB8-oPwYP, recortados antes de la pantalla negra
-- (17-A en 101,85 s; 17-B en 79,45 s, antes de la marca de CapCut) y subidos
-- a Bunny 748005.
-- Se insertan SIN PUBLICAR: Francesc las revisa y se publican con el UPDATE
-- del final. Idempotente por slug.
-- Ángulos elegidos para no pisar lo que ya hay:
--   17-A no repite el curso «El mostrador que vende sin presionar» (método en
--        4 pasos): se centra en la pregunta que sustituye al «¿algo más?» y en
--        el ejercicio «un cliente, un producto».
--   17-B no repite la píldora 102 (puesta a punto de la ficha en 5 pasos): es
--        el mantenimiento mensual, la ficha como segundo escaparate.
-- ============================================================================

INSERT INTO public.courses
  (slug, title, description, category, difficulty, duration_hours, duration_minutes,
   instructor, is_premium, is_published, is_featured, order_index, total_lessons,
   cover_concept, cover_icon, course_modules)
VALUES
(
  'fp-pildora-recomendacion-honesta',
  'Cambia el «¿algo más?» por la pregunta que sí ayuda al cliente',
  'El «¿algo más?» tiene una respuesta fija: no. Aprende a sustituirlo por una pregunta sobre lo que le pasa a la persona y a preparar, producto a producto, el complemento que de verdad le va bien.',
  'ventas', 'principiante', 0, 8,
  'Alejandro Tellería', true, false, false, 109, 1,
  'LA PREGUNTA', 'MessageCircle',
  jsonb_build_array(jsonb_build_object(
    'id', 'fp-pildora-recomendacion-honesta-l1',
    'title', 'La recomendación honesta, producto a producto',
    'duration', '8',
    'video_url', 'https://iframe.mediadelivery.net/embed/748005/bd200626-fca2-4190-bc07-62d9468032d4',
    'downloadable_resources', jsonb_build_array(
      jsonb_build_object('resource_id', 'dc711d2a-3ea1-48c2-b4aa-7a472e529d73',
        'title', 'Guion de venta cruzada ética para el mostrador', 'type', 'pdf',
        'url', '/recursos/guion-venta-cruzada.pdf'),
      jsonb_build_object('resource_id', '5634a929-6608-4ffb-a752-b54fcf50cc3c',
        'title', 'Complementos por necesidad del cliente', 'type', 'pdf',
        'url', '/recursos/impulso-n13-complementos-naturales.pdf')),
    'content', $html$
<h3>El problema</h3>
<p>Hay una pregunta que se repite cientos de veces al día en casi todos los mostradores de España y que casi nunca deja nada: «¿algo más?». Llega al final de la venta, con el producto ya en la bolsa y la mano en el datáfono, y tiene una respuesta tan previsible que el cliente la da antes de pensarla: «no, nada más, gracias». No es que la persona no necesite nada. Es que la pregunta no le da ninguna pista de qué podría necesitar, y a esas alturas ya tiene la cabeza en la puerta.</p>
<p>Piensa en un caso de cualquier mañana. Entra alguien con cara de dolor, se le nota en cómo se apoya en el mostrador, y pide ibuprofeno. Le preguntas si de 400 o de 600, se lo cobras y, como mucho, añades el «¿algo más?». Respuesta: no. Esa persona se va con lo que pidió, pero sin lo que quizá le habría ayudado de verdad, y tu farmacia se queda con una venta que podría haber hecho cualquier otra, o una web. Nadie ha hecho nada mal, y precisamente por eso el problema pasa desapercibido.</p>
<p>El coste no está en una venta suelta, está en la suma. Si cada día salen por la puerta decenas de clientes a los que nadie preguntó qué les pasaba, la farmacia pierde ticket, y pierde algo más difícil de recuperar: la sensación del cliente de que allí le aconsejan. En el vídeo, Alejandro cifra en torno a un 30% la subida del ticket medio cuando se cambia esta pregunta. Tómalo como estimación sectorial: la cifra real depende de la categoría y del producto, pero la dirección es siempre la misma.</p>

<h3>Por qué pasa</h3>
<p>El «¿algo más?» no es pereza. Es un hábito aprendido que resulta cómodo porque no compromete a nadie: no obliga a escuchar, no obliga a saber qué recomendar y no expone a quien atiende a parecer vendedor. Con cola en el mostrador, una pregunta cerrada que se contesta con un «no» es la forma más rápida de pasar al siguiente.</p>
<p>A eso se suman dos frenos muy humanos. El primero es el miedo a presionar: mucha gente del equipo prefiere no recomendar nada antes que sentir que está «colocando» un producto. El segundo es que, en el momento, la cabeza se queda en blanco. Si nadie ha pensado antes qué complemento tiene sentido con cada producto que más se dispensa, es casi imposible improvisarlo bien delante del cliente. Así que se tira de la fórmula de siempre.</p>

<h3>El método en 4 pasos</h3>
<p><strong>Paso 1. Cambia la pregunta: de «¿algo más?» a «¿qué le ocurre?»</strong></p>
<p>La pregunta que deja venta no va al final, va al principio, y no habla del producto sino de la persona: «¿qué le ocurre?», «¿para quién es?», «¿desde cuándo le pasa?». Es una pregunta abierta, que invita a contar, y que además ya forma parte de lo que la profesión llama indicación farmacéutica: antes de dispensar sin receta, saber para quién es y qué le pasa. No añades un paso comercial a la atención; haces bien un paso que ya tocaba.</p>
<p>En el ejemplo del ibuprofeno, la conversación cambia por completo: «¿Es para usted? ¿Qué le duele?». «La espalda, desde ayer, de mover unas cajas». Con esa respuesta ya sabes muchas más cosas que con el «de 400 o de 600».</p>
<p>El error habitual es hacer la pregunta como una fórmula y no escuchar la respuesta. Si preguntas «¿qué le ocurre?» con la vista en la pantalla, el cliente lo nota y contesta con monosílabos.</p>

<p><strong>Paso 2. Conecta lo que te cuenta con lo que le puede ayudar</strong></p>
<p>Con la respuesta en la mano, la pregunta interna ya no es «qué más le puedo vender», sino «qué más le puede ir bien para esto». Para el dolor de espalda de las cajas, una crema o un parche de frío-calor complementa el ibuprofeno que ha venido a buscar. Para una rozadura que se va a curar con un antiséptico, un apósito adecuado. Para unas manos agrietadas por el frío, un gel de higiene suave que no las reseque más.</p>
<p>La clave es que el complemento tenga una relación directa y evidente con lo que la persona te ha contado. Si tienes que explicar demasiado por qué tiene que ver, probablemente no tiene que ver.</p>
<p>El error más frecuente es recomendar lo que hay en promoción esa semana, venga o no a cuento. El cliente lo detecta enseguida y la recomendación pierde todo su valor, esta vez y las siguientes.</p>

<p><strong>Paso 3. Recomienda una sola cosa, y di por qué</strong></p>
<p>No «llévese también esto», sino una frase con motivo: «¿Ha probado alguna vez esta crema de frío-calor? A muchas personas con dolor de espalda les va bien para complementar el ibuprofeno». Una sola recomendación, con su porqué, en tono de consejo. El porqué es lo que convierte una sugerencia en un consejo profesional y lo que separa a una farmacia de un lineal con caja.</p>
<p>Fíjate en lo que no hay en esa frase: ni presión, ni urgencia, ni descuento. Solo interés por la persona y un motivo que entiende a la primera.</p>
<p>El error típico es encadenar tres o cuatro productos. Al segundo, el cliente deja de escuchar consejo y empieza a escuchar venta.</p>

<p><strong>Paso 4. Acepta el no sin insistir</strong></p>
<p>Si la respuesta es «no, gracias», se acabó. Una sonrisa, «si ve que no mejora, aquí estamos», y a cobrar. El cliente ya te ha escuchado y sabe que lo tienes. Insistir puede costarte no solo esa venta, sino la confianza para las siguientes recomendaciones que le hagas.</p>
<p>La línea de todo el método cabe en una frase: si no le hace falta, no se recomienda. Por eso el cliente vuelve.</p>

<h3>El ejercicio de la semana: un cliente, un producto</h3>
<p>La forma de que la cabeza no se quede en blanco en el mostrador es haber pensado antes. Esta semana, con el equipo, elige los cinco productos sin receta que más dispensáis y escribe al lado de cada uno dos cosas: el complemento que tiene sentido para la necesidad más habitual y la frase con motivo con la que lo recomendaríais. Cinco líneas, un folio, a la vista detrás del mostrador.</p>
<p>Después, practicadlo así: cada día, un cliente y un producto. No hace falta hacerlo con todo el mundo ni con todo el catálogo. Basta con que cada persona del equipo lo haga bien una vez al día y lo comente al final de la semana: qué preguntó, qué recomendó y qué contestó el cliente.</p>

<h3>Errores frecuentes</h3>
<ul>
<li><strong>Preguntar «¿qué le ocurre?» y recomendar lo mismo de siempre:</strong> la pregunta solo sirve si la respuesta cambia lo que recomiendas. Corrígelo escuchando hasta el final antes de pensar en el producto.</li>
<li><strong>Recomendar por la promoción y no por la necesidad:</strong> el cliente lo percibe y deja de fiarse. Corrígelo con la regla de la relación evidente: si no se entiende a la primera, no se recomienda.</li>
<li><strong>Hacerlo solo cuando no hay cola:</strong> el hábito no se forma si depende del día. Corrígelo con el ejercicio de un cliente al día, también en hora punta.</li>
<li><strong>Que solo lo haga el titular:</strong> si el resto del equipo sigue con el «¿algo más?», la farmacia no cambia. Corrígelo con el folio de los cinco productos compartido y comentado en equipo.</li>
</ul>

<h3>Hazlo hoy (10 minutos)</h3>
<p>Antes de cerrar, coge los tres productos sin receta que más has dispensado hoy y escribe al lado de cada uno su complemento lógico y la frase con motivo con la que lo recomendarías. Mañana, con el primer cliente que pida uno de ellos, cambia el «¿algo más?» por «¿qué le ocurre?» y prueba la frase.</p>

<h3>Cómo saber que funciona</h3>
<p>Dale cuatro semanas y mira tres señales:</p>
<ul>
<li><strong>Cuántas veces se hace la pregunta.</strong> Una hoja con palotes junto al mostrador durante una semana basta para saber si el hábito está entrando en el equipo o se queda en buena intención.</li>
<li><strong>Cuántas recomendaciones se aceptan.</strong> Otra columna de palotes: recomendaciones hechas y aceptadas. Si casi ninguna se acepta, revisa el paso 2: probablemente el complemento no tiene relación evidente con lo que el cliente cuenta.</li>
<li><strong>El ticket medio de esas categorías.</strong> Tu programa de gestión te da el ticket por categoría o por familia. Compara el mes en que empezáis con el anterior, siempre en la misma categoría y sin promociones de por medio.</li>
</ul>
<p>Hay una cuarta señal que no sale en ningún informe y es la mejor: el cliente que vuelve y te dice que le fue bien lo que le recomendaste.</p>

<h3>Para seguir</h3>
<p>Justo debajo, en «Recursos descargables», tienes el «Guion de venta cruzada ética para el mostrador» y la tabla «Complementos por necesidad del cliente», que te ahorran la mitad del ejercicio de los cinco productos. Si quieres trabajar el método completo con todo el equipo, en Formación tienes el curso «El mostrador que vende sin presionar: venta cruzada ética en la farmacia».</p>
$html$
  ))
),
(
  'fp-pildora-ficha-google-segundo-escaparate',
  'Revisa tu ficha de Google como revisas tu escaparate',
  'Tu ficha de Google es el segundo escaparate de tu farmacia y se queda vieja sin que nadie lo note. Aprende la revisión de diez minutos al mes que mantiene al día fotos, horarios, festivos y reseñas.',
  'marketing', 'principiante', 0, 8,
  'Alejandro Tellería', true, false, false, 110, 1,
  'ESCAPARATE', 'Store',
  jsonb_build_array(jsonb_build_object(
    'id', 'fp-pildora-ficha-google-segundo-escaparate-l1',
    'title', 'El segundo escaparate, revisado cada mes',
    'duration', '8',
    'video_url', 'https://iframe.mediadelivery.net/embed/748005/6b0f1f0d-4352-4880-be67-4ac112a1d13f',
    'downloadable_resources', jsonb_build_array(
      jsonb_build_object('resource_id', '3188e15c-dcbc-4c0d-8d2d-091edac00878',
        'title', 'Infografía: anatomía de una ficha de Google bien optimizada', 'type', 'pdf',
        'url', '/recursos/infografia-ficha-google.pdf'),
      jsonb_build_object('resource_id', '88164fdf-3b82-429c-99e2-cc985abcd814',
        'title', 'Guía: reseñas de Google con tu equipo', 'type', 'pdf',
        'url', '/recursos/portal-guia-resenas-google.pdf')),
    'content', $html$
<h3>El problema</h3>
<p>Tu farmacia tiene dos escaparates. Uno lo ves todos los días al subir la persiana: lo cambias por temporada, lo limpias, discutes con el equipo qué va delante. Jamás dejarías en él la promoción de verano de hace dos años. El otro es tu ficha de Google, y para mucha gente de tu barrio es lo primero que ve de tu farmacia, antes incluso que la fachada: la mira en el móvil para saber si estás abierta, cómo llegar o qué cara tiene el sitio.</p>
<p>Ese segundo escaparate, en muchas farmacias, está descuidado. No por mala fe, sino porque nadie lo mira. Fotos de hace años, con un mostrador que ya no existe. Un horario que no recoge el festivo local de la semana que viene. Una guardia que no aparece. Reseñas de hace meses sin respuesta. Cada cosa por separado parece poca cosa, pero el conjunto transmite lo mismo que un escaparate polvoriento: que aquí nadie está pendiente.</p>
<p>Seamos justos: tu ficha de Google no va a decidir por sí sola si alguien entra o no en tu farmacia. Pero sí suma o resta, y el criterio para saber si resta es sencillo: todo lo que a ti te chirría al verla le chirría igual a quien la mira desde su casa. Y a diferencia del escaparate físico, nadie del equipo pasa por delante cada mañana y lo ve.</p>

<h3>Por qué pasa</h3>
<p>La mayoría de farmacias ha dedicado, en algún momento, una tarde a poner la ficha a punto. El problema no suele ser esa primera vez, sino lo que viene después. Una ficha bien hecha en enero empieza a quedarse vieja en febrero, porque la farmacia cambia y la ficha no se entera: llega un festivo local, cambia el horario de verano, se renueva el mostrador, se incorpora un servicio, entra una reseña.</p>
<p>A eso se suma que los cambios no avisan. El escaparate físico lo ves; la ficha, no. Y hay cambios que ni siquiera haces tú: Google permite a cualquier usuario sugerir modificaciones en la ficha de un negocio (un horario, un teléfono, una categoría) y a veces las aplica. Si nadie revisa, puedes tener un dato cambiado durante semanas sin saberlo. Sin una persona responsable y un día fijo, la revisión no ocurre nunca, porque nunca es urgente.</p>

<h3>La revisión mensual en 5 miradas</h3>
<p>La solución no es una gran puesta a punto cada año, sino una revisión corta y fija cada mes, igual que cambiáis el escaparate por temporada. Diez minutos, siempre el mismo día y siempre la misma persona. Estas son las cinco miradas.</p>

<p><strong>Mirada 1. Mírala como un cliente</strong></p>
<p>Antes de entrar en el panel de gestión, busca tu farmacia en Google Maps desde el móvil, como lo haría alguien de tu barrio. Mira la foto principal, las estrellas, si dice abierto o cerrado, lo que aparece en las primeras líneas. Apunta todo lo que te chirríe, sin corregir todavía. Esta mirada es la más importante, porque es la que nunca hacemos: siempre vemos la ficha desde dentro, nunca desde la calle.</p>

<p><strong>Mirada 2. El calendario del mes que viene</strong></p>
<p>Abre el calendario y repasa el mes siguiente: festivos nacionales, autonómicos y locales, guardias, puentes, cambios de horario por temporada o por fiestas del barrio. Cada uno se mete en la ficha como horario especial del día concreto, sin tocar el horario habitual. Es la revisión que más llamadas ahorra y la que más confianza da: quien comprueba un festivo y lo encuentra bien puesto ya no duda.</p>
<p>El error más común es poner el cartel en la puerta y olvidarse de Google, cuando quien consulta la ficha es justo quien no está delante de tu puerta.</p>

<p><strong>Mirada 3. Una foto nueva, como mínimo</strong></p>
<p>Cada mes, una o dos fotos nuevas y reales: el escaparate de temporada recién montado, el equipo, un rincón renovado, la entrada con luz de mañana. Hay una costumbre que funciona muy bien: cada vez que cambiéis el escaparate físico, fotografiadlo y subidlo a la ficha ese mismo día. Así los dos escaparates cambian a la vez.</p>
<p>Aprovecha para retirar las fotos subidas por la farmacia que ya no representan cómo es hoy: un mostrador que ya no está, una fachada anterior a la reforma, una promoción caducada.</p>

<p><strong>Mirada 4. Reseñas y preguntas pendientes</strong></p>
<p>Repasa las reseñas del último mes y responde a todas las que estén sin respuesta, las buenas y las malas, en pocas líneas y con tono de mostrador. Mira también el apartado de preguntas y respuestas, si aparece en tu ficha: a veces hay preguntas de vecinos que llevan meses esperando y que contestaría cualquiera del equipo en diez segundos. Si quieres que entren reseñas nuevas cada semana, la guía de reseñas que tienes abajo explica cómo pedirlas en el mostrador con todo el equipo.</p>

<p><strong>Mirada 5. Lo que ha cambiado sin que tú lo cambies</strong></p>
<p>Comprueba los datos que no deberían moverse: nombre, dirección, teléfono, web, categoría principal y horario habitual. Si Google ha aplicado un cambio sugerido por un usuario, normalmente lo verás señalado en el panel de gestión como una actualización pendiente de revisar. Acepta solo lo que sea correcto y corrige lo demás. Es la mirada más rápida y la que evita los sustos más grandes, como un teléfono que no es el tuyo.</p>

<h3>Errores frecuentes</h3>
<ul>
<li><strong>Revisar solo cuando algo falla:</strong> si la revisión depende de que un cliente se queje, siempre llegas tarde. Corrígelo con un día fijo al mes, en el calendario del equipo.</li>
<li><strong>Que la ficha no sea de nadie:</strong> si todo el equipo puede, nadie lo hace. Corrígelo nombrando a una persona responsable, y si quieres, rotad cada trimestre.</li>
<li><strong>Corregirlo todo de golpe una vez y abandonarlo:</strong> una gran tarde al año no sustituye a diez minutos al mes. Corrígelo con la revisión corta y fija.</li>
<li><strong>Cambiar el escaparate y no la ficha:</strong> los dos escaparates cuentan cosas distintas y el cliente lo nota. Corrígelo con la regla de la foto el mismo día.</li>
</ul>

<h3>Hazlo hoy (10 minutos)</h3>
<p>Esta tarde, cuando cierres, entra en tu ficha de Google desde el móvil, como un cliente. Fíjate en lo que te chirríe y corrige una cosa, una sola: la foto más antigua, el próximo festivo o la reseña sin responder. Una sola cosa hoy vale más que la puesta a punto completa que lleva meses esperando. Después, apunta en el calendario el día del mes en que harás la revisión de las cinco miradas.</p>

<h3>Cómo saber que funciona</h3>
<p>En dos o tres meses deberías notar tres cosas:</p>
<ul>
<li><strong>Menos llamadas para preguntar si estáis abiertos,</strong> sobre todo en festivos y puentes. Es la señal más rápida y se nota en el teléfono del mostrador.</li>
<li><strong>Más interacciones en el panel de rendimiento de la ficha:</strong> llamadas, solicitudes de cómo llegar y visitas a la web. Compara siempre con el mismo mes del año anterior si lo tienes, porque estas cifras cambian con la temporada.</li>
<li><strong>Una ficha que se parece a tu farmacia de hoy:</strong> fotos recientes, reseñas respondidas y horarios especiales bien puestos. Haz la prueba de la mirada 1 dentro de tres meses y compara lo que te chirría con lo que apuntaste hoy.</li>
</ul>

<h3>Para seguir</h3>
<p>Si tu ficha necesita antes una puesta a punto completa, empieza por la píldora «Convierte tu ficha de Google en la puerta de entrada de tu farmacia», que la deja lista en cinco pasos; esta píldora es la que la mantiene. Justo debajo, en «Recursos descargables», tienes la infografía con la anatomía de una ficha bien optimizada y la guía para que todo el equipo pida reseñas en el mostrador. Y en Formación, el curso «Redes sociales y Google Business Profile para tu farmacia» lo trabaja todo con más detalle.</p>
$html$
  ))
)
ON CONFLICT (slug) DO UPDATE SET
  title = EXCLUDED.title, description = EXCLUDED.description,
  category = EXCLUDED.category, instructor = EXCLUDED.instructor,
  order_index = EXCLUDED.order_index, cover_concept = EXCLUDED.cover_concept,
  cover_icon = EXCLUDED.cover_icon, course_modules = EXCLUDED.course_modules,
  updated_at = now()
RETURNING slug, is_published, length(course_modules->0->>'content') AS caracteres;

-- Comprobación de los descargables en el bucket (deben salir los 4)
SELECT name FROM storage.objects
WHERE bucket_id = 'recursos-portal'
  AND name IN ('guion-venta-cruzada.pdf', 'impulso-n13-complementos-naturales.pdf',
               'infografia-ficha-google.pdf', 'portal-guia-resenas-google.pdf');

-- PUBLICAR (solo tras el visto bueno de Francesc):
-- UPDATE public.courses SET is_published = true, updated_at = now()
-- WHERE slug IN ('fp-pildora-recomendacion-honesta', 'fp-pildora-ficha-google-segundo-escaparate');
