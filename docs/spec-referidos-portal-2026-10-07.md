# Referidos del portal: especificación (07-10-2026)

Estado: **redactada, sin construir.** Se construye cuando Francesc decida F10 (19-10) o antes si lo pide.
Origen: decisión del 29-09 («invitas a otra farmacia → 1 mes gratis para las dos») y propuesta 1 de
`impulso/00-estrategia/captacion-2026-10/F10-canal-externo.md`. Verificado el 07-10 que no existe nada:
ni tabla en la BD ni código en el repo (solo las invitaciones de equipo, `/invitation` y `manage-team`).

## Regla de negocio

- Cada cuenta tiene un enlace propio.
- Quien se da de alta por él tiene **1 mes más de prueba** (60 días en vez de 30).
  **Decidido por Francesc el 07-10-2026: plan Gratis 60 días, no Plus.** Los límites no se duplican (verificado en BD el 07-10): cursos, 2 distintos en toda la prueba (`get_course_modules`); IAFarma, tope por mes natural (`check_text_quota`, `date_trunc('month')`), así que en 60 días le tocan 2 o 3 meses; recursos, tope de 3 en `plans.ts` sin confirmar dónde se aplica (mirarlo antes de construir).
- Quien invita gana **1 mes gratis** cuando la invitada **paga su primera factura de importe mayor que 0**. No basta con el alta.
- Cada alta invitada es una suscripción independiente (tesis de captación del 07-10).

## Lo que ya existe y se reutiliza (verificado en repo el 07-10)

| Pieza | Dónde | Uso |
|---|---|---|
| Captura de UTM y click ids en localStorage | `src/lib/analytics.ts:154` (`captureUtms`), llamada desde `CookieManager.tsx:12` | se añade el código de invitación |
| Metadatos del alta | `src/hooks/useAuth.tsx:134-169` (`signUp` → `raw_user_meta_data`) | viaja el código |
| Alta | `/login?modo=registro` (`LoginForm.tsx:10-22`) | destino del enlace |
| Fin real de la prueba | mayor entre alta + 30 días y `profiles.trial_ends_at` (`plans.ts:220`, migración `20261007180000_concesion_alarga_prueba.sql`) | alargar la prueba de la invitada sin tocar la lógica de FD3 |
| Primer pago | `stripe-webhook`, evento `invoice.paid` (L363; ya salta las facturas de 0 €) | dispara el premio |
| Perfil | `src/pages/Perfil.tsx`, `tabOptions` L88-93 | pestaña nueva «Invita» |

**Ojo:** `?ref=` ya está ocupado (`analytics.ts:166-176` lo convierte en `utm_medium`). El parámetro de invitación es **`?inv=`**.

## Construcción, en este orden

### 1. SQL (`query_database`, sin chat)

- `profiles.referral_code text unique`: 7 caracteres sin ambigüedad (sin 0/O/1/l). Hay que generarlo para todas las cuentas existentes y por defecto para las nuevas.
- Tabla `portal_referrals`:
  - `id`
  - `referrer_id` (uuid de quien invita)
  - `referred_id` (uuid **unique**: una cuenta solo puede tener una invitadora)
  - `code`
  - `created_at`
  - `trial_extended_at`
  - `paid_at`
  - `reward_status`: `pendiente | aplicado | descartado`
  - `reward_kind`: `cupon | prueba`
  - `reward_ref` (id del descuento de Stripe o fecha nueva de la prueba)
  - `motivo_descarte`
- RLS: cada usuario solo ve las filas en las que es `referrer_id`. Las escrituras solo se hacen con service role o desde un trigger `security definer`.
- Trigger `AFTER INSERT ON profiles`, aparte para no tocar `handle_new_user`, que también manda la bienvenida:
  1. lee `raw_user_meta_data->>'referral_code'` de `auth.users`;
  2. busca a quien invita;
  3. aplica las reglas antiabuso (abajo);
  4. inserta en `portal_referrals`;
  5. fija `trial_ends_at = greatest(coalesce(trial_ends_at, now()), created_at + 60 days)`, a las 23:59:59 de Madrid, como hace `portal_sync_trial_end`.

  Nunca acorta la prueba, y una concesión más larga gana.
- RPC `my_referrals()` para la pantalla. Devuelve el código, el enlace, cuántas cuentas se han dado de alta, cuántas pagan y cuántos meses se han ganado. Los nombres de las invitadas salen solo con la inicial, como en el foro.

### 2. Frontend (repo + push, sin chat)

- `captureUtms()`: si llega `?inv=`, guarda `fp_inv` en localStorage. Gana el último código recibido y caduca a los 30 días.
- `signUp`: añade `referral_code` a `options.data`.
- `/login?modo=registro&inv=XXX`: aviso encima del formulario: «Te ha invitado una compañera: tienes 60 días de prueba en lugar de 30».
- Pestaña «Invita a otra farmacia» en `/perfil`:
  - enlace con botón de copiar;
  - botón de WhatsApp (`https://wa.me/?text=` con el texto preparado);
  - contadores sacados de `my_referrals()`;
  - la regla, explicada en dos frases.
- **No se construye «escribe el email de tu compañera y se lo mandamos».** Sería un envío comercial nuestro a alguien que no ha consentido (LSSI art. 21: nada de email en frío). Comparte quien invita, desde su WhatsApp o su correo.
- GA4: evento `referral_share` (copiar o WhatsApp) y parámetro `referral=1` en `sign_up`.

### 3. Edge `stripe-webhook` (una sola petición a Lovable)

En `invoice.paid`, si `amount_paid > 0` y es la primera factura pagada de esa cuenta:

1. Busca su fila en `portal_referrals` con `reward_status='pendiente'`. Si no la hay, no hace nada.
2. Pone `paid_at`.
3. Premia a quien invita:
   - **Si tiene una suscripción activa en Stripe:** aplica a su suscripción el cupón `REFERIDO-1MES` (100 %, `duration: once`) con `stripe.subscriptions.update(sub, { discounts: [{ coupon }] })`. Si ya tiene un descuento puesto, el premio no se pierde: queda en `pendiente` para la siguiente factura.
   - **Si sigue en prueba:** suma 30 días a `trial_ends_at`.
   - **Si no tiene suscripción ni prueba vigente:** queda `pendiente`. Se aplica en su `checkout.session.completed` como `subscription_data.trial_end` + 30 días.
4. Registra `reward_kind`, `reward_ref` y `reward_status='aplicado'`.
5. Respeta la idempotencia que ya da `stripe_events`.

En `create-checkout` no hace falta tocar nada para la invitada: su prueba más larga ya la lee el portal, y FD3 usa el fin real de la prueba.

## Reglas antiabuso (en el trigger)

Se descarta, con `motivo_descarte`, si se da cualquiera de estas:

- el código es de la propia cuenta;
- el CIF de la invitada coincide con el de quien invita (es la misma farmacia);
- el dominio del email coincide y no es genérico (gmail, hotmail, outlook, yahoo, icloud);
- la invitada es miembro del equipo de quien invita (`team_subscriptions`);
- es una de las cuentas internas: fantafrenchie@gmail.com, nuriafrancis@gmail.com o mkproalaitz@gmail.com.

Tope de meses ganados al año por cuenta: lo decide Francesc (propuesta: 12).

## Decisiones de Francesc (07-10-2026, cerradas)

1. Tope: 12 meses ganados al año por cuenta.
2. El plan Equipo cuenta; el premio va a la suscripción de quien es titular.
3. El cupón `REFERIDO-1MES` lo crea la edge en el primer uso si no existe.
4. Precio de fundador: la invitada lo conserva hasta 7 días después del fin de su prueba de 60 días, **si aún quedan plazas**.
5. La invitada tiene plan Gratis 60 días (no Plus).

## Prueba antes de abrirlo

1. Cuenta A (interna de pruebas, fuera de las excluidas o con la exclusión desactivada en la prueba) y cuenta B dada de alta con `?inv=` de A. Comprobar la fila en `portal_referrals` y que el fin de prueba de B es alta + 60 días.
2. B paga en modo test. Comprobar el cupón en la suscripción de A, o +30 días si A está en prueba.
3. Caso CIF igual: debe quedar `descartado`.
