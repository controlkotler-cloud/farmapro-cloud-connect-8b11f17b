# Pricing farmapro — MODELO CERRADO (para implementar) · 2026-06-19

Decisiones finales del titular. Implementado en `src/lib/plans.ts` (fuente única).

## Planes
| Plan | Regular (tachado) | **Lanzamiento (100 primeras plazas, de por vida)** | Anual | Plazas |
|---|---|---|---|---|
| **Gratis** | 0 € | — | — | 1 |
| **Plus** ⭐ | ~~39 €/mes~~ | **19,90 €/mes** | 199 €/año (2 meses gratis) | 1 |
| **Equipo** | ~~79 €/mes~~ | **49 €/mes** | 490 €/año (2 meses gratis) | hasta 10 |

- **Lanzamiento:** las **primeras 100 plazas** se quedan a 19,90/49 **para siempre**; después, precio regular (39/79). En la web se muestra el regular tachado y el de lanzamiento como oferta, con contador de plazas.
- **Estudiante:** fuera por ahora (vuelve con la bolsa de empleo).
- **Add-ons de imágenes** (sobre plan de pago): +20 (4,99 €) · +50 (9,99 €) · +100 (16,99 €).

## Gratis (la máquina de conversión)
- **Días 1-30 — "Gratis con límites":** 1-2 cursos, 2-3 recursos, leer comunidad, 2 textos + 1 imagen IAFarma/mes, ver eventos del sector.
- **Día 31+ — "Gratis bloqueado":** lo ve TODO pero no puede usar nada (catálogo visible y bloqueado). Solo paga o mira.

## IA
- **Texto:** ilimitado en pago (cuesta céntimos). Gratis: 2/mes.
- **Imagen:** medida con créditos (0,07-0,11 €/img). Gratis: 1/mes. Plus: 1/mes + packs. Equipo: igual. Tope en servidor → nunca pérdida.

## Eventos
- Del sector: gratis (solo ver) — `portal-eventos-sector.sql`.
- Nuestros (campañas): exclusivos de pago — `portal-eventos-12-meses.sql` (guardado).

## Implementación (esta tanda)
- ✅ Fuente única `src/lib/plans.ts`.
- 🔨 Página de **Precios** con los 3 planes, regular tachado vs lanzamiento, contador de plazas, anual, add-ons, plan gratis. CTA "Reservar plaza" (sin pago real todavía).
- 🔨 Control de acceso del gratis (entitlements): días 1-30 con límites → bloqueado, aplicado en cursos, recursos e IAFarma.
- ⏳ **Stripe (cobro real) y notificaciones: al final**, antes de abrir al público.

> Nota: el gating del gratis es v1 en cliente (coherente con el resto del portal hoy); el blindaje en servidor (RLS/edge) se hace junto con Stripe.
