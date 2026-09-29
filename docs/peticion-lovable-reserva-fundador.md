# Petición a Lovable — reserva personal del precio de fundador (29-09-2026)

Pegar tal cual en el chat del proyecto del portal:

---
Dos cambios, sin tocar nada más:

1) `supabase/functions/create-checkout/index.ts`, rama de suscripción (Plus/Equipo), justo antes de `pickSubscriptionPrice(plan, cycle, founderSpotsLeft)` en el alta nueva (NO en la rama de cambio de plan, que conserva `isFounder` como está):
   - Llama a `admin.rpc('founder_reserva_hasta', { p_uid: user.id })` (la función ya existe en la BD; devuelve una fecha `YYYY-MM-DD`).
   - Si devuelve fecha y esa fecha es anterior a hoy en Europe/Madrid, usa `founderSpotsLeft = 0` para esta sesión (precio regular). Si el rpc falla o devuelve null, no bloquees el checkout: deja el comportamiento actual.
   - Añade `founderReservaHasta` (la fecha o null) al JSON de respuesta y al `log('session created', ...)`.

2) Redespliega `create-checkout` y `send-portal-email` (y cualquier otra edge function que importe `_shared/portalEmailTemplates.ts`) con el último commit de main (3a3afb2 o posterior).

No cambies precios, textos ni otras funciones.
---
