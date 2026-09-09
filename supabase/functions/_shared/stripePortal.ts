// =====================================================================
// Configuración del portal de cliente de Stripe (billingPortal) del portal
// farmapro, provisionada por API para no depender del Dashboard.
//
// Por qué existe: la configuración por defecto de Stripe no tiene activado
// el cambio de plan, así que un Plus que quería pasar a Equipo aterrizaba
// en una pantalla con solo "Cancelar suscripción" (detectado 09-09-2026).
// Aquí se crea (una sola vez por modo test/live) una configuración con:
//   - cambio de plan entre Plus y Equipo (todos los Price de plans.ts),
//     prorrateo facturado al instante (always_invoice) para que el cobro de
//     la diferencia dispare invoice.paid → factura Holded;
//   - cancelación al final del periodo pagado;
//   - cambio de tarjeta y datos fiscales (NIF/dirección).
//   - SIN historial de facturas: la factura oficial es la de Holded (con la
//     plantilla farmapro); mostrar además la de Stripe daría dos facturas
//     distintas para el mismo cobro (decisión Francesc 09-09-2026).
//
// Se identifica por metadata {origen:'portal', version}. Si cambias las
// features, sube PORTAL_CONFIG_VERSION y se creará una nueva.
// Cualquier fallo devuelve undefined: la sesión se crea con la configuración
// por defecto y el usuario nunca se queda sin portal.
// =====================================================================

import type Stripe from "https://esm.sh/stripe@14.21.0";
import { STRIPE_PRICES, lookupPrice } from "./stripePrices.ts";

export const PORTAL_CONFIG_VERSION = '2026-09-09.4';

/**
 * Dos configuraciones, no una: Stripe exige que dentro de cada Product los
 * precios listados tengan intervalos ÚNICOS, y en nuestros Products conviven
 * el mensual regular y el mensual de lanzamiento (error real 09-09-2026:
 * "For each product, its price must have unique billing intervals").
 *  - 'launch':  precios de lanzamiento (fundador). La usa quien cambia a un
 *               precio de lanzamiento o ya paga uno.
 *  - 'regular': precios normales.
 */
export type PortalTier = 'launch' | 'regular';

/** Tier que corresponde a un Price ID (desconocido → regular). */
export function tierForPrice(priceId: string | null | undefined): PortalTier {
  if (!priceId) return 'regular';
  return lookupPrice(priceId)?.founder ? 'launch' : 'regular';
}

/** Origen público del portal (URLs legales del business_profile). */
const PORTAL_ORIGIN = (Deno.env.get('APP_URL') ?? 'https://portal.farmapro.es').replace(/\/$/, '');

const log = (step: string, details?: unknown) => {
  console.log(`[stripe-portal-config] ${step}${details ? ' - ' + JSON.stringify(details) : ''}`);
};

/** Price IDs reales de suscripción del tier (descarta los TODO_ y los vacíos). */
function realSubscriptionPriceIds(tier: PortalTier): string[] {
  const ids = new Set<string>();
  for (const plan of Object.values(STRIPE_PRICES)) {
    const candidates = tier === 'launch'
      ? [plan.monthly_launch, plan.yearly_launch]
      : [plan.monthly, plan.yearly];
    for (const id of candidates) {
      if (id && !id.startsWith('TODO_')) ids.add(id);
    }
  }
  return [...ids];
}

// Cache en memoria del worker (una edge function viva reutiliza el id), por tier.
const cachedConfigId: Partial<Record<PortalTier, string>> = {};
// Último motivo por el que no se pudo provisionar (para enseñarlo al usuario
// en vez de mandarle a la configuración por defecto, que no permite cambiar
// de plan y da un error de Stripe en inglés sin pista alguna).
export let lastPortalConfigError: string | undefined;

/**
 * Devuelve el id de la configuración del portal farmapro, creándola si no
 * existe todavía en este modo (test/live). undefined = usar la de Stripe por defecto.
 */
export async function getPortalConfigurationId(
  stripe: Stripe,
  tier: PortalTier = 'regular',
): Promise<string | undefined> {
  const cached = cachedConfigId[tier];
  if (cached) return cached;
  try {
    const existing = await stripe.billingPortal.configurations.list({ active: true, limit: 100 });
    const found = existing.data.find(
      (c) => c.metadata?.origen === 'portal'
        && c.metadata?.version === PORTAL_CONFIG_VERSION
        && c.metadata?.tier === tier,
    );
    if (found) {
      cachedConfigId[tier] = found.id;
      return found.id;
    }

    // Agrupar los Price por Product (el portal exige products[{product, prices[]}]).
    const priceIds = realSubscriptionPriceIds(tier);
    const byProduct = new Map<string, string[]>();
    const skipped: string[] = [];
    for (const priceId of priceIds) {
      // Un Price que no exista en este modo (test/live) no debe tumbar toda la
      // configuración: se salta y se registra.
      try {
        const price = await stripe.prices.retrieve(priceId);
        if (!price.recurring || !price.active) { skipped.push(priceId); continue; }
        const productId = typeof price.product === 'string' ? price.product : price.product.id;
        byProduct.set(productId, [...(byProduct.get(productId) ?? []), priceId]);
      } catch (e) {
        skipped.push(priceId);
        log('price skipped', { priceId, err: (e as Error).message });
      }
    }
    if (byProduct.size === 0) {
      lastPortalConfigError = `ningún Price recurrente válido en el tier ${tier} (revisados ${priceIds.length}, saltados ${skipped.length})`;
      log('no recurring prices resolved, using default configuration', { skipped });
      return undefined;
    }

    const created = await stripe.billingPortal.configurations.create({
      business_profile: {
        headline: 'Portal farmapro · gestiona tu suscripción',
        privacy_policy_url: `${PORTAL_ORIGIN}/politica-privacidad`,
        terms_of_service_url: `${PORTAL_ORIGIN}/aviso-legal`,
      },
      features: {
        customer_update: { enabled: true, allowed_updates: ['name', 'address', 'tax_id', 'email'] },
        invoice_history: { enabled: false },
        payment_method_update: { enabled: true },
        subscription_cancel: { enabled: true, mode: 'at_period_end', proration_behavior: 'none' },
        subscription_update: {
          enabled: true,
          default_allowed_updates: ['price'],
          proration_behavior: 'always_invoice',
          products: [...byProduct.entries()].map(([product, prices]) => ({ product, prices })),
        },
      },
      metadata: { origen: 'portal', version: PORTAL_CONFIG_VERSION, tier },
    });
    log('configuration created', { id: created.id, tier, products: byProduct.size, prices: priceIds.length, skipped });
    cachedConfigId[tier] = created.id;
    lastPortalConfigError = undefined;
    return created.id;
  } catch (e) {
    lastPortalConfigError = (e as Error).message;
    log('configuration unavailable, falling back to default', { err: lastPortalConfigError });
    return undefined;
  }
}
