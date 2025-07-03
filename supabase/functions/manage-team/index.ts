
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

    switch (action) {
      case 'invite_member':
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

        // Enviar email de invitación
        const inviteUrl = `${Deno.env.get("SUPABASE_URL")}/invitation?token=${inviteToken}`;
        
        // TODO: Aquí deberías integrar con Resend para enviar el email
        // Por ahora solo registramos la URL de invitación
        logStep("Invitation URL generated", { email, inviteUrl });

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
