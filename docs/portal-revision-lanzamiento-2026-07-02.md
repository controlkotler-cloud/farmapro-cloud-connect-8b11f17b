# Revisión completa del portal antes de Stripe · 2026-07-02

> Auditoría de código sobre HEAD `a34a65c` (repo actualizado hoy con `git pull`: 2 commits nuevos de Lovable,
> retoques en `ai-generate-image` con Gemini 3.1). Contrastada con `auditoria-portal-2026-06-17.md` y la memoria.
> Reparto de fixes: [Cowork] = UI cliente (lo hago yo), [Lovable] = backend/SQL (prompt o SQL preparado).

## Veredicto en una línea

El hardening de junio aguantó bien (lecciones protegidas, IAFarma imagen blindada, webhook con firma e idempotencia),
pero hay **2 críticos nuevos** que hay que resolver antes de conectar Stripe, y todo el circuito de pago existente
sigue operando sobre el modelo de planes VIEJO (estudiante/profesional/premium a 5/29/39 €), incompatible con Plus/Equipo.

---

## CRÍTICOS (bloquean el lanzamiento)

### C1. `profiles` sin política SELECT ~~: el portal entero puede estar roto~~ → **VERIFICADO OK EN VIVO (02-07)**

> Francesc ejecutó el SQL: en producción existen `SELECT "Users can view own profile"` + `"Users can view own
> profile and admins can view all"` + `ALL "Admins can manage all profiles"`. Lovable las aplicó por Dashboard,
> fuera de las migraciones (por eso el repo engañaba). **No bloquea.** Residuo menor: cada usuario solo lee SU
> perfil → comprobar que el leaderboard/comunidad muestra los nombres de otros (si salen vacíos, migrar esas
> lecturas a `profiles_public`). Y conviene volcar estas políticas a una migración para que el repo diga la verdad.
Las migraciones del 19-06 droppearon la política de lectura de `profiles` y la que la sustituía también se dropeó.
Resultado neto en el repo: **cero políticas SELECT** sobre `profiles`. Si eso es lo que hay en producción,
`useAuth` recibe perfil `null` para todo el mundo: paywall desactivado, dashboard, Perfil, admin de usuarios y
leaderboard rotos. La vista `profiles_public` que se creó como sustituta no la usa ningún componente.

**Verificar HOY en el SQL editor:**
```sql
select policyname, cmd from pg_policies where tablename = 'profiles';
```
Si no hay SELECT, aplicar [Lovable/SQL]:
```sql
create policy "Users can view own profile" on profiles for select to authenticated using (auth.uid() = id);
create policy "Admins can view all profiles" on profiles for select to authenticated using (is_current_user_admin());
```
(y migrar el leaderboard a `profiles_public` en una tanda posterior).

### C2. `clientify-sync` deja a cualquier usuario enviar emails con vuestra cuenta
`supabase/functions/clientify-sync/index.ts:172-305`: cualquier usuario logueado (incluso gratis caducado) puede:
- `send_email` con destinatario, asunto y contenido LIBRES → spam/phishing firmado por farmapro vía Clientify.
- `sync_user` con `userId` ajeno → lee el perfil de OTRO usuario con service role (IDOR).
- `team_invitation` y `add_to_automation` sin restricción.

Choca de frente con la política de seguridad Clientify del CLAUDE.md. Fix [Lovable]: `send_email` y
`add_to_automation` solo admin; `sync_user` fuerza `userId = user.id`; `team_invitation` solo owner del equipo.

---

## ALTOS (resolver antes o junto con Stripe)

| # | Hallazgo | Dónde | Fix |
|---|---|---|---|
| A1 | Recursos premium descargables por API: RLS solo mira `is_published`, el gating premium es solo UX | migración `20260320082653` + `useResources.ts:31` | [Lovable] política tipo `can_access_lesson` para `resources` |
| A2 | IAFarma TEXTO contradice Precios: exige roles viejos (`premium/profesional/admin`) → el gratis con "2 textos/mes" prometidos recibe 403, y Plus/Equipo tampoco podrán al lanzar. El tope 2/mes no se aplica en ningún sitio | `ai-creative-assistant/index.ts:49-52` | [Lovable] replicar el patrón de `ai-generate-image` (PAID_ROLES + getAccessState + contador) |
| A3 | Perfil→PlanTab vende los planes VIEJOS con checkout activo (5/29/39 €). Al poner STRIPE_SECRET_KEY alguien podría suscribirse a planes que no existen | `PlanTab.tsx`, `SubscriptionPlans.tsx`, `create-checkout/index.ts:52-56` | [Cowork+Lovable] sustituir por `plans.ts` y desactivar botón hasta el checkout nuevo |
| A4 | Invitaciones de equipo rotas de punta a punta: acción `send_team_invitation` no existe en el switch, la URL apunta a `…supabase.co/invitation` (404) y no hay ruta `/invitation` | `stripe-webhook:183`, `clientify-sync:252-254`, `AppRoutes.tsx` | [Lovable] alinear acción + dominio del portal + página de aceptación |
| A5 | `check-subscription` en modo `active` degradaría a `freemium` incluso a admins y mapea roles por importes viejos (Plus 19,90 caería a freemium) | `check-subscription/index.ts:130-164` | [Lovable] reescribir por Price IDs con roles protegidos ANTES de activar |
| A6 | Enum BD `user_role` sin `plus`/`equipo`: el webhook nuevo fallaría al asignar | migración `20260320082608` | [Lovable/SQL] `ALTER TYPE user_role ADD VALUE 'plus';` y `'equipo'` (sentencias sueltas), ANTES del webhook |
| A7 | `verify_jwt` sin declarar para `stripe-webhook` en config.toml: si el default exige JWT, Stripe recibirá 401 | `supabase/config.toml` | [Lovable] `[functions.stripe-webhook] verify_jwt = false` explícito |
| A8 | `spotsTaken = 95` hardcodeado ("quedan 5 plazas") sin una sola venta real. Riesgo de publicidad engañosa (Ley 3/1991) y desperdicia la palanca de urgencia | `src/lib/plans.ts:46` | [Decisión + Cowork] arrancar con valor real y actualizarlo con las altas (ver plan de lanzamiento) |

## MEDIOS

- **M1. CIF anti-pillaje solo decorativo**: se valida en cliente pero no se persiste en `profiles` ni hay unique → "1 prueba por farmacia" no se cumple. [Lovable] columna `cif` + unique + `handle_new_user`.
- **M2. `profiles_public` legible por `anon`**: cualquiera SIN login lista nombre+farmacia+cargo+bio de todos los miembros con la anon key del bundle. [Lovable] `REVOKE SELECT ON profiles_public FROM anon;`
- **M3. `provision-admin-user` crea admins que no son admin**: no inserta en `user_roles`, que es lo único que lee `is_current_user_admin()`. [Lovable]
- **M4. `ai-generate-image` (commit de hoy)**: auth, cuota y refund correctos, pero el payload mezcla formato chat con el endpoint `/v1/images/generations` y espera `b64_json`. **Probar 1 generación en vivo**: si el gateway no lo tolera, toda generación falla (sin coste, con refund).
- **M5. `ai-portal-chat`**: sin gate de plan (cualquier logueado consume) y sigue en OPENAI_API_KEY cuando el resto migró al gateway Lovable. Decidir si es feature de pago.
- **M6. Lógica de expiración duplicada y muerta** en `AppRoutes.tsx:57-70` y `PlanTab.tsx:94` (`trial_ends_at` que nadie escribe). Pendiente de Lovable NO aplicado. [Cowork]
- **M7. `subscriptions` casi nunca poblada**: el webhook individual actualiza `profiles` pero no inserta fila → al cancelar no degradaría. [Lovable]
- **M8. Restos del modelo viejo** (`estudiante` en `can_access_lesson`, `TeamPlanCard`, `create-team-checkout` con precios por miembro) → desactivar o alinear con plans.ts.
- **M9. Idempotencia del webhook al final del handler**: un retry a mitad duplica efectos. Mover el registro del event.id al inicio con unique.

## BAJOS

Huérfanos sin borrar (`Login.tsx`, `CreativeAssistant.tsx`), `AdminRetos.tsx:131` con `as any` (pendientes de Lovable NO aplicados),
console.logs en admin, `quiz_questions` con `USING (true)` (respuestas legibles por API), CORS `*`, emojis y "Portal FarmaPro"
capitalizado en emails de `clientify-sync`/`create-checkout` (regla minúsculas). XSS OK (DOMPurify), SECURITY DEFINER OK
(search_path + REVOKE), signed URLs de IAFarma OK.

---

## Pendientes de la memoria: qué aplicó Lovable y qué no

| Pendiente | Estado |
|---|---|
| Borrar `Login.tsx` huérfano | NO aplicado |
| Borrar `CreativeAssistant.tsx` huérfano | NO aplicado |
| Quitar `trial_ends_at` de AppRoutes | NO aplicado |
| Limpiar `AdminRetos.tsx:131` | NO aplicado |
| NO borrar `ai-generate-image` | Cumplido (y mejorado hoy) |

## Checklist Stripe (orden de ejecución cuando conectes)

1. Migración enum: `plus` y `equipo` (A6).
2. Products/Prices reales en Stripe (Plus 19,90/39 · Equipo 49/79 · anuales 199/490) y `create-checkout` con `price:` IDs espejo de `plans.ts`.
3. Webhook: rama por metadata `plan` ∈ {plus, equipo} + insert en `subscriptions` (M7) + `payment_failed`/`subscription.updated` + idempotencia al inicio (M9) + invitaciones (A4).
4. `verify_jwt=false` explícito (A7) + `STRIPE_WEBHOOK_SECRET`.
5. Reescribir `check-subscription` por Price ID con roles protegidos (A5) antes de `validation_mode='active'`.
6. Sustituir PlanTab/SubscriptionPlans por plans.ts y conectar CTA de Precios (A3).
7. Añadir plus/equipo a `ai-creative-assistant` (A2). Endurecer recursos premium en RLS (A1).
8. Price-lock de los 100 primeros: guardar `is_founder` (o el Price ID de lanzamiento) en la suscripción.

## Verificaciones en vivo pendientes (no se pueden comprobar desde el repo)

- [ ] `pg_policies` de `profiles` (C1) — hoy mismo.
- [ ] 1 generación de imagen IAFarma en vivo (M4).
- [ ] ¿Se ejecutaron los SQL de contenido? (`portal-cursos-*.sql`, `portal-recursos-*.sql`, `portal-eventos-*.sql`): confirmar que cursos/recursos/eventos se ven publicados en el portal.
- [ ] Hilos de foro sembrados (el plan de contenido los pedía con cuentas reales del equipo).

## Orden de prioridad sugerido

**Hoy**: verificar C1 → fix C2 → decisión A8 (contador real).
**Esta semana (sin Stripe)**: A2, A3 (coherencia visible), A1, M2, M6, limpiezas bajas.
**Con Stripe**: checklist completo de arriba (A4-A7, M1, M7-M9).

---

# ACTUALIZACIÓN 02-07 (tarde) · Scan de seguridad de Lovable aplicado (commits 98eb0ea + d80f5b2)

Revisados los diffs completos. Balance:

## Qué ha arreglado BIEN el scan

- **C2 (clientify-sync) → RESUELTO.** userId/email salen ahora del JWT verificado (no del body),
  `send_email` y `add_to_automation` solo admin, `team_invitation` solo admin u owner estricto del equipo
  (RPC `is_team_owner_strict`), y `manage-team` alineado con el nuevo contrato. Bien hecho.
- **B4/D2 (respuestas de quiz legibles) → RESUELTO a fondo.** Nuevas RPC `get_active_quiz_questions`
  (devuelve preguntas SIN `is_correct`) y `submit_quiz_answer` (corrección en servidor), políticas abiertas
  dropeadas, unique constraint para el upsert, y `useQuiz.ts` migrado a las RPC.
- **M2 (profiles_public para anon) → RESUELTO** vía `security_invoker = true` (anon choca con la RLS de profiles).
- Extras que no habíamos pedido y suman: escape de PostgREST en `GlobalSearch` (inyección de filtros),
  políticas de Storage para `job-resumes`, REVOKE masivo de funciones internas SECURITY DEFINER,
  y cursos/recursos para anon limitados a publicados no-premium.

## Qué NO ha arreglado (sigue abierto, el "0 issues" no lo cubre)

| Hallazgo | Estado |
|---|---|
| **A1 recursos premium**: la política de authenticated sigue siendo `is_published = true` (migración 20260320082653:172); cualquier logueado, incluso gratis caducado, sigue leyendo `file_url` de los premium por API. El scan solo cerró el acceso ANÓNIMO | ABIERTO |
| **A2** IAFarma texto con roles viejos (el gratis no puede usar sus 2 textos; Plus/Equipo tampoco podrán) | ABIERTO |
| **A3** PlanTab/checkout con planes y precios viejos | ABIERTO |
| **A4** invitaciones: `stripe-webhook` sigue llamando `send_team_invitation` (acción inexistente) y la URL sigue siendo `SUPABASE_URL/invitation` sin ruta `/invitation` en la app | ABIERTO |
| A5-A7 (circuito Stripe), A8 (spotsTaken=95), M1 (CIF), M3 (provision-admin), M4 (payload imagen sin probar), M6 (trial_ends_at), M7-M9, huérfanos | ABIERTOS |

## Verificar en vivo tras estos commits

- [ ] Que la migración 20260702083641 esté APLICADA en la BD (regla de la casa: el fichero no se autoejecuta;
      si el scan de Lovable la aplicó, perfecto, pero comprobar: `select proname from pg_proc where proname like '%quiz%';`)
- [ ] Hacer un quiz completo como usuario normal (el cliente ahora depende de las 2 RPC nuevas: si no existen
      en prod, los quizzes están rotos para todos)
- [ ] Que el catálogo público (sin login) siga mostrando lo que deba mostrar (las políticas anon cambiaron)
