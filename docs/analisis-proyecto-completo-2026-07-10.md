# Análisis en profundidad del proyecto farmapro · 2026-07-10

> `/analiza` de TODO el proyecto: web/servicios, Impulso, portal, Rebotica, skills, email (Clientify/Mailrelay/Lovable) y Stripe.
> Método: 4 agentes de auditoría en paralelo (2 Opus código + 2 Sonnet docs/skills) + verificación cruzada manual de cada hallazgo crítico (FASE 2) + límites de email contrastados en fuentes vivas.
> **No se ha implementado nada.** Elige IDs de cualquiera de las 3 tablas y se ejecutan por tandas.
> Nota importante: la ficha `project_rebotica_portal.md` se actualizó HOY por otra sesión (re-prueba Mailrelay: GO LIMPIO, merge tag correcto `{{ subscriber.email }}`). Este informe usa esa versión fresca.

---

## Resumen ejecutivo por área (las 7 del encargo)

**1 · farmapro.es (web, servicios, email comercial).** Sólido. Worker con passthrough correcto, 301 de /rebotica ya activo, bloque D-day preparado y comentado, STATIC_ROUTES completo, 7 formularios con honeypot + rate limit + match exacto de Clientify, footer RGPD en todos los templates de cliente, Stripe→Holded robusto (firma, idempotencia, multi-servicio). Fallos reales: el webhook no reconoce `farmacia-silenciosa` (B1, urgente: C4 sale el 16-07), el voto Q24 no está preparado (B2), la medición GA4 no existe pese a que 7 páginas disparan eventos (B7), y la paginación del Worker mira `?page=` cuando el cliente usa `?p=` (B5).

**2 · Impulso (newsletters, blog, redes, suscriptores).** N1-N23 enviadas; N23 hizo HITO: 82 votos (máximo anterior ~4), la fórmula identitaria queda validada y de paso valida la mecánica del Cajón de la Quincena. Materia prima completa en local (21 textos + 24 fichas de cantera + 3 vídeos transcritos + guion para más). Riesgo real: el calendario de julio choca con tus vacaciones (17-07): N24 (23-07) tiene la "Respuesta" inventada cuando ya hay datos reales (B3), y C5 (30-07) tiene la infraestructura al 0% (B4). La lista no crece desde ago-25: la máquina de captación ES el lanzamiento del portal; hasta entonces, no prometer crecimiento.

**3 · Portal (lanzamiento, funcionamiento, planes, límites, notificaciones, alimentación).** Más avanzado de lo que dice la propia memoria: la UI /rebotica YA existe (cajonera + bases legales + stub honesto), commits pusheados. Pricing cerrado y coherente (`plans.ts` fuente única; Gratis 30 días→bloqueado; Plus 19,90/39; Equipo 49/79; packs de imágenes tras palanca). Gating server sólido en cursos/recursos/quiz/imágenes. Lo que falta para lanzar: Stripe (prompt listo, pero ver A4 y X1), notificaciones (no existe NINGÚN sistema de email en el portal: A2), doble check RGPD en el registro (A1, el hallazgo más grave del análisis), y la carga de contenido (píldoras listas en borrador; decidir is_premium, A10). Alimentación post-lanzamiento resuelta sobre el papel: "Estreno del mes" + goteo de píldoras (quedan 13 N de origen) + cantera (36 ORO sin fichar) + vídeos de Alejandro (agosto).

**4 · La Rebotica (premios, filtros, sostenibilidad, UI/UX).** Concepto y catálogo v3 cerrados; esquema SQL en producción bien diseñado (RLS, idempotencia UNIQUE, índices); el esquema SOPORTA las reglas v2 (anti-repetición por join a prizes, caducidad, source) salvo `'reto'` en el CHECK (A5, ya previsto). Filtros de "a quién le puede tocar qué": tier del premio + tier del usuario + anti-repetición 6/3 meses + pool de pago para el reto: todo especificado en el prompt de backend (correcto). Dos agujeros: cualquier autenticado puede leer pesos y stocks del sorteo (A6) y el prompt de backend asume un sistema de email que el portal no tiene (A2). Anti-fatiga ya diseñado (cadencia quincenal estricta, pool renovado, fase 2 escalonada, aniversario). UI/UX: cajonera sobria + skin eonbox para Apotheka con demo v3 como spec; queda pulir la landing con el flujo email→elección→registro.

**5 · Coherencia del conjunto.** El puente farmapro.es↔portal está hecho (301, flag PORTAL_LIVE, PortalLanzamiento espejando plans.ts, runbook de swap de 1 minuto, vuelta a farmapro.es desde el portal). Incoherencias que quedan: documentación por detrás de la realidad (D1d-D4d), y una de marca menor: conviven 4 verdes (logo real #88c835, botones portal hsl(92 58% 32%), email #97cf3a, PDF #A3D338) sin un documento único de tokens (X3).

**6 · Email (Clientify / Mailrelay / Resend / Lovable).** Mapa real verificado:
- **Clientify** = CRM + cañón de envío HASTA el calentamiento. Su API no crea campañas: operación manual para siempre. Se queda solo como CRM.
- **Mailrelay** = TODO el masivo desde N25/N26. **GO LIMPIO desde hoy**: `{{ subscriber.email }}` verificado con envío real, `use_premailer:false` obligatorio, wrapper 600px e `{{unsubscribe_url}}` ya en la plantilla base. Plan gratis 80.000 emails/mes + 20.000 contactos: nuestro volumen cabe 4 veces.
- **Lovable email API** = transaccional de farmapro-direct (50.000/mes incluidos, **100/hora por workspace**). Uso actual: decenas/mes. Sobra… hasta el D-day (A3).
- **Resend: NO se usa en ningún repo** (verificado). El portal HOY no tiene ningún sistema de email transaccional propio (solo clientify-sync para invitaciones): es EL hueco a decidir antes de enviar los prompts (A2).
- Emails de auth (confirmación de alta) del portal: van por el SMTP de Lovable; límites de auth sin verificar (X4). En el D-day, con pico de altas, el cuello de 100/hora puede morder (A3).

**7 · Stripe.** farmapro-direct: desplegado y operativo (multi-servicio + Holded idempotente + coaching), pendientes conocidos: primer pago real sin validar, SQL del cron de coaching sin ejecutar, Cal.com con fallback, link del resto grupal. Portal: sin conectar; el prompt está listo y cubre bien el modelo nuevo, PERO la capa actual usa el modelo viejo con una colisión peligrosa (39 € se clasificaría como "premium", A4) y hay un riesgo de arquitectura sin resolver: si el portal usa LA MISMA cuenta de Stripe, el webhook de farmapro-direct recibirá también los pagos del portal y los facturará como GBP en Holded (X1: verificar ANTES de ejecutar el prompt).

---

## ✅ TABLA 1 · CONFIRMADOS

Leyenda: Esfuerzo S/M/L · Beneficio y Riesgo (de aplicar el cambio) alto/medio/bajo.

### Área A · Portal + Rebotica (lanzamiento 10-09)

| ID | Cambio | Archivos | Severidad | Esfuerzo | Beneficio | Riesgo | Depende de |
|---|---|---|---|---|---|---|---|
| **A1** (P3) | Registro del portal SIN doble check RGPD y consent_ledger sin ningún escritor. El plan afirma "el registro ya tiene doble check": es FALSO (grep RGPD/consentimiento en `AuthForm.tsx` = 0; solo cookie banner). El KPI nº 1 del lanzamiento (30% consentimientos/90d) hoy es inmedible y el consentimiento no se captura. Fix: 2 checkboxes (RGPD + comerciales, nunca premarcados) + `texto_version` en user_metadata + hook `handle_new_user`→`consent_ledger` (SQL) | `farmapro-portal/src/components/auth/AuthForm.tsx` + tanda SQL 2 + `portal-plan-rebotica-maestro.md` §2.3 | **crítica** | M | alto | bajo | Texto legal de los 2 checks (redactamos, valida asesor si quieres) |
| **A2** (F1) | Los 2 prompts de Lovable asumen email inexistente: nº 2 dice "reutiliza send-transactional-email" y nº 1 p9 "vía el sistema de email existente", pero esa función vive en farmapro-DIRECT; el portal solo tiene clientify-sync. Lovable improvisaría. Decidir mecanismo y reescribir esas secciones ANTES de enviar: (a) replicar el patrón direct (API email de Lovable, mismo workspace), o (b) transaccional por API de Mailrelay (`send_emails`), que unifica plataforma | `prompts-lovable-2026-07-09.md:32,52-54` | **crítica** (bloquea enviar prompts) | S | alto | bajo | Decisión (a)/(b) tuya; recomiendo (a) para D-day por deliverability probada y (b) como evolución |
| **A3** (F2) | Cuello de botella D-day: Lovable limita a **100 emails/hora por workspace** (verificado en docs). El 10-09: confirmaciones de alta + bienvenidas + "premio ganado" del cajón superarán eso en las primeras horas (pico jueves x4-6). Mitigar: decidir si el alta requiere confirmación de email, pedir subida de límite a Lovable Support, y/o mover los emails de la Rebotica a Mailrelay | plan §2.2/§9 + decisión A2 | **alta** | S-M | alto | bajo | A2 |
| **A4** (P1) | Capa Stripe del portal en modelo VIEJO: `create-checkout` con 500/2900/3900 (no existe plus/equipo), `check-subscription` mapea por importes con colisión (Plus regular 39 € → "premium"; anuales sin mapear → degradaría a freemium al activar validation_mode), `create-team-checkout` por asientos. El prompt nº 1 YA lo cubre (reescritura por Price IDs): ejecutarlo + tu pago test 4242 antes del 17-07 | `farmapro-portal/supabase/functions/create-checkout/index.ts:52-56`, `check-subscription/index.ts:116-136`, `create-team-checkout` | **alta** | M (es enviar prompt + verificar) | alto | medio (probar bien) | **X1 resuelto antes**, A2 |
| **A5** (P2) | Tanda SQL 2 NO escrita y te vas el 17-07: debe incluir `'reto'` en el CHECK de `rebotica_openings.source` (el propio `contenido/reto-21-dias.md:211` lo marca bloqueante), el hook consent_ledger (A1) y el fix RLS de premios (A6). Escribirla YA para que la ejecutes antes de irte | nueva `farmapro-portal/supabase/migrations/2026071XXXXXXX_rebotica_tanda2.sql` (migración + copia para SQL editor) | **alta** (por agenda) | S | alto | bajo | A1/A6 decididos |
| **A6** (P4) | RLS de `rebotica_prizes` deja a CUALQUIER autenticado leer `peso`, `stock_restante`, `tier` y valor de la campaña activa: las probabilidades del sorteo son calculables y el misterio, rompible. La UI no usa esa lectura. Fix: retirar el SELECT a authenticated (el sorteo va con service_role) o vista pública solo con titulo/descripcion/tipo | `20260709120000_rebotica_schema_tanda1.sql:217-226` → corregir en tanda SQL 2 | **media-alta** | S | medio | bajo | entra en A5 |
| **A7** (E6) | Los 4 emails de campaña c8 usan `{{email}}`, que en Mailrelay resuelve a **VACÍO** (probado hoy): el link del cajón perdería `?e=` y rompería la identificación. Pasar a `{{ subscriber.email }}` + footer `{{unsubscribe_url}}` + wrapper 600px (patrón `BASE-email-inline.html`) | `impulso/01b-serie-comercial/c8-lanzamiento-rebotica/emails/dday-10-09.md`, `re-no-abridores-14-09.md`, 2 teasers | **alta** | S | alto | bajo | — |
| **A8** (P7) | `types.ts` sin regenerar tras la migración Rebotica (0 menciones a rebotica_*/consent_ledger): cualquier UI que las consulte no tendrá tipos. Pedir regeneración a Lovable (o incluirla en el deploy del prompt nº 2) | `farmapro-portal/src/integrations/supabase/types.ts` | media | S | medio | bajo | con A4/prompt nº 2 |
| **A9** (P5+P6) | Gating del Gratis incoherente cliente↔servidor: el server (`get_course_modules`) SÍ da módulos premium al trial y no aplica el tope de 2 cursos; el cliente (`useCourses.ts:144`) bloquea premium al trial. Decidir doctrina (¿el trial prueba premium o no?) y blindar el tope en server (contador tipo consume_image_credit) en la tanda Stripe | `20260702094101_*.sql:69-71`, `src/hooks/useCourses.ts:99-151` | media | M | medio | bajo | decisión tuya + A4 |
| **A10** (P11) | Decidir `is_premium` por píldora al cargarlas: la píldora 01 (onboarding, activa el 1er cajón) DEBE ser gratis o un usuario Gratis no podrá completarla; el resto reparte entre los 2 huecos del trial y premium | `farmapro-portal/contenido/*` + SQL de carga | media | S | alto | bajo | validación de tu reparto |
| **A11** (P10) | `reto-21-dias.md` tiene 46 rayas largas «—» (regla de casa: prohibidas) pese a declarar la regla en su línea 26. Limpiar antes de cargar el copy | `farmapro-portal/contenido/reto-21-dias.md` | baja | S | bajo | bajo | — |
| **A12** (P8) | `manage-team` construye la URL de invitación con `SUPABASE_URL` (dominio supabase.co → roto) e inserta miembros sin `member_role` (cae a 'profesional'). Camino secundario (el principal va por webhook), pero corregir con la tanda Stripe | `farmapro-portal/supabase/functions/manage-team/index.ts:72-84` | media | S | medio | bajo | con A4 |
| **A13** (P12) | Columna `rebotica_prizes.incomprable`: neologismo confuso; documentar o renombrar (p. ej. `no_comprable`/comentario SQL) antes de que el edge la use | migración tanda 2 (comentario) | baja | S | bajo | bajo | entra en A5 |

### Área B · farmapro-direct + calendario editorial

| ID | Cambio | Archivos | Severidad | Esfuerzo | Beneficio | Riesgo | Depende de |
|---|---|---|---|---|---|---|---|
| **B1** (E2) | El stripe-webhook NO reconoce `farmacia-silenciosa` (ServicioKey línea 159 no lo incluye) y el handoff de C4 instruye crear el Payment Link con `metadata servicio=farmacia-silenciosa` → caería al default `gbp`: factura Holded "Radiografía GBP" y tags Clientify erróneos para un pago real de C4 (¡se envía el 16-07 y la landing lleva viva desde el 01-07!). Fix: añadir alias `farmacia-silenciosa` → config de `mystery` (renombrando su label a "Auditoría Farmacia Silenciosa") + redeploy, o corregir el handoff a `servicio=mystery` | `farmapro-direct/supabase/functions/stripe-webhook/index.ts:159,192` + `C4-monetizacion-y-handoff.md:32` | **crítica** | S | alto | bajo (additive) | redeploy vía Lovable (créditos, mínimo) |
| **B2** (D2) | Voto Q24 sin preparar: `CAMPAIGNS` solo tiene '20'-'23' (verificado) y `GraciasQuincena` sin '24' → etiquetas internas erróneas y "gracias" genérico. Además falta decidir pregunta/opciones de Q24. Hacerlo + redeploy send-transactional-email ANTES del 16-07 (N24 sale el 23-07, ya de vacaciones) | `_shared/transactional-email-templates/internal-quincena-vote-alert.tsx:21-56`, `src/pages/GraciasQuincena.tsx:36-147` | **alta** | S | alto | bajo | decidir pregunta Q24 (propongo con B3) |
| **B3** (E4) | La "Respuesta" de N24 va INVENTADA ("la más repetida fue la gestión") cuando por primera vez hay 82 votos reales de N23. Pedir distribución real (Claude Code/Clientify), actualizar `N24-email-inline.html:112` y presumir del dato ("82 respuestas, récord") | `impulso/01-newsletters/bloque-4-liderazgo-gestion/N24-email-inline.html:112` + handoff | **alta** | S | alto | bajo | dato de Clientify (Claude Code) |
| **B4** (E5) | C5 (30-07) con infraestructura al 0% (6 ítems sin marcar) y montaje Mac de N24 pendiente; ambos caen en tus vacaciones y el sprint pre-17-07 no los cubre. Decidir: adelantar la infra C5 + montaje N24 al 12-16 jul (posible: patrón landing ya industrializado) o mover C5 a la vuelta | `C5-monetizacion-y-handoff.md`, `N24-MONTAJE-handoff.md` | **alta** (agenda) | M | alto | bajo | tu decisión de calendario |
| **B5** (D1) | Paginación: Worker busca `?page=` solo en `/blog`; el cliente usa `?p=` también en categorías → el noindex de paginadas nunca se aplica. Unificar a `?p=` y cubrir `/blog/categoria/*` | `edge-renderer.js:306-308` vs `src/pages/Blog.tsx:14`, `BlogCategoria.tsx:15` | media | S | medio | bajo | pegar Worker (tú); agrupar con próxima ventana |
| **B6** (D4) | Card de campañas dice "A medida" pero tu decisión documentada fue MOSTRAR precio y la landing/Worker dicen "desde 1.890 € + 390 €/mes". Alinear card | `farmapro-direct/src/data/services.ts:98` | media | S | medio | bajo | — |
| **B7** (D3) | Medición inexistente en farmapro.es: 7 páginas disparan `window.gtag` sin que exista GA4 (no-ops silenciosos: compras de coaching/palancas y leads SIN medir). Ya estaba en pendientes; añadir el detalle nuevo: el CSP del Worker (`script-src`) bloqueará googletagmanager si no se amplía. Tanda: GA4 + píxel + banner + CSP | `index.html`, `edge-renderer.js:1252-1257`, páginas Gracias* | media | M | alto | bajo | IDs de GA4/Meta (tú) |
| **B8** (E9) | Email al equipo con hueco sin rellenar (línea 32 "[Resto del equipo...]"); debe salir antes del 17-07 | `email-equipo-lanzamiento-portal.md:32` | media | S | alto | bajo | destinatarios finales (tú) |
| **B9** (D10) | `clientifyUpsert` del webhook compara emails sin `trim()` (inconsistente con el estándar de los submit-*) | `stripe-webhook/index.ts:78-80` | baja | S | bajo | bajo | agrupar con B1 (mismo deploy) |
| **B10** (D9) | Código muerto en services.ts: objeto `STRIPE`, tipo `"pago"` y `payUrl` sin uso | `src/data/services.ts:8,19,27-33` | baja | S | bajo | bajo | — |
| **B11** (D11) | Rama local `feat/coaching-titulares` obsoleta (su contenido ya está en main): borrarla para evitar confusión | repo farmapro-direct | baja | S | bajo | bajo | — |

### Área C · Skills + herramientas (todo ejecutable con Sonnet 5)

| ID | Cambio | Archivos | Severidad | Esfuerzo | Beneficio | Riesgo | Depende de |
|---|---|---|---|---|---|---|---|
| **C1** (S3+S4) | Reescribir `rebotica-quincena`: instruye "subir a Clientify… sin excepción" (plataforma equivocada desde el 08-07) y hardcodea `farmapro.es/rebotica` + `{{email}}` (tag que resuelve a vacío). Debe instruir: Mailrelay por API, URL `portal.farmapro.es/rebotica`, `{{ subscriber.email }}`, `use_premailer:false`, wrapper 600px, footer `{{unsubscribe_url}}` | fuente `.claude/skills/rebotica-quincena/SKILL.md:27,36` (+ paquete) | **crítica** | S | alto | bajo | C7 (o incluir mini-sección Mailrelay aquí) |
| **C2** (S6) | `rebotica-partners` presenta 490/1.290 como "Pricing oficial" y el guion da precio en la llamada, cuando tu decisión es NO dar cifras hasta validarlas con Alejandro. Marcar "PROPUESTO, pendiente validación Alejandro; no comunicar a partners" (misma nota en `como-funciona-un-cajon.md`) | `.claude/skills/rebotica-partners/SKILL.md:23-32,39` + `dossier-partner-rebotica/como-funciona-un-cajon.md` | **alta** | S | alto | bajo | — |
| **C3** (S10) | Divergencia de copias: la `rebotica-quincena` instalada en Cowork y el `.skill` aún dicen "leads opt-in entregados" (política prohibida); solo `.claude/skills` está corregida. Tras C1/C2/C4/C5/C6: re-empaquetar los 4 `.skill` y RE-INSTALARLOS en Cowork (te dejo los ficheros listos y el paso a paso; añadir esta regla al cierre de cada edición de skill) | `herramientas/skills-rebotica/*.skill` | **alta** | S | alto | bajo | C1-C6 hechos |
| **C4** (S7) | `rebotica-partners`: añadir el matiz "LinkedIn NO es canal de pitch" (pedir criterio a warm / nota sin pitch / post de Alejandro; dossier y precio SIEMPRE por email) | `.claude/skills/rebotica-partners/SKILL.md:3,37` | media | S | medio | bajo | con C2 |
| **C5** (S1+S2) | `rebotica-tecnica`: añadir la 2ª vista (`v_rebotica_consentimientos_diarios`) y las columnas de `rebotica_campaigns` (incluida `skin` cajonera/eonbox, mecanismo Apotheka) | `.claude/skills/rebotica-tecnica/SKILL.md:37,42` | media | S | medio | bajo | — |
| **C6** (S9+S8) | `rebotica-contenido`: marcar la lista de 8 píldoras como YA VALIDADA (N01,N06,N05,N04,N03,N17,N08,N21) y frontmatter "N1-N28"→"N1-N21" | `.claude/skills/rebotica-contenido/SKILL.md:3,42` | baja | S | bajo | bajo | — |
| **C7** (nueva) | **Skill nueva `mailrelay-envio`** (transversal, no solo Rebotica): operar TODO el envío por API (crear campaña con HTML, send_test, send_all con target repetido, stats para no-abridores/RE, webhooks HMAC, sync suscriptores, baja sticky) + las 4 reglas de oro de hoy (`{{ subscriber.email }}`, `use_premailer:false`, wrapper, unsubscribe). Hoy ese conocimiento vive enterrado en 270 líneas de ficha | nueva en `.claude/skills/` + `.skill` | **alta** | M | alto | bajo | — |
| **C8** (nueva) | **Skill nueva `impulso-montaje`**: checklist determinista de montaje/envío por número (pregunta+opciones → CAMPAIGNS → GraciasQuincena → redeploy → PDF/featured/SQL → programar envío → verificar). El paso del voto se ha olvidado YA 2 veces (N22/N23) y B2 sería la 3ª | nueva en `.claude/skills/` + `.skill` | media-alta | M | alto | bajo | C7 (comparte reglas de envío) |

### Área D · Documentación (índices vivos)

| ID | Cambio | Archivos | Severidad | Esfuerzo | Beneficio | Riesgo | Depende de |
|---|---|---|---|---|---|---|---|
| **D1d** (E1+E8+E11) | ESTADO-PRODUCCION desactualizado pese a fechar "09-07": landings /manual-procesos y /diseno-farmacia figuran PENDIENTES estando EN VIVO (commits en main verificados); falta la fila de /campanas-farmacia; el "qué falta" de C4 omite el punto webhook (B1). Es el fichero que se lee PRIMERO: corrige o hace reabrir trabajo hecho | `impulso/00-estrategia/ESTADO-PRODUCCION.md:14,39-44` | media | S | alto | bajo | — |
| **D2d** (E3) | Calendario maestro y ESTADO no reflejan el plan Rebotica: N26 = teaser 1 (P.D.), N27 = teaser 2, C8 = EL LANZAMIENTO (no un servicio), N28 = resultados de cajones. El cruce "antes de fijar" que exige el plan §4.2 sigue sin hacer | `impulso/00-estrategia/calendario-maestro-editorial.md` + ESTADO + Google Calendar | media | S | alto | bajo | con D1d |
| **D3d** (E12) | CLAUDE.md raíz: añadir a "documentos vivos" el runbook del swap y los prompts Lovable; actualizar estado (pushes ya hechos, UI /rebotica existente, Mailrelay GO LIMPIO) | `CLAUDE.md:24` + ficha memoria | baja | S | medio | bajo | tras aplicar tandas |
| **D4d** (E10) | TRIAJE de la cantera: 4 fichas re-clasificadas a plata al leerlas en detalle (conformación equipo, teorías organizacionales, Pigmalión, venta persuasiva) sin actualizar tabla ni contador "17/53" | `impulso/11-cantera/TRIAJE.md:200` + tabla | baja | S | bajo | bajo | — |

---

## ⚠️ TABLA 2 · DUDOSOS (los decides tú; explico la duda)

| ID | Cambio propuesto | Archivos | Severidad | Esfuerzo | Beneficio | Riesgo | Por qué dudo / qué falta para confirmar |
|---|---|---|---|---|---|---|---|
| **X1** (F3) | Colisión de webhooks Stripe entre proyectos: si el portal usa la MISMA cuenta Stripe que Palancas/GBP/coaching, el webhook de farmapro-direct TAMBIÉN recibirá los checkouts del portal y `detectarServicio` los mandará al default `gbp` → factura Holded y tags Clientify erróneos por CADA suscripción del portal. Fix barato: metadata `origen=portal` en los checkouts del portal + early-return en el webhook de direct (y decidir dónde factura Holded el portal) | `farmapro-direct/stripe-webhook` + prompt nº 1 del portal | **crítica si se confirma** | S | alto | bajo | Depende de un dato que solo tú tienes: ¿misma cuenta de Stripe? Si "sí": pasa a confirmado y va ANTES de A4. Si cuenta separada: falso positivo |
| **X2** (D8) | Las alertas internas de leads (alejandro@/control@) pasan por la lista de supresión y llevan link de baja: un clic accidental silenciaría los avisos de leads para siempre y sin error visible. Propuesta: bypass de supresión para templates `internal-*` | `send-transactional-email/index.ts:150-187` | media | S | medio | bajo | Es un tradeoff de diseño: el bypass reduce protección anti-spam interna. Decisión tuya; el riesgo real depende de cuánto confíes en no pulsar "baja" en un aviso interno |
| **X3** (F4) | Unificar tokens de marca: conviven #88c835 (logo real), hsl(92 58% 32%) (botones portal AA), #97cf3a (emails), #A3D338 (PDFs). Propuesta: 1 doc de tokens (marca/UI/email/print) y a partir de ahí, coherencia | nuevo `impulso/06-tecnico/tokens-marca.md` | baja-media | S | medio | bajo | Puede ser deliberado (AA en botones, lima en print). Es criterio de diseño tuyo; el valor está en escribirlo, no necesariamente en cambiar colores |
| **X4** | Límites de emails de AUTH de Lovable Cloud (confirmación de registro) sin verificar para el D-day (el 100/h documentado es del transaccional). Propuesta: prueba de carga ligera o pregunta a soporte Lovable en agosto; plan B: desactivar confirmación por email en el alta durante la ola | config Auth del portal | media | S | alto | bajo | No encontré cifra pública específica de auth-emails de Lovable; sin dato, es prudencia, no hallazgo |
| **X5** (P6-dirección) | ¿El trial de 30 días accede a contenido premium? El server hoy dice sí, el cliente dice no (incongruencia confirmada en A9). La DIRECCIÓN correcta es decisión de producto tuya: (a) trial prueba todo con topes (más conversión), o (b) trial solo free (más presión a pagar) | decisión → A9 | media | — | — | — | El pricing cerrado dice "1-2 cursos, 2-3 recursos" sin especificar si premium: ambigüedad real del spec |

---

## ❌ TABLA 3 · PROBABLES FALSOS POSITIVOS (la crítica los tumba; los dejo visibles)

| ID | Hallazgo original | Por qué parecía problema | Por qué probablemente NO lo es | Si aun así quieres tratarlo |
|---|---|---|---|---|
| **Z1** (D6) | Los 4 formularios exigen el check de comunicaciones comerciales (400 si falta): posible fricción RGPD "consentimiento libre" | Bundling de consentimiento es zona gris del art. 7.4 | Es DECISIÓN deliberada documentada (`project_forms_legal_y_antispam.md`: "checkbox comunicaciones comerciales OBLIGATORIO (intercambio por valor)") | Mencionarlo en la nota LIA que ya está prevista para el asesor |
| **Z2** (D7/P9) | `.env` trackeado en git en ambos repos | Un .env en git suele ser fuga | Solo contiene claves PÚBLICAS por diseño (anon/publishable, van al bundle) y es la convención de Lovable; destrackearlo puede romper su flujo | Regla de higiene: jamás añadir secretos a esos .env (los secrets viven en Supabase/Lovable) |
| **Z3** (E7) | `borradores-campana-lanzamiento.md` con rayas largas y "FarmaPro" | Incumple reglas de casa | Es el borrador SUPERADO; los 4 emails formalizados ya están corregidos | Mover el borrador a `archivo/` para que nadie lo reutilice |
| **Z4** | "Falta la UI /rebotica" y "commits sin push" (lo decía la propia memoria/contexto) | La ficha lo afirmaba | La realidad va POR DELANTE: `Rebotica.tsx` + bases legales existen y TODO está pusheado (verificado en git) | Solo actualizar la ficha (entra en D3d) |
| **Z5** | Nota de prensa dice "1 de cada 6 farmacias" y la memoria "1 de cada 8" | Parece contradicción de datos | Son dos métricas distintas y ambas correctas: suelo inequívoco (1/8) vs estimación total (1/6), etiquetada "según estimaciones de la compañía" | Nada |
| **Z6** | Emails internos `internal-*` llenos de «—» | Regla anti raya larga | Son placeholders `\|\| '—'` para campos vacíos en avisos internos, no copy de cliente | Nada |

---

## Orden recomendado (solo confirmados) · sprint 10-16 julio y después

La lógica: primero lo que SOLO TÚ puedes hacer antes del 17-07, después lo que protege envíos con fecha, después skills (multiplican todo lo demás), después limpieza.

**Bloque 1 · esta semana, contigo (10-13 jul):**
1. **X1 → pregunta de 1 minuto** (¿misma cuenta Stripe?) → si sí, aplico el filtro con B1 en el mismo deploy.
2. **B1 + B9** (webhook: alias farmacia-silenciosa + trim) + **B2** (Q24: te propongo pregunta y opciones con los datos de B3) + **B3** (distribución real de N23 vía Claude Code) → un solo redeploy de send-transactional-email.
3. **A5 (tanda SQL 2)** con A1-hook + A6 + 'reto' + A13: te la dejo lista, la ejecutas (10 min).
4. **A1-UI** (checkboxes registro) + **A2** (reescribir secciones de email de los 2 prompts) → **A4** (enviar prompt Stripe) → tu pago test 4242 (15-07 como estaba).
5. **B8** (rellenar hueco y enviar email al equipo) + **B4** (decisión: ¿adelanto infra C5 + montaje N24 al 12-16?).

**Bloque 2 · protege el calendario (13-16 jul):** A7 (emails c8 a `{{ subscriber.email }}`), A10 (reparto is_premium píldoras), prompt nº 2 backend Rebotica (ya corregido por A2) si el nº 1 fue bien.

**Bloque 3 · skills (pueden ser 1 sesión Sonnet, antes o durante tus vacaciones):** C1 → C2+C4 → C5+C6 → C7 (mailrelay-envio) → C8 (impulso-montaje) → C3 (re-empaquetar + te dejo nota para reinstalar en Cowork).

**Bloque 4 · sin fecha crítica:** B5 (Worker paginación, agrupar con tu próximo pegado de Worker), B6, B7 (medición GA4+CSP, cuando tengas IDs), A8, A9+X5, A12, D1d-D4d, B10, B11, A3/X4 (agosto, antes del ensayo general).

---

## Verificaciones OK (lo que está BIEN; no reabrir)

- **Worker**: passthrough de assets antes de clasificar (regla crítica) ✓ · 301 /rebotica→portal ACTIVO ✓ · bloque D-day comentado con marcador ✓ · fichero limpio (0 null bytes) ✓ · 4 fusiones GMB (301) presentes ✓ · STATIC_ROUTES cubre todas las páginas ✓.
- **farmapro-direct**: árbol limpio y sincronizado con origin ✓ · stripe-webhook con firma verificada, idempotencia, Holded por source_id, coaching additive ✓ · 7 submit/subscribe con match exacto de Clientify, honeypot, timestamp anti-bot y rate limit ✓ · footer RGPD Mkpro Kotler SL en los 7 templates de cliente ✓ · Q22/Q23 completos (el fix del 09-07 llegó) ✓ · sin secretos hardcodeados ✓.
- **Portal**: UI /rebotica + bases legales EXISTEN con stub honesto ✓ · enum plus/equipo en BD ✓ · plans.ts fuente única coherente (spotsTaken=0, PACKS false) ✓ · gating server sólido (get_course_modules + REVOKE por columnas, quiz sin answer key, bucket recursos-premium, profiles_public invoker, provision-admin con user_roles, CIF único + RPC) ✓ · consume_image_credit atómico con refund ✓ · RLS Rebotica esencialmente correcta (idempotencia UNIQUE, índices, vistas gateadas) ✓ · 8 píldoras limpias (0 rayas, sin emojis, castellano, firma Laura, quiz completo) ✓.
- **Email/Mailrelay**: GO LIMPIO (tag `{{ subscriber.email }}` verificado con envío real; unsubscribe 200; wrapper OK; premailer off) ✓ · plantilla base y botones de voto ya corregidos ✓ · lista 7.581 importada, DNS 4/4 ✓ · `.mailrelay.env` con 3 variables fuera de git ✓.
- **Comercial Rebotica**: dossier regenerado sin precios ✓ · outreach vende el LANZAMIENTO y LinkedIn sin pitch ✓ · NdP con citas marcadas VALIDAR y "pionero, no el primero" ✓ · demo eOnbox operativa (solo falta el logo real de Apotheka) ✓.
- **Herramientas**: clientify-mcp SOLO lectura (29 tools, 0 escritura) ✓ · snapshot defensivo presente ✓ · agentes rebotica-dev/editor (sonnet) correctos ✓ · skills tecnica/contenido/partners sincronizadas en las 3 copias ✓.
- **Cantera/contenido**: 108 triados (totales cuadran) · 24 fichas · 21 textos completos + INDICE · 3 vídeos transcritos + guion de 10 temas ✓.

## Fuentes externas (límites de email)

- Mailrelay plan gratis 80.000/mes + 20.000 contactos: [mailrelay.com](https://mailrelay.com/en/) y [FAQ](https://mailrelay.com/en/faq/)
- Lovable: [50.000 transaccionales/mes incluidos](https://lovable.dev/faq/backend/email/authentication-emails-monthly-limit) y [100 emails/hora por workspace](https://docs.lovable.dev/features/custom-emails)
- Supabase Auth SMTP: [2/hora por defecto; 30/hora con SMTP propio, ampliable](https://supabase.com/docs/guides/auth/rate-limits)

---

*Análisis de 2026-07-10 (Cowork, Fable). Auditorías delegadas: farmapro-direct (Opus), farmapro-portal (Opus), documental (Sonnet), skills (Sonnet). Todos los hallazgos críticos re-verificados a mano sobre el código citado. Nada implementado: esperando tu selección de IDs.*
