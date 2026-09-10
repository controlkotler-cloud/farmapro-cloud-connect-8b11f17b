# Plan de contenido y captación — del 10-09 al 30-11 de 2026

> Escrito el 10-09-2026, día del lanzamiento del portal, con decisiones de Francesc de ese
> mismo día. **Sustituye como fuente de cadencia** a `portal-plan-contenido.md` y a las filas
> de contenido de `portal-plan-lanzamiento-30-dias.md`.
>
> El cambio de fondo: hasta hoy Impulso era el motor y todo lo demás colgaba de él. Desde hoy
> **el motor es el portal**: suscriptores nuevos y que los de dentro no se vayan. Impulso pasa
> a ser el canal de captación, no el producto.

## 1. Canon de cadencia (cerrado 10-09-2026)

Principio: **una novedad visible cada semana**, alternando con el calendario de Impulso. La
semana que sale Impulso, la novedad es su descargable. La semana que no, un curso.

| Pieza | Cadencia | Quién |
|---|---|---|
| Cursos nuevos | **2/mes**, amplios y completos | sesión de contenido |
| Descargables | **2-4/mes**; los de Impulso entran en el portal **el mismo jueves del envío** | sesión de montaje |
| Píldoras | **1-2/mes** (sustituyen al evento interno mensual, descartado) | sesión de contenido |
| Masterclass | **1/mes, ligada al cajón del mes** | Siempre las graba Alejandro (Laura no sale en vídeo) |
| Cajón de la Rebotica | **1/mes** (era quincenal hasta el 10-09) | skill `rebotica-quincena` |
| Reto | **semanal**, lunes a domingo, y **da entrada extra al cajón** | automático (por montar) |
| Email de novedades | **cada lunes, solo a cuentas del portal**, por la infra del portal | automático (por montar) |
| Webinar abierto de captación | **1/mes, opcional** — se hace si hay agenda, no bloquea nada | Alejandro |

**Estreno del mes garantizado:** 2 cursos + 2-4 descargables + 1 masterclass + 1-2 píldoras +
1 cajón + 4 retos semanales + créditos IAFarma renovados.

**Qué significa "curso amplio"** (mínimo por escrito, para que no se degrade a píldora
disfrazada): **4 módulos, 8 lecciones, 45 minutos**. Por debajo de eso es una píldora y se
etiqueta como tal. Hoy hay 35 cursos publicados y 122 lecciones: varios son de 1 módulo, y ese
es justo el vicio que el mínimo evita.

## 2. Punto de partida real (verificado en producción, 10-09-2026)

| Dato | Valor |
|---|---|
| Cursos | 35, **todos publicados** (0 en reserva) |
| Recursos descargables | 68, **todos publicados** (0 en reserva) |
| Eventos | 23 (11 futuros, hasta mayo-2027) |
| Plantillas de reto semanal | 8, de las que **7 nunca se han usado** |
| Reto activo | "Semana del Experto", 07→13-09 |
| Cuentas del portal | 27 (23 freemium, 1 Plus, 3 admin) |
| Cron del portal | pg_cron activo con 4 jobs + cola de email cada 5 s |

No hay contenido cargado esperando a publicarse: el depósito está vacío y **todo lo de octubre
hay que producirlo**. La **masterclass 2 ya está grabada y la protagoniza Alejandro** (queda
confirmar que está subida a Bunny y cableada en el vault): octubre está cubierto. Pendiente de
grabar: **masterclass 3 (Alejandro, para noviembre)** y los vídeos 17-A/B/C. Ninguna pieza en
vídeo se asigna a Laura: su voz va siempre en formato escrito.

## 3. Lo que queda de septiembre, semana a semana

### Semana 14-20 · novedad = descargable de N28

| Día | Qué | Estado |
|---|---|---|
| Lun 14 | Email "por si se os pasó" a quien no abrió el del jueves | **ya en borrador en Clientify** |
| Lun 14 | Arranca el reto de 21 días | producido |
| Lun 14 | Activar el reto semanal a mano (la automatización aún no está) | acción manual |
| Lun 14 | Publicar 1 píldora nueva (para que el lunes tenga novedad propia) | **por producir** |
| Jue 17 | **N28** + su descargable, que se sube al portal ese mismo jueves | **por redactar** |
| Vie 18 | Cifras de la semana de lanzamiento (altas, aperturas, plazas fundador) | medición |

**N28 — tema decidido:** "La rentabilidad oculta: 5 ratios financieros que pocos titulares
miden", con el Excel "cuenta de resultados de bolsillo" como complemento, tal como ya preveía
el pipeline de descargables. Se descarta el tema que figuraba en el calendario maestro
("cierre de la serie"), porque **la serie no se cierra**: Impulso continúa como N29 y
siguientes. El recordatorio de plazas de fundador va en el cierre, no en el cuerpo.

### Semana 21-27 · novedad = curso nuevo nº 1

| Día | Qué |
|---|---|
| Lun 21 | **Primer email de novedades automático** (ver §5, T1) |
| Lun 21 | Publicar **curso amplio nº 1** |
| Jue 24 | **C9 — la campaña que cierra las plazas de fundador** (con el número real de plazas del día) |

**Corrección al plan anterior:** había un "cajón nº 2 patrocinado" fechado el 24-09. Con la
cadencia mensual, el cajón de bienvenida cubre todo septiembre y **el siguiente es el de
octubre**. El 24-09 no lleva cajón.

### Semana 28-09 / 04-10 · novedad = curso nuevo nº 2

| Día | Qué |
|---|---|
| Lun 28 | Email de novedades + **curso amplio nº 2** |
| Jue 1-10 | **N29** — primer número de la serie nueva, con su descargable al portal ese jueves |
| Jue 1-10 | Abre el **cajón de octubre** + masterclass del mes visible en el vault |

## 4. Octubre y noviembre

Jueves de envío (quincenal alterno, sin cambios): **N29** 01-10 · **C10** 08-10 · **N30** 15-10
· **C11** 22-10 · **N31** 29-10 · **C12** 05-11 · **N32** 12-11 · **C13** 19-11 · **N33** 26-11.

| Mes | Cursos (2) | Descargables | Píldoras | Masterclass | Cajón | Comercial |
|---|---|---|---|---|---|---|
| Oct | nº 3 (lun 06) y nº 4 (lun 20) | N29 y N30 + 1 propio del portal | 2 | nº 2, Alejandro (**ya grabada**; cablear en el vault antes del 01-10) | 01-10 | C10 Manual de procesos · C11 la Rebotica |
| Nov | nº 5 (lun 03) y nº 6 (lun 17) | N31, N32 y N33 | 2 | nº 3, Alejandro (**grabar antes del 25-10**) | 02-11 | C12 Coaching · C13 Campañas anuales |

**Serie comercial: el destino cambia.** Hasta ahora cada C vendía un servicio del catálogo.
Desde C9, la mitad de los slots venden el portal y la otra mitad un servicio, porque el
servicio sigue siendo lo que factura y el portal lo que escala. C9 portal (cierre de
fundadores), C10 servicio, C11 portal/Rebotica, C12 servicio, C13 servicio + balance de año.

**Temas de los cursos:** se sacan de N1-N27 y de las 24 fichas limpias de La Cantera, agrupando
por familia hasta llegar al mínimo de 4 módulos. Antes de producir cada uno hay que **cotejar
el título contra los 35 cursos ya publicados** para no duplicar: ese error es fácil con 35 en
catálogo y nadie lo detectaría hasta verlo en la web.

**Webinar abierto:** queda planificado sin ser obligatorio. Fechas tentativas, jueves sin
envío: **23-10** y **27-11**. Si Alejandro no tiene agenda, se cae sin consecuencias para el
resto del plan.

## 5. Las cinco piezas técnicas que sostienen el plan

En orden de prioridad. Ninguna es grande, pero sin ellas el plan es manual para siempre.

**T1 · Email de novedades de los lunes** *(antes del 21-09)*
Plantilla nueva en `_shared/portalEmailTemplates.ts` (repo, gratis) + cron semanal en SQL
(gratis). **No va por Clientify**: va por `send-portal-email` → cola `transactional_emails` →
API de Lovable, coste 0 € y cero trabajo semanal. Límite 100/hora: irrelevante con 27 cuentas,
y cuando se pase se escalona el lote. Hay que pedirle a Lovable el redeploy de esa edge
function. Estructura fija del email: la novedad de la semana (2 líneas de para qué sirve), el
reto de la semana y que da entrada al cajón, el recordatorio de lo que trae cada mes, y un
hilo de la comunidad. **Hay que respetar `user_notification_settings`**, que existe, el usuario
puede configurar y hoy **no la lee ningún emisor**: este email será el primero que la consulte.

**T2 · Automatizar el reto semanal** *(antes del 21-09)*
Cron los lunes 06:00 que replique lo que hoy hace el botón de admin. Hacen falta tres arreglos
además del cron: una columna de orden o `last_used_at` en `weekly_challenge_templates` (hoy el
cron no sabría cuál toca), desactivar los retos de semanas pasadas (hoy quedan activos con
fecha vencida) y arreglar la tarjeta del dashboard, que no filtra por fechas y **puede estar
mostrando un reto caducado ahora mismo**.

**T3 · El reto da entrada al cajón** *(con T2)*
`rebotica_openings.source` ya admite `'reto'`, así que es una migración pequeña. Es lo que
convierte el reto de un número en una razón para entrar cada lunes.

**T4 · Puente descargable de Impulso → portal** *(antes del 17-09)*
Hoy los PDF se sirven desde el bucket `lead-magnets` con enlace directo y el portal no
interviene. Hay que: subir el recurso al portal el mismo jueves, enlazarlo desde el email con
retorno tras el login, y que **el descargable del número en curso no consuma el tope de 3
descargas del plan gratis** — la promesa de 27 números no se rompe. El archivo histórico de 68
recursos sí sigue dentro del tope: ese es el gancho de pago.
**Y la pieza que más decide:** la pantalla donde cae el lector a descargar es **comercial**.
No es un botón de descarga: es la página que cierra el alta. Se trabaja con CRO, y su único
trabajo es que quien venía por un PDF acabe con cuenta.

**T5 · "Nuevo esta semana" visible en el portal** *(octubre)*
Bloque en el dashboard. Hoy el banner de novedades existe en el repo pero es código muerto: no
se importa en ningún sitio y no está en el bundle desplegado.

## 6. Ganchos del portal: dónde se ponen, por orden de alcance

El portal no se vende solo en las campañas. Por orden de lectores alcanzados por hora de
trabajo:

1. **Cierre estándar de los artículos del blog** (`farmapro-direct/src/pages/Post.tsx:37`): un
   solo cambio alcanza todo el blog de golpe. Hoy remata con "nuevo contenido cada quincena" y
   no menciona el portal.
2. **El descargable de cada Impulso, dentro del portal** (T4). Cada número pasa a ser una
   puerta de alta en vez de un PDF que se va al escritorio.
3. **Bloque de cierre de Impulso**, firma de Laura, sin precio: qué hay dentro y qué llega cada
   mes. No es venta: es decirle al lector que puede seguir.
4. **Respuestas de palabra-gancho** (PANEL, RADIOGRAFIA, MENSAJES), que contesta Alejandro a
   mano: una línea del portal en cada una.
5. **Landings de servicios y /radiografia**: ya etiquetan las altas; les falta el bloque del
   portal.
6. **Redes, 3 posts/semana**, uno de ellos siempre de una novedad real del portal.

## 7. Cómo se mide

Semanal, los viernes: altas nuevas, cuentas activas, plazas de fundador restantes, aperturas
del email del lunes, retos completados y aperturas de cajón. Mensual: bajas y de qué plan,
descargas por recurso, y cursos empezados frente a terminados. La pregunta que contesta el
panel es una sola: **¿el estreno del mes está frenando las bajas?**

## 8. Trabas conocidas que no hay que volver a descubrir

- Desplegar una edge function **no lo hace el push**: lo pide Francesc a Lovable.
- Las listas de Clientify **no existen en la API**: se segmenta por etiqueta, nunca por lista.
- Los envíos masivos van **solo a abridores** (~5.300 contactos) por la reputación del dominio.
- La etiqueta `portal-cuenta` **no se pone sola**: es un CSV a mano. Razón de más para que el
  email del lunes no pase por Clientify.
- Los recursos estáticos del portal necesitan `deploy_project`; el push no basta.
