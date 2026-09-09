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
import { STRIPE_PRICES } from "./stripePrices.ts";

export const PORTAL_CONFIG_VERSION = '2026-09-09.2';

const log = (step: string, details?: unknown) => {
  console.log(`[stripe-portal-config] ${step}${details ? ' - ' + JSON.stringify(details) : ''}`);
};

/** Price IDs reales de suscripción (descarta los TODO_ y los vacíos). */
function realSubscriptionPriceIds(): string[] {
  const ids = new Set<string>();
  for (const plan of Object.values(STRIPE_PRICES)) {
    for (const id of Object.values(plan)) {
      if (id && !id.startsWith('TODO_')) ids.add(id);
    }
  }
  return [...ids];
}

// Cache en memoria del worker (una edge function viva reutiliza el id).
let cachedConfigId: string | undefined;

/**
 * Devuelve el id de la configuración del portal farmapro, creándola si no
 * existe todavía en este modo (test/live). undefined = usar la de Stripe por defecto.
 */
export async function getPortalConfigurationId(stripe: Stripe): Promise<string | undefined> {
  if (cachedConfigId) return cachedConfigId;
  try {
    const existing = await stripe.billingPortal.configurations.list({ active: true, limit: 100 });
    const found = existing.data.find(
      (c) => c.metadata?.origen === 'portal' && c.metadata?.version === PORTAL_CONFIG_VERSION,
    );
    if (found) {
      cachedConfigId = found.id;
      return found.id;
    }

    // Agrupar los Price por Product (el portal exige products[{product, prices[]}]).
    const priceIds = realSubscriptionPriceIds();
    const byProduct = new Map<string, string[]>();
    for (const priceId of priceIds) {
      const price = await stripe.prices.retrieve(priceId);
      if (!price.recurring || !price.active) continue;
      const productId = typeof price.product === 'string' ? price.product : price.product.id;
      byProduct.set(productId, [...(byProduct.get(productId) ?? []), priceId]);
    }
    if (byProduct.size === 0) {
      log('no recurring prices resolved, using default configuration');
      return undefined;
    }

    const created = await stripe.billingPortal.configurations.create({
      business_profile: {
        headline: 'Portal farmapro · gestiona tu suscripción',
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
      metadata: { origen: 'portal', version: PORTAL_CONFIG_VERSION },
    });
    log('configuration created', { id: created.id, products: byProduct.size, prices: priceIds.length });
    cachedConfigId = created.id;
    return created.id;
  } catch (e) {
    log('configuration unavailable, falling back to default', { err: (e as Error).message });
    return undefined;
  }
}
