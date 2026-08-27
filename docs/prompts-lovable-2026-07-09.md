# Prompts para Lovable · v4 del 2026-07-15

> **Superado 27-08-2026:** estos prompts se ejecutaron en julio y describen el email transaccional del portal apoyado en una plataforma de envío externa contratada entonces. Esa plataforma se descartó el 27-08-2026 (el masivo volvió a Clientify; el ensayo de migración fue solo la campaña C7). El transaccional del portal ya NO usa esa API: `send-portal-email` encola el mensaje en la cola `transactional_emails` (pgmq) y el despachador `process-email-queue` (cron cada 5 s) lo envía contra la **API transaccional de Lovable**, remitente `Portal farmapro <noreply@notify.portal.farmapro.es>`, coste 0. Los secrets de aquella plataforma ya no se usan y la columna de `portal_email_log` que guardaba su id de envío se renombró a `message_id`. El texto de los prompts que sigue es el histórico tal cual se envió, con el nombre de la plataforma sustituido por una referencia genérica donde aparecía suelto.

> **ESTADO 16-07-2026 (sesión Cowork): PROMPT Nº 1 ENVIADO Y DESPLEGADO.** Se envió una versión RECORTADA
> (solo lo que faltaba; el bloque Stripe/Equipo ya estaba en repo) en 4 tandas, todo verificado en origin/main:
> A) `send-portal-email` + `portal_email_log` + 5 plantillas [`b90312f`]; B) bienvenida/fin-prueba(cron 09:15)/past-due [`d7fa69a`];
> C) Holded (`portal_holded_invoices`+helper+`invoice.paid`+packs+`add_image_credits`) + enum `past_due` + CIF `B99554446` + guard admin [`a0a2552`];
> D) guard de miembro de equipo en `check-subscription` + plantillas `equipo-invitacion`/`equipo-plaza-activada` en `manage-team` [`e19d032`].
> Bugs reales arreglados: índice único de `subscriptions.stripe_subscription_id` parcial→plano; `HOLDED_API_KEY` renovada. Test 4242 E2E con usuario QA OK.
> Pendientes menores: borrar 4 facturas test en Holded (ver Notion); NIT `caducidadDias:7` vs token 14 en el email de invitación; la plataforma de email de entonces en warm-up (superada 27-08-2026).
> **PROMPT Nº 2 (backend Rebotica): ENVIADO Y DESPLEGADO 16-07** [commit `f47a62b`]. Prerrequisito resuelto: tanda SQL 3 (`rebotica_calendar_draws`) creada por SQL directo (11 cols, índices únicos baúl/Gordo, RLS service-role). Desplegado: `open-reward` (sorteo ponderado + RPC `rebotica_pick_and_consume_prize` atómica) + `redeem-reward` (partner_optin→consent_ledger), cron `rebotica-cron-daily` [30 6 * * *] activo (activa/cierra campañas, aviso <48h, sorteos baúl 30-09/31-10/30-11 + Gordo 30-11), 5 plantillas `rebotica-*`, `verify_jwt=true` en ambas edges (OPTIONS 200). Sin envíos de prueba (warm-up de la plataforma de entonces, superada 27-08-2026); 1er sorteo real 30-09.
>
> **LOS DOS PROMPTS DEL SPRINT ESTÁN DESPLEGADOS Y VERIFICADOS (16-07).**

> Los DOS únicos prompts a Lovable del sprint (jerarquía: 1º SQL, 2º código, 3º Lovable solo edges agrupadas).
> Flujo: Francesc lee → "envíalo" en una sesión de Cowork (va por el conector, gasta créditos) → la sesión verifica el deploy.
> Orden: primero el nº 1 (Stripe + email del portal), después el nº 2 (backend Rebotica).
>
> **v2 (10-07)**: incorpora el análisis /analiza: (a) el portal NO tenía sistema de email (el original citaba
> `send-transactional-email`, que vive en farmapro-DIRECT) → se crea `send-portal-email` sobre la API
> transaccional de la plataforma de email nueva evaluada entonces (SPF/DKIM de farmapro.es ya verificados; evita el límite de 100 emails/hora
> de Lovable en el D-day); (b) misma cuenta Stripe que Palancas/GBP → TODOS los checkouts del portal llevan
> `metadata.origen='portal'` (también en subscription_data) y el webhook de farmapro-direct los ignora
> (filtro ya en código, commit 10-07); (c) el portal factura en HOLDED con su propio webhook (decisión
> Francesc 10-07); (d) fixes de manage-team; (e) regenerar types.ts (sin tipos de rebotica_*).
>
> **v3 (13-07)**: mecánica de premios v4 cerrada por Francesc — el baúl (mensual) y el Gordo (trimestral)
> SALEN del sorteo instantáneo (quedan con peso 0) y los adjudica el cron por SORTEO DE CALENDARIO entre
> las aperturas del período. Requiere la **tanda SQL 3** (tabla `rebotica_calendar_draws`, pendiente de
> escribir en sesión Code) ANTES de enviar el nº 2. El email al ganador del Gordo pide un móvil por
> respuesta para la llamada de Alejandro (finalidad limitada; NO se guarda en BD).
>
> **v4 (15-07)**: plan Equipo operativo (spec cerrada en `docs/plan-equipo-mi-farmacia-SPEC.md`). El webhook
> provisiona el equipo al pagarse (`ensure_team_subscription`) y lo desmonta al cancelar
> (`deactivate_team_for_owner`); `check-subscription` deja de degradar a los miembros (no tienen Stripe
> propio: paga el titular); `manage-team` reescrito (cupo server-side, invitación por la plataforma de entonces con
> caducidad 14 días, `validate_team_invitation` nueva de 2 parámetros, rol `equipo` al aceptar). Requiere
> la **tanda SQL 4** (`20260715120000_equipo_mi_farmacia_tanda4.sql`) ejecutada ANTES del nº 1.
> La UI (/mi-farmacia, pantallas del miembro) NO va en estos prompts: la hace la sesión de rediseño en Code.
>
> **AVISO de colisión (15-07)**: hay un rediseño de UI en curso en Claude Code con cambios locales sin push.
> Enviar los prompts SOLO cuando ese trabajo esté commiteado y pusheado (Lovable auto-commitea sobre el
> mismo repo y habría conflictos).
>
> **PREREQUISITOS antes de enviar el nº 1** (los configura Francesc en Lovable → Settings → Secrets):
> `STRIPE_SECRET_KEY` · `STRIPE_WEBHOOK_SECRET` · `HOLDED_API_KEY` (la misma de farmapro-direct) ·
> las credenciales de la plataforma de email evaluada entonces (superada 27-08-2026, ya retiradas) ·
> `APP_URL` (= https://portal.farmapro.es) ·
> **los 9 `STRIPE_PRICE_*`** (v4.1, 15-07: los Prices se crean A MANO en el dashboard de Stripe, en **modo
> test** para el pago 4242; chuleta exacta en la tarea Notion EQUIPO-STRIPE-PRECIOS). `STRIPE_SECRET_KEY`
> y `STRIPE_WEBHOOK_SECRET` también en modo test. **Antes del D-day**: replicar los 9 Prices en modo live
> y hacer swap de los 12 secrets de Stripe (tarea Notion STRIPE-LIVE, 01-09).
> **Y MUY IMPORTANTE**: el `stripe-webhook` de farmapro-DIRECT debe estar redeployado con el filtro de
> portal ANTES del primer checkout del portal (incluido el pago test). Ver pasos del 10-07.

---

## Prompt nº 1 · Stripe del portal + email transaccional propio

```text
Vamos a conectar Stripe con el modelo de planes REAL (src/lib/plans.ts): Gratis / Plus 39 €/mes (lanzamiento 19,90 de por vida para las primeras 100 plazas, anual 199) / Equipo 79 €/mes hasta 10 usuarios (lanzamiento 49, anual 490). IVA incluido. El enum user_role ya tiene 'plus' y 'equipo'. Secrets configurados: STRIPE_SECRET_KEY, STRIPE_WEBHOOK_SECRET, HOLDED_API_KEY, EMAIL_API_KEY, EMAIL_API_BASE, APP_URL. CONTEXTO IMPORTANTE: esta cuenta de Stripe es COMPARTIDA con otro proyecto (farmapro.es, que vende servicios sueltos); por eso TODO checkout que crees aquí debe llevar metadata.origen='portal' (el webhook del otro proyecto ignora esos eventos). Punto por punto:

1. Los Products/Prices YA ESTÁN CREADOS a mano en Stripe (modo test) y sus Price IDs están cargados como secrets: STRIPE_PRICE_PLUS_MONTHLY, STRIPE_PRICE_PLUS_MONTHLY_LAUNCH, STRIPE_PRICE_PLUS_YEARLY_LAUNCH, STRIPE_PRICE_EQUIPO_MONTHLY, STRIPE_PRICE_EQUIPO_MONTHLY_LAUNCH, STRIPE_PRICE_EQUIPO_YEARLY_LAUNCH, STRIPE_PRICE_IMAGE_PACK_20, STRIPE_PRICE_IMAGE_PACK_50 y STRIPE_PRICE_IMAGE_PACK_100 — exactamente los nombres que ya lee supabase/functions/_shared/stripePrices.ts. NO crees productos ni precios en Stripe, NO hardcodees Price IDs: al arrancar create-checkout y stripe-webhook valida que los 9 secrets existen y falla con mensaje claro si falta alguno.

2. Reescribe create-checkout: recibe {plan: 'plus'|'equipo', cycle: 'monthly'|'yearly'}; elige el Price de lanzamiento si quedan plazas fundador (recuento real, ver punto 5) y el regular si no; modo subscription; success/cancel a APP_URL. Metadata OBLIGATORIA en la session Y en subscription_data.metadata: origen='portal', plan, founder=true|false (la metadata de la suscripción es la que permite enrutar invoice.paid y subscription.deleted en los dos webhooks de la cuenta). Elimina los importes hardcodeados 500/2900/3900 y el texto "Portal FarmaPro" (farmapro en minúsculas). Desactiva o borra create-team-checkout y calculate_team_price_v2 (modelo viejo).

3. stripe-webhook: registra la idempotencia (event.id con unique) al PRINCIPIO del handler, no al final. checkout.session.completed: asigna profiles.subscription_role según metadata plan, guarda stripe_customer_id, inserta fila en subscriptions (hoy no se inserta y por eso la cancelación no encuentra qué degradar) y si founder=true marca is_founder en la suscripción. PLAN EQUIPO: si metadata.plan='equipo', llama además a la función SQL ensure_team_subscription(p_owner := user_id, p_stripe_subscription_id := id de la suscripción de Stripe) — ya existe en la base de datos, ejecútala con el service role; crea o reactiva el equipo del titular con 9 plazas de invitación (titular + 9 = 10 personas). Maneja además invoice.payment_failed (marca past_due y notifica por email, punto 9) y customer.subscription.updated/deleted: en deleted (y en updated cuando el plan deje de ser 'equipo'), ANTES de degradar al titular llama a deactivate_team_for_owner(user_id) — ya existe: cancela el equipo, retira las plazas y degrada a los miembros que no tengan suscripción propia — y después degrada al titular a freemium (o al plan nuevo) SOLO si su rol actual no es admin. Mantén la sincronización con Clientify existente.

4. FACTURACIÓN HOLDED (nueva en este proyecto): cada cobro real crea su factura fiscal en Holded vía API (header 'key' = HOLDED_API_KEY), replicando el patrón del proyecto hermano: contacto auto-creado por email (con el CIF de profiles.cif como NIF si existe), IVA 21% INCLUIDO en el precio (desglosa base), serie por defecto de Holded, e idempotencia por source_id en una tabla propia portal_holded_invoices (unique por source_id, resolution ignore-duplicates). Suscripciones: facturar en invoice.paid (cubre alta + cada renovación) con concepto "Suscripción portal farmapro · Plan {Plus|Equipo} ({mensual|anual}{, precio fundador})". Packs de imágenes (pago único): facturar en checkout.session.completed con concepto "Portal farmapro · Pack {N} imágenes IAFarma". NUNCA facturar el mismo cobro en los dos eventos.

5. Contador de plazas fundador real: crea una función o vista founder_count que cuente las suscripciones activas con is_founder=true, y una RPC pública de solo lectura para que la web actualice LAUNCH.spotsTaken; mientras tanto se actualiza a mano en plans.ts.

6. Reescribe check-subscription para validar por Price IDs del mapa (no por importes: hoy 39 € colisionaría con el rol 'premium' antiguo) y con lista de roles protegidos que NUNCA se degradan (admin). MIEMBROS DE EQUIPO: antes de degradar a freemium a un usuario sin customer o sin suscripción propia en Stripe, comprueba si es miembro activo de un equipo activo (team_members.status='active' JOIN team_subscriptions.status='active'): si lo es, su rol correcto es 'equipo' y NO se degrada (los miembros no tienen Stripe propio: paga el titular). Hasta que esto esté probado, validation_mode sigue en beta.

7. En config.toml declara explícitamente [functions.stripe-webhook] verify_jwt = false (Stripe llega sin JWT; la seguridad es la firma del webhook). Perfil > Facturación: conecta el botón "Gestionar suscripción" a la edge customer-portal existente (Stripe Billing Portal) para usuarios con stripe_customer_id.

8. Packs de imágenes (add-ons de plans.ts: 20/4,99, 50/9,99, 100/16,99): Prices de pago único con metadata pack_credits y origen='portal'; en el webhook, al pagarse, suma los créditos con una función atómica add_image_credits. La recarga automática NO va en esta tanda.

9. EMAIL TRANSACCIONAL PROPIO + NOTIFICACIONES. Este proyecto NO tiene sistema de email (no lo busques: no existe). Crea una edge function compartida send-portal-email que envíe por la API transaccional de la plataforma contratada entonces: POST {EMAIL_API_BASE}/send_emails con header X-AUTH-TOKEN={EMAIL_API_KEY}, from "Equipo farmapro <somos@farmapro.es>" (dominio ya autenticado: SPF/DKIM/DMARC verificados), html + versión texto. Estructura: registry de plantillas en _shared (igual patrón que un registry normal), castellano de España, firma "El equipo de farmapro", farmapro en minúsculas, sin emojis, footer legal RGPD (responsable Mkpro Kotler SL). Si la API responde error, reintenta 1 vez y deja log en una tabla portal_email_log (template, destinatario, estado). Con esa base, monta las notificaciones mínimas: (a) email de bienvenida al registrarse (dispáralo al crearse el usuario, con database webhook o trigger sobre auth.users hacia la edge), (b) aviso de fin de prueba los días 23 y 28 desde created_at (cron diario con pg_cron o scheduled function), (c) el aviso de past_due del punto 3. Haz un envío de prueba real de cada plantilla a control@mkpro.es y confirma que llegan.

10. manage-team, reescritura del plan Equipo (la tanda SQL 4 YA está ejecutada: existen validate_team_invitation(invitation_token_param, user_email_param) de DOS parámetros, ensure_team_subscription, deactivate_team_for_owner y get_team_progress; max_members ya es 9 y hay índice único anti-duplicados por (team_id, email) en filas vivas):
   (a) invite_member: además de validar la titularidad como ahora, valida el CUPO EN SERVIDOR (nº de team_members con status<>'inactive' del equipo < max_members; si está lleno, error claro "No quedan plazas: tu plan Equipo incluye al titular y 9 personas más"). No pases expires_at (el default de BD ya pone 14 días). Si el INSERT falla por el índice único (23505), responde "Esa persona ya tiene una plaza o una invitación pendiente". La URL de invitación es APP_URL + '/invitation?token=...' (NUNCA SUPABASE_URL). El email de invitación se envía por send-portal-email (punto 9) con una plantilla nueva 'equipo-invitacion': asunto "[nombre del titular o de la farmacia] te invita al portal farmapro", CTA a la URL, aviso "crea tu cuenta con este mismo email", caducidad 14 días, y esta línea de transparencia obligatoria: "Al unirte, el titular verá tu progreso formativo (cursos y evaluaciones) y tu última actividad en el portal. Tu actividad en la comunidad, IAFarma y la Rebotica es privada." DEJA de invocar clientify-sync para invitaciones (Clientify ya no envía email; su sync de CRM no se toca).
   (b) accept_invitation: llama a validate_team_invitation con SOLO (invitation_token, email del usuario) — la firma nueva; la vieja de 3 parámetros ya no existe y además el frontend nunca tuvo el team_id. Al aceptar: profiles.subscription_role='equipo' y subscription_status='active' (NO 'profesional' ni 'premium', que son roles legacy; ignora la columna member_role, es vestigial). Después envía por send-portal-email la plantilla nueva 'equipo-plaza-activada' al email del titular del equipo ("[nombre] ha activado su plaza · X de 10 personas").
   (c) remove_member: mantén el comportamiento actual (plaza a 'inactive' + degradar el perfil del retirado; check-subscription restaura a quien tenga suscripción propia). Cambia el texto de los mensajes: "Plaza retirada" (nunca "miembro removido").
   (d) NO toques la UI (/invitation, Perfil, /mi-farmacia): la lleva otra sesión. Registra las 2 plantillas nuevas en el registry de send-portal-email con el estilo de casa del punto 9.

11. Regenera src/integrations/supabase/types.ts desde la base real: faltan los tipos de rebotica_partners, rebotica_campaigns, rebotica_prizes, rebotica_openings y consent_ledger (las tablas ya existen en producción).

Al terminar: pago de prueba end-to-end con tarjeta test 4242 (alta Plus → rol en profiles → fila en subscriptions → factura en Holded SIN duplicado del otro proyecto → Billing Portal → cancelación degrada) y pega el resultado de cada paso.
```

---

## Prompt nº 2 · Backend Rebotica (ÚNICO, agrupado) — enviar DESPUÉS del nº 1

Las TABLAS ya existen en producción (tanda SQL 1, 09-07) y la **tanda SQL 2 (10-07) debe estar ejecutada antes**: añade `'reto'` al CHECK de `rebotica_openings.source`, engancha consent_ledger al registro y retira el SELECT de authenticated sobre `rebotica_prizes` (los premios se leen con service_role desde las edges). **También la tanda SQL 3 (pendiente de escribir, sesión Code)**: tabla `rebotica_calendar_draws` para las adjudicaciones de baúl/Gordo (evita chocar con el UNIQUE(user_id, campaign_id) de openings). NO pedir a Lovable que cree o modifique tablas.

```text
Vamos a montar el backend de "La Rebotica", el motor de recompensas del portal. Las tablas YA EXISTEN en la base de datos (rebotica_partners, rebotica_campaigns, rebotica_prizes, rebotica_openings, consent_ledger), con RLS activa: NO crees ni modifiques tablas. IMPORTANTE: rebotica_prizes NO es legible por authenticated (a propósito: pesos y stock del sorteo son secretos); tus edges leen premios con el service role. Solo edge functions, cron y plantillas de email. Punto por punto:

1. Edge function open-reward: recibe {campaign_id, cajon, source?}. source es opcional con default 'welcome' y solo admite 'welcome'|'quincena'|'aniversario'|'equipo'|'reto' (coincide con el CHECK de la tabla). Valida sesión (si no hay JWT, devuelve 401 con {redirect: '/login?modo=registro'} conservando campaign_id y cajon en la query). Valida campaña activa (rebotica_campaigns.estado='activa' y fecha dentro de rango). Idempotencia: si ya existe fila en rebotica_openings para (user_id, campaign_id), devuelve esa apertura, no sortea otra vez (la tabla tiene UNIQUE(user_id, campaign_id)). Sorteo ponderado por rebotica_prizes.peso SOLO entre premios de la campaña con stock_restante > 0 y aptos para el tier del usuario (tier del premio 'todos' o igual al plan del usuario; los premios de suscripción solo al pool que corresponda), con decremento ATÓMICO de stock_restante (UPDATE ... WHERE stock_restante > 0 RETURNING, mismo patrón que consume_image_credit; si pierde la carrera, re-sortea). El sorteo instantáneo SOLO considera premios con peso > 0: los de peso 0 son premios de calendario (baúl, Gordo) y los adjudica el cron del punto 3, NUNCA esta función. Inserta la apertura con source y expires_at según caducidad_dias del premio y devuelve el premio.

2. Edge function redeem-reward: recibe {opening_id}. Valida que la apertura es del usuario, no caducada y no canjeada. Marca el canje (redeemed_at). Si el premio es de partner (partner_id no nulo), exige en el body partner_optin=true explícito (si no llega, error 400 con mensaje claro) y escribe una fila en consent_ledger (tipo 'partner_optin', source 'canje', con el texto_version que se le pase desde la UI). Dispara el email correspondiente al premio vía send-portal-email.

3. Cron (pg_cron o scheduled function): pase diario que (a) activa las campañas cuya fecha de inicio llega y cierra las vencidas, (b) avisa por email a quien tenga premios sin canjear que caducan en menos de 48h, y (c) SORTEOS DE CALENDARIO: el último día de cada mes (30-09, 31-10, 30-11) sortea EL BAÚL entre todas las rebotica_openings del mes natural (de cualquier campaña de la temporada), excluyendo a quien ya figure como ganador de baúl en rebotica_calendar_draws esta temporada; el 30-11 sortea además EL GORDO (premio tipo 'gordo') entre TODAS las aperturas de la temporada, excluyendo a los ganadores de baúl. Cada adjudicación: inserta fila en rebotica_calendar_draws (la tabla YA EXISTE, no la crees), decrementa stock_restante del premio, envía email al ganador y aviso interno (plantillas del punto 4). El email del ganador del Gordo NO da detalles del premio: pide responder al correo con un móvil de contacto y franja horaria para una llamada de Alejandro (el teléfono NO se guarda en base de datos: finalidad limitada a gestionar el premio). TODOS los emails van por la edge send-portal-email creada en la tanda anterior (la plataforma contratada entonces). No montes otro sistema de envío.

4. Plantillas nuevas en el registry de send-portal-email: (a) rebotica-premio-ganado (premio, instrucciones de canje, caducidad), (b) rebotica-premio-caduca (recordatorio 48h), (c) rebotica-baul-ganador (enhorabuena, qué es el baúl y petición de dirección de envío de la farmacia por respuesta al correo), (d) rebotica-gordo-ganador (tono sobrio y SIN detalles del premio ni asunto revelador: "has ganado el premio grande de la temporada; Alejandro tiene que llamarte: responde con un móvil y cuándo te va bien"), (e) rebotica-aviso-calendario-interno (aviso a alejandro@mkpro.es con copia a control@mkpro.es en cada adjudicación de baúl o Gordo, con datos del ganador). Los avisos internos NO llevan enlace de baja. Castellano de España, firma "El equipo de farmapro", farmapro en minúsculas, sin emojis, footer legal RGPD estándar.

5. Seguridad: open-reward y redeem-reward con verify_jwt = true en config.toml (solo usuarios autenticados). Nada de lógica de sorteo en el cliente: la UI (/rebotica, ya en el repo) solo llama y muestra. No toques la UI ni Stripe.

Al terminar, si types.ts sigue sin los tipos de rebotica_*, regenéralo.
```

---

## Verificación tras cada deploy (lo hace la sesión que envía)

- OPTIONS 200 a las edges nuevas + revisar config.toml (verify_jwt correcto en cada una).
- Nº 1: pago test 4242 SOLO Francesc (tarea Notion) · factura en Holded del PORTAL y ninguna del proyecto direct (filtro origen=portal funcionando) · bienvenida + fin de prueba + past_due probados a control@mkpro.es · types.ts con rebotica_*.
- Nº 1 · EQUIPO (checklist completa en `docs/plan-equipo-mi-farmacia-SPEC.md` §8): pago test Equipo crea fila en team_subscriptions (max_members 9) · invitación llega por la plataforma de entonces con URL de APP_URL · invitar duplicado = error claro · aceptar invitación pone rol 'equipo' y avisa al titular · retirar plaza degrada · cancelar la suscripción Equipo degrada a TODOS los miembros (deactivate_team_for_owner) · check-subscription no degrada a un miembro activo.
- Nº 2: open-reward idempotente (2 llamadas = mismo premio) y 401 sin sesión · el sorteo instantáneo NUNCA devuelve un premio con peso 0 · redeem-reward sin partner_optin en premio de partner = 400 · cron listado en pg_cron (incluidos los sorteos de calendario) · las 5 plantillas probadas con envío real.
- Después del pago test: poner spotsTaken al recuento real cuando haya ventas (o cablear la RPC founder_count en plans.ts en la siguiente tanda UI).
