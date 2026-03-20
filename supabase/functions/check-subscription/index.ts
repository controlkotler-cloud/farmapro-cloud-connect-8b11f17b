
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[CHECK-SUBSCRIPTION] ${step}${detailsStr}`);
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseClient = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    { auth: { persistSession: false } }
  );

  try {
    logStep("Function started");

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("No authorization header provided");

    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userError } = await supabaseClient.auth.getUser(token);
    if (userError) throw new Error(`Authentication error: ${userError.message}`);
    const user = userData.user;
    if (!user?.email) throw new Error("User not authenticated or email not available");
    logStep("User authenticated", { userId: user.id, email: user.email });

    // Check if we're in beta mode
    const { data: validationModeData } = await supabaseClient
      .from('system_settings')
      .select('value')
      .eq('key', 'validation_mode')
      .single();

    const validationMode = validationModeData?.value ? JSON.parse(validationModeData.value) : 'beta';
    logStep("Validation mode", { mode: validationMode });

    // Get current profile to avoid downgrades in beta mode
    const { data: currentProfile } = await supabaseClient
      .from('profiles')
      .select('subscription_role, subscription_status')
      .eq('id', user.id)
      .single();

    if (validationMode === 'beta') {
      logStep("Beta mode active, skipping Stripe validation");
      
      // In beta mode, don't validate with Stripe, just return current status
      const currentRole = currentProfile?.subscription_role || 'freemium';
      const currentStatus = currentProfile?.subscription_status || 'trialing';
      
      return new Response(JSON.stringify({
        subscribed: currentRole !== 'freemium',
        subscription_role: currentRole,
        subscription_status: currentStatus,
        current_period_end: null
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    // Active mode - validate with Stripe
    const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", {
      apiVersion: "2023-10-16",
    });

    const customers = await stripe.customers.list({ email: user.email, limit: 1 });
    
    if (customers.data.length === 0) {
      logStep("No customer found, checking if should downgrade");
      
      // Only downgrade to freemium if not in beta mode and not already a paid plan
      const shouldDowngrade = currentProfile?.subscription_role === 'freemium' || !currentProfile?.subscription_role;
      
      if (shouldDowngrade) {
        await supabaseClient.from("profiles").update({
          subscription_role: 'freemium',
          subscription_status: 'trialing',
          updated_at: new Date().toISOString(),
        }).eq('id', user.id);
      }
      
      return new Response(JSON.stringify({ 
        subscribed: false, 
        subscription_role: shouldDowngrade ? 'freemium' : (currentProfile?.subscription_role || 'freemium'),
        subscription_status: shouldDowngrade ? 'trialing' : (currentProfile?.subscription_status || 'trialing')
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    const customerId = customers.data[0].id;
    logStep("Found Stripe customer", { customerId });

    const subscriptions = await stripe.subscriptions.list({
      customer: customerId,
      status: "active",
      limit: 1,
    });

    const hasActiveSub = subscriptions.data.length > 0;
    let subscriptionRole = 'freemium';
    let subscriptionStatus = 'trialing';
    let currentPeriodEnd = null;

    if (hasActiveSub) {
      const subscription = subscriptions.data[0];
      currentPeriodEnd = new Date(subscription.current_period_end * 1000).toISOString();
      subscriptionStatus = 'active';
      
      // Determine subscription role from price
      const priceId = subscription.items.data[0].price.id;
      const price = await stripe.prices.retrieve(priceId);
      const amount = price.unit_amount || 0;
      
      if (amount === 500) {
        subscriptionRole = "estudiante";
      } else if (amount === 2900) {
        subscriptionRole = "profesional";
      } else if (amount === 3900) {
        subscriptionRole = "premium";
      }
      
      logStep("Active subscription found", { 
        subscriptionId: subscription.id, 
        endDate: currentPeriodEnd,
        role: subscriptionRole 
      });

      // Update or create subscription record
      await supabaseClient.from("subscriptions").upsert({
        user_id: user.id,
        stripe_subscription_id: subscription.id,
        plan_name: subscriptionRole,
        status: 'active',
        current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
        current_period_end: currentPeriodEnd,
        updated_at: new Date().toISOString(),
      }, { onConflict: 'stripe_subscription_id' });
    } else {
      logStep("No active subscription found");
    }

    // Update profile
    await supabaseClient.from("profiles").update({
      stripe_customer_id: customerId,
      subscription_role: subscriptionRole,
      subscription_status: subscriptionStatus,
      updated_at: new Date().toISOString(),
    }).eq('id', user.id);

    logStep("Updated database with subscription info", { 
      subscribed: hasActiveSub, 
      subscriptionRole, 
      subscriptionStatus 
    });

    return new Response(JSON.stringify({
      subscribed: hasActiveSub,
      subscription_role: subscriptionRole,
      subscription_status: subscriptionStatus,
      current_period_end: currentPeriodEnd
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR in check-subscription", { message: errorMessage });
    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
