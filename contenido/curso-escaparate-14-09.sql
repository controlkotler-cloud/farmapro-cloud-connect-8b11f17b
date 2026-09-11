-- =============================================================================
-- Curso nuevo para el lunes 14-09-2026: "Convierte tu escaparate en el primer
-- vendedor de tu farmacia" (5 módulos, 45 min, categoría marketing).
-- Fuente editorial: Impulso N11 "El Efecto Escaparate" (impulso/01-newsletters/
-- textos-completos/N11-newsletter-11-efecto-escaparate-psicologia.md).
-- Hueco real del catálogo: no había ningún curso de escaparate / punto de venta.
--
-- Se carga SIN publicar (is_published=false). La publicación va al final, en el
-- bloque PUBLICAR, y no se ejecuta hasta que Francesc valide el texto y el PDF
-- esté desplegado y verificado con curl contra portal.farmapro.es.
-- =============================================================================

-- 1) RECURSO DESCARGABLE ------------------------------------------------------
-- Fichero estático en farmapro-portal/public/recursos/ (NO Storage: es gratuito).
insert into resources (id, title, slug, description, category, type, format, file_url, is_premium, is_published)
values (
  '9c1f7a42-5d30-4b8e-9a61-2f3c81d47e05',
  'El test de los 3 segundos: ficha de diagnóstico de tu escaparate',
  'test-3-segundos-escaparate',
  'Ficha imprimible para averiguar qué dice hoy tu escaparate. Incluye el guion del test con cinco personas, la plantilla de respuestas, la rejilla 40/30/30 para repartir el espacio, el calendario de los cuatro montajes del año y la hoja de medición a 30 días.',
  'marketing', 'checklist', 'pdf',
  '/recursos/portal-test-3-segundos-escaparate.pdf',
  false, false
)
on conflict (id) do update set
  title = excluded.title, description = excluded.description, slug = excluded.slug,
  file_url = excluded.file_url, category = excluded.category, type = excluded.type, format = excluded.format;

-- 2) CURSO --------------------------------------------------------------------
insert into courses (
  title, slug, description, category, difficulty, duration_hours, duration_minutes,
  instructor, is_published, is_premium, is_featured, order_index, total_lessons,
  cover_concept, cover_icon, course_modules
) values (
  'Convierte tu escaparate en el primer vendedor de tu farmacia',
  'fp-mk-escaparate-primer-vendedor',
  'Tu escaparate trabaja las veinticuatro horas del día, también con la farmacia cerrada. En cinco módulos decides qué mensaje lanza, cómo repartes el espacio, cómo lo iluminas y cómo sabrás, con números, si está funcionando. Al terminar tendrás montado el escaparate de otoño.',
  'marketing', 'principiante', 0.75, 45,
  'Laura Domínguez', false, false, false, 40, 5,
  'ESCAPARATE', 'Store',
  jsonb_build_array(

  -- ---------- MÓDULO 1 ----------
  jsonb_build_object(
    'id', 'fp-mk-escaparate-primer-vendedor-m1',
    'title', 'Los tres segundos que deciden si entran',
    'duration', 8,
    'content', $m1$
<h3>El problema</h3>
<p>Sal a la acera, ponte a diez metros de tu farmacia y mira el escaparate como si no fuera tuyo. Cuenta tres segundos y aparta la vista. ¿Qué te ha dicho? La mayoría de titulares que hacen este ejercicio por primera vez llegan a la misma conclusión incómoda: el escaparate enseña productos, pero no cuenta nada. No dice quién eres, ni en qué eres bueno, ni por qué merece la pena cruzar esa puerta hoy.</p>
<p>Esos primeros metros cuadrados son el único empleado de tu farmacia que trabaja las veinticuatro horas del día, festivos incluidos y también con la persiana bajada. La cuestión no es si comunica, porque comunica siempre. La cuestión es si comunica lo que tú has decidido o lo que le ha ido tocando.</p>
<p>Y es un coste invisible, por eso se arrastra durante años. Nadie entra a decirte que tu escaparate está apagado: simplemente pasa de largo. No aparece en ningún ticket, no salta ninguna alarma en el programa de gestión y no hay forma de echarlo de menos.</p>

<h3>Cómo mira de verdad quien pasa por delante</h3>
<p>El peatón no está estudiando tu escaparate: lo percibe de reojo mientras va a otra cosa, con el móvil en la mano y la cabeza en la lista de la compra. En ese vistazo ocurren tres cosas muy rápidas, y siempre en este orden:</p>
<ul>
<li><strong>Primero el filtro.</strong> El ojo decide en un instante si ahí hay algo que merezca detener la mirada. Gana el contraste y el orden, nunca la cantidad de producto.</li>
<li><strong>Después el juicio.</strong> Se forma una impresión de profesionalidad: limpio o descuidado, actual o antiguo, cuidado o improvisado. Esa impresión se traslada entera a lo que el cliente espera encontrarse dentro, aunque dentro tengas la mejor farmacia del barrio.</li>
<li><strong>Y solo entonces la decisión.</strong> Si las dos anteriores han ido bien, aparece la única pregunta que te interesa: ¿esto es para mí, y es para ahora?</li>
</ul>
<p>La consecuencia práctica es incómoda al principio y liberadora después: un escaparate lleno compite consigo mismo y se queda atascado en el primer paso. Cuantas más cosas quieres decir, menos se entiende ninguna.</p>

<h3>Expositor o imán</h3>
<p>Casi todas las farmacias se mueven entre dos formas de entender el escaparate, y la diferencia no es de presupuesto sino de criterio.</p>
<p><strong>El escaparate expositor</strong> se llena con lo que va llegando de los proveedores, se cambia cuando alguien se acuerda, muestra el máximo de referencias posible y no persigue ningún objetivo concreto. Nadie mide nada, así que nadie sabe si funciona.</p>
<p><strong>El escaparate imán</strong> transmite una sola idea, elige los productos que refuerzan esa idea (aunque sean pocos), se planifica con fechas en el calendario, pide una acción concreta al que pasa y se mide después. Cuesta lo mismo montarlo. Lo que cambia es que alguien ha decidido antes qué quiere conseguir.</p>
<p>El resto del curso va de pasar del primero al segundo sin obras, sin diseñador y sin gastarte un dinero que no tenías previsto.</p>

<h3>Errores frecuentes en este primer paso</h3>
<ul>
<li>Juzgar tu escaparate desde dentro de la farmacia. Desde tu lado del cristal ves otra cosa: distinta altura, distinta luz y, sobre todo, sabiendo ya lo que hay. Se juzga desde la acera de enfrente.</li>
<li>Mirarlo solo de día. Muchas farmacias tienen su mejor escaparate al mediodía y uno invisible a las ocho de la tarde de un martes de noviembre, que es justo cuando más gente pasa por delante.</li>
<li>Preguntar a tu equipo. Conocen la farmacia y ya no pueden verla con ojos nuevos. Hacen falta ojos de fuera.</li>
</ul>

<h3>Tu tarea de este módulo (10 minutos)</h3>
<p>Haz una foto frontal del escaparate desde la acera de enfrente, con el móvil en horizontal y a la altura de tus ojos. No la retoques ni elijas el mejor ángulo: esa foto es tu punto de partida y la vas a necesitar en los módulos siguientes. Guárdala y ponle la fecha de hoy en el nombre.</p>
<p>Justo debajo, en "Recursos descargables", tienes la ficha del test de los tres segundos. Imprímela: la usarás en el módulo 2 para preguntar a cinco personas de fuera qué han entendido en tres segundos.</p>
$m1$,
    'downloadable_resources', jsonb_build_array(
      jsonb_build_object(
        'url', '/recursos/portal-test-3-segundos-escaparate.pdf',
        'type', 'pdf',
        'title', 'El test de los 3 segundos: ficha de diagnóstico de tu escaparate',
        'resource_id', '9c1f7a42-5d30-4b8e-9a61-2f3c81d47e05'
      )
    )
  ),

  -- ---------- MÓDULO 2 ----------
  jsonb_build_object(
    'id', 'fp-mk-escaparate-primer-vendedor-m2',
    'title', 'Un solo mensaje: decide qué quieres que piensen al pasar',
    'duration', 8,
    'content', $m2$
<h3>Una idea, no cinco</h3>
<p>Si tu escaparate solo puede transmitir una cosa en tres segundos, más vale que esa cosa la elijas tú. El mensaje central es la frase que quieres que se le quede a quien pasa, aunque nunca la llegue a leer literalmente. No es un eslogan bonito: es una decisión sobre qué tipo de cliente quieres atraer.</p>
<p>Un buen mensaje central cumple tres condiciones. Se entiende sin pensar, dice algo que no dirían todas las farmacias de tu ciudad, y se sostiene cuando el cliente entra. Esta última es la que más se incumple: prometer especialización en el cristal y no tener a nadie formado detrás del mostrador genera más decepción que el escaparate anterior.</p>

<h3>Cómo se construye el tuyo</h3>
<p>Contesta a estas tres preguntas por escrito, con frases cortas. Diez minutos bastan.</p>
<p><strong>1. ¿En qué eres realmente mejor que la farmacia de al lado?</strong> No lo que te gustaría, lo que ya es verdad hoy. Puede ser el asesoramiento en cuidado de la piel, la atención a familias con bebés, el seguimiento de personas mayores, la ortopedia, el tiempo que dedicáis a explicar las cosas.</p>
<p><strong>2. ¿A quién quieres ver entrar más a menudo?</strong> Un escaparate que intenta atraer a todo el mundo no atrae a nadie en concreto. Piensa en una persona real que ya es clienta tuya y que te gustaría multiplicar.</p>
<p><strong>3. ¿Qué problema tiene esa persona ahora mismo, en esta época del año?</strong> La estación manda: en septiembre no preocupa lo mismo que en abril.</p>
<p>Con esas tres respuestas, escribe una frase de seis palabras como máximo. Ejemplos que funcionan por lo concretos que son: "Especialistas en piel sensible". "Aquí te explicamos tu tratamiento". "Tu farmacia para los primeros años". "Expertos en descanso y sueño". Ejemplos que no dicen nada: "Tu farmacia de confianza", "Salud y bienestar", "Siempre a tu servicio".</p>

<h3>Del mensaje al cristal</h3>
<p>La frase tiene que verse desde diez metros, y eso obliga a un tamaño mayor del que te va a parecer razonable la primera vez. Tres reglas sencillas:</p>
<ul>
<li>Letras de al menos diez centímetros de alto para el mensaje principal. Si dudas, más grande.</li>
<li>Máximo dos tipos de letra en todo el escaparate, y colores de tu propia identidad, no los del cartel que regaló el laboratorio.</li>
<li>El mensaje se coloca a la altura de los ojos, no arriba del todo. Nadie levanta la cabeza al pasar.</li>
</ul>
<p>No hace falta rotulación cara. Vinilo de corte, letras sobre metacrilato o un cartel bien impreso en un soporte digno resuelven esto por poco dinero, y se cambian cuatro veces al año sin drama.</p>

<h3>Errores frecuentes</h3>
<ul>
<li>Dejar que el mensaje lo ponga el laboratorio. Los materiales de marca están diseñados para vender esa marca, no para posicionar tu farmacia. Úsalos como apoyo, nunca como titular.</li>
<li>Cambiar de mensaje cada mes. La idea central debería aguantar toda una temporada. Lo que rota son los productos y la decoración, no quién eres.</li>
<li>Escribir para farmacéuticos. Tu vecino no sabe qué es un cosmecéutico ni un nutracéutico. Escribe como hablas en el mostrador.</li>
<li>Llenar el cristal de folios tamaño A4 con avisos. Cada papel que pegas resta fuerza al mensaje y suma sensación de descuido.</li>
</ul>

<h3>Tu tarea de este módulo (10 minutos)</h3>
<p>Coge la ficha del test de los tres segundos y pásasela a cinco personas que no trabajen contigo: familiares, un cliente de confianza, el del bar de enfrente. Enséñales la foto del módulo 1 durante tres segundos y anota sus respuestas a las tres preguntas de la ficha. Si las cinco respuestas no coinciden entre sí, ya sabes por dónde empezar: tu escaparate no está diciendo una cosa, está diciendo cinco.</p>
$m2$
  ),

  -- ---------- MÓDULO 3 ----------
  jsonb_build_object(
    'id', 'fp-mk-escaparate-primer-vendedor-m3',
    'title', 'El reparto del espacio: la regla 40/30/30',
    'duration', 10,
    'content', $m3$
<h3>Un escaparate es un cartel, no una estantería</h3>
<p>El error de reparto más común es tratar el escaparate como espacio de almacenaje: cuanto más quepa, mejor. Funciona justo al revés. El vacío es lo que hace que se vea lo que hay, igual que los silencios hacen que se entienda una frase.</p>
<p>La regla 40/30/30 es una forma sencilla de repartir el espacio disponible sin necesidad de saber diseño.</p>

<h3>El 40%: el mensaje y el producto estrella</h3>
<p>Casi la mitad del escaparate se dedica a una sola idea: tu mensaje central del módulo 2 y el producto o servicio que lo representa mejor. Un único protagonista, con espacio libre a su alrededor. Si no tienes claro cuál es, elige el producto que más te gusta recomendar y que mejor explica tu equipo.</p>
<p>Este bloque va en el centro y a la altura de los ojos, que en un escaparate de farmacia suele estar entre el metro treinta y el metro sesenta del suelo. Todo lo que quede por debajo de un metro lo ve muy poca gente, y lo que quede por encima de metro ochenta, prácticamente nadie.</p>

<h3>El 30%: lo complementario y de temporada</h3>
<p>Aquí van tres o cuatro referencias que acompañan al protagonista y que tienen sentido en esta época del año. Complementario significa que al cliente le encaja mentalmente que estén juntas, no que sean del mismo proveedor.</p>
<p>Tres o cuatro referencias, no doce. Si tienes que decidir qué quitar, quita lo que ya se vende solo: el escaparate no está para recordar lo que todo el mundo sabe que vendes.</p>

<h3>El 30%: quién eres y qué quieres que hagan</h3>
<p>El tercio restante es el que casi todas las farmacias se saltan, y es el que convierte. Dos cosas:</p>
<ul>
<li><strong>Tus servicios,</strong> escritos de forma legible: horario ampliado, asesoramiento personalizado, servicio a domicilio, lo que ofrezcas de verdad.</li>
<li><strong>Una llamada a la acción concreta,</strong> que es una frase que invita a hacer algo hoy: "Pregúntanos por tu rutina de cuidado facial", "Te ayudamos a organizar tu medicación", "Consulta sin cita para el cuidado del bebé". Evita las genéricas del tipo "Te esperamos dentro", que no piden nada.</li>
</ul>
<p>Una advertencia que conviene tener presente: lo que ofrezcas en el cristal tiene que estar dentro, con alguien preparado para atenderlo y sin prometer un resultado de salud concreto. La invitación es a preguntar y a que le atiendan, nunca a un resultado garantizado.</p>

<h3>Errores frecuentes</h3>
<ul>
<li>Repartir el espacio a partes iguales entre todo lo que quieres enseñar. Sin protagonista no hay lectura posible.</li>
<li>Usar el suelo del escaparate como zona de almacenaje de cajas vacías o soportes de repuesto. Se ve desde fuera más de lo que crees.</li>
<li>Amontonar en el tercio bajo, que es zona ciega, el producto que más te interesa mover.</li>
<li>Olvidar que el cristal tiene reflejos. Antes de dar por bueno el montaje, míralo con el sol de frente y comprueba qué se sigue viendo.</li>
</ul>

<h3>Tu tarea de este módulo (10 minutos)</h3>
<p>Imprime la foto del módulo 1 o ábrela en el móvil y dibuja encima, con el dedo o con un rotulador, tres rectángulos: el 40% del protagonista, el 30% de lo complementario y el 30% de servicios y llamada a la acción. Vas a ver enseguida cuál de los tres bloques te falta. Casi siempre es el tercero. La rejilla 40/30/30 en tamaño para imprimir está en la ficha descargable del módulo 1.</p>
$m3$
  ),

  -- ---------- MÓDULO 4 ----------
  jsonb_build_object(
    'id', 'fp-mk-escaparate-primer-vendedor-m4',
    'title', 'Luz, altura y vida: los detalles que más cambian el resultado',
    'duration', 9,
    'content', $m4$
<h3>La luz hace la mitad del trabajo</h3>
<p>Un escaparate bien pensado y mal iluminado se ve peor que uno mediocre con buena luz. Y como el montaje se hace casi siempre por la mañana con la farmacia abierta, es muy fácil no darse cuenta.</p>
<p>Tres cosas que puedes comprobar esta misma tarde:</p>
<ul>
<li><strong>El escaparate tiene que ser claramente más luminoso que la calle.</strong> Si la iluminación de la acera compite con la tuya, tu escaparate desaparece. Esto se ve de noche en dos segundos.</li>
<li><strong>La luz general no basta:</strong> hace falta al menos un foco dirigido al bloque del 40%, el del mensaje y el producto protagonista. Un solo foco bien orientado cambia por completo la lectura.</li>
<li><strong>Cuidado con los reflejos.</strong> Un foco mal colocado convierte el cristal en un espejo. Se corrige moviendo el ángulo, no subiendo la potencia.</li>
</ul>
<p>Si tu escaparate se apaga al cerrar, plantéate dejar encendido al menos el foco principal unas horas más. Es el único comercial que sigue trabajando cuando tú ya estás en casa, y el consumo de un LED dirigido es pequeño.</p>

<h3>Altura: la línea de los ojos manda</h3>
<p>Repite el ejercicio del módulo 1 pero fijándote solo en alturas. Lo que está entre el metro treinta y el metro sesenta se ve sin esfuerzo. Lo de más abajo solo lo ven quienes van con niños o en silla de ruedas. Lo de más arriba, casi nadie.</p>
<p>La corrección es barata: cajas forradas, peanas de metacrilato o soportes escalonados suben el producto a la zona buena y, de paso, crean niveles. Un escaparate con tres alturas distintas se lee mucho mejor que uno donde todo está apoyado en el mismo plano.</p>

<h3>Vida: lo que cambia se mira</h3>
<p>El ojo se acostumbra a lo estático y deja de verlo. Tus vecinos pasan por delante cada día: si el escaparate es idéntico al del mes pasado, dejó de existir para ellos hace semanas.</p>
<p>No hace falta una gran producción. Basta con que algo cambie cada semana, aunque sea pequeño: girar el producto destacado, cambiar un cartel de mano, añadir un elemento de temporada. Las plantas naturales funcionan muy bien (transmiten cuidado y atención, que es justo lo que quieres comunicar), siempre que estén vivas: una planta seca en el escaparate dice lo contrario de lo que buscas.</p>
<p>Y una revisión de mantenimiento que conviene hacer siempre: mira si el sol ha amarilleado los cartones y los envases. Un envase descolorido comunica producto viejo, y esa impresión se traslada a toda la farmacia.</p>

<h3>Errores frecuentes</h3>
<ul>
<li>Montar el escaparate solo de día y no volver a mirarlo nunca de noche.</li>
<li>Dejar el producto real expuesto al sol durante meses. Para el escaparate usa envases vacíos o de exposición siempre que puedas.</li>
<li>Añadir tanta decoración estacional que ya no se ve el producto. La decoración acompaña, no protagoniza.</li>
<li>Poner un código QR y no comprobar nunca adónde lleva ni si sigue funcionando.</li>
</ul>

<h3>Tu tarea de este módulo (10 minutos)</h3>
<p>Vuelve esta noche, cuando ya haya oscurecido, y haz una segunda foto desde el mismo sitio que la del módulo 1. Ponlas una al lado de la otra. Si la de noche se ve peor, tienes el arreglo más rentable de todo el curso a tiro: un foco dirigido y un temporizador.</p>
$m4$
  ),

  -- ---------- MÓDULO 5 ----------
  jsonb_build_object(
    'id', 'fp-mk-escaparate-primer-vendedor-m5',
    'title', 'Cuatro montajes al año y cómo saber si funciona',
    'duration', 10,
    'content', $m5$
<h3>Cuatro veces al año, con fecha en el calendario</h3>
<p>Las farmacias que sacan partido a su escaparate no lo cambian cuando se acuerdan: tienen cuatro fechas puestas en el calendario y las respetan. Cuatro montajes al año es el punto de equilibrio entre el trabajo que da y el efecto que tiene.</p>
<ul>
<li><strong>Primavera (montaje a principios de marzo).</strong> Tema: renovación y preparación del buen tiempo. Tonos verdes y claros.</li>
<li><strong>Verano (montaje a finales de mayo).</strong> Tema: protección solar y viaje. Azules y blancos.</li>
<li><strong>Otoño (montaje a principios de septiembre).</strong> Tema: vuelta a la rutina, al colegio y al trabajo. Naranjas y tonos cálidos.</li>
<li><strong>Invierno (montaje a finales de noviembre).</strong> Tema: cuidado en los meses fríos y regalo de Navidad. Rojos y tonos profundos.</li>
</ul>
<p>Montar en el día de menos tráfico y a primera hora evita hacerlo con prisa y con clientes esperando. Y una vez montado, sal a la acera y míralo desde los tres sitios por los que llega la gente: de frente, viniendo por la derecha y viniendo por la izquierda. Lo que se ve perfecto de frente a veces queda tapado por una jardinera desde el lado por el que llega la mitad de tu barrio.</p>

<h3>Cómo saber si está funcionando</h3>
<p>Aquí es donde casi todo el mundo abandona, y es una pena, porque medir un escaparate no exige ningún programa ni ningún sensor. Tres indicadores y una libreta bastan.</p>
<p><strong>1. Entradas contadas en una franja fija.</strong> Elige una franja de media hora que se repita (por ejemplo, de 11:00 a 11:30 los martes) y cuenta cuánta gente entra. Hazlo dos martes antes del cambio y dos martes después. No es una medición de laboratorio, pero el orden de magnitud lo vas a ver.</p>
<p><strong>2. Consultas espontáneas sobre lo expuesto.</strong> Pide al equipo que anote con una raya en un papel cada vez que alguien pregunta por algo que está en el escaparate. Es el indicador que mejor te dice si el mensaje se entiende.</p>
<p><strong>3. Ventas del producto protagonista.</strong> Mira en tu programa de gestión las unidades vendidas del producto del bloque 40% en las cuatro semanas siguientes al montaje, y compáralas con las cuatro anteriores.</p>
<p>Si los tres suben, repite la fórmula en el siguiente montaje. Si solo sube el tercero, el escaparate está vendiendo producto pero no está atrayendo gente nueva: revisa el mensaje. Si no se mueve ninguno, casi siempre el problema está en la legibilidad desde la acera, no en el producto elegido.</p>

<h3>La ficha de aprendizaje</h3>
<p>Después de cada montaje, dedica cinco minutos a anotar tres cosas: qué mensaje pusiste, qué resultado dieron los tres indicadores y qué comentarios os hizo la gente. A la cuarta temporada tendrás algo que no se compra en ninguna parte: el histórico de lo que funciona en tu calle concreta, con tus vecinos concretos.</p>

<h3>Errores frecuentes</h3>
<ul>
<li>Cambiar el escaparate y no medir nada. Sin medición, el año que viene vuelves a empezar de cero.</li>
<li>Medir en una semana rara (fiestas locales, obras en la calle, una ola de calor) y sacar conclusiones.</li>
<li>Cambiar mensaje, productos, luz y decoración a la vez y no saber después qué fue lo que funcionó.</li>
</ul>

<h3>Hazlo hoy (10 minutos)</h3>
<p>Abre el calendario y pon ya las cuatro fechas de montaje del próximo año, con aviso una semana antes para preparar materiales. Es lo único de este curso que, si lo haces hoy, te garantiza que el resto no se quede en buenas intenciones.</p>

<h3>Para seguir</h3>
<p>En "Recursos descargables" del primer módulo tienes la ficha del test de los tres segundos, con la rejilla 40/30/30, el calendario de los cuatro montajes y la hoja de medición a treinta días. En la sección de Recursos del portal encontrarás además dos piezas que amplían este curso: el checklist de los doce elementos imprescindibles de un escaparate estacional y la plantilla de planificación de los cuatro escaparates del año.</p>
$m5$
  )

  )
)
on conflict (slug) do update set
  title = excluded.title, description = excluded.description, category = excluded.category,
  difficulty = excluded.difficulty, duration_hours = excluded.duration_hours,
  duration_minutes = excluded.duration_minutes, instructor = excluded.instructor,
  order_index = excluded.order_index, total_lessons = excluded.total_lessons,
  cover_concept = excluded.cover_concept, cover_icon = excluded.cover_icon,
  course_modules = excluded.course_modules, updated_at = now();

-- 3) CUESTIONARIO -------------------------------------------------------------
with c as (select id from courses where slug = 'fp-mk-escaparate-primer-vendedor'),
q as (
  insert into course_quizzes (course_id, title, description, passing_score, is_published, is_active, order_index)
  select c.id,
         'Cuestionario: el escaparate que hace entrar',
         'Cinco preguntas para fijar el método. Se aprueba con un 70%.',
         70, true, true, 1
  from c
  returning id
)
insert into quiz_questions (quiz_id, question, question_text, question_type, options, correct_answer, explanation, order_index, points)
select q.id, v.pregunta, v.pregunta, 'multiple_choice', v.opciones, v.correcta, v.explicacion, v.orden, 10
from q, (values
  (
    '¿Qué es lo primero que hace el ojo de quien pasa por delante de tu escaparate?',
    '["Leer el mensaje principal","Decidir si hay algo que merezca detener la mirada","Comparar precios con otra farmacia","Buscar el horario de apertura"]'::jsonb,
    1,
    'Antes de leer nada, el ojo filtra: decide si ahí hay algo que merezca la pena mirar. Por eso gana el contraste y el orden, no la cantidad de producto.',
    0
  ),
  (
    'Según la regla 40/30/30, ¿a qué se dedica el 40% del escaparate?',
    '["A los productos de temporada","A los servicios y la llamada a la acción","Al mensaje central y al producto protagonista","A los materiales que envían los laboratorios"]'::jsonb,
    2,
    'El bloque más grande es para una sola idea: tu mensaje central y el producto o servicio que mejor lo representa, con espacio libre alrededor.',
    1
  ),
  (
    '¿Cuál de estos mensajes centrales cumple la condición de ser concreto?',
    '["Tu farmacia de confianza","Salud y bienestar","Siempre a tu servicio","Tu farmacia para los primeros años"]'::jsonb,
    3,
    'Un mensaje sirve cuando dice algo que no diría cualquier otra farmacia de tu ciudad. Los tres primeros son intercambiables entre miles de farmacias.',
    2
  ),
  (
    '¿A qué altura se ve sin esfuerzo lo que colocas en el escaparate?',
    '["Entre el metro treinta y el metro sesenta","A ras de suelo, donde hay más superficie","Por encima del metro ochenta, para que se vea de lejos","La altura da igual si la luz es buena"]'::jsonb,
    0,
    'Es la línea de los ojos. Lo que queda por debajo de un metro lo ve muy poca gente y lo que queda por encima de metro ochenta, prácticamente nadie.',
    3
  ),
  (
    'Has cambiado el escaparate. ¿Cuál de estas formas de medir el resultado es válida sin comprar nada?',
    '["Contar las entradas en una franja fija repetida, antes y después","Preguntar al equipo si les parece que ha mejorado","Comparar las ventas totales del mes con las del año pasado","Esperar a que algún cliente lo comente"]'::jsonb,
    0,
    'Contar entradas en una franja fija que se repite (por ejemplo, los martes de 11:00 a 11:30) permite comparar antes y después sin sensores ni programas.',
    4
  )
) as v(pregunta, opciones, correcta, explicacion, orden);

-- 4) PUBLICAR -----------------------------------------------------------------
-- EJECUTADO el 11-09-2026 a las 20:4x, con las dos condiciones cumplidas:
--   (a) Francesc validó el texto del curso sobre la vista previa con el formato real del portal;
--   (b) el PDF responde 200 con Content-Type application/pdf y md5 d250211eb1935001e741f200d44a23d1,
--       idéntico al fichero local (verificado dos veces, la segunda tras el publish del 11-09).
-- Quedan is_published = true los dos, is_premium = false los dos. Visibles desde el lunes 14-09.
--
update resources set is_published = true where id = '9c1f7a42-5d30-4b8e-9a61-2f3c81d47e05';
update courses   set is_published = true where slug = 'fp-mk-escaparate-primer-vendedor';
