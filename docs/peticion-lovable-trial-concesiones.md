# Petición a Lovable · trial por concesión (portal_grants)

> Escrita 14-09-2026. La pide Francesc por el chat de Lovable (proyecto Farmapro Cloud Connect,
> `c3f72248-9d45-48ac-947a-a3472f2c51ba`). Una sola petición, cerrada: cada corrección vuelve a
> cobrar, así que va entera de una vez.
>
> La parte de base de datos YA ESTÁ HECHA y verificada en producción (tabla `portal_grants`,
> columna `subscriptions.founder_granted`, vista `founder_count` y los dos triggers). Esto es lo
> único que falta.
>
> Antes de enviarla: comprobar que no hay commits nuestros sin sincronizar (`git status` y
> `git fetch` en farmapro-portal).

---

## Texto para pegar en el chat de Lovable

Necesito dos cambios en edge functions del portal.

**1) `supabase/functions/create-checkout/index.ts` — aplicar periodo de prueba cuando el usuario tiene una concesión**

Ya existe en la base de datos la tabla `public.portal_grants`, con estas columnas relevantes: `email` (text), `lote` (text), `plan` (text), `concedido_desde` (date), `concedido_hasta` (date), `founder_reserved` (boolean). Tiene RLS activado sin políticas, así que solo se puede leer con el cliente de service role, que esta función ya usa (`admin`).

Antes de crear la sesión de Stripe, con el correo del usuario autenticado:

```ts
const { data: grant } = await admin
  .from('portal_grants')
  .select('lote, concedido_hasta')
  .ilike('email', userEmail)
  .gte('concedido_hasta', new Date().toISOString().slice(0, 10))
  .maybeSingle();
```

Si `grant` existe:

- Calcular `trialEnd` = el timestamp Unix (segundos) de `concedido_hasta` a las 23:59:59 en hora de Madrid. Stripe exige que `trial_end` esté al menos 48 horas en el futuro: si faltan menos de 48 h, NO aplicar trial y seguir con el flujo normal.
- Añadir a `subscription_data`:
  - `trial_end: trialEnd`
  - `trial_settings: { end_behavior: { missing_payment_method: 'cancel' } }`
  - en su `metadata`, además de lo que ya lleve: `grant_lote: grant.lote`
- En la sesión de checkout:
  - `payment_method_collection: 'always'` (queremos la tarjeta aunque no se cobre hoy)
  - en `metadata`, añadir también `grant_lote: grant.lote`
  - `custom_text: { submit: { message: 'Los primeros meses son cortesía de Mkpro. Hoy no se te cobra nada: el primer cobro será el 1 de enero de 2027.' } }`

Si `grant` no existe, el comportamiento debe quedar exactamente como está ahora. No toques la lógica de `FOUNDER_TOTAL` ni la de selección de precios: las plazas concedidas ya se excluyen del contador en la base de datos.

Importante: el checkout debe seguir exigiendo NIF/CIF y dirección fiscal como hasta ahora. Confírmame que sigue siendo obligatorio.

**2) `supabase/functions/stripe-webhook/index.ts` — dejar de escribir el estado a fuego**

En `handleCheckoutCompleted`, el upsert a `subscriptions` escribe `status: 'active'` literal, y el update a `profiles` escribe `subscription_status: 'active'` literal, a pesar de que justo antes se ha hecho `stripe.subscriptions.retrieve(subscriptionId)`. Con una suscripción en periodo de prueba eso guarda un estado falso.

Usa el estado real de la suscripción recuperada, pasándolo por la función `toDbStatus` que ya existe en el mismo fichero, en los dos sitios. El resto del manejador no cambia.

---

## Cómo comprobarlo cuando esté desplegado

1. `select * from portal_grants where lote='redes-2026q4' limit 1;` para coger un correo del lote.
2. Con una cuenta de prueba creada con ese correo, entrar al checkout de Equipo: debe mostrar 0,00 € hoy, la fecha del primer cobro y el texto de cortesía.
3. Tras completar el checkout en test: `select status, is_founder, founder_granted from subscriptions where user_id = '<uuid>';` → `status` debe ser `trialing`, `is_founder` true y `founder_granted` true.
4. `select spots_taken from founder_count;` → NO debe haber subido.
