# Plan maestro · La Rebotica

> Lanzamiento del portal farmapro con la Rebotica como pieza central.
> Escrito 2026-07-08 (Cowork) tras validación de concepto con Francesc.
> Decisiones de partida: **lanzamiento septiembre** · **500 € de capa memorable** · **jerarquía de ejecución SQL → código directo → Lovable (último recurso, solo edge functions/secrets)** · **Email masivo: plataforma de email masivo de farmapro (GO LIMPIO 10-07; sustituye al "Clientify cañón" original — Clientify solo envía ya N24/C5 y queda como CRM; detalle en `impulso/CLAUDE.md`). El transaccional del portal es aparte y va por §8 (superado 27-08-2026).**
> Contexto completo: `impulso/memory/project_rebotica_portal.md` · Dossier: `dossier-partner-rebotica/`.

---

## 0 · Principios innegociables

1. **La Rebotica regala, Promociones ofrece.** Premio = regalo completo, sin condiciones. Ningún descuento entra en un cajón (los nuestros se reformulan como regalo: "1 mes de Plus", nunca "-X%").
2. **GDPR es el KPI nº 1.** Toda mecánica pasa por el registro con doble check (RGPD + comunicaciones comerciales). El éxito de la acción se mide en consentimientos firmados tanto como en altas.
3. **Honestidad demostrable** (doctrina `spotsTaken`): stock real, premios reales, contador real. Nada que no resista una inspección.
4. **Deontología**: premios de negocio y formación; nada sanitario, nada de medicamentos ni incentivo a dispensación.
5. **Verdad en local/Supabase**: Clientify solo envía. Consentimientos, premios y estado viven en nuestra base.

## 1 · Objetivos y KPIs (D-day + 90 días)

| KPI | Objetivo | Cómo se mide |
|---|---|---|
| **Consentimientos GDPR firmados** (north star) | **30% de la lista activa (~2.275)** en 90 días | `consent_ledger` (Supabase) |
| Altas en el portal | 1.500 registros en 90 días | `profiles` |
| Plazas fundador (100, price-lock) | Agotadas en ≤30 días | contador real (visible desde 20) |
| Activación | ≥70% de registrados abre su cajón | `rebotica_openings` |
| Canje de premios | ≥50% de premios canjeados antes de caducar | `rebotica_openings.redeemed_at` |
| Partners | 2 partners fundadores cerrados antes del D-day | pipeline |
| Ingresos patrocinio temporada 1 (sept-nov) | ≥3.000 € | facturación Holded |
| Conversión a pago | objetivo del plan de 30 días vigente (100 fundadores) | Stripe |

## 2 · Arquitectura técnica (interno)

### 2.1 Esquema Supabase (TODO por SQL, lo ejecuta Francesc)

```
rebotica_campaigns   id, nombre, quincena_inicio, quincena_fin, estado(draft/activa/cerrada),
                     partner_id NULL, tema, email_campaign_ref,
                     skin(cajonera/eonbox, default cajonera)  ← quincenas de Apotheka usan la
                     estética de su robot eOnbox (demo: dossier-partner-rebotica/demo-eonbox-rebotica.html)
rebotica_prizes      id, campaign_id, titulo, descripcion, tipo(producto_propio/credito_ia/
                     contenido/servicio/partner_especie/gordo), tier(gratis/plus/equipo/todos),
                     valor_percibido_eur, stock_total, stock_restante, peso, caducidad_dias,
                     partner_id NULL, incomprable bool
rebotica_openings    id, user_id, campaign_id, prize_id, opened_at, redeemed_at NULL,
                     expires_at, source(text: welcome/quincena/aniversario/equipo), email_ref
consent_ledger       id, user_id NULL, email, tipo(rgpd/comercial/partner_optin),
                     texto_version, accepted_at, source(registro/canje/reto/descargable), ip
rebotica_partners    id, nombre, contacto, tipo(patrocinio/especie/ambos), estado(pipeline),
                     notas, opt_in_texto
```

- RLS: lectura de premios activos para autenticados; `openings` solo del propio usuario; `consent_ledger` y `partners` solo admin/service role.
- Vistas admin por SQL (`v_rebotica_dashboard`): aperturas, canjes, consentimientos/día, stock. **El panel de administración de la fase 1 es el SQL editor** (cero UI de admin hasta fase 2): ahorra semanas.

### 2.2 Lógica de servidor (ÚNICO prompt a Lovable, agrupado)

Una sola tanda a Lovable con TODO lo de backend (es lo único que no podemos hacer por SQL/código):

1. **Edge `open-reward`**: valida sesión + campaña activa + no abierto ya (idempotente) → sorteo ponderado por `peso` **SOLO entre premios con peso > 0** (los de peso 0 son de calendario: baúl/Gordo, los sortea el cron) con decremento atómico de `stock_restante` (patrón `consume_image_credit`) → inserta `opening` con `expires_at` → devuelve premio. Si el usuario llega con `?e=` sin cuenta, responde 401 con redirect a registro conservando la elección de cajón en query.
2. **Edge `redeem-reward`**: marca canje, dispara template email correspondiente y, si el premio es de partner, exige el check `partner_optin` y lo escribe en `consent_ledger`.
3. **Cron diario**: activa/cierra campañas, avisa premios a 48h de caducar, y **SORTEOS DE CALENDARIO (v4, 13-07)**: baúl 1/MES (último día de mes, entre las aperturas del mes) y Gordo 1/TRIMESTRE (30-11, entre toda la temporada, excluidos ganadores de baúl; nadie gana 2 baúles/temporada). Adjudicaciones en `rebotica_calendar_draws` (tanda SQL 3, pendiente). Emails por `send-portal-email` (cola `transactional_emails` + API transaccional de Lovable).
4. **Templates nuevos** en el registry (premio ganado, premio a punto de caducar, baúl ganador, Gordo ganador — sobrio, pide móvil por respuesta para la llamada de Alejandro, sin guardarlo en BD —, aviso interno a alejandro+control por cada adjudicación de calendario).
5. Escritura de `consent_ledger` en el registro (hook en `handle_new_user` puede ser SQL puro: valorar antes de dárselo a Lovable).

### 2.3 UI (código directo mío en el repo, cero Lovable)

- Página `/rebotica`: cajonera de botica en SVG/CSS de marca (sobria, 9 cajones con rótulos), estados cerrado/elegido/abierto, animación CSS discreta. Elegir cajón funciona SIN sesión; abrir exige registro (efecto compromiso). Skin `eonbox` para quincenas de Apotheka (spec visual = la demo v3).
- **Landing de lanzamiento** (añadida 08-07, faltaba como pieza explícita): página pública de entrada de toda la campaña con hero + promesa, la cajonera, los 3 planes con pricing (reutilizando `plans.ts`/`Precios.tsx`, que YA están cerrados), contador fundador, FAQ y CTA a registro. La hago yo en código (tanda UI S29-S30). Todos los emails y anuncios apuntan aquí.
- Bloque "Tu cajón" en el dashboard + badge de racha (fase 2).
- Página `/rebotica/bases-legales` (bases + política de premios + RGPD).
- Registro: ya tiene doble check y CIF; añadir `texto_version` del consentimiento al metadata (SQL/código).
- Flujo email→portal: links `farmapro.es/rebotica?c={campaña}&cajon={n}&e={email}` (patrón voto v2); la elección viaja al registro.

### 2.4 Medición

- GA4 + píxel ya montados en el portal (banner de cookies existente): eventos `rebotica_view`, `cajon_elegido`, `sign_up` (ya existe), `cajon_abierto`, `premio_canjeado`. UTM según convención (`impulso/00-estrategia/convencion-utm.md`).
- Revisión semanal automatizada: tarea programada de Cowork cada lunes (estado de campaña, stock, consentimientos, flags) dentro de la sesión de Revisión de los lunes.
- Snapshot mensual de `consent_ledger` a local (backup defensivo, misma política que Clientify).

## 3 · GDPR-max por diseño

- **Todos los caminos llevan al registro**: cajón de bienvenida, cajón de la quincena, reto, complementos de descargables (la "interacción extra" de la regla editorial pasa a canjearse en el portal cuando tenga sentido).
- `consent_ledger` guarda **versión literal del texto aceptado + fecha + origen + IP**: prueba sólida art. 7.1 RGPD.
- Check de partner **separado y nunca premarcado**, solo en el canje de premios de partner.
- Los no registrados tras la ola de lanzamiento: mini-secuencia "tu cajón sigue cerrado" (2 toques, sept-oct) + RE clásico a no abridores (ya funciona: +400 lectores/ola).
- Contador interno de consentimientos en la vista SQL: se revisa cada lunes.
- Nota para el asesor (1 página): LIA del interés legítimo para la base histórica + confirmación del flujo nuevo. La redacto yo, la valida el asesor.

## 4 · Comunicación (la capa que se recuerda)

### 4.1 Narrativa

"**Se abre la Rebotica**": en toda farmacia, la rebotica es donde pasan las cosas de verdad. La nuestra abre cada quincena y siempre hay premio. Sin trampa: aquí no se descuenta, se regala. Meta-mensaje sectorial (pieza de autoridad de Alejandro): "por qué en farmapro regalamos en vez de descontar".

### 4.2 Calendario (cruzar con calendario maestro y ESTADO-PRODUCCION antes de fijar)

**AJUSTE 13-08 (Francesc): jerarquía portal-primero.** El lanzamiento es DEL PORTAL; la Rebotica es el instrumento de engagement dentro de él. En toda pieza donde convivan: primero el portal, después el cajón. La presentación del portal (pieza 1) siempre delante de la Rebotica 60s (pieza 2); cuentas atrás ancladas con rótulo "se abre el portal de farmapro"; email D-day reordenado (portal → cajonera → plazas fundador). El manifiesto de LinkedIn se MUEVE del 18-08 al lunes 7-09: sin el teaser 2 delante, "regalamos en vez de descontar" confundía (farmapro vende servicios); el 7-09 ya tiene referente. Cronograma operativo completo (edición + publicaciones + prensa, día a día): `portal-cronograma-lanzamiento-completo.md`.

Cadencia editorial actual (jueves alternos): N25 06-08 · C6 13-08 · N26 20-08 · C7 27-08 · N27 03-09 · **hueco comercial 10-09** · N28 17-09.

| Fecha | Pieza | Contenido |
|---|---|---|
| 20-08 (N26) | teaser 1 | P.D. enigmática: "estamos montando algo en la rebotica" |
| 03-09 (N27) | teaser 2 | Bloque propio: la cajonera cerrada, "el jueves 10 se abre, todos tienen premio" |
| **Lun 07-09** | **Manifiesto** (movido del 18-08) | Blog pilar + LinkedIn Alejandro (rutina lunes): "por qué regalamos en vez de descontar", encuadrado como filosofía del PORTAL + vídeo pieza 3. Mismo día: cuenta atrás 1 en redes |
| Ma 08-09 | Prensa + carga portal | NdP (embargo 10-09), ángulo "nace el portal de formación y comunidad con IA". Masterclasses al vault, bienvenida, intros |
| Mi 09-09 | Redes + web | Cuenta atrás 2 · /rebotica live (vídeo pieza 2) · congelar (runbook swap) |
| **Jue 10-09** | **D-day: envío especial** (ocupa el hueco de la serie comercial: el lanzamiento ES la campaña C8) | **Orden nuevo**: 1) el portal abierto y qué hay dentro (vídeo pieza 1) → 2) la cajonera + elige tu cajón (CTA del día) → 3) 100 plazas fundador. Firma Alejandro. P.D.: link al manifiesto |
| 14-09 (lun) | RE a no abridores + redes | Social proof: primeros premios entregados (con permiso) |
| 17-09 (N28) | newsletter | "La Respuesta": qué ha salido de los cajones; recordatorio fundador |
| 24-09 | Cajón de la Quincena nº 2 | Primer cajón patrocinado (partner fundador) |
| Oct | quincenal estable | Racha + Fórmula Magistral (fase 2) |

Redes: cuentas atrás 7-09 y 9-09 (fechas SIEMPRE en rótulo), LinkedIn del D-day con el vídeo del portal primero (la Rebotica 60s, después), post recurrente "lo que ha salido del cajón" cada quincena. Blog: artículo pilar + bases legales enlazadas.

### 4.3 La capa memorable (≤500 €)

**El premio llega en un cajón de verdad.** Los 3 Gordos de la temporada reciben en su farmacia un cajón físico de madera tipo botica (rótulo personalizado con el nombre de la farmacia) con el premio dentro. Coste estimado: 3 × (cajón 40-60 € + rotulación 15 € + envío 10-15 €) ≈ **250 €**; resto = colchón para detalles (lote de bienvenida a los 3 primeros partners, imprevistos PR). La foto del titular con SU cajón es el activo social del trimestre y el gancho de la nota de prensa.

PR sectorial (coste 0, esfuerzo mío + Alejandro): notas de prensa REDACTADAS en `dossier-partner-rebotica/notas-prensa.md` (variante A medios farma, B marketing/PMFarma, C local Aragón + pitch, calendario de embargo y tabla de seguimiento). Ángulo: portal + mecánica pionera de regalos sin descuentos + el dato "1 de cada 6 farmacias" (estimación propia). Citas pendientes de validar con Alejandro y Laura.

### 4.4 Piezas a producir (todas mías salvo grabación)

Email D-day + 2 teasers + RE + secuencia "cajón cerrado" (2) · HTML cajonera para email (estático, imagen + links) · artículo blog pilar + bases legales · guiones vídeo Alejandro (2) · posts redes (6) · nota de prensa · plantilla informe partner. Copias locales de todo HTML enviado (regla de la casa).

## 5 · Partners

### 5.1 Oferta y pricing (propuesta inicial, validar en las 2 primeras conversaciones)

| Formato | Qué incluye | Precio (VALIDADO por Alejandro, 13-07) |
|---|---|---|
| Cajón patrocinado (1 quincena) | Presentación del cajón en email (7.2k envíos, ~2.400 lectores) + reenvío a no abridores + portal 14 días + post en redes + informe D+7. Logo siempre enlazado a su web | **490 €** (suelo 390 €) |
| **Partner fundador temporada 1** (sept-nov, 3 plazas) | 2 cajones patrocinados + logo en /rebotica toda la temporada + exclusividad de categoría + informe de temporada + precio bloqueado T2 | **1.290 €** (suelo 1.090 €) |

**REGLA de producto (definitiva, Francesc 13-07; sustituye a la del 09-07):** SIN productos de partner en los cajones, ni como regalo estrella ni en el pool. Los premios los pone SIEMPRE farmapro; el patrocinio es presencia pura (logo enlazado + línea de marca + informe). Detalle en `dossier-partner-rebotica/como-funciona-un-cajon.md`.

Justificación de precio: cada quincena pone la marca ante ~2.400 lectores verificados del sector + audiencia portal, con exclusividad total. No vendemos CPM ni datos: vendemos acceso a decisores de farmacia (dato dossier: 78% señal farmacia).

### 5.2 Pipeline (objetivo: 2 fundadores cerrados antes del 10-09)

1. **Confirmados para outreach (decisión 08-07): Apotheka y plusfarma** (contacto warm; sus códigos co-branded viven en Promociones, sus regalos en la Rebotica). El resto se busca: 5-7 candidatos de dermo/tecnología/formación propuestos en lluvia y validados por Francesc ANTES de contactar. Plantillas listas en `dossier-partner-rebotica/outreach-partners.md`; desglose del paquete y suelos de negociación en `dossier-partner-rebotica/como-funciona-un-cajon.md`.
2. Outreach de Alejandro (secuencia de 2 emails + seguimiento, la redacto yo) con el dossier PDF.
3. Cierre con **acuerdo de 1 página** (plantilla mía, valida el asesor): qué incluye, calendario, veto editorial nuestro, datos solo con opt-in, deontología.
4. Onboarding: ficha de premio (formulario simple), materiales de marca, fechas.
5. Post-quincena: informe automático (datos de la vista SQL) en plantilla.

## 6 · Contenido interno del portal (para que el bucle viva)

| Pieza | Fuente | Cuándo |
|---|---|---|
| 12-16 píldoras (5-10 min) con quiz | Reciclaje N1-N21 (infra quiz existe; 20 descargables ya en Recursos) | 8 antes del D-day, resto en goteo |
| Reto de lanzamiento "21 días para poner tu farmacia en marcha digital" | Infra retos existente | Listo el 10-09, arranca el 14-09 |
| Vault: 2 masterclasses grabadas (Alejandro/Laura) + 3 plantillas "solo cajón" | Grabación agosto | Antes del D-day |
| Onboarding recompensado (perfil + 1ª lección → 1er cajón) | Config, no desarrollo | Con el MVP |

### 6.1 · Ritmo de valor mensual (anti-churn, decidido 08-07)

Para que nadie tenga motivo de baja, cada mes hay **"Estreno del mes"** garantizado y visible: 1 curso o masterclass nuevo + 2-4 recursos nuevos + 1 reto o evento (el calendario de eventos de 12 meses ya existe) + créditos IAFarma renovados + 2 cajones de la Rebotica. La cadencia coincide con la ya decidida en el plan de 30 días (2-4 recursos y 1-2 cursos/mes). Dos piezas de retención con timing quirúrgico: **email "lo que llega el mes que viene"** enviado unos días ANTES de cada renovación (automatizable vía cron + `send-portal-email`, cola `transactional_emails` + API de Lovable) y **Cajón de Aniversario** en el momento de renovar. En el portal, sección/bloque "Nuevo este mes".

### 6.2 · Retos y Rebotica: UNIDOS, en dos tiempos (aclarado 08-07)

No son sistemas separados: los retos alimentan la Rebotica. **Tiempo 1 (lanzamiento)**: el reto de 21 días desemboca en la Rebotica (completar semana = recompensa intermedia; completar el reto = premio final vía cajón + diploma). **Tiempo 2 (fase 2, octubre)**: integración total con la Fórmula Magistral (completar retos/píldoras/acciones = ingredientes para abrir cajones) y el canje de puntos (`user_points`, hoy sin sumidero) para comprar aperturas extra. Operativamente son tablas distintas; para el usuario es un único sistema de juego.

## 7 · Roadmap semanal (owners: F=Francesc · CW=Cowork · CC=Claude Code · LV=Lovable · A=Alejandro)

| Semana | Hito | Tareas |
|---|---|---|
| **S28 (8-13 jul)** | Plan validado | F: valida plan + PDF dossier (Cmd+P). CW: SQL tanda 1 (esquema completo + vistas) **EJECUTADA Y VERIFICADA EN BD REAL** (`farmapro-portal/supabase/migrations/20260709120000_rebotica_schema_tanda1.sql`, 09-07 Claude Code) |
| S29 (14-20 jul) | Base de datos viva | F: ejecuta SQL tanda 1. CW: UI cajonera en el repo (rama/commits) + bases legales. A: valida pricing partner |
| S30 (21-27 jul) | Backend | CW: prompt Lovable ÚNICO (edges + templates + cron) preparado y revisado con F → LV lo ejecuta. CC: git sync + pruebas |
| S31 (28 jul-3 ago) | MVP end-to-end en test | Flujo completo: email test → elegir → registro (consent_ledger ✓) → abrir → premio → canje. F: valida |
| S32-33 (agosto) | Contenido + partners | CW: píldoras + reto + emails campaña. A: outreach partners (dossier). Grabar 2 masterclasses. Stripe del portal cerrado (prompt LV nº 2 ya previsto en reparto existente) |
| S34-35 (17-31 ago) | Pre-carga | Teaser 1 en N26 (20-08). Cargar premios reales + stocks (SQL bienvenida v2). Encargar 3+1 baúles de cartón full-print + baraja + cuaderno (contenido v4, ~350-480 €). Nota de prensa lista. Teaser 2 en N27 (03-09) |
| **S37 · jue 10-09** | **D-DAY** | Envío especial + redes + contador fundador activo. Guardia técnica ese día (CW+F) |
| S38-39 | Sostener | RE 14-09 · N28 con resultados · cajón nº 2 patrocinado (24-09) · nota de prensa fuera |
| Oct (fase 2) | Ampliar | Racha + Fórmula Magistral + canje de puntos + evaluación email (ver §8) + informe temporada a partners |

Regla de ejecución permanente: **1º SQL (F) · 2º código directo en repo (CW/CC) · 3º Lovable solo edge functions/secrets/storage, agrupado en el mínimo de prompts** (gasta créditos; lo demás no).

## 8 · Capa de email del portal (transaccional)

**Superado el 27-08-2026:** el portal ya no usa el proveedor de email masivo externo para el transaccional. El envío lo hace `send-portal-email`, que encola en la cola `transactional_emails` (pgmq); el despachador `process-email-queue` (cron cada 5 s) hace el envío real contra la API transaccional de Lovable (`sendLovableEmail`, paquete `@lovable.dev/email-js`) — la misma infraestructura que ya usaban los correos de autenticación (`auth-email-hook`). Remitente: `Portal farmapro <noreply@notify.portal.farmapro.es>`. Ventajas: coste 0, sin add-on de pago, rate limit 429 gestionado, 5 reintentos y cola de mensajes muertos. La columna de log que guardaba el id del proveedor anterior se renombró a `message_id`.

El email masivo de farmapro (Impulso/Comercial/Rebotica) sigue en su plataforma propia, documentada en `impulso/CLAUDE.md`; esta sección cubre solo el transaccional del portal, que ya no depende de ella.

## 9 · Riesgos y colchones

| Riesgo | Mitigación |
|---|---|
| Agosto se come la producción | Todo lo técnico cerrado el 3-08 (S31); agosto es solo contenido y partners |
| Lovable despliega desfasado (incidencia conocida) | Verificación post-deploy en checklist S30-S31 |
| Premios sin canjear | Caducidad 7-14 días + email a 48h + recordatorio en dashboard |
| Partners no llegan al D-day | El lanzamiento no depende de ellos: cajón nº 1 es 100% farmapro; el patrocinado entra el 24-09 |
| Fatiga de la mecánica | Cadencia quincenal estricta + pool renovado + fase 2 escalonada |
| Contador fundador vs realidad | Contador real desde 20 altas (ya implementado así) |
| Entregabilidad del D-day | Masivo de la Rebotica por la plataforma de email masivo de farmapro, con dominio autenticado desde el 09-07 (SPF/DKIM/DMARC verdes) + calentamiento real con N25/N26 en agosto + RE probado, el D-day NO estrena dominio; el transaccional del portal (premios, canjes) va aparte por la cola `transactional_emails` + API de Lovable |

## 10 · Presupuesto (capa memorable: tope 500 €)

| Concepto | Estimación |
|---|---|
| 3 cajones físicos de botica rotulados + envío | ~250 € |
| Detalle bienvenida 3 primeros partners | ~100 € |
| Colchón PR / imprevistos | ~150 € |
| Retargeting (ya decidido en plan 30 días, aparte) | 300 € |

Todo lo demás es coste marginal ~0 (producto propio, créditos IAFarma, contenido) o en especie de partners.

## 11 · Herramientas de ejecución (skills + agentes, creadas 08-07)

Para que TODO este plan lo pueda ejecutar cualquier sesión con **Sonnet 5** (sin depender de modelos superiores) y siempre con antelación:

| Herramienta | Para qué | Dónde |
|---|---|---|
| Skill `rebotica-tecnica` | SQL, edges, UI cajonera, verificación, jerarquía de ejecución | `.claude/skills/` (Claude Code lo ve solo) + `.skill` instalable en Cowork |
| Skill `rebotica-quincena` | Operar cada quincena: campaña, premios, email, RE, informe | ídem |
| Skill `rebotica-partners` | Pipeline comercial, outreach, pricing, onboarding, informes | ídem |
| Skill `rebotica-contenido` | Píldoras + quiz, reto 21 días, vault, onboarding recompensado | ídem |
| Agente `rebotica-dev` (model: sonnet) | Tandas técnicas delegables en Claude Code | `.claude/agents/` |
| Agente `rebotica-editor` (model: sonnet) | Tandas editoriales delegables en Claude Code | `.claude/agents/` |

Paquetes instalables en Cowork: `herramientas/skills-rebotica/*.skill` (botón "Save skill"). Regla de uso: cualquier sesión de la Rebotica arranca invocando la skill que toque; las skills apuntan a la ficha de memoria y a este plan, así que el contexto viaja solo. **Doctrina de antelación en todas: producir a T-14 mínimo.** Pendiente de calidad: una sesión corta de prueba/iteración de las 4 skills con casos reales (método skill-creator) tras la primera tanda de uso.

---

> **ACTUALIZACIÓN 09-07 — calendario comprimido por vacaciones** (Francesc fuera 17-07 → 10-08; equipo escalonado; todos última semana de agosto): el sprint operativo día a día y los prompts literales de cada sesión están en **`guia-sesiones-portal-rebotica.md`** (raíz). Regla: todo lo que necesita a Francesc, antes del 17-07; borradores para validar el 11-08.

### TABLERO · qué queda y quién (actualizado 08-07 noche)

**Francesc (su lista personal, en orden):**
1. ~~Cuenta gratuita del proveedor de email masivo + verificar dominio remitente (DNS) + generar API key → desbloquea la prueba.~~ **Superado 27-08-2026**: el transaccional del portal ya no depende de ese proveedor (ver §8); el masivo de farmapro sigue en su plataforma propia (`impulso/CLAUDE.md`).
2. PDF del dossier (abrir HTML → Cmd+P) → desbloquea el outreach.
3. Pasar los logos (farmapro, Apotheka, eOnbox) para la demo + decidir cajón físico personalizado vs genérico.
4. ~~Ejecutar SQL tanda 1~~ **HECHO (09-07)** — verificado en vivo contra `jeysistgdajopfruqpbc.supabase.co` vía PostgREST: 5 tablas responden 200/[] (RLS activa), las 2 vistas responden 401 permission denied a anon (grant restringido a authenticated tal cual la migración).

**Sesiones de Claude (cada una = un objetivo, con su skill):**
- ~~Prueba del proveedor de email masivo end-to-end (Claude Code, cuando haya API key) → si pasa, migración + automatizaciones...~~ **Superado 27-08-2026**: el transaccional del portal quedó resuelto por la cola `transactional_emails` + API de Lovable (ver §8); las automatizaciones (RE, "mes que viene", sync consentimientos) van por cron + esa misma vía.
- SQL tanda 1 + UI cajonera + landing de lanzamiento (skill rebotica-tecnica).
- Contenido por tandas con antelación: píldoras, reto 21 días, emails de campaña, posts (skills rebotica-contenido y rebotica-quincena, ejecutables con Sonnet).
- Cargar hitos en Google Calendar "02. farmapro contenidos" al validar Francesc el conjunto.

**Lovable (créditos, mínimo imprescindible):**
- Prompt Stripe del portal (ya previsto como "prompt nº 2" en `portal-reparto-tareas-2026-07-02.md`).
- Prompt ÚNICO backend Rebotica (3 edges + templates + cron), preparado por Claude y revisado por Francesc antes de enviar.

**Alejandro / Laura:** outreach partners + masterclasses + vídeo (A) · píldoras firmadas + cita NdP (L). Detallado en el email de equipo.
