# Runbook — pasar el cobro del portal de TEST a LIVE

> Escrito 31-08-2026. D-day del portal: **jueves 10-09**. Confirmado por Francesc: Stripe del portal está hoy en **modo TEST**.
> Todo lo verificado aquí sale de la BD de producción del portal (`jeysistgdajopfruqpbc`) y del repo. Lo no verificado va marcado.

## Por qué esto no puede improvisarse el día 9

**La vía de facturación de Holded no distingue modo.** `HOLDED_API_KEY` es siempre la de producción: un `invoice.paid` de una suscripción de **test** ya ha emitido una **factura fiscal real**. Prueba: `portal_holded_invoices` tiene una fila `done` — doc Holded `6a7cc9ac5e17568fe10f95dd`, 49,00 €, 12-08-2026, contacto "Francesc prueba" (CIF B99554446), de la suscripción de test `sub_1U3hqJ2ft48aAAhUTqtMYm8u`.

Y esa suscripción **sigue activa, con `current_period_end = 2026-09-12`**. Si nadie la para, el 12-09 se renueva sola (en test, sin dinero) y emite **una segunda factura real en Holded**. Dos días después del lanzamiento.

---

## Orden de ejecución

### 1. Cortar la sangría (hacer ya, no esperar al D-day) — Francesc

- [ ] **Stripe (test) → cancelar** la suscripción `sub_1U3hqJ2ft48aAAhUTqtMYm8u` (Equipo, 49 €, cliente `cus_V3pVRjhgYskIdq`). Cancelación inmediata, no "al final del periodo".
- [ ] **Stripe (test) → desactivar o borrar el endpoint de webhook** que apunta a `stripe-webhook` del portal. Mientras exista, cualquier trasteo en test puede facturar de verdad en Holded.
- [ ] **Holded → anular la factura** `6a7cc9ac5e17568fe10f95dd` (49 €). Es una factura ficticia dentro de una serie fiscal real: cómo se anula (anulación directa o rectificativa) depende de si el periodo ya está declarado — consultar con la gestoría si hay duda. Revisar también el contacto "Francesc prueba" / CIF B99554446.

### 2. Crear el catálogo en LIVE — HECHO 31-08-2026

Nueve precios, en EUR, **impuestos incluidos**. Importes verificados: coinciden en `src/lib/plans.ts` (lo que ve el usuario) y en los comentarios de `supabase/functions/_shared/stripePrices.ts`.

| Secret | Producto | Importe | Metadata en Stripe |
|---|---|---|---|
| `STRIPE_PRICE_PLUS_MONTHLY_LAUNCH` | Plus mensual fundador | 19,90 €/mes | `plan=plus, launch=true` |
| `STRIPE_PRICE_PLUS_MONTHLY` | Plus mensual | 39,00 €/mes | `plan=plus, launch=false` |
| `STRIPE_PRICE_PLUS_YEARLY_LAUNCH` | Plus anual fundador | 199,00 €/año | `plan=plus, launch=true` |
| `STRIPE_PRICE_EQUIPO_MONTHLY_LAUNCH` | Equipo mensual fundador | 49,00 €/mes | `plan=equipo, launch=true` |
| `STRIPE_PRICE_EQUIPO_MONTHLY` | Equipo mensual | 79,00 €/mes | `plan=equipo, launch=false` |
| `STRIPE_PRICE_EQUIPO_YEARLY_LAUNCH` | Equipo anual fundador | 490,00 €/año | `plan=equipo, launch=true` |
| `STRIPE_PRICE_IMAGE_PACK_20` | Pack 20 imágenes | 4,99 € (pago único) | `pack_credits=20` |
| `STRIPE_PRICE_IMAGE_PACK_50` | Pack 50 imágenes | 9,99 € (pago único) | `pack_credits=50` |
| `STRIPE_PRICE_IMAGE_PACK_100` | Pack 100 imágenes | 16,99 € (pago único) | `pack_credits=100` |

`STRIPE_PRICE_PLUS_YEARLY` y `STRIPE_PRICE_EQUIPO_YEARLY` (anuales fuera de lanzamiento) se quedan **vacíos a propósito**: el código lanza "El precio anual solo está disponible durante el lanzamiento fundador" si alguien pide anual sin plazas fundador. No inventarlos.

### 3. Webhook y secrets en LIVE — endpoint HECHO, secrets pendientes

- [ ] Crear en **Stripe LIVE** un endpoint de webhook hacia la misma URL de `stripe-webhook`, con los eventos: `checkout.session.completed`, `invoice.paid`, `invoice.payment_failed`, `customer.subscription.updated`, `customer.subscription.deleted`.
- [ ] Actualizar en Lovable (portal) los secrets: los **9 `STRIPE_PRICE_*`** de arriba, **`STRIPE_SECRET_KEY`** (clave live) y **`STRIPE_WEBHOOK_SECRET`** (el del endpoint live recién creado).

Los tres van juntos: clave live con secret de webhook de test = todos los eventos rebotan con 400 en la verificación de firma.

### 4. Limpiar la BD del portal — HECHO 31-08-2026

**Ejecutado y verificado el 31-08.** `subscriptions`, `team_subscriptions`, `team_members`, `portal_holded_invoices` y `stripe_events` quedan a 0 filas; ningún perfil conserva `stripe_customer_id`; `founder_count.spots_taken` = 0; los únicos perfiles no-freemium son los 3 admins (Francesc, Alejandro, Laura). Gotcha encontrado: el trigger `block_unsafe_profile_updates` bloquea tocar `subscription_role` / `stripe_customer_id` salvo con credenciales de servicio — se salva abriendo la transacción con `set local request.jwt.claims = '{"role":"service_role"}'`.

**OJO — esto NO cancela nada en Stripe.** Borrar la fila de `subscriptions` no toca la suscripción real: `handleInvoicePaid` lee la metadata de Stripe, no la base de datos. Si la suscripción de test sigue viva y el endpoint de webhook de test sigue registrado, el 12-09 vuelve a emitir factura en Holded. El paso 1 sigue siendo obligatorio.

Contexto original: sin esta limpieza, dos perfiles **no habrían podido pagar en live**. `create-checkout` lee `profiles.stripe_customer_id`, y si existe hace `stripe.subscriptions.list({customer})`: un `cus_` de test bajo clave live devuelve "No such customer", la función revienta con 500 y el checkout no abre.

```sql
-- 1) Suscripción y equipo de test
delete from subscriptions where stripe_subscription_id = 'sub_1U3hqJ2ft48aAAhUTqtMYm8u';
delete from team_subscriptions
 where stripe_subscription_id = 'sub_1U3hqJ2ft48aAAhUTqtMYm8u'
    or team_name like 'PRUEBA%';

-- 2) Rastro de Stripe/Holded de test
delete from portal_holded_invoices where source_id = 'in_1U3hqJ2ft48aAAhUe8gWC5lw';
delete from stripe_events;   -- 31 filas, todas de test, ninguna con error

-- 3) Perfiles de prueba: quitar customer_id de test y devolver a freemium
update profiles
   set stripe_customer_id = null,
       subscription_role  = 'freemium',
       subscription_status = null,
       updated_at = now()
 where id in ('9546e219-512b-4b82-a4a9-9dce585846b3',   -- "Francesc prueba"
              'b877f5d1-492f-472c-b275-395c74933e6d');  -- "Prueba Farmapro"
```

Tras esto `founder_count.spots_taken` vuelve a 0 (la vista cuenta `subscriptions` con `is_founder = true and status = 'active'`), y las 100 plazas fundador salen limpias al lanzamiento. Hoy marca 1, ocupada por la prueba.

**Resuelto:** "Alaitz" es `mkproalaitz@gmail.com`, del equipo de Mkpro. Su rol `profesional` venía de ser miembro del equipo de test, no de una suscripción. Al borrar ese equipo la causa desaparece; se la dejó en freemium y **no se borró la cuenta**: tiene actividad real (2 quizzes, progreso del reto, puntos, insignia) y 2 registros en `consent_ledger` que conviene conservar. Francesc autorizó borrarla; se le devolvió la decisión ya informada y quedó así.

### 5. Probar el circuito en LIVE antes del 10-09

Un pago live es la única prueba válida, y cobra de verdad. Lo barato: crear en live un Price oculto de 1 € con la misma metadata (`plan=plus, launch=true`), apuntar temporalmente `STRIPE_PRICE_PLUS_MONTHLY_LAUNCH` a él, pagar con tarjeta propia, y comprobar **los cuatro extremos**:

1. `subscriptions` → fila nueva `active`, `is_founder` correcto.
2. `profiles` → `subscription_role` = plan contratado.
3. `portal_holded_invoices` → fila `status = 'done'` con `holded_doc_id`.
4. Holded → factura emitida con base + 21 % correctos.

Después: cancelar la suscripción, reembolsar en Stripe, anular la factura en Holded, devolver el secret al precio real y **volver a comprobar que el secret apunta al Price bueno**.

---

## Trampas conocidas

- **`profiles.email` está NULL en todos los perfiles de pago.** La factura del 12-08 salió bien de milagro: `handleInvoicePaid` intenta `profiles.email` y cae en `invoice.customer_email`. Si algún día Stripe no lo trae, el contacto se crea en Holded sin email. Conviene rellenar `profiles.email` en el alta.
- **Una suscripción creada a mano desde el dashboard de Stripe no se factura ni sincroniza.** Todo el flujo depende de `metadata.origen = 'portal'`, que solo pone `create-checkout` (lo pone bien: en la session y en `subscription_data`). Ya pasó una vez: el `invoice.paid` del 15-08 21:00 se procesó "OK" y no dejó fila en `portal_holded_invoices` porque salió por ese filtro. En live, eso es cobrar sin facturar. Regla: **las suscripciones nacen del checkout, nunca del dashboard**.
- **No dar por bueno un cobro porque aparezca en Stripe.** La comprobación es la fila `done` en `portal_holded_invoices` con `holded_doc_id`.
- **Cuenta de Stripe compartida con farmapro-direct.** El webhook de direct ignora lo que lleve `metadata.origen='portal'`. Al pasar a live esto vuelve a estar en juego: verificar que el primer cobro live del portal no aparece en `stripe_holded_invoices` (BD de direct).

— CIERRE (obligatorio antes de terminar): (1) actualiza en Notion ("Tareas · farmapro") las tareas afectadas por lo hecho: Estado, y Detalle con evidencia + fecha; busca por palabra clave otras tareas Pendiente que hablen de lo que has cambiado y corrígelas también; (2) si tocaste piezas editoriales, actualiza `impulso/00-estrategia/ESTADO-PRODUCCION.md`; (3) si hay decisión, aprendizaje o cambio de estado de proyecto, actualiza la ficha de memoria correspondiente (y su línea en `MEMORY.md`); (4) resume en el chat qué has actualizado y qué queda.

---

## Catálogo LIVE creado el 31-08-2026 (vía MCP de Stripe)

Cuenta **mkpro.es** `acct_1IPpNUGYq2u7pAVi`, livemode. El portal en test vive en un sandbox aparte (`acct_1TtTEN2ft48aAAhU`, "portal farmapro"); en live comparte cuenta con farmapro-direct.

Todos los precios llevan `tax_behavior: inclusive` (el IVA va dentro del importe), `lookup_key` y `nickname` iguales a los de test, y su metadata.

**Productos**

| Producto | ID |
|---|---|
| Portal farmapro · Plan Plus | `prod_VAmQyxKHmPLNny` |
| Portal farmapro · Plan Equipo | `prod_VAmRZT0b5eB0Rr` |
| Portal farmapro · Pack 20 imágenes IAFarma | `prod_VAmR9XOazdgXv7` |
| Portal farmapro · Pack 50 imágenes IAFarma | `prod_VAmRtG7aZ6cEqY` |
| Portal farmapro · Pack 100 imágenes IAFarma | `prod_VAmR0RdZYxc6VR` |

**Precios — pegar tal cual como secrets en Lovable (portal)**

| Secret | Price ID (live) | Importe |
|---|---|---|
| `STRIPE_PRICE_PLUS_MONTHLY_LAUNCH` | `price_1UAQsTGYq2u7pAVif7jCvdv9` | 19,90 €/mes |
| `STRIPE_PRICE_PLUS_MONTHLY` | `price_1UAQsVGYq2u7pAViKZJyEvFo` | 39,00 €/mes |
| `STRIPE_PRICE_PLUS_YEARLY_LAUNCH` | `price_1UAQsYGYq2u7pAVi83muIE8q` | 199,00 €/año |
| `STRIPE_PRICE_EQUIPO_MONTHLY_LAUNCH` | `price_1UAQsaGYq2u7pAViLUzLW6uN` | 49,00 €/mes |
| `STRIPE_PRICE_EQUIPO_MONTHLY` | `price_1UAQsbGYq2u7pAVidereTJ4M` | 79,00 €/mes |
| `STRIPE_PRICE_EQUIPO_YEARLY_LAUNCH` | `price_1UAQsgGYq2u7pAVit6J9q6ka` | 490,00 €/año |
| `STRIPE_PRICE_IMAGE_PACK_20` | `price_1UAQsjGYq2u7pAVibcge5Ny3` | 4,99 € |
| `STRIPE_PRICE_IMAGE_PACK_50` | `price_1UAQslGYq2u7pAViCC99ExqE` | 9,99 € |
| `STRIPE_PRICE_IMAGE_PACK_100` | `price_1UAQsmGYq2u7pAVigNU5RFpo` | 16,99 € |

`STRIPE_PRICE_PLUS_YEARLY` y `STRIPE_PRICE_EQUIPO_YEARLY` siguen vacíos a propósito.

**Webhook LIVE creado:** `we_1UAQtRGYq2u7pAVi8n6YsCBK` → `https://jeysistgdajopfruqpbc.supabase.co/functions/v1/stripe-webhook`, con los 5 eventos (`checkout.session.completed`, `invoice.paid`, `invoice.payment_failed`, `customer.subscription.updated`, `customer.subscription.deleted`). Su signing secret se copia del dashboard de Stripe (Developers → Webhooks → ese endpoint → Reveal) y se pega como `STRIPE_WEBHOOK_SECRET`.

**Cuidado — en live el portal comparte cuenta con direct.** El endpoint live de farmapro-direct (`we_1Tezi1GYq2u7pAViZhYCcSnG` → `ebuntvgsppedmtmuklyl…`) escucha `checkout.session.completed` e `invoice.paid` en esa misma cuenta, así que **recibirá también los eventos del portal**. La única defensa es la guarda de `metadata.origen='portal'` en el webhook de direct. Verificar el primer cobro live del portal contra `stripe_holded_invoices` (BD de direct): debe quedar a 0.

**Suscripciones de test canceladas el 31-08:** `sub_1U3hqJ…` (Francesc prueba) y `sub_1TtYyO…` (Prueba Farmapro). La segunda no llevaba `metadata.origen` — se creó el 15-07, antes de que se implementara — y por eso su `invoice.paid` del 15-08 no facturó en Holded. No era un bug: era una suscripción anterior al arreglo.

**Lo que falta para cobrar en live:**
1. Pegar en Lovable los 9 `STRIPE_PRICE_*` de la tabla.
2. Pegar `STRIPE_SECRET_KEY` (la `sk_live_…` de mkpro.es).
3. Pegar `STRIPE_WEBHOOK_SECRET` (el del endpoint nuevo).
4. Borrar en Holded el borrador de 49,01 € del 12-08 (documento `6a7cc9ac5e17568fe10f95dd`, sin numerar).
5. Decidir el redondeo del IVA (49,00 € cobrado → 49,01 € facturado) antes de emitir facturas a clientes.
6. Decidir si las facturas deben nacer aprobadas en vez de borrador.

Los tres secrets van juntos: clave live con webhook secret de test = todos los eventos rebotan con 400 en la verificación de firma.
