# Prompt para Lovable · `open-reward` pasa el usuario al sorteo

Único cambio de edge function pendiente antes del D-day. Cuesta créditos, así que
va en un solo mensaje cerrado. Copia y pega tal cual en el chat del proyecto
**Farmapro Cloud Connect**.

> Contexto: la función SQL `rebotica_pick_and_consume_prize` tiene ahora un tercer
> parámetro opcional, `p_user_id uuid DEFAULT NULL`. Cuando se le pasa el usuario,
> evita que un premio de tipo 'contenido' (la masterclass del vault y la plantilla
> exclusiva) le toque dos veces a la misma persona o a dos personas de la misma
> farmacia. La versión de dos argumentos ya no existe.
>
> Cambio pedido, solo este: en `supabase/functions/open-reward/index.ts`, en la
> llamada `supabase.rpc("rebotica_pick_and_consume_prize", { p_campaign_id:
> campaign.id, p_tier: tier })`, añade `p_user_id: user.id` al objeto de
> parámetros. No cambies nada más de la función ni de ningún otro fichero, y
> despliega `open-reward`.

## Por qué hace falta

La cajonera pasa a ser mensual (decisión del 02-09), así que un usuario abre
varios cajones a lo largo de la temporada y la repetición de premio pasa a ser
posible. Con la llamada actual de dos argumentos el parámetro llega nulo y la
regla no se aplica: el sorteo funciona, pero puede repetir.

## Cómo comprobar que ha entrado

En el SQL editor, con el `user_id` de una cuenta de prueba que ya tenga una
apertura con la masterclass:

```sql
SELECT p.titulo
  FROM rebotica_prizes p
 WHERE p.id = rebotica_pick_and_consume_prize(
   (SELECT id FROM rebotica_campaigns WHERE estado = 'activa' LIMIT 1),
   'gratis',
   '<user_id>'::uuid
 );
```

Repetido varias veces dentro de `BEGIN; … ROLLBACK;` no debe devolver nunca
"Masterclass del vault" para ese usuario.
