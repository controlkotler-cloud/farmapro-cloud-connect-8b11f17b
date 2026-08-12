# Auditoría en profundidad — portal.farmapro.es (farmapro-portal)

> Análisis de código (no del sitio en vivo). Stack: React 18 + Vite + TS + shadcn/ui + Supabase (Postgres + 14 edge functions) + Stripe + Clientify.
> Fecha: 2026-06-17 · Repo: controlkotler-cloud/farmapro-cloud-connect-8b11f17b · ~290 ficheros, 36k líneas.
> **No se ha implementado nada.** Tres cubos (Confirmados / Dudosos / Probables falsos positivos) para que tú elijas. Rutas relativas a `farmapro-portal/`.

## Resumen en una línea

El control de acceso de **admin es sólido** (`is_current_user_admin()` lee de `user_roles`, sin policy de INSERT propia → no se puede auto-conceder admin). Lo que **no** está protegido en servidor es el **paywall**: un usuario puede auto-editar `profiles.subscription_role` y, además, el contenido (cursos/lecciones/recursos) es legible por cualquier autenticado. Hay también un **bug de publicación de quizzes**, una **edge function de IA sin auth** y **lagunas en el webhook de Stripe** que conviene cerrar antes de monetizar. Mucho de lo que los exploradores marcaron como "crítico" se ha rebajado tras leer el código (ver tercer cubo).

Conteo: **Confirmados 26 · Dudosos 10 · Probables falsos positivos 8.**

---

## CUBO 1 — CONFIRMADOS (evidencia sólida)

### Seguridad / Pagos
| ID | Cambio | Archivos | Sev | Esf | Benef | Riesgo | Depende de |
|---|---|---|---|---|---|---|---|
| C-SEG1 | `profiles` tiene UPDATE `USING (auth.uid()=id)` **sin restricción de columnas ni trigger** → el usuario puede `update profiles set subscription_role='premium', subscription_status='active'` y auto-desbloquear plan de pago (incl. la IA de pago de C-SEG-ref). No escala a admin (eso usa `user_roles`). | migrations `20260320082653…:129`; consumido por `useSubscriptionLimits.ts`, `useCourses.ts:109`, `ai-creative-assistant` | **alta** (crítica al monetizar) | M | alto | medio | C-MNT3 |
| C-SEG2 | Paywall no aplicado en servidor: `courses`/`resources` SELECT `USING (is_published=true)` y `course_lessons` `USING (true)`; `is_premium`/`is_free` no se comprueban en RLS. `canAccessCourse` es solo cliente. Cualquier autenticado (incl. freemium) puede leer lecciones premium por API. | migrations `…:141,149,172`; `useCourses.ts:109-112` | **alta** | M-L | alto | medio | C-SEG1 |
| C-SEG3 | `ai-generate-image` **no comprueba auth, rol ni límite** alguno; llama a DALL·E con la API key del servidor. Abuso/coste directo. Incoherente con `ai-creative-assistant` (que sí valida). | `supabase/functions/ai-generate-image/index.ts` (todo) | **alta** | S | alto | bajo | — (indep.) |
| C-SEG4 | `stripe-webhook`: (a) sin idempotencia por `event.id`; (b) `checkout.session.completed` solo actúa si `plan_type==='team'` → **planes individuales no actualizan `profiles`**; (c) `invoice.payment_succeeded` es no-op; (d) `customer.subscription.deleted` solo toca `team_subscriptions`, no degrada perfiles individuales. | `stripe-webhook/index.ts:51-208` | **alta** (facturación al lanzar) | M | alto | medio | modelo de planes |
| C-SEG5 | `ai-portal-chat`: exige auth pero **sin gate de plan ni rate-limit** (OpenAI). Cualquier logueado consume tokens. | `ai-portal-chat/index.ts:15-46` | media | S | medio | bajo | D4 |
| C-SEG6 | Proveedores de IA incoherentes: `OPENAI_API_KEY` (ai-portal-chat, ai-generate-image) vs `LOVABLE_API_KEY`/gemini (ai-creative-assistant). Gobernanza y coste dispersos. | las 3 funciones IA | media | M | medio | bajo | — |
| C-SEG7 | `console.log` de datos sensibles en cliente (user, profile, isAdmin, formData del curso) → quedan en consola del navegador. | `AdminCursos.tsx:84-123` | media | S | medio | bajo | — |
| C-SEG8 | `manage-team` `remove_member` pone `status='inactive'` pero **no degrada** `subscription_role` del miembro retirado (sigue premium/profesional). | `manage-team/index.ts:201-207` | media | S | medio | bajo | — |

### Funcionalidad / Lógica
| ID | Cambio | Archivos | Sev | Esf | Benef | Riesgo | Depende de |
|---|---|---|---|---|---|---|---|
| C-FUNC1 | **Quizzes invisibles para usuarios normales**: el form admin fija `is_active` y nunca `is_published`, pero la RLS de lectura exige `is_published=true`. Las queries de usuario (`is_active=true`) devuelven 0 filas para no-admin; el admin lo ve (bypass) y no detecta el fallo. | `QuizFormDialog.tsx:47,101,106-118`; RLS `…:159`; `useQuiz.ts:46`; `useCourseData.ts:48` | **alta** | S | alto | bajo | — |
| C-FUNC2 | `useLeaderboard`: `timeFilter` está en estado y en el dep array, pero `loadLeaderboard` **no lo usa** → el selector semana/mes/histórico no cambia nada. | `useLeaderboard.ts:22-36` | media | M | medio | bajo | — |
| C-FUNC3 | Contador de vistas falso con `Math.random()` → cambia en cada render. | `forum/ThreadCard.tsx:87` | media | S | medio | bajo | — |
| C-FUNC4 | `dashboardStatsService` ignora `error` de varias queries y usa `?.length || 0` → fallos (red/permiso) se muestran como **0** sin avisar. | `services/dashboardStatsService.ts:64-78` | media | S | medio | bajo | — |
| C-FUNC5 | Ordena actividad por fecha **ya localizada** (`toLocaleDateString('es-ES')`) re-parseada con `new Date(...)` → `Invalid Date`/orden incorrecto. | `services/dashboardStatsService.ts:~150 y ~199` | media | S | medio | bajo | — |

### Datos / Rendimiento
| ID | Cambio | Archivos | Sev | Esf | Benef | Riesgo | Depende de |
|---|---|---|---|---|---|---|---|
| C-DATA1 | `useLeaderboard` trae **todos** los `user_badges` (sin filtro ni límite) para contar en cliente. No escala. | `useLeaderboard.ts:50-52` | media | M | medio | bajo | — |
| C-DATA2 | Usar `.maybeSingle()` en chequeos de existencia de quiz (evita error PGRST116 y, en `useCourseData`, captura el error). | `useCourseData.ts:44-49`, `useQuiz.ts:42-54` | baja | S | bajo | bajo | — |
| C-DATA3 | `select('*')` amplio en varios hooks y `count` con `select('*',{head:true})`; pedir solo columnas necesarias. | `useCourses.ts:28`, `useResources.ts:27`, `usePharmacyManagement.ts`, `useRetosData.ts:100-109` | baja | M | bajo | bajo | — |

### UX / A11y / Contenido
| ID | Cambio | Archivos | Sev | Esf | Benef | Riesgo | Depende de |
|---|---|---|---|---|---|---|---|
| C-UX1 | `key={index}` en listas **dinámicas** (riesgo de DOM/estado desfasado). | `dashboard/RecentActivity.tsx:53`, `ai/CreativeAssistant.tsx:142`, `creative/ResultsArea.tsx:67,104` | media | S-M | medio | bajo | — |
| C-UX2 | Botones solo-icono sin `aria-label` (campana, cerrar, enviar). | `layout/Header.tsx:64`, `ai/CreativeAssistant.tsx:101,199` | media (a11y) | S | medio | bajo | — |
| C-CONT1 | "Farma**Pro**" capitalizado; la regla del proyecto es **minúsculas**. | `pages/Login.tsx:64` | media | S | medio | bajo | — |
| C-CONT2 | `NotFound` en inglés ("Oops! Page not found", "Return to Home"). | `pages/NotFound.tsx:18` | media | S | medio | bajo | — |
| C-CONT3 | Emojis en UI core (📚 fallback de portada; 🔔 en `getNotificationIcon`) → usar iconos lucide (regla "sin emojis salvo redes"). | `course/CourseCard.tsx:52`, `layout/Header.tsx:42` | baja | S | bajo | bajo | D6 |

### Mantenibilidad / Calidad
| ID | Cambio | Archivos | Sev | Esf | Benef | Riesgo | Depende de |
|---|---|---|---|---|---|---|---|
| C-MNT1 | Duplicación masiva de CRUD admin (patrón loadData/delete/form) en 5+ páginas → extraer hooks (`useAdminList`, `useDeleteRecord`). | `AdminRecursos/AdminEventos/AdminCursos/AdminEmpleo/AdminQuizzes` | media | L | medio | medio | — |
| C-MNT2 | **Sin tests reales** (solo `src/test/example.test.ts`) pese a vitest + playwright configurados. | `src/test/`, `package.json` | media | L | medio | bajo | — |
| C-MNT3 | `profiles` tiene **dos** columnas de rol: `role` (default 'freemium') y `subscription_role` (la que usa la app) → doble fuente de verdad. | migrations (tabla) + `types.ts:1286,1292` | media | M | medio | medio | — |
| C-MNT4 | `AdminUsuarios`: cambio de rol **sin confirmación** y RPC con `as any` (sin validar el enum). | `AdminUsuarios.tsx:92-96,433` | media | S | medio | bajo | — |
| C-MNT5 | `.env` versionado (solo claves `VITE_` públicas → bajo riesgo) y `README.md` placeholder ("TODO: Document…"). | `.env`, `README.md` | baja | S | bajo | bajo | — |
| C-MNT6 | `Index.tsx` es el placeholder de Lovable ("Your app will live here") y **no está enrutado** → código muerto, eliminar. | `pages/Index.tsx` | baja | S | bajo | bajo | — |

---

## CUBO 2 — DUDOSOS (dependen de contexto/criterio que tú conoces mejor)

| ID | Cuestión | Archivos | Sev (si aplica) | Qué hace falta para confirmar |
|---|---|---|---|---|
| D1 | `profiles` SELECT `USING (true)`: cualquier miembro lee de todos: nombre, farmacia, ciudad, `subscription_role`, puntos. ¿Fuga de PII o aceptable para comunidad/leaderboard? | migrations `…:128` | media | Decisión de producto: qué campos deben ser públicos entre miembros. |
| D2 | `quiz_questions`/`quiz_question_options`/`quiz_answers` legibles por cualquier autenticado (`USING true`). Si las opciones llevan `is_correct`, se pueden leer respuestas por API. | migrations `…:103,117,163` | media | ¿Importa el "anti-trampa" en formación interna? Revisar si options expone `is_correct`. |
| D3 | `generate-daily-course` / `generate-daily-resource` usan service_role y no muestran auth propia. ¿Las protege `verify_jwt`/secreto de cron o están abiertas? | ambas funciones | dudosa (alta si abiertas) | Cómo se invocan (cron Supabase, header secreto, config `verify_jwt`). |
| D4 | `ai-portal-chat` disponible para todo usuario logueado (sin gate de plan). ¿Intencionado como asistente general? | `ai-portal-chat` | media | Definir si el chat es feature de pago o gratis. |
| D5 | `useNotifications` con dep `[user, toast]`: si `toast` de shadcn es estable (lo es a nivel módulo), no re-suscribe → probablemente inocuo. | `useNotifications.ts:140` | baja | Confirmar estabilidad de `toast`; si estable, descartar. |
| D6 | Severidad de la regla "sin emojis": ¿aplica a iconos de UI (🔔/📚) o solo a copy de marketing? | `Header.tsx:42`, `CourseCard.tsx:52` | baja | Tu criterio de marca. |
| D7 | `AsistenteCreativo` muestra "IAFarma está incluido en tu suscripción". ¿Es el nombre de producto vigente? | `pages/AsistenteCreativo.tsx:23` | baja | Confirmar naming oficial. |
| D8 | `CourseQuizView` pasa `courseTitle=""` a `DatabaseQuiz`. ¿El componente lo resuelve solo o queda en blanco? | `CourseQuizView.tsx:70` | baja | Revisar si `DatabaseQuiz` usa el prop o lo ignora. |
| D9 | CORS `Access-Control-Allow-Origin: "*"` en todas las edge functions. Aceptable con token, pero ¿restringir a dominio? | todas las functions | baja | Política de orígenes deseada. |
| D10 | `AdminCursos` valida `is_current_user_admin` en cliente antes de insertar (redundante con RLS). ¿Mantener como UX o simplificar? | `AdminCursos.tsx:117-128` | baja | Criterio: defensa en profundidad vs. simplicidad. |

---

## CUBO 3 — PROBABLES FALSOS POSITIVOS (la crítica los tumba; tú decides si aun así los tratas)

| ID | Hallazgo original (de los exploradores) | Por qué parecía problema | Por qué creo que NO lo es |
|---|---|---|---|
| FP1 | "`Index.tsx` = entry point roto (**crítica**)" | El fichero es un placeholder de Lovable. | `Index` **no se importa ni se enruta**; `/` hace `Navigate` a `/login` o `/dashboard` (`AppRoutes.tsx:94`). Solo es código muerto → reclasificado a C-MNT6 (baja). |
| FP2 | "`.single()` lanza excepción y rompe (**crítica**)" en `useQuiz`/`useCourseData` | `.single()` con 0 filas. | En supabase-js `.single()` **devuelve** `error` (PGRST116), no lanza. `useQuiz:49` comprueba el error y `useCourseData` degrada a `null`. No hay crash; solo conviene `maybeSingle` → C-DATA2 (baja). |
| FP3 | "`getBestAttempt` type mismatch (**alta**)" | Parecía devolverse función vs. usarse valor. | El hook **devuelve el valor** (`useQuiz.ts:322` invoca `getBestAttempt()`) y los consumidores lo usan como valor (`DatabaseQuiz.tsx:230`, `CourseView.tsx:103`). Coherente; solo el nombre confunde. |
| FP4 | "`.filter('is_weekly','eq',true)` sintaxis incompatible (**alta**)" en `useWeeklyChallenges` | Parecía API equivocada. | `.filter(col, op, val)` es sintaxis **válida** de supabase-js/PostgREST. No es bug. (El `as any` es un olor menor.) |
| FP5 | "`is_active` no existe en `course_quizzes` → crash" | La tabla base no lo tenía. | La migración `20260320090226:29` añade `is_active boolean DEFAULT true`. La query funciona. El problema real es otro (publicación) → C-FUNC1. |
| FP6 | "Admin escalable desde cliente / `subscription_role='admin'` concede admin" | El rol vive en `profiles` editable. | `is_current_user_admin()` lee de `user_roles`, y **no hay policy de INSERT** para que el usuario se asigne roles. Auto-ponerse `subscription_role='admin'` **no** da admin. El riesgo real es de paywall → C-SEG1. |
| FP7 | "`PersonalInfoTab` puede editar el perfil de otro usuario" | `update().eq('id', user.id)` con id de cliente. | La RLS de `profiles` UPDATE `USING (auth.uid()=id)` lo impide a nivel servidor. No procede. |
| FP8 | "Variables `VITE_` expuestas en cliente = vuln" | Claves en el bundle. | Por diseño: son la URL y la *publishable/anon key*, públicas por definición. La seguridad real es la RLS. |

---

## Orden recomendado (SOLO para Confirmados)

Quick wins independientes primero, luego el bloque de modelo de acceso, luego calidad:

1. **C-SEG3** (auth en `ai-generate-image`) — corta sangrado de coste, S, independiente.
2. **C-SEG7** (quitar `console.log` sensibles) — S.
3. **C-FUNC1** (publicar quizzes: alinear `is_published`/`is_active`) — desbloquea feature, S.
4. **C-FUNC3 / C-FUNC4 / C-FUNC5** (vistas falsas, errores silenciosos, orden por fecha) — quick wins de fiabilidad.
5. **C-MNT3 → C-SEG1 → C-SEG2** (resolver doble columna de rol y, sobre esa base, blindar paywall en RLS) — **hacer juntos**; C-SEG2 depende de C-SEG1.
6. **C-SEG4** (ciclo de vida del webhook Stripe) — **antes de cobro real**.
7. **C-SEG5 / C-SEG6 / C-SEG8 / C-FUNC2 / C-DATA1** — medias.
8. **C-UX1 / C-UX2 / C-CONT1 / C-CONT2 / C-CONT3** — batch UX/contenido.
9. **C-DATA2 / C-DATA3 / C-MNT1 / C-MNT2 / C-MNT4 / C-MNT5 / C-MNT6** — calidad/refactor cuando haya hueco.

Bloqueos/independencias: C-SEG2 ← C-SEG1 ← C-MNT3 (cadena de modelo de acceso). C-SEG4 depende de fijar el modelo de planes individuales. El resto son independientes entre sí.

---

## Apéndice — evidencia de los Confirmados de severidad alta

**C-SEG1** — `supabase/migrations/20260320082653…sql:129`
```sql
CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE TO authenticated USING (auth.uid() = id);
-- sin WITH CHECK, sin restricción de columnas, sin trigger que bloquee subscription_role/status
```
Único trigger sobre auth/profiles es `on_auth_user_created` (no impide cambios de rol). `is_current_user_admin()` consulta `user_roles` (no `profiles`), por lo que el riesgo es de paywall, no de admin.

**C-SEG2** — `…sql:141,149,172`
```sql
CREATE POLICY "Anyone can view published courses"   ... USING (is_published = true OR is_current_user_admin());
CREATE POLICY "Anyone can view lessons"             ... USING (true);
CREATE POLICY "Anyone can view published resources" ... USING (is_published = true OR is_current_user_admin());
```
`course_lessons.is_free` y `courses.is_premium` no se usan en ninguna policy. Gating premium = solo `useCourses.ts:109-112` (cliente).

**C-SEG3** — `supabase/functions/ai-generate-image/index.ts`
```ts
serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });
  const { prompt, size = '1024x1024', style = 'vivid' } = await req.json();
  const openAIApiKey = Deno.env.get('OPENAI_API_KEY');   // ← sin getUser, sin rol, sin límite
```

**C-SEG4** — `supabase/functions/stripe-webhook/index.ts:52-86,189-208`
```ts
case 'checkout.session.completed':
  const session = ...;
  if (session.metadata?.plan_type === 'team') { ... }   // planes individuales: no se procesan
  break;
case 'invoice.payment_succeeded':
  logStep("Payment succeeded", ...); break;             // no-op
case 'customer.subscription.deleted':
  ...update('team_subscriptions')...                    // no degrada profiles individuales
```
No se persiste `event.id` para idempotencia.

**C-FUNC1** — `QuizFormDialog.tsx:47,101` vs RLS `…:159`
```ts
// Form admin: setea is_active, nunca is_published
const [formData] = useState({ ..., is_active: true });
// insert/update .from('course_quizzes')  → is_published queda en su DEFAULT (false)
```
```sql
CREATE POLICY "Anyone can view published quizzes" ON public.course_quizzes
  FOR SELECT TO authenticated USING (is_published = true OR is_current_user_admin());
```
Consulta de usuario: `useQuiz.ts:46` / `useCourseData.ts:48` filtran `.eq('is_active', true)` → la RLS las oculta a los no-admin.
