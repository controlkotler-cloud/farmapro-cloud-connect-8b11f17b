# Plan de contenido para lanzar el portal farmapro

> Borrador operativo para sembrar el contenido mínimo del portal de formación y comunidad
> (`farmapro-portal`, Supabase). Pensado para un lanzamiento real y digno, no para llenar
> por llenar. Fecha: 2026-06-18.
>
> Acompaña al archivo `portal-curso-muestra.sql` (un curso completo de ejemplo, listo para
> ejecutar, que sirve de plantilla para el resto).

---

## 0. Resumen ejecutivo (TL;DR)

- **Sembrar a mano, no apoyarse en el generador de IA.** El generador actual (`generate-daily-course`
  / `generate-daily-resource`) produce contenido genérico, no farmacéutico de verdad, escribe
  en la columna JSONB pero deja el curso **sin publicar y sin quiz**, y arrastra inconsistencias
  de esquema. Para el lanzamiento, contenido curado. El generador se deja apagado o como apoyo
  posterior (ver sección 5).
- **MVP recomendado: 6 cursos** (uno por cada una de las 5 categorías + un "curso ancla"
  transversal de bienvenida), **8-12 recursos descargables**, y **6-8 hilos de foro sembrados**
  para que la comunidad no nazca vacía.
- **Cada curso publicado necesita su quiz** (con `is_active = true` Y `is_published = true`),
  porque la finalización del curso y los retos de gamificación dependen de aprobar el quiz.
- **Regla de oro de visibilidad:** un curso sólo se ve si `is_published = true`. Un quiz sólo se
  ve si `is_active = true` (y, por coherencia con el hardening de seguridad, también
  `is_published = true`). Ver "Gotchas de esquema" más abajo.

---

## 1. Gotchas de esquema que condicionan el contenido (leer antes de sembrar)

Estos son los puntos donde es fácil equivocarse al insertar contenido. Verificados contra
`supabase/migrations/*.sql` y `src/integrations/supabase/types.ts`, **y contra lo que el frontend
realmente lee** (`useCourseData`, `useCourses`, `useQuiz`, `ModuleContentSection`).

### 1.1 El contenido del curso vive en la columna JSONB `courses.course_modules`, NO en las tablas relacionales

- Existen tablas `course_modules` y `course_lessons` (relacionales), **pero el portal del alumno
  no las lee**. `CourseView.tsx` hace `const modules = course?.course_modules || []` leyendo el
  campo **JSONB** `courses.course_modules`. Las tablas relacionales hoy son "esquema muerto" para
  la vista de alumno.
- Por tanto: **para que un curso se vea con módulos, hay que rellenar el JSONB
  `courses.course_modules`.** La muestra SQL lo hace. (Adicionalmente, y de forma opcional, la
  muestra también inserta filas en las tablas relacionales por higiene de datos y por si el panel
  admin o un futuro refactor las usa; no es obligatorio.)
- **Forma EXACTA de cada módulo dentro del JSONB** (definida en `src/types/course.ts`):
  ```json
  {
    "id": "string-unico-estable",   // OBLIGATORIO y único: el progreso por módulo se guarda por este id
    "title": "string",
    "content": "string con HTML",    // se renderiza con dangerouslySetInnerHTML + DOMPurify
    "duration": 12,                   // ¡ojo! la clave es "duration", NO "duration_minutes"
    "video_url": null,
    "downloadable_resources": [ { "title": "...", "url": "...", "type": "pdf" } ]
  }
  ```
  - El `id` de cada módulo debe ser único y estable: `useModuleProgress` guarda el avance en
    `localStorage` con ese id y el desbloqueo del módulo siguiente depende de él. Usar slugs tipo
    `"m1-intro"`, `"m2-..."`.
  - El `content` se sanea con DOMPurify y se pinta dentro de `.prose`. **Escribir HTML semántico**
    (`<p>`, `<h3>`, `<ul><li>`, `<strong>`, `<blockquote>`). Markdown crudo NO se interpreta.

### 1.2 El quiz se lee de `quiz_question_options`, no del JSONB `options`

- `useQuiz` carga `quiz_questions` con un join a `quiz_question_options (*)` y decide la respuesta
  correcta con `option.is_correct === true`. **La columna `quiz_questions.options` (JSONB) y
  `quiz_questions.correct_answer` NO las usa la vista de alumno.**
- Aun así, `quiz_questions.options` es `NOT NULL DEFAULT '[]'` y `correct_answer` es
  `NOT NULL DEFAULT 0`. La muestra rellena ambos modelos (el JSONB por compatibilidad con el
  panel admin / generador, y la tabla `quiz_question_options` porque es la que de verdad pinta el
  alumno). **La fuente de verdad para el alumno es `quiz_question_options.is_correct`.**

### 1.3 Banderas de visibilidad ("gates")

| Tabla | Se ve para el usuario normal cuando… | Notas |
|---|---|---|
| `courses` | `is_published = true` | RLS: `is_published = true OR is_current_user_admin()` |
| `course_quizzes` | `is_active = true` (consulta del front) | El hardening fuerza además `is_published = true` donde `is_active`. **Poner ambos a true.** |
| `quiz_questions` | siempre visibles (RLS `USING true`) | No tienen flag propia |
| `quiz_question_options` | siempre visibles (RLS `USING true`) | No tienen flag propia |
| `resources` | `is_published = true` | RLS igual que cursos |
| `course_lessons` (relacional) | `is_free = true` OR acceso al curso | Sólo relevante si algún día se usan las tablas relacionales |

- **Acceso premium:** `courses.is_premium = true` exige `profiles.subscription_role != 'freemium'`
  (lógica en `useCourses.canAccessCourse`). Para el lanzamiento, dejar **la mayoría de cursos del
  MVP como `is_premium = false`** (gratis para registrados) y reservar 1-2 como premium para dar
  motivo a la suscripción.

### 1.4 Columnas duplicadas (legado de migraciones) — rellenar las dos para evitar sorpresas

- `courses` tiene **`duration_hours`** (numeric) **y** `duration_minutes` (int). Rellenar ambas
  coherentes.
- `resources` tiene **`download_count`** **y** `downloads_count` (dos columnas distintas). Poner
  ambas a 0.
- `quiz_questions` tiene `question` **y** `question_text`; `course_quizzes` se relaciona vía
  `course_id`. Rellenar `question` (obligatoria) y `question_text` igual.

### 1.5 Otros requisitos NOT NULL / UNIQUE relevantes

- `courses.slug` y `resources.slug`: **UNIQUE y NOT NULL**. Usar slugs en minúsculas con guiones.
- `courses.title`, `course_quizzes.title`, `quiz_questions.question`, `quiz_question_options.option_text`:
  NOT NULL.
- Enums: `course_category` = `ventas | marketing | gestion | liderazgo | atencion | otros`
  (+ añadidos por migración: `atencion_cliente`, `tecnologia`). **Recomendación: usar el set
  canónico de 5 del proyecto** → `ventas`, `marketing`, `gestion`, `liderazgo`, `atencion`.
  (Evitar `atencion_cliente`/`tecnologia` salvo necesidad: duplican intención y ensucian filtros.)
  `resource_type` válido = `pdf | video | infografia | plantilla | guia | otro` (+ `protocolo`,
  `calculadora`, `checklist`, `manual`, `herramienta`).

---

## 2. Set de lanzamiento recomendado (MVP)

Realista para arrancar con dignidad y poder crecer. Todo curado a mano, en la voz de farmapro.

### 2.1 Cursos: 6 en total (≈ 3-4 módulos cada uno, contenido real)

Uno por categoría + un curso ancla de bienvenida. Estructura objetivo por curso:
**3-4 módulos**, cada módulo **400-700 palabras de contenido útil** en HTML, **1 quiz de 4-5
preguntas**. Duración declarada realista (45-90 min/curso).

| # | Curso (título de trabajo) | Categoría | Premium | Notas |
|---|---|---|---|---|
| 1 | **El mostrador que vende sin presionar: venta cruzada ética en la farmacia** | `ventas` | No | Curso ancla recomendado + **es el que entrega la muestra SQL**. Conecta con el servicio "Auditoría Farmacia Silenciosa". |
| 2 | **Google My Business y reseñas: que te encuentren antes que a la de enfrente** | `marketing` | No | Conecta con servicio GMB/SEO local (campaña C2). |
| 3 | **Stock muerto y márgenes: gestión de categorías sin morir en el intento** | `gestion` | Sí | Premium: gancho de suscripción. Conecta con "Auditoría de Stock Muerto". |
| 4 | **Liderar tu equipo de mostrador: del "porque lo digo yo" al equipo que propone** | `liderazgo` | No | Conecta con "Programa Liderazgo y Equipo" (N22). |
| 5 | **Atención al cliente difícil: protocolos para quejas, esperas y devoluciones** | `atencion` | No | Conecta con experiencia de cliente / mystery shopper. |
| 6 | **Bienvenida a farmapro: cómo sacar partido al portal en 30 minutos** | `otros` | No | Curso corto (2 módulos) de onboarding; sube la tasa de "primer curso completado" (badge Primer Paso). |

> Por qué 6 y no más: cubre las 5 categorías (los filtros de `/formacion` no quedan vacíos),
> da una razón clara para suscribirse (curso 3 premium), incluye un onboarding que dispara la
> gamificación, y es una cantidad que se puede redactar con calidad real antes de lanzar. Se
> amplía después, 1-2 cursos/quincena, reaprovechando material de las newsletters.

### 2.2 Recursos descargables: 8-12

Reutilizar los descargables que ya existen de las newsletters (checklists, plantillas Excel,
calculadoras, guías PDF). Mínimo viable: **2 por categoría**. Mezcla de tipos para que la página
de recursos se vea variada:

- `atencion`: *Checklist de atención en mostrador* (`checklist`/pdf), *Protocolo de gestión de
  quejas* (`protocolo`/pdf).
- `marketing`: *Plantilla de calendario de contenidos 15-15-15* (`plantilla`/xls→`format='xls'`),
  *Guía de fichas GMB optimizadas* (`guia`/pdf).
- `gestion`: *Calculadora de stock muerto* (`calculadora`/xls), *Plantilla de análisis de
  categorías* (`plantilla`/xls).
- `liderazgo`: *Guía de reuniones de equipo de 15 minutos* (`guia`/pdf), *Checklist de delegación*
  (`checklist`/pdf).
- `ventas`: *Guía de venta cruzada ética por categorías* (`guia`/pdf), *Checklist de cierre de
  venta en mostrador* (`checklist`/pdf).
- 1-2 premium para reforzar la suscripción (p. ej. la calculadora de stock muerto como `is_premium=true`).

Todos con `is_published = true`. Subir los ficheros reales al bucket `recursos` de Storage y
poner la URL pública en `file_url` (o enlazar a los PDF/Excel ya generados de las newsletters).

### 2.3 Comunidad: sembrar 6-8 hilos de foro

Una comunidad vacía mata la percepción de valor. Antes de abrir, sembrar hilos creados por el
**usuario admin** (`control@mkpro.es`, id `9ab8b139-2fc3-4987-88a8-a15cc703539b`) o por 2-3
perfiles "semilla" del equipo (Laura, Alejandro) si se decide crearlos.

- Crear primero **3-4 `forum_categories`** (p. ej. *Presentaciones*, *Mostrador y ventas*,
  *Marketing y digital*, *Gestión y equipo*). Hoy no hay categorías sembradas.
- Luego **6-8 `forum_threads`** repartidos, con preguntas abiertas y reales de titular
  ("¿Cómo gestionáis las reseñas negativas en Google?", "¿Qué hacéis con el stock que no rota
  tras la campaña de verano?"). 1-2 respuestas iniciales por hilo para que no estén a cero.

> Nota: los hilos requieren `author_id` que exista en `profiles` (FK a `profiles.id`). Por eso se
> siembran con cuentas reales del equipo, no con UUIDs inventados. **Esto se hace cuando existan
> esas cuentas**; no forma parte de la muestra SQL de curso para no introducir FKs a usuarios
> inexistentes.

### 2.4 Gamificación: ya viene sembrada

`badges` y `weekly_challenge_templates` ya tienen seeds en las migraciones. No hace falta tocar.
Sólo asegurarse de que cada curso tenga quiz (para el badge "Evaluación Perfecta" y el reto
"Evaluación estrella") y de que el curso de bienvenida sea fácil de completar (badge "Primer Paso").

---

## 3. Orden de ejecución recomendado

1. **Cursos + quizzes** (lo primero: es el corazón del portal). Empezar ejecutando
   `portal-curso-muestra.sql` (curso 1), revisarlo en la web, y clonar el patrón para los otros 5.
2. **Recursos**: subir ficheros a Storage e insertar filas en `resources` (`is_published=true`).
3. **Foro**: crear categorías → cuentas semilla del equipo → hilos + primeras respuestas.
4. **Repaso de visibilidad**: confirmar `is_published`/`is_active` en cursos, quizzes y recursos.

---

## 4. Voz y límites de contenido (resumen operativo)

Heredado de `CLAUDE.md` raíz y de `impulso/CLAUDE.md`. Aplica a TODO el contenido del portal:

- **farmapro siempre en minúsculas.**
- **Castellano de España.** "Vosotros", "vuestra farmacia", "tenéis". Nunca neutro/latino.
- **Contenido de NEGOCIO y habilidades**, no clínico: ventas, marketing, gestión, liderazgo,
  atención al cliente. **Nada de consejos sanitarios ni promesas de resultados de salud**
  (código deontológico). No se aconseja sobre fármacos ni patologías.
- **Cifras con fuente o etiqueta "estimación sectorial".** Nunca un dato suelto sin respaldo.
- **Sin emojis** en el contenido de cursos/recursos (los emojis sólo en posts de redes; nota: la
  UI ya añade algún icono decorativo por su cuenta, no hace falta meterlos en el texto).
- **Tono**: profesional, cercano, directo, orientado a aplicar mañana en el mostrador. CTAs suaves.
- **Vocabulario del sector**: titular, mostrador, dispensación, OTC, corner, auxiliar, dermocosmética.
- **Firmas**: contenido formativo/editorial → **Laura Domínguez** (Especialista en Farmacias).
  Contenido comercial/de servicios → **Alejandro Tellería** (Director de Estrategia y Marketing).
  No mezclar. Para cursos, `instructor` = "Laura Domínguez" en los formativos; "farmapro" como
  genérico si no procede una firma personal.

---

## 5. ¿Sembrar a mano o arreglar el generador de IA? → A mano para lanzar

Análisis del generador actual (`supabase/functions/generate-daily-course/index.ts` y
`generate-daily-resource/index.ts`):

**Cómo funciona hoy:**
- Función edge protegida (sólo admin) que llama a OpenAI (`gpt-4o-mini`) con un prompt genérico.
- Tablas de control: `course_generation_control` (índice de tema que rota sobre una lista de 15
  `COURSE_TOPICS` genéricos) y `resource_generation_control` (rota sobre 6 categorías). Logs en
  `generated_courses_log` / `generated_resources_log`.
- Inserta el curso escribiendo `courses.course_modules` (JSONB), `is_premium=false` y un `slug`
  derivado del título.

**Por qué NO conviene apoyarse en él para el lanzamiento:**
1. **Temas genéricos, no farmacéuticos** ("Gestión del tiempo", "Ciberseguridad"…). No es la voz
   ni el foco de farmapro; chocaría con la marca y con el código deontológico si la IA divaga.
2. **Deja el curso a medio publicar:** inserta sin `is_published=true` y **sin crear quiz**, así
   que no se ve (gate de `is_published`) y, aunque se publicara, no completa el flujo de
   finalización/gamificación que depende del quiz.
3. **`web search` es un placeholder** (texto simulado), así que las "cifras" que genere no tienen
   fuente → incumple la regla de "cifras con fuente".
4. **Riesgo de esquema:** el insert de log usa campos (`level`, `error_message`) que no existen en
   `generated_courses_log`; el curso puede crearse pero el log fallaría. Señal de que el generador
   no está afinado.

**Recomendación:**
- **Lanzar con los 6 cursos + recursos curados a mano** (calidad, marca y cumplimiento garantizados).
- **Después del lanzamiento**, si se quiere usar el generador como apoyo, arreglarlo: (a) sustituir
  `COURSE_TOPICS` por temas de negocio farmacéutico de farmapro, (b) endurecer el prompt con las
  reglas de marca/deontología, (c) hacer que cree el quiz y ponga `is_published=true`, (d) corregir
  los campos de log. Hasta entonces, dejarlo apagado (no programar el cron) para que no ensucie el
  catálogo con borradores genéricos.

---

## 6. Checklist de "listo para enseñar"

- [ ] 6 cursos `is_published=true`, repartidos por las 5 categorías, con módulos en el JSONB.
- [ ] Cada curso con su quiz `is_active=true` Y `is_published=true`, 4-5 preguntas, una opción
      `is_correct=true` por pregunta.
- [ ] 8-12 recursos `is_published=true`, ficheros reales en Storage.
- [ ] 3-4 categorías de foro + 6-8 hilos sembrados con cuentas del equipo + 1-2 respuestas/hilo.
- [ ] 1-2 cursos y 1-2 recursos marcados `is_premium=true` como gancho de suscripción.
- [ ] Revisión de voz: minúsculas "farmapro", vosotros, sin promesas sanitarias, cifras con fuente.
- [ ] Generador de IA desactivado (o arreglado) para no publicar borradores genéricos.
