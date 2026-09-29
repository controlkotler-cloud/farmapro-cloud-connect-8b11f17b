# Plan de captación autónoma del portal — 29-09-2026

Objetivo único: altas de pago en el portal, desde la búsqueda hasta el pago, sin intervención humana salvo aprobaciones de Francesc y los envíos de partners de Alejandro.

## Decisiones de Francesc (29-09-2026)

| # | Decisión |
|---|---|
| 1 | **Sin garantía de devolución.** El riesgo lo cubre el plan gratis de 30 días sin tarjeta. |
| 2 | **Presupuesto de anuncios: 300 €/mes** (Google Ads búsqueda + retargeting Meta). |
| 3 | **Referidos: sí.** Invitas a otra farmacia → 1 mes gratis para las dos. |
| 4 | **Asistente IA en /precios y en el portal: sí.** Responde con la biblioteca de objeciones y lleva al alta. |
| 5 | **Precio de fundador SIN fecha global (revisado 29-09 tras objeción de Francesc).** Cada cuenta tiene su precio de fundador **reservado hasta 7 días después del fin de su prueba** (o de su concesión); pasado eso, esa cuenta paga el precio normal. Las altas nuevas siempre ven 19,90 €/49 € mientras queden plazas (tope 100, sin dar nunca la cifra). Fecha global solo si se superan ~70 plazas. Función `founder_reserva_hasta()` en BD; la hace cumplir `create-checkout`. |
| 6 | **Autonomía:** los agentes ejecutan todo lo que NO sea masivo (transaccional, emails de comportamiento, landings, SEO, respuestas del asistente). Lo masivo (Clientify, redes) lo aprueba Francesc. |

## Prompts de Hormozi

No se reparte un prompt por agente. Los prompts 1, 2, 3 y 5 se trabajan en una sesión de oferta, de la que salen dos documentos canon:
- `farmapro-portal/docs/oferta-portal.md` — la promesa elegida (de 5 ángulos), la ecuación de valor, los bonos anti-objeción y la estructura de la oferta.
- `farmapro-portal/docs/objeciones-portal.md` — el prompt 4: la biblioteca viva de objeciones y respuestas. La usan el asistente IA, los emails, las landings y los anuncios.

## Etapas

| # | Etapa | Qué | Vía | Ejecución |
|---|---|---|---|---|
| 0 | Medición | UTM guardado en el perfil al darse de alta, eventos GA4 (alta/activación/pago), informe del embudo cada lunes | SQL + repo + tarea programada | Auto |
| 1 | Oferta | `/portal` y `/precios` con la promesa nueva, las FAQ de objeciones y la fecha límite 31-10 | repo + `cro` | Auto (no masivo) |
| 2 | Cohorte del día 31 (05-18/10, ~50 cuentas) | Emails de los días 28 y 31 con la oferta nueva y el plazo 31-10 | `_shared/portalEmailTemplates.ts` + SQL | Auto |
| 3 | Activación por comportamiento | Emails según lo que hace cada usuario (sin curso empezado el día 3, primer resultado, equipo) sobre los triggers de activity_log | edge + cron (Lovable) | Auto |
| 4 | Recuperación de pagos abandonados | Stripe checkout.session.expired → email a la hora y a las 24 h | webhook (Lovable) | Auto |
| 5 | Asistente IA | Chat en /precios y en el portal, con objeciones-portal.md | edge + API Claude (Lovable) | Auto |
| 6 | SEO de captación | 4-6 landings por problema + agente semanal de oportunidades | seo-cluster, seo-content-brief, DataForSEO | Auto |
| 7 | Anuncios (300 €/mes) | Búsqueda en Google Ads hacia /portal + retargeting en Meta | claude-ads; se da de alta en la interfaz | Francesc da de alta |
| 8 | Referidos | 1 mes gratis por cada farmacia invitada que se da de alta | Lovable | Auto |
| 9 | Distribución | Laboratorios, mayoristas y colegios que ofrecen el portal | rebotica-partners | Envía Alejandro |
| 10 | Redes | 1 reel semanal problema → alta | reel-director + Metricool (UI) | Francesc aprueba |

## Calendario

- **Semana del 30-09:** etapa 0 (verificación en vivo, solo lectura primero), sesión de oferta (los dos documentos canon) y etapas 1 y 2 en vivo ANTES del 05-10.
- **Semana del 05-10:** etapas 3, 4 y 5.
- **Semanas del 12 y el 19-10:** etapas 6 a 10 y arranque de los agentes semanales.
- **Revisión de la fecha global:** cuando `founder_count` supere ~70 plazas o el 31-12, lo que llegue antes.

## Pendiente de verificar antes de invertir en anuncios

- ¿Stripe del portal está en LIVE? (la ficha del 31-08 decía TEST; hay 4 pagos).
- Si las altas ya guardan su origen (utm/source).
- Datos reales del embudo (altas por semana, activos, conversión) — consultas SELECT vía el MCP de Lovable.

## Límites

- Nada de email en frío a farmacias: la LSSI (art. 21) exige consentimiento también en B2B.
- Masivos: Clientify y Metricool se programan por la UI.
- Deploy de edge functions: se avisa a Francesc y él se lo pide a Lovable (regla del 27-08).

## Etapa 0 — datos en vivo (29-09-2026, SQL solo lectura sobre prod)

- **63 cuentas** (sin semillas): 57 freemium, 2 Plus de pago activos (19,90 € fundador → 39,80 €/mes), 2 Equipo en prueba hasta 31-12, 3 canceladas. `founder_count.spots_taken = 2`.
- **Stripe está en LIVE:** 2 facturas reales de 19,90 € en Holded (F260485, F260489), `metadata.origen='portal'`.
- **Origen:** 48 de 63 vienen de Clientify (email), 10 sin utm, 5 de web/blog. La captación fuera de la lista propia es prácticamente cero. El utm ya se guarda (53/63).
- **Altas:** 25 (semana del 07-09) y 27 (semana del 14-09), con picos los días de envío (10-09: 19, 17-09: 20). Semana del 21-09: 8. Sin envío, ~1 alta al día.
- **Actividad (last_seen_at):** 12 en los últimos 7 días, 27 entre 7 y 14 días, 13 hace más de 14 días y 11 nunca.
- **Secuencia (cron 30, `notify_trial_ending`, 09:15 UTC):** el día 20 (`prueba-dia20`) es el ÚNICO correo comercial y exige consentimiento. Los días 23 y 28 (`fin-prueba`) y el 31 (`prueba-bloqueada`) son aviso de servicio y van sin venta a todos. Las dos cohortes grandes tienen consentimiento al 100 %:
  - 10-09 (19 cuentas): día 20 el 30-09, días 23/28 el 03 y el 08-10, bloqueo el 11-10.
  - 17-09 (20 cuentas): día 20 el 07-10, días 23/28 el 10 y el 15-10, bloqueo el 18-10.
- **Hecho el 29-09:** la fecha global del 31-10 se descartó el mismo día (ver decisión 5). Plantilla del día 20 con la reserva personal "hasta el X" (commit 3a3afb2); `founder_reserva_hasta()` creada en BD (sin migración en el repo; transición: ninguna reserva vence antes del 06-10). Pendiente de Lovable: `docs/peticion-lovable-reserva-fundador.md`.
- **Implicación para la etapa 2:** la fecha de la reserva solo puede ir en correos comerciales; en el portal (banner en /precios y en el panel) va siempre, porque no es email. Hace falta un comercial nuevo entre el día 23 y el 28 para quien tenga consentimiento (hoy solo hay uno, el del día 20).
