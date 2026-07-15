
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

// Mismo canon visual que docs/email-templates/auth-confirm-signup-es.html
// (verde #88C835/#5F8F20, Open Sans/Arial, pill button). Estilos inline: los
// clientes de correo strippean <style>.
const buildInvitationEmailHtml = (inviteUrl: string) => `
<table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="border-collapse:collapse;background-color:#f4f4f4;">
  <tr>
    <td align="center" style="padding:32px 12px;">
      <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="480" style="border-collapse:collapse;background-color:#ffffff;max-width:480px;width:100%;border-radius:14px;">
        <tr>
          <td style="padding:40px 32px;font-family:'Open Sans',Arial,Helvetica,sans-serif;text-align:center;">
            <img src="https://farmapro.es/email-logo-farmapro.png" alt="farmapro" width="130" style="display:block;width:130px;height:auto;border:0;outline:none;margin:0 auto 28px;">
            <h1 style="margin:0 0 16px;font-size:22px;font-weight:800;color:#181C17;line-height:1.3;text-align:center;">Te han invitado a un equipo</h1>
            <p style="margin:0 0 28px;font-size:16px;line-height:1.6;color:#3a3f38;text-align:center;">
              Alguien de tu farmacia te ha invitado a unirte a su equipo en el <strong style="color:#181C17;">Portal farmapro</strong>. Acepta la invitación para empezar a usarlo.
            </p>
            <table role="presentation" cellspacing="0" cellpadding="0" border="0" align="center" style="border-collapse:collapse;">
              <tr>
                <td align="center" style="border-radius:999px;background-color:#5F8F20;">
                  <a href="${inviteUrl}" style="display:inline-block;color:#ffffff;text-decoration:none;font-size:15px;font-weight:800;letter-spacing:0.04em;padding:16px 40px;text-transform:uppercase;line-height:1;">Aceptar invitación</a>
                </td>
              </tr>
            </table>
            <p style="margin:32px 0 0;font-size:13px;line-height:1.5;color:#9a9a9a;text-align:center;">
              Este enlace caduca en 7 días. Si no esperabas esta invitación, puedes ignorar este email.
            </p>
          </td>
        </tr>
      </table>
      <p style="margin:20px 0 0;font-size:12px;line-height:1.6;color:#9a9a9a;text-align:center;">
        farmapro &middot; el ecosistema para farmacias
      </p>
    </td>
  </tr>
</table>`;

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

        // Enviar invitación vía Mailrelay (API transaccional /send_emails, no
        // una campaña — no requiere que el destinatario esté en ninguna lista).
        // Clientify dejó de ser canal de envío el 10-07 (ahora es solo CRM).
        const appUrl = Deno.env.get("APP_URL") ?? "";
        const inviteUrl = `${appUrl}/invitation?token=${inviteToken}`;

        const mailrelayBase = Deno.env.get("MAILRELAY_API_BASE") ?? "";
        const mailrelayKey = Deno.env.get("MAILRELAY_API_KEY") ?? "";

        if (!mailrelayBase || !mailrelayKey) {
          logStep("Mailrelay secrets missing, invitation email not sent", { email });
        } else {
          try {
            const mrResponse = await fetch(`${mailrelayBase}/send_emails`, {
              method: "POST",
              headers: {
                "X-AUTH-TOKEN": mailrelayKey,
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                from: { email: "somos@farmapro.es", name: "farmapro" },
                to: [{ email }],
                subject: "Te han invitado a un equipo en el Portal farmapro",
                html_part: buildInvitationEmailHtml(inviteUrl),
              }),
            });
            if (!mrResponse.ok) {
              logStep("Mailrelay invitation error", { status: mrResponse.status, body: await mrResponse.text() });
            } else {
              logStep("Invitation sent via Mailrelay", { email });
            }
          } catch (mrErr) {
            logStep("Mailrelay invitation exception", { err: (mrErr as Error).message });
          }
        }

        logStep("Member invited", { email, teamId, inviteToken });
        return new Response(JSON.stringify({
          success: true,
          message: `Invitación creada para ${email}.`,
          invitationToken: inviteToken,
        }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 200,
        });

      case 'accept_invitation':
        // First validate the invitation before processing
        const { data: validationResult, error: validationError } = await supabaseClient
          .rpc('validate_team_invitation', {
            invitation_token_param: invitationToken,
            user_email_param: user.email
          });

        if (validationError || !validationResult) {
          logStep('Invitation validation failed', { validationError, result: validationResult });
          throw new Error('Invalid or expired invitation');
        }

        // Get the member role before updating
        const { data: memberData, error: memberError } = await supabaseClient
          .from('team_members')
          .select('member_role')
          .eq('invitation_token', invitationToken)
          .single();

        if (memberError || !memberData) {
          logStep("Failed to get member role", { error: memberError?.message });
          throw new Error('Invalid invitation token');
        }

        const memberRole = memberData.member_role;
        logStep("Retrieved member role", { memberRole });

        // Update the team member status, clear the token, and set joined_at
        const { error: acceptError } = await supabaseClient
          .from('team_members')
          .update({
            user_id: user.id,
            status: 'active',
            joined_at: new Date().toISOString(),
            invitation_token: null // Clear token to prevent reuse
          })
          .eq('invitation_token', invitationToken)
          .eq('email', user.email);

        if (acceptError) throw acceptError;

        // Update user profile role based on member role
        const subscriptionRole = memberRole === 'premium' ? 'premium' : 'profesional';
        const { error: profileError } = await supabaseClient
          .from('profiles')
          .update({ 
            subscription_role: subscriptionRole,
            subscription_status: 'active'
          })
          .eq('id', user.id);

        if (profileError) throw profileError;

        logStep("Invitation accepted", { userId: user.id, email: user.email, subscriptionRole });
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

        // C-SEG8: degradar el perfil del miembro retirado (pierde el acceso del equipo).
        // Si tuviera una suscripción individual propia, check-subscription la re-sincroniza.
        const { data: removedMember } = await supabaseClient
          .from('team_members')
          .select('user_id')
          .eq('email', email)
          .eq('team_id', teamId)
          .maybeSingle();
        if (removedMember?.user_id) {
          await supabaseClient
            .from('profiles')
            .update({ subscription_role: 'freemium', subscription_status: 'trialing' })
            .eq('id', removedMember.user_id);
        }

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
