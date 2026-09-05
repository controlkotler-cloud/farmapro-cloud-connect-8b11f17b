# Mensaje único para el chat de Lovable (portal) — preparación del D-day

> Revisado el 05-09-2026 contra la BD y el repo. Enviar el **martes 8**, después
> de hacer push de lo que haya pendiente en `main` (regla de convivencia: no se
> escribe a Lovable con commits nuestros sin sincronizar).

**Cuándo:** antes del ensayo de cobro, y con el repo sincronizado (regla de
convivencia: si hay commits nuestros sin pushear, primero push, confirmar sync,
y solo entonces mandar esto).

**Cuánto cuesta:** un `send_message`. Va todo junto a propósito: cada iteración
corta vuelve a cobrar.

**Antes de pegarlo, Francesc necesita a mano dos valores del dashboard de Stripe
(cuenta mkpro.es, modo LIVE):**

- `STRIPE_SECRET_KEY` → clave secreta `sk_live_…` (Developers → API keys).
- `STRIPE_WEBHOOK_SECRET` → el `whsec_…` del endpoint live que ya apunta a
  `https://jeysistgdajopfruqpbc.supabase.co/functions/v1/stripe-webhook`
  (Developers → Webhooks → ese endpoint → Signing secret).

Los 9 price IDs ya van escritos abajo: se han leído de la cuenta live el
03-09-2026 y son los definitivos.

---

## Mensaje (copiar desde aquí)

Tres encargos en uno. Hazlos en este orden y no toques nada más del proyecto.

**1) Secrets del proyecto (Stripe en modo LIVE).** Crea o actualiza estos 11
secrets con estos valores exactos:

| Secret | Valor |
|---|---|
| `STRIPE_PRICE_PLUS_MONTHLY` | `price_1UAQsVGYq2u7pAViKZJyEvFo` |
| `STRIPE_PRICE_PLUS_MONTHLY_LAUNCH` | `price_1UAQsTGYq2u7pAVif7jCvdv9` |
| `STRIPE_PRICE_PLUS_YEARLY_LAUNCH` | `price_1UAQsYGYq2u7pAVi83muIE8q` |
| `STRIPE_PRICE_EQUIPO_MONTHLY` | `price_1UAQsbGYq2u7pAVidereTJ4M` |
| `STRIPE_PRICE_EQUIPO_MONTHLY_LAUNCH` | `price_1UAQsaGYq2u7pAViLUzLW6uN` |
| `STRIPE_PRICE_EQUIPO_YEARLY_LAUNCH` | `price_1UAQsgGYq2u7pAVit6J9q6ka` |
| `STRIPE_PRICE_IMAGE_PACK_20` | `price_1UAQsjGYq2u7pAVibcge5Ny3` |
| `STRIPE_PRICE_IMAGE_PACK_50` | `price_1UAQslGYq2u7pAViCC99ExqE` |
| `STRIPE_PRICE_IMAGE_PACK_100` | `price_1UAQsmGYq2u7pAVigNU5RFpo` |
| `STRIPE_SECRET_KEY` | (lo pego yo) |
| `STRIPE_WEBHOOK_SECRET` | (lo pego yo) |

No hace falta tocar código para esto: los price IDs se leen por
`Deno.env.get` en `supabase/functions/_shared/stripePrices.ts`.

**2) Redespliega estas cinco edge functions** para que cojan los secrets
nuevos: `create-checkout`, `create-team-checkout`, `stripe-webhook`,
`customer-portal`, `check-subscription`. Cuando termines, dime qué versión ha
quedado desplegada de cada una.

Importante: `create-checkout`, `stripe-webhook` y `_shared/holded.ts` ya llevan
en el repo (commit `f7f9dc8`, 04-09-2026, sincronizado en `main`) los cambios
que hacen obligatorios el NIF y la dirección fiscal en todo checkout
(`billing_address_collection: 'required'`, `tax_id_collection`,
`customer_update`, y el webhook leyendo `customer_details`). **No los
reescribas ni los revises: solo despliega lo que hay en `main`.** Sin ese
despliegue, las facturas de Holded del primer día vuelven a salir sin NIF y en
borrador.

**3) Un cambio de una línea en `supabase/functions/open-reward/index.ts`.**
La RPC `rebotica_pick_and_consume_prize` tiene tres parámetros
(`p_campaign_id uuid, p_tier text, p_user_id uuid DEFAULT NULL`) y ahora mismo
se la llama solo con dos, así que la regla de no repetir premio a un mismo
usuario está dormida. En la llamada del bloque "Sorteo ponderado + decremento
atómico" (sobre la línea 166) añade el tercer argumento:

```ts
const { data, error } = await supabase.rpc("rebotica_pick_and_consume_prize", {
  p_campaign_id: campaign.id,
  p_tier: tier,
  p_user_id: user.id,
});
```

No cambies nada más de esa función: ni el bucle de 5 reintentos, ni el
manejo de errores, ni el resto del fichero. Después, redespliega `open-reward`
y confírmame que la versión desplegada ya lleva `p_user_id`.

## Después del mensaje (lo comprueba Claude Code / Francesc, no Lovable)

1. Un checkout real de prueba en live → mirar `subscriptions` y
   `portal_holded_invoices`. Estado verificado el 05-09-2026: **una fila en
   cada una**, del pago real del 04-09 (`sub_1UBt3qGYq2u7pAVizMr5NLCu`,
   19,90 €, Holded `6a9a8a0399493c8e6d0a1c66`). La cadena escribe; lo que hay
   que comprobar en el ensayo del 9 es que la factura salga ya **con NIF y
   dirección y fuera de borrador**. Después: cancelar y reembolsar esa
   suscripción (lo hace Francesc en Stripe), anular el borrador de Holded y
   devolver `founder_count.spots_taken` a 0.

   Descartado a propósito de este mensaje: el `reward_type` fijo a `'premio'`
   de `open-reward` (líneas 132 y 208). Verificado el 05-09 que no afecta al
   D-day — hay 0 filas en `rebotica_sorteos` y 0 en `rebotica_participaciones`,
   así que nadie puede recibir una participación. Deuda técnica de después del
   lanzamiento; meterla aquí solo añadiría riesgo y créditos.
2. Abrir un cajón en la Rebotica y comprobar que `rebotica_openings` suma fila
   y que el premio no se repite al segundo intento del mismo usuario.
