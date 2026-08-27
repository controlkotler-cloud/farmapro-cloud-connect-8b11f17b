# Pasos de Francesc tras la auditoría · 2026-07-10

> **Superado el 27-08-2026:** estos pasos son de julio y ya se ejecutaron. Las referencias de más abajo a la plataforma de envío externa evaluada entonces para el email transaccional del portal quedaron superadas: esa plataforma se descartó (el masivo sigue en Clientify; el transaccional del portal usa la cola `transactional_emails` + API de Lovable). La skill de envío por API que se menciona más abajo tampoco está ya en uso.

> Todo lo automatizable YA ESTÁ HECHO y commiteado. Esto es lo que solo puedes hacer tú,
> en orden, con los prompts listos para copiar. Cada paso tiene su tarea en Notion
> (Agenda → Tareas · farmapro) con la misma ficha. Informe completo:
> `analisis-proyecto-completo-2026-07-10.md`.

## Lo que ya está hecho (commits locales, sin push)

- **farmapro-direct `a95e05f`**: webhook acepta `servicio=farmacia-silenciosa` (C4 facturará bien) + IGNORA los eventos del portal (misma cuenta Stripe, sin facturas duplicadas) + Q24 preparado (pregunta "¿De qué te fías para decidir?") + los avisos internos ya no se silencian por una baja accidental + precio real en la card de campañas. Typecheck OK.
- **farmapro-portal `da61d02`**: el registro ya pide el DOBLE CHECK RGPD (nunca premarcado, textos versionados) y lo manda al metadata; tanda SQL 2 escrita; reto sin rayas largas; reparto is_premium decidido. Typecheck OK.
- **Worker local** (`impulso/06-tecnico/cloudflare-worker/edge-renderer.js`): paginación noindex arreglada + CSP lista para GA4/píxel. Sintaxis verificada. Falta pegarlo (paso 6).
- **Prompts Lovable v2** (`prompts-lovable-2026-07-09.md`): reescritos con Holded del portal, email por la plataforma nueva evaluada entonces (superada 27-08-2026), metadata origen=portal, fixes manage-team y types.
- **6 skills** actualizadas/creadas + `.skill` regenerados (paso 2 para activarlas en Cowork).
- **Docs vivos al día**: ESTADO-PRODUCCION, calendario (teasers + C8=D-day), CLAUDE.md (mapa email + regla Stripe), tokens de marca, TRIAJE, ficha de la Rebotica.
- **Emails de campaña c8** con el merge tag bueno (`{{ subscriber.email }}`); borrador viejo archivado.
- **11 tareas creadas en Notion** con fecha y ficha de acción.

## Tus pasos, en orden

### 1 · Push + redeploy de direct (mañana sábado, 10 min) — DESBLOQUEA TODO
```sh
cd ~/farmapro/farmapro-direct && git pull --rebase origin main && git push origin main
cd ~/farmapro/farmapro-portal && git pull --rebase origin main && git push origin main
```
Después, en el chat de Lovable de farmapro-DIRECT, pega:
> Redespliega las edge functions stripe-webhook, send-transactional-email y preview-transactional-email con el código actual del repo (sin cambios de código). Confirma OPTIONS 200 de las tres.

**Por qué es lo primero**: sin este redeploy, un pago de C4 se factura como GBP y el primer checkout del portal crearía factura duplicada en Holded.

### 2 · Reinstalar las 6 skills en Cowork (5 min)
Finder → `~/farmapro/herramientas/skills-rebotica/` → instala los 6 `.skill` (los 4 rebotica-* + la skill de envío por API, superada 27-08-2026 + `impulso-montaje`). La copia que usa Cowork ahora mismo instruye enviar por Clientify con un merge tag roto.

### 3 · Ejecutar la tanda SQL 2 (10 min)
SQL editor de Lovable (portal) → pegar entero `farmapro-portal/supabase/migrations/20260710120000_rebotica_tanda2_consent_reto_rls.sql`. Idempotente. Al acabar, dime "tanda 2 ejecutada" en cualquier sesión para verificarla. Antes que el prompt nº 2 SIEMPRE.

### 3b · NUEVO 15-07: ejecutar la tanda SQL 4 (plan Equipo, 5 min) — ANTES del prompt nº 1
SQL editor de Lovable (portal) → pegar entero `farmapro-portal/supabase/migrations/20260715120000_equipo_mi_farmacia_tanda4.sql`. Idempotente. Crea las funciones que el nuevo webhook necesita (`ensure_team_subscription`, `deactivate_team_for_owner`, `get_team_progress`, `validate_team_invitation` v2) y arregla plazas/caducidad/duplicados. Spec: `docs/plan-equipo-mi-farmacia-SPEC.md`.

### 4 · Secrets del portal + prompt nº 1 (lunes 14, 15 min + sesión)
Lovable del PORTAL → Settings → Secrets: `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `HOLDED_API_KEY` (la de direct), las credenciales de la plataforma de email evaluada entonces (superadas 27-08-2026, ya retiradas), `APP_URL` = `https://portal.farmapro.es`.
Luego en Cowork:
> Lee prompts-lovable-2026-07-09.md, enséñame el prompt nº 1 y cuando diga "envíalo", mándalo a Lovable y verifica el deploy.

**OJO (15-07)**: el prompt nº 1 ya es **v4** (incluye el plan Equipo). Requisitos: tanda SQL 4 ejecutada (paso 3b) Y el rediseño de UI de Claude Code commiteado y pusheado (Lovable escribe en el mismo repo).

### 5 · Pago test 4242 (martes 15) y prompt nº 2
Pago test Plus en /precios → la verificación clave es que en Holded salga UNA factura del portal y NINGUNA "Radiografía GBP". Después, misma mecánica con el prompt nº 2 (backend Rebotica).

### 6 · Pegar el Worker (con la ventana que prefieras, antes del 16)
Copiar `~/farmapro/impulso/06-tecnico/cloudflare-worker/edge-renderer.js` → Worker divine-frost-a8c4 → Deploy → Purge Everything. Verificar: `farmapro.es/blog?p=2` con `noindex,follow` y la home 200.

### 7 · Claude Code: N24 con los votos reales (antes del 16)
En Claude Code (`~/farmapro`):
> Lee el CLAUDE.md raíz y ESTADO-PRODUCCION. Tanda montaje N24 con la skill impulso-montaje: (1) saca la distribución real de votos de N23 (mostrador/gestión/equipo), (2) reescribe la "Respuesta de la newsletter anterior" de N24-email-inline.html con los datos reales y presume del récord de 82 respuestas, (3) montaje completo: PDF + featured + SQL + verificación Q24 + programar envío del 23-07, (4) push y redeploy si tocas código. El código del voto Q24 ya está preparado (commit a95e05f).

### 8 · Dos decisiones tuyas (respóndelas en cualquier sesión)
- **C5 (30-07)**: ~~¿adelantamos la infra?~~ **RESUELTO 10-07: infra HECHA** (la landing /web-farmacia ya existía y está viva; card + webhook completados, commit `be7eb47`). Quedan 3 tareas en Notion: push del commit, programar el email en Clientify antes del 17-07, y featured+SQL del blog (Claude Code).
- **Email al equipo**: dime los destinatarios del hueco de la línea 32 y te lo dejo enviado.

### 9 · En agosto (tarea Notion del 12-08) · pregunta para soporte Lovable
> Our project portal.farmapro.es expects a registration spike on Sept 10 (product launch to a 7,500-contact list). Two questions: (1) what is the rate limit for AUTH emails (signup confirmations) on Lovable Cloud, and can it be raised for that day? (2) can the 100 emails/hour transactional limit be raised temporarily for the same workspace?

Plan B si no lo suben: desactivar la confirmación por email del alta en la semana del lanzamiento (se decide en el ensayo general de finales de agosto).

## Qué queda para sesiones de Claude (sin ti)

- ~~Tanda C5 infra~~ HECHA 10-07 (ver paso 8). Solo queda la parte Mac (featured + SQL, tarea Notion de Claude Code).
- Tanda medición GA4 + píxel + banner en farmapro.es (cuando tengas los IDs; el CSP del Worker ya está preparado).
- Contenido en goteo (píldoras 9-16, cantera, guiones de vídeo) con las skills nuevas, en agosto.
- La nota LIA de 1 página para el asesor (incluirá el matiz del checkbox comercial obligatorio).
