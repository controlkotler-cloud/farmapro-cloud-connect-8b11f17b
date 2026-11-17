// =====================================================================
// create-checkout: genera una Stripe Checkout Session para Plus o Equipo.
// Body: { plan, cycle, pack?, oferta?: 'mes-plus-tarjeta'|'black-friday' }.
// Elige el Price de lanzamiento si quedan plazas fundador (recuento REAL
// en public.founder_count), si no cae al Price regular. IVA incluido.
// Con suscripción ya viva: mismo plan → { mode:'current' }; otro plan →
// { mode:'portal', url } a la confirmación del cambio en el portal de Stripe.
// =====================================================================

import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { pickSubscriptionPrice, lookupPrice, IMAGE_PACK_PRICES, STRIPE_PRICES, type PlanId, type Cycle } from "../_shared/stripePrices.ts";
import { getPortalConfigurationId, lastPortalConfigError, tierForPrice } from "../_shared/stripePortal.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const FOUNDER_TOTAL = 100;

// Black Friday 2026 (decisión de Francesc del 17-11-2026): Plus anual a 180 €
// el primer año. NO gasta plaza de fundador (founder=false) y renueva al
// precio anual normal: 390 € (39 €/mes con dos meses gratis, la misma regla
// que el anual de lanzamiento). Solo altas nuevas y solo en esta ventana,
// fechas de Madrid, ambas incluidas.
const BF_DESDE = '2026-11-24';
const BF_HASTA = '2026-12-01';
const BF_PRECIO_REGULAR_CENTS = 39000;
const BF_DESCUENTO_CENTS = 21000;
const BF_COUPON_ID = 'BLACKFRIDAY2026';
const PLUS_YEARLY_REGULAR_LOOKUP = 'plus_yearly_regular';

const log = (step: string, details?: unknown) => {
  console.log(`[create-checkout] ${step}${details ? ' - ' + JSON.stringify(details) : ''}`);
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const body = await req.json().catch(() => ({} as any));
    const pack = body.pack as number | undefined;
    let plan = body.plan as PlanId;
    let cycle = (body.cycle ?? 'monthly') as Cycle;

    const isPack = typeof pack === 'number';
    const isOferta = !isPack && body.oferta === 'mes-plus-tarjeta';
    if (isOferta) { plan = 'plus'; cycle = 'monthly'; }
    const isBlackFriday = !isPack && body.oferta === 'black-friday';
    if (isBlackFriday) {
      plan = 'plus'; cycle = 'yearly';
      const hoy = hoyMadrid();
      if (hoy < BF_DESDE || hoy > BF_HASTA) {
        log('black friday fuera de plazo', { hoy });
        return json({ error: 'oferta_fuera_de_plazo' }, 403);
      }
    }
    if (!isPack) {
      if (!['plus', 'equipo'].includes(plan)) {
        return json({ error: 'Invalid plan (expected plus|equipo)' }, 400);
      }
      if (!['monthly', 'yearly'].includes(cycle)) {
        return json({ error: 'Invalid cycle (expected monthly|yearly)' }, 400);
      }
    } else if (!IMAGE_PACK_PRICES[pack]) {
      return json({ error: 'Invalid pack (expected 20|50|100)' }, 400);
    }

    // Auth
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith('Bearer ')) return json({ error: 'Unauthorized' }, 401);
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
    );
    const token = authHeader.replace('Bearer ', '');
    const { data: userData, error: userErr } = await supabase.auth.getUser(token);
    if (userErr || !userData.user?.email) return json({ error: 'Unauthorized' }, 401);
    const user = userData.user;
    log('user', { id: user.id, email: user.email });

    const admin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    );

    // Oferta "un mes más de Plus a 0 €": elegibilidad en servidor.
    if (isOferta) {
      const hoyMadridOferta = new Intl.DateTimeFormat('en-CA', {
        timeZone: 'Europe/Madrid', year: 'numeric', month: '2-digit', day: '2-digit',
      }).format(new Date());
      const { data: ofertas, error: ofErr } = await admin
        .from('portal_ofertas')
        .select('email')
        .eq('oferta', 'mes-plus-tarjeta')
        .ilike('email', user.email!.replace(/[\\%_]/g, (c) => '\\' + c))
        .gte('valida_hasta', hoyMadridOferta)
        .limit(1);
      const { count: subCount, error: subErr } = await admin
        .from('subscriptions')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', user.id);
      if (ofErr || subErr || !ofertas || ofertas.length === 0 || (subCount ?? 0) > 0) {
        log('oferta no disponible', { userId: user.id, ofErr: ofErr?.message, subErr: subErr?.message, subCount });
        return json({ error: 'oferta_no_disponible' }, 403);
      }
      log('oferta elegible', { userId: user.id });
    }

    const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", { apiVersion: "2023-10-16" });

    // Reutiliza customer si existe.
    const customers = await stripe.customers.list({ email: user.email, limit: 1 });
    const customerId = customers.data[0]?.id;

    // Perfil: rol (gate de packs), customer guardado y datos fiscales.
    const { data: profile } = await admin
      .from('profiles')
      .select('subscription_role, stripe_customer_id, cif, full_name')
      .eq('id', user.id)
      .maybeSingle();
    const profileCif = ((profile?.cif as string | null) ?? '').trim() || null;

    // El CIF/NIF se pide obligatorio y validado en el registro, así que casi
    // siempre lo tenemos ya: se lo adjuntamos al customer de Stripe para que el
    // checkout no se lo vuelva a pedir (Stripe oculta el campo cuando el
    // customer ya tiene un tax_id). Si el perfil no lo tiene —altas anteriores
    // a que el campo existiera— el checkout lo pedirá en pantalla.
    if (customerId && profileCif) {
      try {
        const taxIds = await stripe.customers.listTaxIds(customerId, { limit: 1 });
        if (taxIds.data.length === 0) {
          await stripe.customers.createTaxId(customerId, { type: 'es_cif', value: profileCif });
          log('tax id attached', { customerId });
        }
      } catch (e) {
        // Un NIF que Stripe no valide nunca puede tumbar el cobro.
        log('tax id attach failed', { err: (e as Error).message });
      }
    }

    // Datos de facturación obligatorios en TODAS las modalidades: sin dirección
    // fiscal y NIF no sale una factura española válida en Holded.
    const billingFields = {
      billing_address_collection: 'required' as const,
      tax_id_collection: { enabled: true },
      ...(customerId ? { customer_update: { name: 'auto' as const, address: 'auto' as const } } : {}),
    };

    const origin = req.headers.get('origin') ?? Deno.env.get('APP_URL') ?? 'https://portal.farmapro.es';

    // ============================================================
    // RAMA PACKS DE IMÁGENES (pago único)
    // ============================================================
    if (isPack) {
      // Los packs solo tienen sentido sobre un plan de pago (así se anuncian en
      // Precios e ImageWorkspace). Sin este guard, un usuario gratis podía
      // comprarlos desde la consola aunque la UI no se lo ofreciera.
      const PAID_ROLES = ['plus', 'equipo', 'premium', 'profesional', 'admin'];
      const packRole = (profile?.subscription_role as string | null) ?? null;
      if (!packRole || !PAID_ROLES.includes(packRole)) {
        return json({ error: 'Los packs de imágenes están disponibles con los planes Plus y Equipo. Mira los planes para recargar créditos.' }, 403);
      }

      const packPriceId = IMAGE_PACK_PRICES[pack!];
      if (packPriceId.startsWith('TODO_')) {
        return json({ error: `Stripe Price ID no configurado (${packPriceId})` }, 500);
      }
      const session = await stripe.checkout.sessions.create({
        customer: customerId,
        customer_email: customerId ? undefined : user.email,
        line_items: [{ price: packPriceId, quantity: 1 }],
        mode: 'payment',
        allow_promotion_codes: true,
        ...billingFields,
        success_url: `${origin}/asistente-creativo?pack=success&session_id={CHECKOUT_SESSION_ID}`,
        cancel_url:  `${origin}/asistente-creativo?pack=cancelled`,
        metadata: {
          origen: 'portal',
          user_id: user.id,
          pack_credits: String(pack),
        },
      });
      log('pack session created', { id: session.id, pack });
      return json({ url: session.url, pack });
    }

    // ============================================================
    // RAMA SUSCRIPCIÓN (Plus / Equipo)
    // ============================================================

    const { data: fc } = await admin.from('founder_count').select('spots_taken').maybeSingle();
    const spotsTaken = (fc?.spots_taken ?? 0) as number;
    const founderSpotsLeft = Math.max(0, FOUNDER_TOTAL - spotsTaken);

    // Guard antiduplicado: si ya hay suscripción viva no se abre un segundo
    // checkout. Si pide OTRO plan, se le lleva a la pantalla de confirmación
    // del cambio en el portal de Stripe (prorrateo y cobro de la diferencia
    // los pinta Stripe); si pide el que ya tiene, se le dice sin redirigir.
    const existingCustomerId = (profile?.stripe_customer_id as string | null) ?? customerId;

    if (existingCustomerId) {
      const subs = await stripe.subscriptions.list({ customer: existingCustomerId, status: 'all', limit: 100 });
      const live = subs.data.filter(
        (s) => ['active', 'trialing', 'past_due'].includes(s.status) && s.metadata?.origen === 'portal',
      );
      if (live.length > 0 && isBlackFriday) {
        // La oferta es para altas nuevas: quien ya paga no cambia de precio aquí.
        log('black friday con suscripción viva', { customer: existingCustomerId });
        return json({ error: 'ya_suscrito' }, 409);
      }
      if (live.length > 0) {
        const current = live[0];
        const item = current.items.data[0];
        const currentInfo = item?.price?.id ? lookupPrice(item.price.id) : null;
        const currentPlan = currentInfo?.plan ?? ((current.metadata?.plan as PlanId | undefined) ?? null);
        const currentCycle = currentInfo?.cycle ?? ((current.metadata?.cycle as Cycle | undefined) ?? 'monthly');

        if (currentPlan === plan && currentCycle === cycle) {
          log('already on requested plan', { customer: existingCustomerId, plan, cycle });
          return json({ mode: 'current', plan, cycle });
        }

        // Quien ya es fundador conserva el precio de lanzamiento al cambiar de
        // plan aunque las plazas se hayan agotado: "no sube mientras mantengas
        // la suscripción activa" incluye subir de plan.
        const isFounder = currentInfo?.founder ?? (current.metadata?.founder === 'true');
        let newPriceId: string;
        try {
          ({ priceId: newPriceId } = pickSubscriptionPrice(plan, cycle, isFounder ? Math.max(1, founderSpotsLeft) : founderSpotsLeft));
        } catch (e) {
          return json({ error: (e as Error).message }, 400);
        }
        if (newPriceId.startsWith('TODO_')) {
          return json({ error: `Stripe Price ID no configurado (${newPriceId}).` }, 500);
        }
        if (!item) {
          return json({ error: 'La suscripción actual no tiene un concepto que actualizar. Escríbenos a soporte@farmapro.es.' }, 409);
        }

        // Configuración del tier del precio destino (lanzamiento o regular).
        const configuration = await getPortalConfigurationId(stripe, tierForPrice(newPriceId));
        if (!configuration) {
          // Sin la configuración farmapro, el portal por defecto no permite
          // cambiar de plan: Stripe devolvería "subscription update feature ...
          // is disabled". Mejor decir el motivo real.
          log('portal configuration unavailable for plan change', { err: lastPortalConfigError });
          return json({
            error: `No se ha podido preparar el cambio de plan (configuración del portal de Stripe): ${lastPortalConfigError ?? 'motivo desconocido'}. Escríbenos a soporte@farmapro.es.`,
          }, 500);
        }
        const portal = await stripe.billingPortal.sessions.create({
          customer: existingCustomerId,
          configuration,
          return_url: `${origin}/precios`,
          flow_data: {
            type: 'subscription_update_confirm',
            subscription_update_confirm: {
              subscription: current.id,
              items: [{ id: item.id, price: newPriceId, quantity: 1 }],
            },
            after_completion: {
              type: 'redirect',
              redirect: { return_url: `${origin}/perfil?tab=plan&cambio=ok` },
            },
          },
        });
        log('existing subscription, redirecting to plan change confirmation', {
          customer: existingCustomerId, from: currentPlan, to: plan, cycle, newPriceId, configuration,
        });
        return json({ url: portal.url, mode: 'portal', from: currentPlan, to: plan });
      }
    }


    // ============================================================
    // CONCESIÓN: periodo de prueba hasta concedido_hasta
    // ============================================================
    let trialEnd: number | undefined;
    const { data: grant } = (isOferta || isBlackFriday) ? { data: null as { lote: string; concedido_hasta: string } | null } : await admin
      .from('portal_grants')
      .select('lote, concedido_hasta')
      .ilike('email', user.email)
      .gte('concedido_hasta', new Date().toISOString().slice(0, 10))
      .order('concedido_hasta', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (grant?.concedido_hasta) {
      const trialTs = toMadridEndOfDayTimestamp(grant.concedido_hasta as string);
      const minTrialEnd = Math.floor(Date.now() / 1000) + 48 * 3600;
      if (trialTs >= minTrialEnd) {
        trialEnd = trialTs;
        log('grant found', { lote: grant.lote, trialEnd });
      } else {
        log('grant too close to expire, skipping trial', { lote: grant.lote, trialTs, minTrialEnd });
      }
    }

    if (isOferta) trialEnd = Math.floor(Date.now() / 1000) + 30 * 86400;

    // Precio fundador para todo el que se suscriba mientras queden plazas
    // (decisión de Francesc del 10-11-2026). Antes se aplicaba una reserva
    // personal (alta + 37 días, founder_reserva_hasta) y quien la tenía vencida
    // veía 19,90 € en /precios pero pagaba 39 € y el anual daba error.
    const effectiveFounderSpotsLeft = founderSpotsLeft;

    let priceId: string; let founder: boolean;
    let bfCoupon: string | null = null;
    if (isBlackFriday) {
      // Black Friday: precio anual regular (390 €) con un cupón de 210 € solo
      // en la primera factura. Se cobra hoy, sin periodo de cortesía.
      try {
        const regular = await ensurePlusYearlyRegular(stripe);
        priceId = regular.priceId;
        bfCoupon = await ensureBlackFridayCoupon(stripe, regular.productId);
        founder = false;
      } catch (e) {
        log('black friday setup failed', { err: (e as Error).message });
        return json({ error: `No se ha podido preparar la oferta: ${(e as Error).message}` }, 500);
      }
    } else {
      try {
        ({ priceId, founder } = pickSubscriptionPrice(plan, cycle, effectiveFounderSpotsLeft));
      } catch (e) {
        return json({ error: (e as Error).message }, 400);
      }
    }
    if (priceId.startsWith('TODO_')) {
      return json({ error: `Stripe Price ID no configurado (${priceId}).` }, 500);
    }

    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      customer_email: customerId ? undefined : user.email,
      line_items: [{ price: priceId, quantity: 1 }],
      mode: 'subscription',
      // Stripe no deja combinar un cupón fijo con códigos promocionales.
      ...(bfCoupon ? { discounts: [{ coupon: bfCoupon }] } : { allow_promotion_codes: true }),
      ...billingFields,
      ...(isBlackFriday ? {
        custom_text: {
          submit: {
            message: 'Hoy pagas 180 € por un año completo de Plus. Dentro de un año se renueva al precio anual normal, 390 €, y puedes cancelarlo antes desde tu perfil.',
          },
        },
      } : {}),
      ...(trialEnd ? {
        payment_method_collection: 'always' as const,
        custom_text: {
          submit: {
            message: isOferta
              ? 'Hoy no pagas nada. Tu precio de fundador, 19,90 €/mes, queda guardado mientras mantengas la suscripción.'
              : `Es cortesía de Mkpro: hoy no se te cobra nada. El primer cobro, si decides continuar, será el ${firstChargeLabelFromTrialEnd(trialEnd)}.`,
          },
        },
      } : {}),
      success_url: `${origin}/perfil?checkout=success&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url:  isOferta ? `${origin}/continuar?checkout=cancelled`
        : isBlackFriday ? `${origin}/black-friday?checkout=cancelled`
        : `${origin}/precios?checkout=cancelled`,
      metadata: {
        origen: 'portal',
        user_id: user.id,
        plan,
        cycle,
        founder: String(founder),
        ...(grant?.lote ? { grant_lote: grant.lote } : {}),
        ...(isOferta ? { oferta: 'mes-plus-tarjeta' } : {}),
        ...(isBlackFriday ? { oferta: 'black-friday' } : {}),
      },
      subscription_data: {
        ...(trialEnd ? {
          trial_end: trialEnd,
          trial_settings: { end_behavior: { missing_payment_method: 'cancel' } },
        } : {}),
        metadata: {
          origen: 'portal',
          user_id: user.id,
          plan,
          cycle,
          founder: String(founder),
          ...(grant?.lote ? { grant_lote: grant.lote } : {}),
          ...(isOferta ? { oferta: 'mes-plus-tarjeta' } : {}),
          ...(isBlackFriday ? { oferta: 'black-friday' } : {}),
        },
      },
    });


    log('session created', { id: session.id, priceId, founder });
    return json({ url: session.url, founder, founderSpotsLeft });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    log('ERROR', { msg });
    return json({ error: msg }, 500);
  }
});

function hoyMadrid(): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Europe/Madrid', year: 'numeric', month: '2-digit', day: '2-digit',
  }).format(new Date());
}

/**
 * Plus anual regular (390 €). Si existe STRIPE_PRICE_PLUS_YEARLY se usa ese;
 * si no, se busca por lookup_key y, la primera vez, se crea en el mismo
 * producto y con el mismo tratamiento de IVA que el anual de lanzamiento.
 */
async function ensurePlusYearlyRegular(stripe: Stripe): Promise<{ priceId: string; productId: string }> {
  const launch = await stripe.prices.retrieve(STRIPE_PRICES.plus.yearly_launch);
  const productId = typeof launch.product === 'string' ? launch.product : launch.product.id;
  if (STRIPE_PRICES.plus.yearly) return { priceId: STRIPE_PRICES.plus.yearly, productId };

  const buscar = async () => {
    const found = await stripe.prices.list({ lookup_keys: [PLUS_YEARLY_REGULAR_LOOKUP], active: true, limit: 1 });
    return found.data[0]?.id ?? null;
  };
  const existing = await buscar();
  if (existing) return { priceId: existing, productId };
  try {
    const created = await stripe.prices.create({
      product: productId,
      currency: 'eur',
      unit_amount: BF_PRECIO_REGULAR_CENTS,
      recurring: { interval: 'year' },
      tax_behavior: (launch.tax_behavior ?? 'inclusive') as Stripe.PriceCreateParams.TaxBehavior,
      lookup_key: PLUS_YEARLY_REGULAR_LOOKUP,
      nickname: 'Plus anual (regular)',
      metadata: { origen: 'portal', plan: 'plus', cycle: 'yearly', founder: 'false' },
    });
    log('plus yearly regular created', { id: created.id });
    return { priceId: created.id, productId };
  } catch (e) {
    // Dos altas a la vez: la otra ya lo ha creado.
    const again = await buscar();
    if (again) return { priceId: again, productId };
    throw e;
  }
}

/** Cupón de Black Friday: 210 € menos en la primera factura (390 → 180). */
async function ensureBlackFridayCoupon(stripe: Stripe, productId: string): Promise<string> {
  try {
    const c = await stripe.coupons.retrieve(BF_COUPON_ID);
    if (c.valid) return c.id;
    throw new Error('El cupón de Black Friday ya no es válido.');
  } catch (e) {
    const code = (e as { code?: string }).code;
    if (code !== 'resource_missing') throw e;
  }
  try {
    const created = await stripe.coupons.create({
      id: BF_COUPON_ID,
      name: 'Black Friday 2026',
      amount_off: BF_DESCUENTO_CENTS,
      currency: 'eur',
      duration: 'once',
      applies_to: { products: [productId] },
      // Margen de un día sobre la ventana: la sesión de Checkout dura 24 h.
      redeem_by: Math.floor(Date.UTC(2026, 11, 3, 0, 0, 0) / 1000),
      metadata: { origen: 'portal', oferta: 'black-friday' },
    });
    log('black friday coupon created', { id: created.id });
    return created.id;
  } catch (e) {
    const again = await stripe.coupons.retrieve(BF_COUPON_ID).catch(() => null);
    if (again?.valid) return again.id;
    throw e;
  }
}

function json(payload: unknown, status = 200) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

function toMadridEndOfDayTimestamp(isoDate: string): number {
  // isoDate = 'YYYY-MM-DD'. Devuelve el timestamp Unix de las 23:59:59 en Europa/Madrid.
  const formatter = new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Europe/Madrid',
    year: 'numeric', month: '2-digit', day: '2-digit',
  });
  const parts = Object.fromEntries(
    formatter.formatToParts(new Date(`${isoDate}T00:00:00`)).map(p => [p.type, p.value]),
  ) as Record<string, string>;
  const [y, mo, d] = [parseInt(parts.year, 10), parseInt(parts.month, 10) - 1, parseInt(parts.day, 10)];
  return Math.floor(new Date(y, mo, d, 23, 59, 59).getTime() / 1000);
}

function firstChargeLabelFromTrialEnd(trialEnd: number): string {
  // El primer cobro es el día siguiente al fin del periodo de cortesía
  // (trialEnd son las 23:59:59 de ese día en Europa/Madrid). Se formatea en
  // español y en hora de Madrid: "1 de noviembre de 2026".
  const dayFmt = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Europe/Madrid',
    year: 'numeric', month: '2-digit', day: '2-digit',
  });
  const [y, mo, d] = dayFmt.format(new Date(trialEnd * 1000)).split('-').map(Number);
  const nextDay = new Date(Date.UTC(y, mo - 1, d + 1, 12));
  return new Intl.DateTimeFormat('es-ES', {
    timeZone: 'Europe/Madrid',
    day: 'numeric', month: 'long', year: 'numeric',
  }).format(nextDay);
}
