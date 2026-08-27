# Plan Equipo · "Mi farmacia" — SPEC CERRADA · 2026-07-15

> Fuente única del funcionamiento multi-usuario del plan Equipo. Decisiones tomadas por Francesc el 15-07-2026.
> Ejecutar en este orden: **1º tanda SQL 4** (`supabase/migrations/20260715120000_equipo_mi_farmacia_tanda4.sql`) → **2º prompt Lovable nº 1 v4** (`docs/prompts-lovable-2026-07-09.md`, ya actualizado) → **3º UI "Mi farmacia"** (sesión Claude Code del rediseño, §5) → **4º checklist E2E** (§8).

## 1 · El modelo en una frase

**Una farmacia, una cuota, hasta 10 cuentas individuales.** El titular paga y gestiona; cada persona de su equipo tiene SU cuenta propia con todo lo de Plus; lo único compartido es el acceso. El empleado no ve precios, plan ni facturación; el titular ve el progreso formativo de su gente, y nada más de su vida en el portal.

## 2 · Quién ve qué (respuesta directa a las dudas del 15-07)

| Pregunta | Respuesta cerrada |
|---|---|
| ¿Dónde gestiona el titular a los usuarios? | Página propia **"Mi farmacia"** (`/mi-farmacia`), entrada en el menú lateral SOLO visible para el titular. Sustituye a la pestaña "Equipo" de Perfil. |
| ¿Los añade o elimina? | Sí: invita por email (la invitación caduca a los 14 días) y retira plazas cuando quiere. Cupo: **titular + 9 = 10 personas**. Al retirar a alguien, esa persona vuelve a Gratis con su histórico intacto y su plaza queda libre. |
| ¿Ve su evolución? | Sí, **progreso formativo por persona**: cursos/píldoras completados y en curso, evaluaciones aprobadas, puntos/nivel y última actividad. **No ve**: su actividad en el foro, su uso de IAFarma, sus premios de la Rebotica ni sus datos personales más allá de nombre, email y puesto. |
| ¿Cada persona tiene su espacio? | Sí. Cada miembro es una cuenta completa: su progreso, sus certificados, sus insignias, sus puntos, su racha, su cajón de la Rebotica, sus créditos de imagen (1/mes). Nada de eso se comparte ni se hereda. |
| ¿Es todo compartido? | Solo el ACCESO (todo lo de Plus). El trabajo de cada uno es individual. |
| ¿Cada uno realiza sus formaciones? | Sí, cada uno la suya; los quiz y certificados son personales. |
| ¿Ven qué ocurre con el resto del equipo? | **No.** Cada miembro solo ve lo suyo (el ranking global de retos sigue existiendo como hasta ahora, con su opt-out). El "ranking interno de la farmacia" queda para fase 2, opcional. |
| ¿Los usuarios ven plan y facturación? | **No.** El miembro no ve Facturación (pestaña oculta), y en Plan ve solo "Plan Equipo · plaza de [nombre farmacia], la gestiona tu titular". En /precios ve un aviso "ya tienes acceso completo" en lugar de CTAs de compra. La facturación es exclusiva del titular (Stripe Billing Portal + facturas Holded). |

## 3 · Lo que había y lo que estaba roto (auditoría 15-07)

Existía un esqueleto de marzo: tablas `team_subscriptions` (max_members default **5**) y `team_members` (roles legacy `premium/profesional`), edge `manage-team` (invitar/aceptar/retirar), página `/invitation`, pestaña "Equipo" en Perfil y RPCs `is_team_owner*`. Sobre él, **6 agujeros que hacían el plan Equipo inoperante**:

1. **Nada creaba el equipo al pagar**: el webhook (prompt nº 1 v3) asignaba rol al titular pero no insertaba `team_subscriptions` → `isTeamOwner` siempre false → la gestión no aparecía nunca. FIX: `ensure_team_subscription()` (tanda 4) + webhook la llama (prompt v4).
2. **Aceptar la invitación estaba roto**: `/invitation` no envía `team_id` y `validate_team_invitation` lo exigía → error siempre. FIX: v2 de la RPC solo con token + email (tanda 4) + manage-team adaptado (prompt v4).
3. **`check-subscription` en modo real degradaría a los miembros a Gratis** (no tienen Stripe propio; solo protegía 'admin'). FIX: rama de membresía de equipo antes de degradar (prompt v4).
4. **La invitación salía por Clientify** (`clientify-sync`, plataforma que ya no envía) y asignaba roles legacy. FIX: plantilla `equipo-invitacion` por `send-portal-email` (cola `transactional_emails` + API transaccional de Lovable) y rol `equipo` al aceptar (prompt v4). `member_role` queda vestigial (comentario SQL en tanda 4).
5. **Cupo solo en cliente** y `max_members` 5 ≠ pricing (10 personas). FIX: default 9 (titular aparte) + check server-side + índice único anti-duplicados (tanda 4 + prompt v4).
6. **No existía ninguna vista de progreso del equipo.** FIX: RPC `get_team_progress()` (tanda 4) + bloque de UI (§5).

Además, la cancelación no tenía cascada (titular deja de pagar → los 9 seguían con acceso). FIX: `deactivate_team_for_owner()` (tanda 4) llamada desde `subscription.deleted/updated` (prompt v4).

## 4 · Arquitectura cerrada

### 4.1 Roles

- Titular y miembros llevan `profiles.subscription_role = 'equipo'` (mismo acceso; los premios de la Rebotica con tier de suscripción ya los excluyen correctamente: a quien está en Equipo no se le regala suscripción, catálogo v3 regla 7).
- Titular ≠ miembro se distingue por PROPIEDAD, no por rol: `team_subscriptions.owner_id` (RPC `is_team_owner`) vs fila activa en `team_members` (RPC `is_team_member`).
- `team_members.member_role` (enum legacy premium/profesional): NO usar. Vestigial.

### 4.2 Ciclo de vida

| Evento | Qué pasa |
|---|---|
| Titular compra Equipo en /precios | Stripe checkout (metadata `origen='portal'`, `plan='equipo'`) → webhook: rol `equipo` + fila `subscriptions` + **`ensure_team_subscription()`** → "Mi farmacia" aparece en su menú. |
| Titular invita (email) | manage-team `invite_member`: valida titularidad + **cupo server-side** (plazas vivas < max_members) + inserta pendiente (caduca 14 días; índice único impide duplicar email vivo) + email `equipo-invitacion` (cola `transactional_emails` + API de Lovable) con `APP_URL/invitation?token=…`. |
| Invitado acepta | `/invitation` → login o registro CON EL EMAIL INVITADO (el registro normal, con su doble check RGPD) → manage-team `accept_invitation`: `validate_team_invitation(token, email)` → plaza activa + `subscription_role='equipo'` → email `equipo-plaza-activada` al titular. Si el invitado ya tenía plan de pago propio, se le muestra el aviso de §4.3. |
| Titular retira una plaza | manage-team `remove_member`: plaza `inactive` + perfil degradado a freemium (si tiene suscripción propia activa, `check-subscription` se la restaura). La plaza queda libre al instante. Se puede reinvitar más adelante (el índice único solo bloquea filas vivas). |
| Titular deja de pagar / baja a Plus | webhook `customer.subscription.deleted/updated` → **`deactivate_team_for_owner()`**: equipo `canceled`, plazas `inactive`, miembros degradados (salvo admin o suscripción propia). El titular queda freemium (deleted) o plus (downgrade). |
| Miembro con sesión iniciada | `check-subscription`: si es miembro activo de un equipo activo → rol `equipo` garantizado, NUNCA degradado por no tener Stripe propio. |

### 4.3 Casos borde (decididos)

- **Invitado que ya paga Plus**: puede aceptar; su rol pasa a `equipo` y la UI le avisa: "Tu plaza de equipo ya incluye todo: puedes cancelar tu plan individual desde Facturación" (no se cancela nada automáticamente; Facturación sigue visible para él MIENTRAS tenga `stripe_customer_id`).
- **Mismo email invitado por 2 farmacias**: posible (el único es por equipo). Caso raro; el acceso se mantiene mientras al menos una plaza esté activa.
- **El titular no consume "invitación"**: es la fila de `team_subscriptions`, no de `team_members`. La UI muestra "X de 10 personas" contando titular (1) + plazas vivas.
- **Founder**: un alta Equipo = 1 plaza fundador (1 suscripción), igual que Plus.
- **IAFarma**: texto ilimitado para los 10; imagen 1 crédito/mes POR PERSONA. Packs de imágenes solo los compra quien tiene facturación (titular). "Packs para el equipo" = fase 2.

## 5 · UI "Mi farmacia" (para la sesión de rediseño en Code)

Aplicar el canon `DESIGN.md` (Manrope, verde canónico, pill CTAs, un acento por componente, nada de arcoíris ni side-stripes).

- **Ruta** `/mi-farmacia`, ítem del sidebar solo si `isTeamOwner` (icono `Store`), título "Mi farmacia" + subtítulo con `team_name`. La pestaña "Equipo" de Perfil se elimina (o redirige aquí).
- **Bloque Plazas**: "X de 10 personas" con barra de progreso brand; input email + botón pill brand-dark "Invitar"; lista de personas: titular primero (chip "Titular", brand-soft), activos (badge brand-soft texto tinta), pendientes (badge `--miel`-soft + "caduca el …" + acciones reenviar/cancelar), acción "Retirar plaza" (nunca "remover") con confirmación. Cupo lleno → aviso claro sin CTA de soporte.
- **Bloque Progreso del equipo** (datos de `get_team_progress()`): tabla o cards por persona: nombre + puesto, cursos completados / en curso, evaluaciones aprobadas, nivel y puntos, "última actividad hace N días". Vacío con Fraunces itálica: "Aún nadie ha empezado una formación". Nada de datos de foro/IA/Rebotica.
- **Bloque Tu plan**: resumen (Equipo · precio fundador si aplica · renovación) + enlace a Facturación de Perfil.
- **Pantallas del miembro**: PlanTab variante "Plan Equipo — plaza de [farmacia]. La gestiona tu titular" (sin CTA de precios); pestaña Facturación OCULTA si es miembro sin `stripe_customer_id`; /precios con banner "Ya tienes acceso completo con el plan Equipo de tu farmacia" y sin botones de compra; `/invitation` con el texto de transparencia (§7) antes de aceptar.
- **Limpieza**: borrar `SubscriptionPlans.tsx`, `TeamPlanCard.tsx` y `config/PlanConfig.ts` si nada más los usa (modelo viejo; el prompt v4 retira `create-team-checkout`).

## 6 · Emails (registry de send-portal-email, cola `transactional_emails` + API transaccional de Lovable)

| Plantilla | Destinatario | Contenido |
|---|---|---|
| `equipo-invitacion` | Invitado | "[Nombre titular / farmacia] te invita al portal farmapro con el plan Equipo". CTA a `/invitation?token=…`, aviso "crea tu cuenta con este mismo email", caducidad 14 días, línea de transparencia (§7). |
| `equipo-plaza-activada` | Titular | "[Nombre] ha activado su plaza (X de 10 ocupadas)". |

Estilo casa: castellano de España, firma "El equipo de farmapro", farmapro en minúsculas, sin emojis, footer RGPD. Los avisos internos no llevan enlace de baja.

## 7 · RGPD / laboral

- La visibilidad del progreso formativo por el titular se apoya en interés legítimo (formación de empresa) + **deber de información**: el texto aparece en el email de invitación Y en la pantalla de aceptación: *"Al unirte al equipo de [farmacia], su titular verá tu progreso formativo (cursos y evaluaciones) y tu última actividad en el portal. Tu actividad en la comunidad, IAFarma y la Rebotica es privada."*
- Añadir ese mismo punto a la política de privacidad del portal (sección "Plan Equipo") — puede ir en la próxima revisión del texto legal con el asesor (junto a la nota LIA).
- El registro del invitado es el registro normal del portal: doble check RGPD del 10-07 intacto (escribe en `consent_ledger`).
- El titular JAMÁS ve: contenido de foro, conversaciones, uso de IA, premios. Minimización aplicada en la propia RPC (solo devuelve lo formativo).

## 8 · Checklist de verificación E2E (tras prompt nº 1 v4 + UI)

1. Pago test Equipo (4242) → fila en `subscriptions` + fila en `team_subscriptions` (max_members 9) + rol titular `equipo` + factura Holded del portal (y NINGUNA en direct).
2. "Mi farmacia" visible para el titular; invitar un email → email de invitación llega por la cola `transactional_emails` (API de Lovable) con URL de `APP_URL` (no supabase.co).
3. Intentar invitar el mismo email otra vez → error claro (duplicado). Invitar hasta cupo → la plaza 10 (novena invitación) entra, la 11 se rechaza server-side.
4. Aceptar invitación con cuenta nueva (email invitado) → rol `equipo`, acceso total, banner de transparencia visto; el titular recibe `equipo-plaza-activada`; "X de 10" sube.
5. El miembro NO ve: Mi farmacia, Facturación, precios de compra; su PlanTab dice "plaza de [farmacia]".
6. `get_team_progress()` como titular devuelve titular + miembros con conteos; como miembro devuelve 0 filas.
7. Retirar plaza → miembro degradado a Gratis (o su plan propio si lo tiene) y plaza libre.
8. Cancelar la suscripción Equipo en Billing Portal → equipo `canceled` + todos los miembros degradados + titular degradado.
9. `check-subscription` en modo real (cuando se active) NO degrada a un miembro activo.

## 9 · Fase 2 (post-D-day, no bloquea el lanzamiento)

- **Ranking interno de la farmacia** (opt-in del titular) y **Cajón de Equipo** (reto colectivo con premio compartido; `rebotica_openings.source='equipo'` ya está en el CHECK).
- Packs de imágenes comprados por el titular repartibles al equipo.
- Informe mensual por email al titular ("tu equipo este mes").
- Rol delegado "encargado" (gestiona plazas sin ver facturación).
- Enganchar el progreso de equipo al "Estreno del mes" (qué contenido nuevo asignar al equipo).
