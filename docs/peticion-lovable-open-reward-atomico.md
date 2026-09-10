# Petición para Lovable: `open-reward` en una sola llamada atómica

**Estado del circuito el 10-09-2026, antes de esto**

- El cambio de la *apertura extra por reto* **ya está desplegado**: lo hizo Lovable esta misma
  mañana (commits `bb8b995` + `fccbea8`, 12:59 UTC) y está en el repo. Es decir: **no hay que
  agrupar los dos mensajes**, la petición de `docs/peticion-lovable-open-reward-apertura-extra.md`
  está cerrada.
- El UNIQUE de `rebotica_openings` es `(user_id, campaign_id, source)`.
- Existen y están en producción `rebotica_extra_opening_available(uuid, uuid)` y
  `rebotica_extra_opening_status()`.

**Por qué esto no se puede hacer por repo:** `open-reward` es una edge function (`.ts` contra
Supabase). El push no la despliega de forma fiable (regla 27-08-2026: dos commits seguidos, uno
tardó minutos y el otro no entró hasta pedírselo a Lovable por chat), así que el cambio lo pide
Francesc por el chat de Lovable.

---

## El bug que arregla

Abrir un cajón son hoy **tres pasos en tres transacciones distintas** dentro de la edge:

1. `rebotica_pick_and_consume_prize` → sortea y **descuenta `stock_restante`**.
2. `SELECT` a `rebotica_prizes` para leer `caducidad_dias` y calcular `expires_at`.
3. `INSERT` en `rebotica_openings`.

Si algo corta entre el 1 y el 3, el stock queda consumido y **no existe apertura**: el usuario
pierde su cajón y una unidad de premio desaparece sin registro ni rastro que auditar. No hace
falta un fallo exótico: **el doble clic ya lo reproduce** — dos peticiones simultáneas pasan las
dos el `SELECT` de idempotencia, las dos consumen stock, y la segunda revienta con unique
violation al insertar. La edge devuelve 500 y el stock se queda descontado.

## Y un agujero que se cierra por el camino

Al ampliar esta mañana el UNIQUE a `(user_id, campaign_id, source)`, `open-reward` pasó a
aceptar de un usuario con sesión los sources `'quincena'`, `'aniversario'` y `'equipo'` — están
en su `VALID_SOURCES` desde julio porque coinciden con el CHECK de la columna. Hasta esta mañana
el `UNIQUE(user_id, campaign_id)` los bloqueaba igual; desde el cambio, **tres premios extra por
campaña con tres POST**. Verificado que nada del repo llama a `open-reward` con esos valores: el
único sitio es `src/pages/Rebotica.tsx`, que manda `'welcome'` o `'reto'`. La función nueva y la
edge nueva solo admiten esos dos.

## Lo de BD ya está hecho

Migración `supabase/migrations/20260910200000_rebotica_open_cajon_atomico.sql` — **ejecutar ese
SQL con `query_database` ANTES de pedir el cambio de la edge** (añadir el fichero no ejecuta
nada). Es aditivo: la función nueva no la llama nadie hasta que la edge cambie, así que se puede
ejecutar sin ventana de riesgo.

Crea `public.rebotica_open_cajon(_user_id uuid, _campaign_id uuid, _source text)` → `jsonb`,
`SECURITY DEFINER SET search_path TO 'public'`, `GRANT EXECUTE` **solo** a `service_role` (nunca a
`authenticated`: recibe el `_user_id` por parámetro). Hace, en una única transacción:

- resuelve y valida la campaña (con `_campaign_id = NULL` busca la activa cuya ventana incluye
  hoy, misma regla que tenía la edge);
- rechaza cualquier `_source` que no sea `'welcome'` o `'reto'`;
- `pg_advisory_xact_lock` por (usuario, campaña, source), que serializa el doble clic;
- idempotencia por `(user_id, campaign_id, source)`;
- derecho a la apertura extra si `source='reto'`;
- tier del usuario (`subscription_role` + `team_members`);
- sorteo y descuento de stock llamando a `rebotica_pick_and_consume_prize` (que no se toca: sigue
  siendo la única fuente de verdad del sorteo);
- `INSERT` en `rebotica_openings` y relectura de la fila (el trigger `trg_rebotica_fulfil_opening`
  canjea al instante los premios automáticos, así que `RETURNING` devolvería un estado viejo).

Si el `INSERT` falla, Postgres revierte **también** el descuento de stock. Eso es el arreglo.

Respuesta de la función:

```json
{ "ok": true,  "already": false, "campaign_id": "…",
  "opening": { "id": "…", "opened_at": "…", "expires_at": "…", "redeemed_at": null,
               "fulfilled_at": null, "reward_type": "premio", "source": "welcome" },
  "prize":   { "id": "…", "titulo": "…", "descripcion": "…", "tipo": "…",
               "valor_percibido_eur": 0, "partner_id": null } }
```

```json
{ "ok": false, "error": "sin_stock" }
```

Códigos de `error`: `user_invalido`, `source_invalido`, `campana_no_encontrada`,
`campana_no_activa`, `campana_fuera_de_ventana`, `sin_campana_activa`, `reto_no_completado`,
`sin_stock`. Los errores *reales* (un fallo del sorteo) se dejan propagar a propósito, para que
la edge devuelva 500 con el mensaje de Postgres: enmascararlos como "sin stock" fue lo que tuvo
el sorteo roto e invisible del 13-07 al 02-09-2026.

---

## Mensaje para pegar en el chat de Lovable (proyecto farmapro-portal)

> En `supabase/functions/open-reward/index.ts`: el sorteo del cajón no es atómico. Hoy son tres
> pasos en tres transacciones (RPC que descuenta stock → SELECT del premio para `expires_at` →
> INSERT en `rebotica_openings`) y si algo corta en medio —un despliegue, un timeout, o
> simplemente el doble clic de un usuario— el stock queda consumido sin apertura: el usuario
> pierde el cajón y una unidad de premio desaparece sin registro.
>
> Los tres pasos ya viven en una sola función de base de datos, creada y ejecutada en
> producción: `public.rebotica_open_cajon(_user_id uuid, _campaign_id uuid, _source text)`, que
> devuelve `jsonb`. Hace la validación de campaña, la idempotencia, el derecho a apertura extra
> por reto, el tier, el sorteo, el descuento de stock y el INSERT en la misma transacción.
>
> El cambio en la edge es sustituir TODO el contenido del `try` (validación de campaña,
> idempotencia, tier, check de `rebotica_extra_opening_available`, bucle de
> `rebotica_pick_and_consume_prize`, SELECT de `rebotica_prizes` e INSERT en
> `rebotica_openings`) por una única llamada RPC y el mapeo de sus códigos a HTTP. Todo lo de
> antes del `try` (CORS, parseo del body, validación de `campaign_id` y `cajon`, y el bloque de
> auth con su `redirect` a `/login`) se queda EXACTAMENTE como está.
>
> Este es el fichero completo como debe quedar:
>
> ```ts
> // =====================================================================
> // open-reward: abre el cajón de la Rebotica para el usuario autenticado.
> //
> // - Body: { campaign_id?: uuid, cajon: number, source?: 'welcome'|'reto' }
> //   (source default 'welcome').
> // - Sin JWT -> 401 { redirect: '/login?modo=registro&c=<campaign_id>&cajon=<n>' }.
> // - TODO lo demás (campaña, idempotencia, tier, derecho a apertura extra por
> //   reto, sorteo, descuento de stock e INSERT de la apertura) lo hace UNA sola
> //   función de BD, `rebotica_open_cajon`, en UNA transacción. Antes eran tres
> //   pasos separados: si algo cortaba en medio (un despliegue, un timeout, o el
> //   doble clic de un usuario) el stock quedaba consumido sin apertura y el
> //   usuario perdía su cajón sin dejar rastro. Postgres ahora lo revierte entero.
> // - No dispara email aquí (el email "premio-ganado" lo envía redeem-reward al
> //   confirmarse el canje).
> // =====================================================================
>
> import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
> import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
>
> const corsHeaders = {
>   "Access-Control-Allow-Origin": "*",
>   "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
> };
>
> // Solo los dos sources que puede pedir una persona. 'quincena', 'aniversario' y 'equipo'
> // están en el CHECK de la columna porque los escriben otros caminos (sorteos de equipo y
> // de calendario), pero desde que el UNIQUE incluye `source` (10-09-2026) aceptarlos aquí
> // regalaba TRES premios extra por campaña a cualquiera con sesión. Un source desconocido
> // cae a 'welcome', que es idempotente.
> const VALID_SOURCES = ["welcome", "reto"] as const;
> type Source = typeof VALID_SOURCES[number];
>
> // Códigos de negocio de rebotica_open_cajon -> [status HTTP, mensaje al usuario].
> const BUSINESS_ERRORS: Record<string, [number, string]> = {
>   user_invalido: [400, "Usuario inválido"],
>   source_invalido: [400, "source inválido"],
>   campana_no_encontrada: [404, "Campaña no encontrada"],
>   campana_no_activa: [409, "La campaña no está activa"],
>   campana_fuera_de_ventana: [409, "La campaña no está en su ventana de apertura"],
>   sin_campana_activa: [409, "No hay campaña activa ahora mismo"],
>   reto_no_completado: [409, "Todavía no has completado el reto de la semana"],
>   sin_stock: [409, "Sin stock de premios disponible ahora mismo"],
> };
>
> const log = (step: string, details?: unknown) => {
>   console.log(`[open-reward] ${step}${details ? " - " + JSON.stringify(details) : ""}`);
> };
>
> function json(payload: unknown, status = 200) {
>   return new Response(JSON.stringify(payload), {
>     status,
>     headers: { ...corsHeaders, "Content-Type": "application/json" },
>   });
> }
>
> serve(async (req) => {
>   if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
>
>   const supabase = createClient(
>     Deno.env.get("SUPABASE_URL") ?? "",
>     Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
>     { auth: { persistSession: false } },
>   );
>
>   let body: { campaign_id?: string; cajon?: number; source?: Source };
>   try {
>     body = await req.json();
>   } catch {
>     return json({ error: "Invalid JSON body" }, 400);
>   }
>
>   const campaignIdRaw = String(body.campaign_id ?? "").trim();
>   const cajon = Number(body.cajon);
>   const source: Source = (VALID_SOURCES as readonly string[]).includes(body.source ?? "")
>     ? (body.source as Source)
>     : "welcome";
>
>   if (campaignIdRaw && !/^[0-9a-f-]{36}$/i.test(campaignIdRaw)) {
>     return json({ error: "campaign_id inválido" }, 400);
>   }
>   if (!Number.isInteger(cajon) || cajon < 1 || cajon > 30) {
>     return json({ error: "cajon inválido" }, 400);
>   }
>
>   // ---- Auth ----------------------------------------------------------------
>   const authHeader = req.headers.get("Authorization");
>   const loginRedirect = `/login?modo=registro${campaignIdRaw ? `&c=${encodeURIComponent(campaignIdRaw)}` : ""}&cajon=${cajon}`;
>   if (!authHeader?.startsWith("Bearer ")) {
>     return json({ error: "Unauthorized", redirect: loginRedirect }, 401);
>   }
>   const token = authHeader.replace("Bearer ", "");
>   const { data: userData, error: userErr } = await supabase.auth.getUser(token);
>   if (userErr || !userData.user) {
>     return json({ error: "Unauthorized", redirect: loginRedirect }, 401);
>   }
>   const user = userData.user;
>   log("user", { id: user.id, campaignIdRaw, cajon, source });
>
>   try {
>     // ---- Apertura atómica --------------------------------------------------
>     const { data, error } = await supabase.rpc("rebotica_open_cajon", {
>       _user_id: user.id,
>       _campaign_id: campaignIdRaw || null,
>       _source: source,
>     });
>     if (error) {
>       // Un error de Postgres NO es un estado de negocio: 500 con el mensaje real.
>       log("rpc error", { err: error.message });
>       return json({ error: error.message }, 500);
>     }
>
>     const result = data as {
>       ok?: boolean;
>       error?: string;
>       already?: boolean;
>       campaign_id?: string;
>       opening?: {
>         id: string;
>         opened_at: string;
>         expires_at: string;
>         redeemed_at: string | null;
>         fulfilled_at: string | null;
>         reward_type: string;
>         source: string;
>       } | null;
>       prize?: Record<string, unknown> | null;
>     } | null;
>
>     if (!result?.ok) {
>       const [status, msg] = BUSINESS_ERRORS[result?.error ?? ""] ??
>         [500, "No se ha podido abrir el cajón"];
>       log("rechazado", { code: result?.error ?? null, status });
>       return json({ error: msg }, status);
>     }
>
>     log("premio granted", {
>       userId: user.id,
>       openingId: result.opening?.id,
>       already: result.already === true,
>     });
>
>     return json({
>       ...(result.already ? { already: true } : {}),
>       reward_type: result.opening?.reward_type ?? "premio",
>       opening_id: result.opening?.id,
>       expires_at: result.opening?.expires_at,
>       redeemed_at: result.opening?.redeemed_at ?? null,
>       prize: result.prize ?? null,
>     });
>   } catch (err) {
>     const msg = err instanceof Error ? err.message : String(err);
>     log("ERROR", { msg });
>     return json({ error: msg }, 500);
>   }
> });
> ```
>
> No hay que crear ni modificar nada de base de datos: `rebotica_open_cajon` ya existe.
> `rebotica_pick_and_consume_prize` se queda como está (la llama la función nueva por dentro).

---

## Verificación después del despliegue

La forma de la respuesta no cambia (`data.prize`, `data.prize.titulo`, `data.already`,
`data.error`), así que `src/pages/Rebotica.tsx` no necesita ni un cambio.

1. Abrir un cajón con una cuenta que no haya abierto → premio y `already` ausente.
2. Volver a pulsar → `already: true` y el mismo premio, sin consumir stock (comprobar
   `stock_restante` antes y después con `query_database`).
3. Doble clic rápido → una sola apertura y **una** unidad de stock consumida. Antes salía un 500
   y el stock se descontaba dos veces.
4. Con `source: 'reto'` y el reto sin completar → 409 "Todavía no has completado el reto de la
   semana", y `stock_restante` intacto.
5. `POST` con `source: 'quincena'` → cae a `'welcome'` y devuelve la apertura que ya tenía
   (`already: true`), sin premio nuevo.
6. Correr `docs/rebotica-diagnostico-descuadre-stock.sql` (consulta 1) y confirmar que sigue sin
   descuadres.

### Lo que ya se ha probado (10-09-2026, Postgres 17.5 local con réplica del esquema)

El SQL se cargó en un cluster de pruebas con el esquema real, el sorteo real y el trigger de
canje, y se ejecutaron 15 casos. Lo relevante:

| Caso | Resultado |
|---|---|
| Apertura normal, segunda llamada, `already` | 1 apertura, 1 unidad de stock |
| 6 llamadas SIMULTÁNEAS del mismo usuario (doble clic) | 1 apertura, **1** unidad, 5 `already` |
| Las mismas 6 con los 3 pasos de hoy | 1 apertura, **4** unidades → **3 huérfanos** |
| Fallo forzado en el INSERT tras consumir stock | stock intacto, 0 aperturas (revierte) |
| El mismo fallo con los 3 pasos de hoy | stock 5 → 4, 0 aperturas (huérfano) |
| Campaña inexistente / fuera de ventana / no activa / reto sin completar / sin stock | cada uno su código, y **stock sin tocar** |
| Reto completado | apertura `reto` además de la `welcome`, una sola por campaña |
| Premio de `peso = 0` (El Baúl) | nunca se sortea |
| Re-ejecutar la migración 3 veces | sin error, sigue habiendo 1 sola función |

Queda sin probar en local lo que no se puede replicar sin producción: los datos reales de
`profiles`/`team_members` para el tier, y el trigger de canje verdadero (se usó una réplica
simplificada).
