# Reto de 21 días · "Pon tu farmacia en marcha digital"

> BORRADOR — pendiente de validación de Francesc (vuelta 11-08-2026).
> Fuente: skill `rebotica-contenido` + `impulso/memory/project_rebotica_portal.md` + `portal-plan-rebotica-maestro.md` §6.
> Infra: el motor de retos del portal YA EXISTE (RPC `update_challenge_progress`, badges vía `useBadges.ts`) → esto se carga por SQL/config, no se desarrolla. Ver "Notas técnicas" al final.
> Fecha de referencia: listo el 10-09-2026 (D-day), arranca el lunes 14-09-2026.

## 0. Concepto

21 tareas de máximo 10 minutos, una al día, agrupadas en 3 semanas temáticas. Cada tarea es una acción concreta que se hace en la farmacia real, no una lectura. Nadie necesita conocimientos de marketing: cada tarea explica qué hacer, por qué y cómo saber que está hecha.

El reto es la puerta de entrada del lanzamiento: completar una semana da una recompensa intermedia (insignia + ingrediente), y completar las 3 semanas desemboca en un cajón de la Rebotica (premio sorteado con stock real, igual que cualquier otro cajón) más un diploma. Decisión ya tomada (memoria 08-07): "Retos ↔ Rebotica UNIDOS en dos tiempos" — en el lanzamiento el reto desemboca en cajón; en fase 2 (octubre) se integra con la Fórmula Magistral.

### Las 3 semanas

| Semana | Días | Tema | Insignia |
|---|---|---|---|
| 1 | 1-7 | Visibilidad — que os encuentren | Insignia Escaparate |
| 2 | 8-14 | Mostrador y equipo — que rentabilicéis lo que ya tenéis | Insignia Mostrador |
| 3 | 15-21 | Números — que sepáis dónde estáis y a dónde vais | Insignia Cuentas Claras |

Al completar las 3: **Diploma "Farmacia en Marcha Digital"** + apertura del **Cajón del Reto** (premio final, ver §4).

### Reglas de redacción de cada tarea (heredadas)

- Castellano de España (vosotros), farmapro en minúsculas, sin emojis, sin raya larga.
- Nunca prometer resultados sanitarios: son tareas de gestión y comunicación, no clínicas.
- Cifras solo si vienen de una newsletter ya publicada, siempre con la etiqueta "estimación sectorial" que ya llevaban en origen.
- Tono acompañante, nunca de examen: el objetivo es que la tarea se sienta posible en 10 minutos entre dos clientes.

### Tabla de conexión con las píldoras de tanda 1

Las 21 tareas se apoyan en las 8 píldoras ya validadas para producir (`farmapro-portal/contenido/`, aún pendientes de redactar como píldoras individuales — este reto es el hilo narrativo que las conecta día a día):

| Píldora (N de origen) | Semana | Días donde aparece |
|---|---|---|
| N01 — La Farmacia Silenciosa (onboarding) | 1 | Día 1, Día 6 |
| N06 — Google My Business | 1 | Días 2, 3, 4, 5, 18 |
| N03 — Del mostrador a la rentabilidad (categorías) | 2 | Días 8, 9 |
| N17 — Dermocosmética, categoría estrella | 2 | Días 10, 11 |
| N05 — Stock muerto | 2 | Día 12 |
| N04 — Equipo desmotivado | 2 | Días 13, 14 |
| N08 — El cliente que no vuelve (fuga silenciosa) | 3 | Días 15, 16, 17 |
| N21 — Las 5 palancas de la rentabilidad | 3 | Días 19, 20, 21 |

Cada tarea no exige haber hecho la píldora antes (el reto funciona solo), pero quien complete también la píldora de esa N tiene el contexto completo — se enlaza la píldora correspondiente desde la tarea del día en el portal.

---

## 1. Semana 1 — VISIBILIDAD (días 1-7)

> Ingrediente semanal: "vuestra farmacia, encontrable." Al completar los 7 días: insignia Escaparate + 1 recurso premium desbloqueado (del catálogo de recursos, elegido por Francesc/Alejandro entre los ya existentes con candado).

**Día 1 — Detectad vuestra farmacia silenciosa**
Qué hacer: cronometrad cuánto tarda el equipo en dar la primera señal (mirada, saludo) a los 5 primeros clientes de la mañana.
Por qué: es la primera pista de si estáis perdiendo ventas sin veros — el estándar es menos de 20 segundos para el primer contacto.
Cómo sabéis que está hecha: anotáis el tiempo medio de los 5 clientes en el portal.
Conecta con: píldora N01.

**Día 2 — Buscaos en Google**
Qué hacer: desde el móvil, sin sesión iniciada, buscad "farmacia + vuestra zona" y anotad en qué posición aparecéis.
Por qué: la mayoría de búsquedas de "farmacia cerca" acaban en visita física (estimación sectorial, ver píldora N06) — quien no aparece en los tres primeros resultados pierde clics.
Cómo sabéis que está hecha: capturáis pantalla del resultado y la posición anotada.
Conecta con: píldora N06.

**Día 3 — Poned el reloj en hora**
Qué hacer: entrad en vuestra ficha de Google (Google Business Profile) y revisad horarios, teléfono y guardias.
Por qué: una ficha con horarios desactualizados genera desconfianza y llamadas de más preguntando si estáis abiertos.
Cómo sabéis que está hecha: la ficha refleja los datos de hoy, festivos incluidos.
Conecta con: píldora N06.

**Día 4 — Tres fotos que hablen bien de vosotros**
Qué hacer: subid 3 fotos reales (fachada, interior, equipo) a la ficha de Google.
Por qué: un perfil con fotos reales de calidad genera más confianza que uno vacío o con fotos genéricas.
Cómo sabéis que está hecha: contáis 3 fotos nuevas subidas hoy.
Conecta con: píldora N06.

**Día 5 — Pedid una opinión**
Qué hacer: a un cliente satisfecho de hoy, enseñadle el enlace o QR para dejar una reseña de Google.
Por qué: la mayoría de la gente mira las reseñas antes de decidir a qué farmacia ir.
Cómo sabéis que está hecha: hay una reseña nueva o pendiente de publicarse.
Conecta con: píldora N06.

**Día 6 — Miraos desde fuera**
Qué hacer: entrad en vuestra propia farmacia como si fuerais clientes por primera vez (o pedidle a alguien que no trabaje allí) y anotad una cosa que actúa como barrera: el mostrador, la señalización, la postura del equipo.
Por qué: son las señales silenciosas que espantan sin que nadie diga una palabra.
Cómo sabéis que está hecha: una anotación concreta en el portal.
Conecta con: píldora N01.

**Día 7 — Cierre de semana: repaso de escaparate**
Qué hacer: comparad lo anotado el día 1 (tiempo de primer contacto) y el día 2 (posición en Google) con cómo estáis hoy.
Por qué: medir es la única forma de saber si una tarea de 10 minutos ha servido de algo.
Cómo sabéis que está hecha: una línea de conclusión + reclamáis la insignia Escaparate.
Conecta con: N01 + N06 (cierre de semana).

---

## 2. Semana 2 — MOSTRADOR Y EQUIPO (días 8-14)

> Ingrediente semanal: "vuestro espacio y vuestro equipo, trabajando para vosotros." Al completar los 7 días: insignia Mostrador + 2 créditos IAFarma.

**Día 8 — Dibujad vuestro mapa**
Qué hacer: dibujad un plano sencillo de la farmacia y coloread 3 zonas según vuestra intuición de rentabilidad (verde, ámbar, rojo).
Por qué: buena parte del espacio de una farmacia media se dedica a categorías de bajo rendimiento sin que nadie lo haya decidido así (estimación sectorial, ver píldora N03).
Cómo sabéis que está hecha: una foto del plano coloreado.
Conecta con: píldora N03.

**Día 9 — Vuestro top 5 y vuestro flop 5**
Qué hacer: anotad las 5 categorías que creéis que más rentabilidad dan por metro cuadrado, y las 5 que menos.
Por qué: es el primer paso para decidir qué espacio merece cada cosa, antes de mover nada físicamente.
Cómo sabéis que está hecha: las dos listas escritas.
Conecta con: píldora N03.

**Día 10 — Radiografía de dermocosmética en 10 minutos**
Qué hacer: anotad qué porcentaje de la facturación de parafarmacia es dermocosmética, cuántas marcas tenéis y el margen medio aproximado.
Por qué: suele ser la categoría con más margen y menos espacio dedicado en la mayoría de farmacias (píldora N17).
Cómo sabéis que está hecha: los 3 datos anotados, aunque sean aproximados.
Conecta con: píldora N17.

**Día 11 — Dos minutos de escucha**
Qué hacer: en la próxima consulta de dermocosmética, practicad 2 minutos de escuchar antes de recomendar nada.
Por qué: el protocolo de consulta empieza por entender la piel y la necesidad real, no por vender la crema más cara.
Cómo sabéis que está hecha: lo habéis hecho al menos una vez hoy.
Conecta con: píldora N17.

**Día 12 — Semáforo de 10 referencias**
Qué hacer: elegid 10 referencias de baja rotación y clasificadlas en verde (rota bien), ámbar (va a menos) o rojo (lleva meses parada).
Por qué: es el primer paso del método de los tres niveles contra el stock muerto.
Cómo sabéis que está hecha: la lista de 10 con su color.
Conecta con: píldora N05.

**Día 13 — El perfil de cada uno**
Qué hacer: escribid en una línea el perfil de cada miembro del equipo (quien tira más de vocación sanitaria, quien de una categoría concreta, quien del grupo) y asignad de palabra una categoría "responsable" a alguien.
Por qué: un equipo desconectado hace menos venta cruzada sin ni siquiera notarlo.
Cómo sabéis que está hecha: la lista de perfiles + la categoría asignada.
Conecta con: píldora N04.

**Día 14 — Cierre de semana: registro de impacto**
Qué hacer: anotad 2 intervenciones sanitarias o de asesoramiento relevantes que haya hecho el equipo hoy, no solo ventas.
Por qué: es el primer paso de un hábito que reconoce el trabajo del equipo más allá de la caja.
Cómo sabéis que está hecha: las 2 anotaciones + reclamáis la insignia Mostrador.
Conecta con: N03 + N17 + N05 + N04 (cierre de semana).

---

## 3. Semana 3 — NÚMEROS (días 15-21)

> Ingrediente semanal: "vuestros números, bajo control." Al completar el reto entero (día 21): insignia Cuentas Claras + apertura del Cajón del Reto + diploma.

**Día 15 — Vuestros 10 de siempre**
Qué hacer: pensad en 10 clientes habituales que hace tiempo no véis y clasificadlos: verde (viene igual), ámbar (menos que antes), rojo (ha desaparecido).
Por qué: la mayoría de clientes que dejan de venir no lo dicen, simplemente no vuelven (estimación sectorial, ver píldora N08).
Cómo sabéis que está hecha: la lista de 10 con su color.
Conecta con: píldora N08.

**Día 16 — Preguntad sin miedo**
Qué hacer: a un cliente habitual, preguntadle hoy, de forma casual, si todo va bien con vosotros.
Por qué: detectar pronto es más barato que recuperar después — recuperar un cliente cuesta bastante más que retenerlo.
Cómo sabéis que está hecha: lo habéis preguntado al menos una vez.
Conecta con: píldora N08.

**Día 17 — Poned una alerta sencilla**
Qué hacer: definid una señal simple (agenda, nota, aviso al equipo) para detectar cuándo un cliente habitual lleva más de 30 días sin venir.
Por qué: cierra el ciclo de detección de la fuga silenciosa que empezasteis el día 15.
Cómo sabéis que está hecha: la señal está definida y el equipo la conoce.
Conecta con: píldora N08.

**Día 18 — Repaso de escaparate, 10 días después**
Qué hacer: volved a buscar "farmacia + vuestra zona" y comparad con lo que anotasteis el día 2.
Por qué: medir de nuevo es la única forma de saber si las tareas de la semana 1 sirvieron de algo.
Cómo sabéis que está hecha: la comparación anotada.
Conecta con: píldora N06 (segunda medición).

**Día 19 — Elegid vuestra palanca**
Qué hacer: de las 5 palancas de la rentabilidad (visibilidad, conversión, captación, diversificación, sistematización), elegid la que vais a trabajar el próximo trimestre y anotad una acción concreta.
Por qué: las farmacias que crecen activan una palanca por trimestre, no las cinco a la vez (estimación sectorial, ver píldora N21).
Cómo sabéis que está hecha: la palanca elegida + la acción anotada.
Conecta con: píldora N21.

**Día 20 — El test, otra vez**
Qué hacer: repetid el test de autodiagnóstico de las 5 palancas (píldora N21) y comparadlo con cómo os hubierais visto hace 21 días.
Por qué: cerrar el reto viendo el cambio real, no solo la lista de tareas hechas.
Cómo sabéis que está hecha: el resultado del test + una línea de comparación.
Conecta con: píldora N21.

**Día 21 — Cierre del reto: lo que os lleváis**
Qué hacer: escribid en una línea el cambio que más habéis notado en estas 3 semanas.
Por qué: cierra el reto con algo propio, no solo con tareas marcadas.
Cómo sabéis que está hecha: la línea escrita + reclamáis la insignia Cuentas Claras.
Conecta con: N08 + N21 (cierre del reto completo).

---

## 4. Premio final: Cajón del Reto + Diploma

Al completar el día 21 se desbloquea un cajón especial de la Rebotica (mismo mecanismo de sorteo ponderado con stock real que cualquier otro cajón, `source = 'reto'` en `rebotica_openings`), más un diploma descargable.

**Cajón del Reto**: quien completa el reto es un suscriptor de pago (el reto vive dentro del portal; un plan Gratis no puede realizarlo), así que el pool NO es el del Cajón de Bienvenida: nada de pases Plus 72h ni meses de Plus (regla de premios v2: a quien paga no se le regala suscripción de su propio nivel). Pool del Cajón del Reto, tomado del catálogo T1 v3 para planes de pago: créditos/imágenes IAFarma (incl. dobles), masterclass del vault, plantilla "solo cajón", recurso premium desbloqueado, "tu duda respondida en la newsletter" y tier-up (Plus puede ganar 1 mes de Equipo; Equipo recibe el resto del pool). Caducidad estándar 7-14 días. Si algún día se abre una versión del reto al plan Gratis, esa variante sí usaría el pool de Bienvenida.

**Diploma "Farmacia en Marcha Digital"**: PDF descargable/imprimible de marca farmapro, con el nombre de la farmacia, la fecha de finalización y una frase de cierre (propuesta, a validar):

> "[Nombre de la farmacia] ha completado el Reto de 21 días de la Rebotica: 21 acciones concretas para hacer que la farmacia se vea, se organice mejor y retenga a quien ya confía en ella."

Sin promesas sanitarias, sin cifras de resultado inventadas. Pensado para poder colgarse en la rebotica real, igual que la placa de los ganadores del Gordo — mismo espíritu de "objeto-foto" que ya funciona en el resto del proyecto.

---

## 5. Notas técnicas (para la sesión que lo cargue, no para esta sesión)

- El motor de retos ya existe (`update_challenge_progress`, badges en `useBadges.ts`): esto se carga por SQL/config, no se desarrolla desde cero. Definir si las 3 semanas son 3 sub-hitos de un mismo reto o 3 retos encadenados — decisión de diseño de quien lo cargue (skill `rebotica-tecnica`).
- **Flag bloqueante para el premio final**: el esquema actual de `rebotica_openings.source` (migración `20260709120000_rebotica_schema_tanda1.sql`) solo admite `welcome/quincena/aniversario/equipo` como CHECK. Falta añadir `reto` como origen válido antes de poder registrar la apertura del Cajón del Reto. Es una migración menor (ALTER del CHECK), pero hay que hacerla antes de que el reto llegue a producción.
- El diploma es un PDF estático generado con los datos de la farmacia (nombre + fecha): puede resolverse con una plantilla simple (igual que la placa grabada del Gordo, pero digital) — no requiere diseño complejo para el lanzamiento.
- Las píldoras de tanda 1 (N01, N06, N05, N04, N03, N17, N08, N21) siguen pendientes de redactarse como fichero individual en `farmapro-portal/contenido/` — este documento da el hilo narrativo, no sustituye la píldora.
