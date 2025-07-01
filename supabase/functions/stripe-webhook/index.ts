
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[STRIPE-WEBHOOK] ${step}${detailsStr}`);
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseClient = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
  );

  try {
    logStep("Webhook received");

    const signature = req.headers.get("stripe-signature");
    const body = await req.text();
    
    const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", {
      apiVersion: "2023-10-16",
    });

    // Verify webhook signature using async method
    let event;
    try {
      event = await stripe.webhooks.constructEventAsync(
        body,
        signature!,
        Deno.env.get("STRIPE_WEBHOOK_SECRET") || ""
      );
    } catch (err) {
      logStep("Webhook signature verification failed", { error: err.message });
      return new Response(`Webhook Error: ${err.message}`, { status: 400 });
    }

    logStep("Processing event", { type: event.type, id: event.id });

    switch (event.type) {
      case 'checkout.session.completed':
        const session = event.data.object as Stripe.Checkout.Session;
        
        if (session.metadata?.plan_type === 'team') {
          logStep("Processing team subscription", { sessionId: session.id });
          
          const userId = session.metadata.user_id;
          const teamName = session.metadata.team_name;
          const memberCount = parseInt(session.metadata.member_count || '0');
          const memberEmails = JSON.parse(session.metadata.member_emails || '[]');
          
          // Create team subscription
          const { data: teamSub, error: teamError } = await supabaseClient
            .from('team_subscriptions')
            .insert({
              owner_id: userId,
              stripe_subscription_id: session.subscription as string,
              team_name: teamName,
              max_members: memberCount + 1, // +1 for owner
              status: 'active'
            })
            .select()
            .single();

          if (teamError) {
            logStep("Error creating team subscription", { error: teamError });
            throw teamError;
          }

          logStep("Team subscription created", { teamId: teamSub.id });

          // Update owner profile to premium
          const { error: ownerError } = await supabaseClient
            .from('profiles')
            .update({ subscription_role: 'premium' })
            .eq('id', userId);

          if (ownerError) {
            logStep("Error updating owner profile", { error: ownerError });
          }

          // Create team member invitations
          for (const email of memberEmails) {
            const invitationToken = crypto.randomUUID();
            
            const { error: memberError } = await supabaseClient
              .from('team_members')
              .insert({
                team_id: teamSub.id,
                email: email,
                status: 'pending',
                invitation_token: invitationToken
              });

            if (memberError) {
              logStep("Error creating team member", { email, error: memberError });
            } else {
              logStep("Team member invitation created", { email, token: invitationToken });
            }
          }

          logStep("Team setup completed", { teamId: teamSub.id, memberCount });
        }
        break;

      case 'invoice.payment_succeeded':
        // Handle successful payment
        logStep("Payment succeeded", { invoiceId: event.data.object.id });
        break;

      case 'customer.subscription.deleted':
        // Handle subscription cancellation
        const subscription = event.data.object as Stripe.Subscription;
        
        const { error: cancelError } = await supabaseClient
          .from('team_subscriptions')
          .update({ status: 'cancelled' })
          .eq('stripe_subscription_id', subscription.id);

        if (cancelError) {
          logStep("Error cancelling team subscription", { error: cancelError });
        } else {
          logStep("Team subscription cancelled", { subscriptionId: subscription.id });
        }
        break;

      default:
        logStep("Unhandled event type", { type: event.type });
    }

    return new Response(JSON.stringify({ received: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR in stripe-webhook", { message: errorMessage });
    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
