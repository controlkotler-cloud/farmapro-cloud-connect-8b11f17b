
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[MANAGE-TEAM] ${step}${detailsStr}`);
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
    logStep("Function started");

    const { action, email, teamId, invitationToken } = await req.json();
    logStep("Request data", { action, email, teamId, invitationToken });

    const authHeader = req.headers.get("Authorization")!;
    const token = authHeader.replace("Bearer ", "");
    const { data } = await supabaseClient.auth.getUser(token);
    const user = data.user;
    if (!user?.email) throw new Error("User not authenticated");

    // Security: Log all team management attempts
    await supabaseClient.rpc('log_security_event', {
      event_type: 'admin_action',
      details: {
        description: `Team management action: ${action}`,
        metadata: { action, teamId, userEmail: user.email },
        severity: 'medium'
      },
      user_id_param: user.id
    });

    switch (action) {
      case 'invite_member':
        // CRITICAL: Verify team ownership before inviting
        const { data: ownershipCheck, error: ownershipError } = await supabaseClient
          .rpc('is_team_owner_strict', { team_id_param: teamId, user_id_param: user.id });
        
        if (ownershipError || !ownershipCheck) {
          logStep("SECURITY: Unauthorized invite attempt", { userId: user.id, teamId });
          await supabaseClient.rpc('log_security_event', {
            event_type: 'suspicious_activity',
            details: {
              description: 'Unauthorized team member invitation attempt',
              metadata: { teamId, attemptedBy: user.email },
              severity: 'high'
            },
            user_id_param: user.id
          });
          throw new Error("Unauthorized: Only team owners can invite members");
        }

        // Generate invitation token
        const inviteToken = crypto.randomUUID();
        
        // Insert team member with pending status
        const { error: inviteError } = await supabaseClient
          .from('team_members')
          .insert({
            team_id: teamId,
            email: email,
            status: 'pending',
            invitation_token: inviteToken
          });

        if (inviteError) throw inviteError;

        // Enviar invitación via Clientify
        const inviteUrl = `${Deno.env.get("SUPABASE_URL")}/invitation?token=${inviteToken}`;
        
        // Llamar a Clientify para enviar la invitación
        const { data: clientifyResponse, error: clientifyError } = await supabaseClient.functions.invoke('clientify-sync', {
          body: {
            action: 'team_invitation',
            email: email,
            data: {
              invitationToken: inviteToken,
              teamId: teamId,
              teamName: 'farmapro Team'
            }
          }
        });

        if (clientifyError) {
          logStep("Clientify invitation error", clientifyError);
          // Si falla Clientify, continuamos con la respuesta pero registramos el error
        } else {
          logStep("Invitation sent via Clientify", { email, clientifyResponse });
        }

        logStep("Member invited", { email, teamId, inviteToken });
        return new Response(JSON.stringify({ 
          success: true, 
          message: `Invitación creada para ${email}. URL: ${inviteUrl}`,
          invitationToken: inviteToken,
          invitationUrl: inviteUrl
        }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 200,
        });

      case 'accept_invitation':
        // Accept invitation and activate member
        const { error: acceptError } = await supabaseClient
          .from('team_members')
          .update({
            user_id: user.id,
            status: 'active',
            joined_at: new Date().toISOString()
          })
          .eq('invitation_token', invitationToken)
          .eq('email', user.email);

        if (acceptError) throw acceptError;

        // Update user profile to professional
        const { error: profileError } = await supabaseClient
          .from('profiles')
          .update({ subscription_role: 'profesional' })
          .eq('id', user.id);

        if (profileError) throw profileError;

        logStep("Invitation accepted", { userId: user.id, email: user.email });
        return new Response(JSON.stringify({ 
          success: true, 
          message: 'Te has unido al equipo exitosamente' 
        }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 200,
        });

      case 'remove_member':
        // CRITICAL: Verify team ownership before removing
        const { data: removeOwnershipCheck, error: removeOwnershipError } = await supabaseClient
          .rpc('is_team_owner_strict', { team_id_param: teamId, user_id_param: user.id });
        
        if (removeOwnershipError || !removeOwnershipCheck) {
          logStep("SECURITY: Unauthorized remove attempt", { userId: user.id, teamId });
          await supabaseClient.rpc('log_security_event', {
            event_type: 'suspicious_activity',
            details: {
              description: 'Unauthorized team member removal attempt',
              metadata: { teamId, attemptedBy: user.email },
              severity: 'high'
            },
            user_id_param: user.id
          });
          throw new Error("Unauthorized: Only team owners can remove members");
        }

        // Remove member from team
        const { error: removeError } = await supabaseClient
          .from('team_members')
          .update({ status: 'inactive' })
          .eq('email', email)
          .eq('team_id', teamId);

        if (removeError) throw removeError;

        logStep("Member removed", { email, teamId });
        return new Response(JSON.stringify({ 
          success: true, 
          message: 'Miembro removido del equipo' 
        }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 200,
        });

      default:
        throw new Error("Invalid action");
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR in manage-team", { message: errorMessage });
    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
