# Fix quiz + chatbot del portal — 10-07-2026

Dos bugs reportados por Francesc y diagnosticados en producción (sesión Cowork 10-07, con navegador y BD en vivo). Ninguno tiene que ver con Stripe. Ambos invisibles en auditoría estática: solo afloran con sesión de usuario real.

## Bug 1 — Quiz del curso de bienvenida: "Validar respuesta" no hace nada

**Causa raíz (confirmada en BD en vivo):** `quiz_attempts.completed_at` es `NOT NULL DEFAULT now()` (la tabla la creó Lovable en marzo; ese default no está en ninguna migración del repo). La migración de seguridad del 02-07 (`20260702083641`) introdujo el RPC `submit_quiz_answer` con la guarda `completed_at IS NULL` para el intento activo → nunca se cumple porque el intento nace "completado" → el RPC lanza excepción → `saveAnswer` devuelve null → `DatabaseQuiz.tsx` no hace nada (sin toast). Afecta a TODOS los quizzes desde el 02-07, no solo al de bienvenida.

**Prueba:** los 2 intentos de Francesc del 10-07 tienen `completed_at = started_at` y 0 respuestas guardadas; su intento del 18-06 (pre-migración) funcionó (100%, 5 respuestas).

**Fix (SQL, pegar en el editor SQL de Lovable):** el contenido de
`farmapro-portal/supabase/migrations/20260710150000_fix_quiz_attempts_completed_at.sql`

```sql
ALTER TABLE public.quiz_attempts ALTER COLUMN completed_at DROP DEFAULT;
ALTER TABLE public.quiz_attempts ALTER COLUMN completed_at DROP NOT NULL;

DELETE FROM public.quiz_attempts qa
WHERE qa.completed_at = qa.started_at
  AND qa.started_at >= '2026-07-02'
  AND NOT EXISTS (SELECT 1 FROM public.quiz_answers a WHERE a.attempt_id = qa.id);
```

Verificado antes de proponer: el trigger `pts_quiz` y las políticas RLS de `quiz_attempts`/`quiz_answers` no dependen del NOT NULL. `finishQuizAttempt` es quien rellena `completed_at` al terminar.

## Bug 2 — Chatbot "Asistente farmapro": siempre "Error al procesar la solicitud"

**Causa raíz (reproducida en vivo):** la edge function `ai-portal-chat` devuelve 401 "Sesión inválida" con tokens válidos (el mismo JWT responde 200 en `/auth/v1/user`). Es la ÚNICA de las 13 funciones que llama `supabaseClient.auth.getUser()` **sin pasarle el token**, y además importa supabase-js **2.7.1** (esa versión no propaga el header Authorization al cliente de auth en Deno). Todas las demás usan `getUser(token)`.

**Descartado:** LOVABLE_API_KEY y el modelo están bien — IAFarma (`ai-creative-assistant`, misma key y modelo `google/gemini-3-flash-preview`, patrón de auth correcto) responde 200 y streamea. Con el fix de auth, el chat queda operativo.

**Fix (prompt para pegar en Lovable):**

```
En supabase/functions/ai-portal-chat/index.ts hay un bug de autenticación: se llama a
supabaseClient.auth.getUser() sin token y con supabase-js 2.7.1, así que SIEMPRE devuelve
401 "Sesión inválida" aunque el usuario esté logueado (las demás funciones usan getUser(token)).
Haz exactamente esto y nada más:

1. En ai-portal-chat/index.ts: cambia el import de
   https://esm.sh/@supabase/supabase-js@2.7.1 a https://esm.sh/@supabase/supabase-js@2.45.0
   (la versión de las demás funciones).
2. En esa misma función, tras leer authHeader, extrae el token y pásalo a getUser:
   const token = authHeader.replace('Bearer ', '');
   const { data: { user } } = await supabaseClient.auth.getUser(token);
   Mantén el createClient con el global Authorization header tal cual (lo usan las queries RLS).
3. En src/hooks/usePortalChat.ts: cuando !response.ok, lee el JSON de la respuesta y muestra
   errorData.error en el toast si existe (como ya hace useCreativeChat), en vez del mensaje
   genérico fijo "Error al procesar la solicitud".
4. En src/components/course/DatabaseQuiz.tsx (handleConfirmAnswer): si saveAnswer devuelve
   null, muestra un toast destructivo "No se pudo guardar tu respuesta. Inténtalo de nuevo."
   en lugar de no hacer nada.

NO cambies el modelo, el system prompt, el rate-limit diario, el gating de planes ni ninguna
otra función.
```

## Cómo verificar después

1. Quiz: entrar al curso de bienvenida → responder las 5 preguntas → debe dar feedback verde/rojo por pregunta y pantalla de resultados. En BD: el intento nuevo con `completed_at NULL` durante el quiz y relleno al terminar.
2. Chat: abrir el asistente flotante → "¿Qué cursos tenéis disponibles?" → debe streamear respuesta.

## Parte 2 (13-07) — Sesgo de respuestas + rescate de los Tests legacy

Tras aplicar el fix del quiz, Francesc detectó que todas las correctas del curso de bienvenida eran la 2ª opción. Verificado en BD: **no es casualidad**.

- **Sesgo**: en la serie nueva ("Cuestionario:", las 18 píldoras cargadas por SQL), 81/97 correctas (84%) están en la 2ª posición. La serie antigua ("Evaluación:") está equilibrada (3/19/18). Defecto del generador de la tanda de contenido.
- **order_index duplicado** en las preguntas de 5 cuestionarios (orden de preguntas indeterminado).
- **Los 6 cursos premium legacy de marzo** (Atención Farmacéutica, Stock, Financiera, Liderazgo, RRHH, VERI*FACTU): quiz "Test:" duplicado entero (2 activos por curso, 23-03 y 24-03) → `maybeSingle()` da error → hoy muestran "No hay evaluación disponible". Además las preguntas están en formato legacy (`options` jsonb + `correct_answer` 0-based) con `quiz_question_options` vacía. 0 intentos en los 12 quizzes.

**Fix (SQL, pegar en el editor de Lovable):**
`farmapro-portal/supabase/migrations/20260713100000_fix_quiz_contenido_sesgo_y_tests.sql`
(desactiva la copia del 24-03, migra las opciones legacy, renumera preguntas y baraja la posición de las opciones en Cuestionario+Test; la serie Evaluación no se toca). Al final del fichero van 3 consultas de verificación — la 3ª es una revisión a ojo de las correctas de los Tests.

**Regla para futuras tandas de píldoras** (añadida a `farmapro-portal/contenido/README.md`): el SQL de carga debe repartir la posición de la respuesta correcta (aleatoria por pregunta) y asignar `order_index` únicos 0..n-1. Actualizar también la skill `rebotica-contenido` con esta regla en la próxima revisión de skills.

## Barrido asociado (sin más fallos de esta familia)

13/13 RPCs del frontend existen en BD · funciones invocadas = desplegadas (`open-reward` comentado, TODO S30, correcto) · RLS de quiz correctas · IAFarma y Lovable AI gateway operativos · `generate-daily-course`/`generate-daily-resource` van con supabase-js 2.7.1 pero pasan el token → funcionan (bump a 2.45.0 recomendable algún día, no urgente).
