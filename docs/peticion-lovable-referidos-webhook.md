# Petición a Lovable: premio de referidos en stripe-webhook (07-10-2026)

Pegar en el chat de Lovable (proyecto Farmapro Cloud Connect) **después** de confirmar que Lovable
tiene el commit `8d90d0b` o posterior. Solo toca `supabase/functions/stripe-webhook/index.ts` y hay que desplegarla.

---

Necesito un cambio SOLO en la edge function `stripe-webhook` y que la despliegues. No toques ningún otro fichero, ni el frontend, ni las migraciones: la base de datos ya está preparada (tabla `portal_referrals`, función `portal_referral_quota_left(uuid)`, que solo puede ejecutar el service role).

**Contexto.** Programa de referidos del portal. Cuando una cuenta invitada paga su primera factura de importe mayor que 0, quien la invitó gana 1 mes gratis. Cada invitación es una fila de `portal_referrals` con estas columnas:
- `referrer_id`: quien invita;
- `referred_id`: la invitada (unique);
- `paid_at`;
- `reward_status`: `pendiente`, `aplicado` o `descartado`;
- `reward_kind`: `cupon` o `prueba`;
- `reward_ref`;
- `rewarded_at`.

**Dónde.** Dentro de `handleInvoicePaid`, justo después del `if (total === 0) { ... return; }` y antes de `createHoldedInvoice`, llama a una función nueva `await processReferralRewards(stripe, supabase, userId, subscriptionId)`. Métela entera en un try/catch que solo haga `log(...)`: un fallo de referidos nunca debe impedir la factura de Holded ni hacer que Stripe reintente el evento.

**Qué hace `processReferralRewards`** (si `userId` es null, no hace nada):

1. **Marcar el pago de la invitada (atómico e idempotente).**
   `update portal_referrals set paid_at = now() where referred_id = userId and paid_at is null and reward_status = 'pendiente'`, con `.select()` para saber si ha actualizado alguna fila. Si ha actualizado una, es su primera factura pagada: intenta premiar a su `referrer_id` (paso 3).

2. **Cobrar los premios pendientes de quien paga ahora.**
   Busca las filas donde `referrer_id = userId`, `reward_status = 'pendiente'` y `paid_at` no es null (premios ganados que no se pudieron aplicar antes). Para cada una, intenta premiar a `userId` (paso 3), pero solo una por factura: el cupón es de un solo uso.

3. **Premiar a una cuenta R por una fila F:**
   a. **Cupo.** `supabase.rpc('portal_referral_quota_left', { p_referrer: R })`. Si devuelve 0: pon `reward_status = 'descartado'` y `motivo_descarte = 'tope_anual'`, y termina.

   b. **Suscripción que recibe el premio.**
      - Primero, la de R: fila de `subscriptions` con `user_id = R` y `status` en (`'active'`, `'trialing'`), la de `current_period_end` más reciente. Una en `trialing` (cortesía) también vale: el cupón se come en su primer cobro real.
      - Si R no tiene, pero es miembro de un equipo (`team_members.user_id = R` y `team_members.status = 'active'`), se usa la suscripción del titular: `team_subscriptions.stripe_subscription_id` de ese `team_id`, si `team_subscriptions.status = 'active'`. El premio va siempre a quien es titular.

   c. **Si hay suscripción**, recupérala de Stripe:
      - Si ya tiene un descuento (`sub.discount` o `sub.discounts` no vacío), NO lo sustituyas. Deja la fila en `pendiente` y termina: se aplicará en una factura posterior (paso 2).
      - Si no tiene descuento:
        - asegura el cupón `REFERIDO-1MES`: `stripe.coupons.retrieve('REFERIDO-1MES')`; si da `resource_missing`, créalo con `{ id: 'REFERIDO-1MES', percent_off: 100, duration: 'once', name: 'Invitación farmapro: 1 mes gratis' }`;
        - aplícalo con `stripe.subscriptions.update(subId, { coupon: 'REFERIDO-1MES' })`;
        - actualiza la fila: `reward_status = 'aplicado'`, `reward_kind = 'cupon'`, `reward_ref = subId` y `rewarded_at = now()`.

   d. **Si no hay suscripción, pero R sigue en su prueba gratuita del portal.** La prueba sigue vigente si el mayor entre `auth created_at + 30 días` y `profiles.trial_ends_at` es posterior a ahora; la fecha de alta se saca con `supabase.auth.admin.getUserById(R)`.
      - Pon `profiles.trial_ends_at = (ese fin de prueba) + 30 días` para R.
      - Actualiza la fila: `reward_status = 'aplicado'`, `reward_kind = 'prueba'`, `reward_ref` = la fecha nueva en ISO, `rewarded_at = now()`.

   e. **En cualquier otro caso**, deja la fila en `pendiente` (ya tiene `paid_at`). Se cobrará en el paso 2 cuando R pague su propia suscripción.

**Reglas:**
- No cambies nada más del flujo actual: Holded, la deduplicación por `stripe_events` y el resto de eventos siguen igual.
- Escribe cada paso con `log(...)` (`referral paid`, `referral reward applied`, `referral reward pending`, `referral quota reached`), con los ids pero sin emails.
- Las consultas, con el cliente service role que ya usa la función.

Cuando termines, dime qué commit has creado y confirma que la función está desplegada.
