# Petición para Lovable: `open-reward` con apertura extra por reto

**Por qué esto no se puede hacer por repo:** `open-reward` es una edge function (`.ts` contra
Supabase). El push no la despliega de forma fiable (regla 27-08-2026), así que el cambio lo pide
Francesc por el chat de Lovable. Lo de BD ya está hecho y verificado en producción (10-09-2026,
migración `20260910170000_retos_semanales_cron_y_entrada_cajon.sql`):

- El UNIQUE de `rebotica_openings` pasó de `(user_id, campaign_id)` a
  `(user_id, campaign_id, source)`. `'reto'` ya estaba admitido en el CHECK de `source`.
- Existe `public.rebotica_extra_opening_available(_user_id uuid, _campaign_id uuid) → boolean`:
  devuelve true si el usuario completó un reto **semanal** dentro de la ventana de esa campaña y
  no ha gastado todavía su apertura `source='reto'`. Una extra por campaña.

**Mensaje para pegar en el chat de Lovable (proyecto farmapro-portal):**

> En `supabase/functions/open-reward/index.ts` hay que permitir una segunda apertura del cajón
> cuando viene de un reto completado. Dos cambios, nada más:
>
> 1. El SELECT de idempotencia (sobre `rebotica_openings`, por `user_id` y `campaign_id`) tiene
>    que filtrar **también por `source`**, porque la tabla ya permite una fila por cada source.
>    Sin ese filtro, un usuario con dos aperturas rompe el `.maybeSingle()`.
>
> 2. Cuando la petición llega con `source: 'reto'`, antes de sortear hay que comprobar el derecho
>    llamando a la función de base de datos ya existente:
>    `supabase.rpc('rebotica_extra_opening_available', { _user_id: user.id, _campaign_id: campaign.id })`.
>    Si devuelve `false`, responder 409 con
>    `{ error: 'Todavía no has completado el reto de la semana' }` y no sortear.
>    Si devuelve `true`, seguir el flujo normal de sorteo e insertar la apertura con
>    `source: 'reto'`.
>
> El resto de la lógica (elección de campaña, `rebotica_pick_and_consume_prize`, stock,
> `expires_at`, respuesta) no se toca. No hace falta ningún `ON CONFLICT`.

**Después del despliegue** queda el front (gratis, por repo): en `/rebotica`, cuando
`rebotica_extra_opening_available` devuelva true, ofrecer la apertura extra diciendo de dónde
viene ("la has ganado completando el reto de la semana") e invocar `open-reward` con
`source: 'reto'`. Hasta que la edge esté desplegada, ese botón NO debe existir: daría error.
