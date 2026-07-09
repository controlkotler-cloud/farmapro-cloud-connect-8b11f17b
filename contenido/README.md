# Contenido interno del portal — Píldoras Rebotica, tanda 1

Fuente: skill `rebotica-contenido` (`impulso/memory/project_rebotica_portal.md` + `portal-plan-rebotica-maestro.md`).

## Qué es esto

8 píldoras formativas de la Rebotica, tanda 1, **lista validada por Francesc el 09-07** ("lista OK"). Cada píldora es una micro-lección de 5-10 minutos destilada de una newsletter de Impulso (N1-N21), reestructurada en formato "hazlo hoy" (no es un resumen de la newsletter, es la versión accionable).

**Decisión de arquitectura (09-07, en la ficha de memoria):** dentro del portal, cada píldora vive como un curso de la sección **Cursos** ("Formación" en la UI), formato propio "Píldora" = 1 lección + 1 quiz. Reutiliza toda la infra existente (tarjetas por categoría, tracking de completado, gating premium, RPCs `get_active_quiz_questions` / `submit_quiz_answer`). Cero desarrollo nuevo: solo carga por SQL cuando se prepare la migración correspondiente.

## Estado

**Contenido en markdown, listo para revisión editorial. PENDIENTE de carga por SQL** (no se ha escrito ni ejecutado ninguna migración en esta tanda; eso es tarea de una sesión técnica rebotica-tecnica, consultando antes el esquema real de `courses` / quiz en el repo). No se ha tocado la ficha de memoria ni `ESTADO-PRODUCCION.md` (lo consolida la sesión principal).

## Formato de cada píldora

Cada `.md` sigue la estructura fija que marca la skill:

1. Título accionable (qué vas a poder hacer al terminar)
2. El problema en 3 líneas
3. El método en 5 pasos concretos (lo esencial de la N de origen, reestructurado, no copiado)
4. "Hazlo hoy": una acción de 10 minutos
5. Enlace al descargable de esa N en Recursos (referencia textual; falta la URL real cuando se cargue en Recursos)
6. Quiz de 4 preguntas de opción múltiple, con respuesta correcta y explicación breve

Cabecera de metadatos en cada fichero: categoría (enum `course_category` real del repo: `ventas`, `marketing`, `gestion`, `liderazgo`, `atencion_cliente`, entre otras), N de origen, firma editorial (Laura Domínguez firma todo lo formativo, según regla del proyecto) y, en la primera, marca de píldora de onboarding.

## Las 8 píldoras de la tanda 1

| # | Fichero | N origen | Categoría | Nota |
|---|---|---|---|---|
| 1 | `pildora-01-n01-onboarding-farmacia-silenciosa.md` | N01 | atencion_cliente | **Onboarding**: completarla (lección + quiz) desbloquea el primer cajón de la Rebotica |
| 2 | `pildora-02-n06-google-my-business.md` | N06 | marketing | Conecta con el servicio Gestión GMB + SEO Local |
| 3 | `pildora-03-n05-stock-muerto.md` | N05 | gestion | Conecta con Auditoría de Stock Muerto |
| 4 | `pildora-04-n04-equipo-categorias-responsables.md` | N04 | liderazgo | Conecta con Programa Liderazgo y Equipo |
| 5 | `pildora-05-n03-rentabilidad-por-categorias.md` | N03 | gestion | Conecta con Consultoría de Categorías |
| 6 | `pildora-06-n17-corner-dermocosmetica.md` | N17 | ventas | Categoría estrella, alta rentabilidad |
| 7 | `pildora-07-n08-cliente-que-no-vuelve.md` | N08 | atencion_cliente | Conecta con Business Intelligence / Omnicanal |
| 8 | `pildora-08-n21-cinco-palancas.md` | N21 | gestion | Cierre/síntesis de la tanda; referencia cruzada a N06 y N17 |

## Reglas aplicadas (heredadas, no negociables)

Castellano de España (vosotros), farmapro en minúsculas, sin emojis, sin raya larga (—), cifras etiquetadas como "estimación sectorial" cuando la fuente original de la newsletter no es una fuente verificable de forma independiente, código deontológico farmacéutico respetado (nada de promesas de resultados sanitarios ni de medicamentos concretos; nota deontológica explícita en la píldora de dermocosmética), contenido destilado y reestructurado a partir del texto íntegro de cada newsletter (no copia literal).

## Pendiente / siguiente paso

- Carga SQL de las 8 píldoras como cursos + preguntas de quiz (sesión rebotica-tecnica; verificar antes el esquema real de `courses`, `course_category` y las RPCs de quiz en el repo).
- Subir los descargables de cada N a Recursos (si no están ya) y sustituir la referencia textual por el enlace real.
- Validación editorial de Laura Domínguez sobre el tono y las citas de las 8 piezas.
- Decidir si la píldora 1 (onboarding) necesita algún ajuste de UI específico para el flujo "completar perfil + primera píldora = primer cajón".
