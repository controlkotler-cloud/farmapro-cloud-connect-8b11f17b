// =====================================================================
// customer-portal: abre el portal de cliente de Stripe (tarjeta, datos
// fiscales, cambio de plan, cancelación al final del periodo, facturas).
// Usa la configuración provisionada en _shared/stripePortal.ts; si no se
// puede resolver, cae a la configuración por defecto de Stripe.
// Resuelve el customer por profiles.stripe_customer_id (lo escribe el
// webhook) y, si falta, por email.
// =====================================================================

import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { getPortalConfigurationId, tierForPrice } from "../_shared/stripePortal.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[CUSTOMER-PORTAL] ${step}${detailsStr}`);
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    logStep("Function started");

    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("No authorization header provided");

    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userError } = await supabaseClient.auth.getUser(token);
    if (userError) throw new Error(`Authentication error: ${userError.message}`);
    const user = userData.user;
    if (!user?.email) throw new Error("User not authenticated or email not available");
    logStep("User authenticated", { userId: user.id, email: user.email });

    const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", {
      apiVersion: "2023-10-16",
    });

    // Customer: primero el guardado en el perfil, si no, por email.
    const { data: profile } = await supabaseClient
      .from('profiles').select('stripe_customer_id').eq('id', user.id).maybeSingle();
    let customerId = (profile?.stripe_customer_id as string | null) ?? null;
    if (!customerId) {
      const customers = await stripe.customers.list({ email: user.email, limit: 1 });
      customerId = customers.data[0]?.id ?? null;
    }
    if (!customerId) {
      throw new Error("No Stripe customer found for this user");
    }
    logStep("Found Stripe customer", { customerId });

    const origin = req.headers.get("origin") || Deno.env.get('APP_URL') || "https://portal.farmapro.es";
    // El tier lo marca lo que ya paga: un fundador ve los precios de lanzamiento
    // al cambiar de plan; el resto, los regulares.
    const subs = await stripe.subscriptions.list({ customer: customerId, status: 'all', limit: 5 });
    const live = subs.data.find((s) => ['active', 'trialing', 'past_due'].includes(s.status)) ?? subs.data[0];
    const tier = tierForPrice(live?.items.data[0]?.price?.id);
    const configuration = await getPortalConfigurationId(stripe, tier);
    const portalSession = await stripe.billingPortal.sessions.create({
      customer: customerId,
      ...(configuration ? { configuration } : {}),
      return_url: `${origin}/perfil?tab=billing`,
    });
    logStep("Customer portal session created", { sessionId: portalSession.id, configuration, tier });

    return new Response(JSON.stringify({ url: portalSession.url }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR in customer-portal", { message: errorMessage });
    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
