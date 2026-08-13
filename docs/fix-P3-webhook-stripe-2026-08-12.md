# P3 — El webhook de Stripe deja de tragarse los fallos · 12-08-2026

**Estado: APLICADO y desplegado.** Cambios en `supabase/functions/stripe-webhook/index.ts` (vía Lovable,
typecheck OK) más dos columnas nuevas en `stripe_events`. Código desplegado verificado leyéndolo de vuelta.

---

## Corrección a mi diagnóstico anterior

En el informe escribí que "el `upsert` de `subscriptions` falló el 15-07". **La observación era correcta**
—la tabla estaba vacía pese a haber un checkout procesado, y el error solo se escribía en un log— pero
**no he podido reproducir la causa**, y conviene decirlo:

- Sospeché que faltaba el índice único sobre `stripe_subscription_id`, lo que haría fallar siempre el
  `onConflict`. **Falso**: el índice `subscriptions_stripe_subscription_id_key` existe.
- El pago de prueba de hoy recorrió exactamente el mismo camino y **funcionó entero**: fila en
  `subscriptions`, equipo creado con su `stripe_subscription_id`, factura en Holded.

Así que la causa concreta de julio se perdió con los logs. Lo que sí queda demostrado es el problema
estructural: **cuando algo falla, no se entera nadie y no hay segunda oportunidad.** Eso es lo que se
arregla aquí.

Sí apareció, de paso, un fallo vivo y confirmado: el desajuste del enum de estados (punto 3).

---

## 1. Idempotencia en dos tiempos: reclamar y confirmar

**Antes:** el `event.id` se insertaba en `stripe_events` *antes* de procesar, y el `catch` devolvía **200**.
Un fallo a mitad significaba que Stripe no reintentaba (200 = recibido) y que un reenvío manual se
descartaba como duplicado. El evento se perdía para siempre.

**Ahora:** columnas nuevas `completed_at` y `last_error`.

- Al llegar, se *reclama* el evento con `completed_at = null`.
- Si ya existe con `completed_at` puesto → duplicado real, se ignora.
- Si existe con `completed_at` a null → un intento anterior murió a medias: **se reprocesa**.
- Al terminar bien, se confirma con `completed_at = now()`.
- Si algo falla, se guarda el motivo en `last_error` y se devuelve **500**, para que Stripe reintente.

```sql
alter table public.stripe_events
  add column if not exists completed_at timestamptz,
  add column if not exists last_error text;
update public.stripe_events set completed_at = processed_at where completed_at is null;
-- 24 eventos históricos marcados como completados.
```

## 2. Los errores de base de datos dejan de tragarse

Pasan de `log(...)` a `throw` (y por tanto a 500 + reintento de Stripe):

- update de `profiles` en las dos ramas de `handleCheckoutCompleted`
- upsert de `subscriptions`
- RPC `ensure_team_subscription`
- update de `subscriptions` y update final de `profiles` en `handleSubscriptionChange`

Se mantienen como salidas silenciosas las que no son fallos: sesión sin `user_id`/`plan`, modo no
soportado, pack sin créditos. Un evento que no nos incumbe no debe provocar reintentos.

## 3. Estados de Stripe que no caben en el enum (fallo vivo)

`subscriptions.status` es un enum con `active | canceled | expired | trialing | past_due`, pero el código
escribía `sub.status` tal cual y Stripe también manda `unpaid`, `incomplete`, `incomplete_expired` y
`paused`. Esas escrituras fallaban — y el error tampoco se comprobaba.

Nueva función `toDbStatus()` que traduce al enum, aplicada **solo al escribir**:

| Stripe | Se guarda como |
|---|---|
| `active` | active |
| `trialing` | trialing |
| `past_due`, `incomplete` | past_due |
| `unpaid`, `incomplete_expired` | expired |
| `canceled`, `paused` | canceled |

**Punto delicado, verificado en el código desplegado:** `willDowngrade` se sigue calculando con el estado
**crudo** de Stripe (`canceled`, `unpaid`, `incomplete_expired`). Si se calculase con el ya traducido, se
dejaría de degradar a quien toca. Confirmado que quedó bien.

> Decisión de producto pendiente de tu criterio: he mapeado `paused` → `canceled`, o sea que una
> suscripción pausada pierde el acceso. Si prefieres que la conserve, se cambia en una línea.

## 4. Filtrar lo que no es del portal

La cuenta de Stripe la comparten el portal y farmapro-direct. Solo `invoice.paid` comprobaba el origen.

- `handleCheckoutCompleted`: ahora exige `session.metadata.origen === 'portal'` en las dos ramas
  (suscripción y packs).
- `handleSubscriptionChange`: filtro **suave** a propósito. Solo descarta si no lleva el metadato **y
  además** no existe fila nuestra con ese `stripe_subscription_id`. Las suscripciones antiguas del portal
  no llevan el metadato (se implementó el 16-07) y se habrían quedado fuera con un filtro duro.

---

## Cómo comprobarlo

La forma limpia es desde el panel de Stripe en modo test: reenviar un evento ya procesado (debe responder
`duplicate: true` y no tocar nada) y provocar una cancelación para ver la degradación a `freemium` con la
desactivación del equipo.

Consulta de vigilancia, ahora que existe el rastro:

```sql
-- Eventos que entraron pero nunca llegaron a completarse
select id, type, processed_at, last_error
  from stripe_events
 where completed_at is null
 order by processed_at desc;
```

Si esa consulta devuelve algo, hay un pago a medio procesar. Antes de hoy no había forma de saberlo.

## Lo que sigue pendiente

- **P4, el email** (18 de 22 envíos fallidos): `suppressed_emails` sin consultar, reintentos ante errores
  permanentes, y el log de `notify_trial_ending` escrito antes de enviar.
- Ahora que `subscriptions` se puebla de verdad, se puede **endurecer `is_team_owner_strict`** para exigir
  suscripción de pago real, que era lo que quedó aparcado en P1.
- El contador de plazas fundador (`founder_count`) ya tiene de dónde leer: queda conectarlo a la página de
  Precios, que hoy sigue con `spotsTaken: 0` a mano (A2 del informe).
