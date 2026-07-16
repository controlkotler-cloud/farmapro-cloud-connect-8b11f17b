
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

// Email de invitación migrado a send-portal-email (plantilla 'equipo-invitacion').
// Clientify dejó de ser canal de envío el 10-07 (ahora es solo CRM).

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

        // Cupo server-side: el plan Equipo incluye al titular + max_members personas más.
        const { data: teamSub, error: teamSubError } = await supabaseClient
          .from('team_subscriptions')
          .select('max_members')
          .eq('id', teamId)
          .single();

        if (teamSubError || !teamSub) {
          throw new Error('No se ha encontrado el equipo.');
        }

        const { count: activeMemberCount, error: countError } = await supabaseClient
          .from('team_members')
          .select('*', { count: 'exact', head: true })
          .eq('team_id', teamId)
          .neq('status', 'inactive');

        if (countError) throw countError;

        if ((activeMemberCount ?? 0) >= teamSub.max_members) {
          throw new Error(`No quedan plazas: tu plan Equipo incluye al titular y ${teamSub.max_members} personas más.`);
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

        if (inviteError) {
          if ((inviteError as { code?: string }).code === '23505') {
            throw new Error('Ya existe una invitación pendiente para ese email en este equipo.');
          }
          throw new Error(inviteError.message);
        }

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

        // Update the team member status, clear the token, and set joined_at
        const { data: acceptedRows, error: acceptError } = await supabaseClient
          .from('team_members')
          .update({
            user_id: user.id,
            status: 'active',
            joined_at: new Date().toISOString(),
            invitation_token: null // Clear token to prevent reuse
          })
          .eq('invitation_token', invitationToken)
          .eq('email', user.email)
          .select('id');

        if (acceptError) throw acceptError;
        if (!acceptedRows || acceptedRows.length === 0) {
          logStep("Accept invitation matched no rows", { invitationToken });
          throw new Error('Invalid invitation token');
        }

        // El rol de un miembro de equipo es siempre 'equipo' (paga el titular).
        // member_role es vestigial: no decide el rol.
        const { error: profileError } = await supabaseClient
          .from('profiles')
          .update({
            subscription_role: 'equipo',
            subscription_status: 'active'
          })
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
    const errorMessage = error instanceof Error
      ? error.message
      : (error as { message?: string })?.message ?? String(error);
    logStep("ERROR in manage-team", { message: errorMessage });
    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
