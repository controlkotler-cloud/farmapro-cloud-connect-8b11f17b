// =====================================================================
// Mapa de Stripe Price IDs (espejo de src/lib/plans.ts).
// TODO: rellenar con los Price IDs REALES antes de probar en Stripe test.
// Crear en Stripe (dashboard o API) los siguientes Products/Prices, EUR,
// impuestos incluidos, con metadata {plan: 'plus'|'equipo', launch: 'true'|'false'}:
//   - plus_monthly_launch  → 19,90 €/mes (metadata plan=plus, launch=true)
//   - plus_monthly         → 39,00 €/mes (metadata plan=plus, launch=false)
//   - plus_yearly_launch   → 199,00 €/año (metadata plan=plus, launch=true)
//   - equipo_monthly_launch→ 49,00 €/mes (metadata plan=equipo, launch=true)
//   - equipo_monthly       → 79,00 €/mes (metadata plan=equipo, launch=false)
//   - equipo_yearly_launch → 490,00 €/año (metadata plan=equipo, launch=true)
// Además, Prices de pago único para los packs de imágenes IAFarma:
//   - image_pack_20  → 4,99  € (metadata pack_credits=20)
//   - image_pack_50  → 9,99  € (metadata pack_credits=50)
//   - image_pack_100 → 16,99 € (metadata pack_credits=100)
// =====================================================================

export type PlanId = 'plus' | 'equipo';
export type Cycle = 'monthly' | 'yearly';

/**
 * Price IDs de las suscripciones. Los `_launch` rigen mientras queden plazas
 * fundador (ver public.founder_count); si no, cae al Price regular.
 * yearly no tiene variante "regular": el precio anual solo existe en lanzamiento.
 */
export const STRIPE_PRICES = {
  plus: {
    monthly:        Deno.env.get('STRIPE_PRICE_PLUS_MONTHLY')        ?? 'TODO_price_plus_monthly',
    monthly_launch: Deno.env.get('STRIPE_PRICE_PLUS_MONTHLY_LAUNCH') ?? 'TODO_price_plus_monthly_launch',
    yearly_launch:  Deno.env.get('STRIPE_PRICE_PLUS_YEARLY_LAUNCH')  ?? 'TODO_price_plus_yearly_launch',
  },
  equipo: {
    monthly:        Deno.env.get('STRIPE_PRICE_EQUIPO_MONTHLY')        ?? 'TODO_price_equipo_monthly',
    monthly_launch: Deno.env.get('STRIPE_PRICE_EQUIPO_MONTHLY_LAUNCH') ?? 'TODO_price_equipo_monthly_launch',
    yearly_launch:  Deno.env.get('STRIPE_PRICE_EQUIPO_YEARLY_LAUNCH')  ?? 'TODO_price_equipo_yearly_launch',
  },
} as const;

/** Packs de imágenes (pago único). Metadata en Stripe: pack_credits=<n>. */
export const IMAGE_PACK_PRICES: Record<number, string> = {
  20:  Deno.env.get('STRIPE_PRICE_IMAGE_PACK_20')  ?? 'TODO_price_image_pack_20',
  50:  Deno.env.get('STRIPE_PRICE_IMAGE_PACK_50')  ?? 'TODO_price_image_pack_50',
  100: Deno.env.get('STRIPE_PRICE_IMAGE_PACK_100') ?? 'TODO_price_image_pack_100',
};

/**
 * Elige el Price a usar según plan/cycle y si quedan plazas fundador.
 * Devuelve además el flag `founder` para el metadata de la suscripción.
 */
export function pickSubscriptionPrice(
  plan: PlanId,
  cycle: Cycle,
  founderSpotsLeft: number,
): { priceId: string; founder: boolean } {
  const founderActive = founderSpotsLeft > 0;
  if (cycle === 'yearly') {
    // El precio anual SOLO existe como lanzamiento. Si se agota, no permitimos anual.
    if (!founderActive) {
      throw new Error('El precio anual solo está disponible durante el lanzamiento fundador.');
    }
    return { priceId: STRIPE_PRICES[plan].yearly_launch, founder: true };
  }
  return founderActive
    ? { priceId: STRIPE_PRICES[plan].monthly_launch, founder: true }
    : { priceId: STRIPE_PRICES[plan].monthly,        founder: false };
}

/** Índice inverso: dado un Price ID, devuelve el plan y si es lanzamiento. */
export function lookupPrice(priceId: string): { plan: PlanId; cycle: Cycle; founder: boolean } | null {
  for (const plan of ['plus', 'equipo'] as PlanId[]) {
    const p = STRIPE_PRICES[plan];
    if (priceId === p.monthly)        return { plan, cycle: 'monthly', founder: false };
    if (priceId === p.monthly_launch) return { plan, cycle: 'monthly', founder: true };
    if (priceId === p.yearly_launch)  return { plan, cycle: 'yearly',  founder: true };
  }
  return null;
}

/** Roles que jamás se degradan por eventos de Stripe. */
export const PROTECTED_ROLES = ['admin'] as const;
