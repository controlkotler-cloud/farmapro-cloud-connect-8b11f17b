import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[CLIENTIFY-SYNC] ${step}${detailsStr}`);
};

interface ClientifyContact {
  email: string;
  name?: string;
  last_name?: string;
  custom_fields?: {
    farmapro_user_id?: string;
    subscription_role?: string;
    subscription_status?: string;
    pharmacy_name?: string;
    position?: string;
    last_login?: string;
    total_points?: number;
    level?: number;
  };
}

interface ClientifyEmailData {
  to: string;
  subject: string;
  content: string;
  template_id?: string;
  personalization?: Record<string, any>;
}

class ClientifyAPI {
  private apiKey: string;
  private baseUrl = "https://api.clientify.net/v1";

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  async createOrUpdateContact(contact: ClientifyContact): Promise<any> {
    const response = await fetch(`${this.baseUrl}/contacts/`, {
      method: "POST",
      headers: {
        "Authorization": `Token ${this.apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email: contact.email,
        first_name: contact.name || "",
        last_name: contact.last_name || "",
        custom_fields: contact.custom_fields || {},
      }),
    });

    if (!response.ok) {
      // Si el contacto ya existe, intentamos actualizarlo
      if (response.status === 400) {
        return this.updateContactByEmail(contact);
      }
      throw new Error(`Clientify API error: ${response.status} ${response.statusText}`);
    }

    return response.json();
  }

  async updateContactByEmail(contact: ClientifyContact): Promise<any> {
    // Primero obtenemos el contacto por email
    const searchResponse = await fetch(`${this.baseUrl}/contacts/?email=${contact.email}`, {
      headers: {
        "Authorization": `Token ${this.apiKey}`,
      },
    });

    if (!searchResponse.ok) {
      throw new Error(`Error searching contact: ${searchResponse.statusText}`);
    }

    const searchData = await searchResponse.json();
    if (!searchData.results || searchData.results.length === 0) {
      // Si no existe, lo creamos
      return this.createOrUpdateContact(contact);
    }

    const existingContact = searchData.results[0];
    
    // Actualizamos el contacto existente
    const updateResponse = await fetch(`${this.baseUrl}/contacts/${existingContact.id}/`, {
      method: "PATCH",
      headers: {
        "Authorization": `Token ${this.apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        first_name: contact.name || existingContact.first_name,
        last_name: contact.last_name || existingContact.last_name,
        custom_fields: {
          ...existingContact.custom_fields,
          ...contact.custom_fields,
        },
      }),
    });

    if (!updateResponse.ok) {
      throw new Error(`Error updating contact: ${updateResponse.statusText}`);
    }

    return updateResponse.json();
  }

  async sendEmail(emailData: ClientifyEmailData): Promise<any> {
    const response = await fetch(`${this.baseUrl}/emails/`, {
      method: "POST",
      headers: {
        "Authorization": `Token ${this.apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        to: [emailData.to],
        subject: emailData.subject,
        content: emailData.content,
        template_id: emailData.template_id,
        personalization: emailData.personalization || {},
      }),
    });

    if (!response.ok) {
      throw new Error(`Error sending email: ${response.status} ${response.statusText}`);
    }

    return response.json();
  }

  async addToAutomation(email: string, automationId: string): Promise<any> {
    const response = await fetch(`${this.baseUrl}/automations/${automationId}/contacts/`, {
      method: "POST",
      headers: {
        "Authorization": `Token ${this.apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email: email,
      }),
    });

    if (!response.ok) {
      throw new Error(`Error adding to automation: ${response.status} ${response.statusText}`);
    }

    return response.json();
  }
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseClient = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
  );

  try {
    logStep("Clientify sync function started");

    const { action, data } = await req.json();
    logStep("Request data", { action });

    const authHeader = req.headers.get("Authorization")!;
    const token = authHeader.replace("Bearer ", "");
    const { data: userData } = await supabaseClient.auth.getUser(token);
    const authUser = userData?.user;

    if (!authUser?.email) {
      throw new Error("User not authenticated");
    }

    // Only these actions accept a target email; sync_user is always self.
    // Always derive the acting user from the verified JWT, never from client body.
    const userId = authUser.id;
    const email = authUser.email;

    // Admin check for privileged actions
    const { data: isAdminRow } = await supabaseClient
      .from('admin_users')
      .select('user_id')
      .eq('user_id', userId)
      .maybeSingle();
    const isAdmin = !!isAdminRow;

    const clientifyAPI = new ClientifyAPI(Deno.env.get("CLIENTIFY_API_KEY")!);

    switch (action) {
      case 'sync_user': {
        // IDOR-safe: always use the authenticated user id from the verified JWT.
        const { data: profile, error: profileError } = await supabaseClient
          .from('profiles')
          .select('*')
          .eq('id', userId)
          .single();

        if (profileError) throw profileError;

        const { data: userPoints } = await supabaseClient
          .from('user_points')
          .select('*')
          .eq('user_id', userId)
          .single();

        const contact: ClientifyContact = {
          email: profile.email,
          name: profile.full_name?.split(' ')[0] || '',
          last_name: profile.full_name?.split(' ').slice(1).join(' ') || '',
          custom_fields: {
            farmapro_user_id: profile.id,
            subscription_role: profile.subscription_role,
            subscription_status: profile.subscription_status,
            pharmacy_name: profile.pharmacy_name,
            position: profile.position,
            last_login: new Date().toISOString(),
            total_points: userPoints?.total_points || 0,
            level: userPoints?.level || 1,
          },
        };

        const syncResult = await clientifyAPI.createOrUpdateContact(contact);
        logStep("User synced to Clientify", { userId: profile.id });

        return new Response(JSON.stringify({
          success: true,
          message: 'Usuario sincronizado con Clientify',
          clientifyContactId: syncResult?.id,
        }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 200,
        });
      }

      case 'send_email': {
        // Restricted to admins only. Free-form subject/content by regular
        // users would allow arbitrary email relay from the platform's Clientify.
        if (!isAdmin) {
          return new Response(JSON.stringify({ error: 'Forbidden' }), {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
            status: 403,
          });
        }
        const to = typeof data?.to === 'string' ? data.to : email;
        const emailResult = await clientifyAPI.sendEmail({
          to,
          subject: data.subject,
          content: data.content,
          template_id: data.template_id,
          personalization: data.personalization,
        });
        logStep("Email sent via Clientify (admin)", { adminId: userId });
        return new Response(JSON.stringify({
          success: true,
          message: 'Email enviado via Clientify',
          emailId: emailResult?.id,
        }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 200,
        });
      }

      case 'team_invitation': {
        // Must be admin OR strict owner of the target team.
        const targetTeamId = data?.teamId as string | undefined;
        const targetEmail = data?.email as string | undefined;
        if (!targetTeamId || !targetEmail) {
          return new Response(JSON.stringify({ error: 'Missing teamId or email' }), {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
            status: 400,
          });
        }
        let authorized = isAdmin;
        if (!authorized) {
          const { data: ownerCheck } = await supabaseClient
            .rpc('is_team_owner_strict', { team_id_param: targetTeamId, user_id_param: userId });
          authorized = !!ownerCheck;
        }
        if (!authorized) {
          return new Response(JSON.stringify({ error: 'Forbidden: not team owner' }), {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
            status: 403,
          });
        }

        const invitationUrl = `${Deno.env.get("SUPABASE_URL")}/invitation?token=${data.invitationToken}`;
        const invitationEmail = await clientifyAPI.sendEmail({
          to: targetEmail,
          subject: "Invitación al equipo farmapro",
          content: `<h1>Te han invitado al equipo farmapro</h1>
            <p><a href="${invitationUrl}">Aceptar invitación</a></p>`,
        });

        await clientifyAPI.createOrUpdateContact({
          email: targetEmail,
          custom_fields: {
            invitation_status: 'pending',
            invitation_token: data.invitationToken,
            team_id: targetTeamId,
          },
        });

        return new Response(JSON.stringify({
          success: true,
          message: 'Invitación enviada',
          emailId: invitationEmail?.id,
        }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 200,
        });
      }

      case 'add_to_automation': {
        // Admin only.
        if (!isAdmin) {
          return new Response(JSON.stringify({ error: 'Forbidden' }), {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
            status: 403,
          });
        }
        const targetEmail = typeof data?.email === 'string' ? data.email : email;
        const automationResult = await clientifyAPI.addToAutomation(targetEmail, data.automationId);
        return new Response(JSON.stringify({
          success: true,
          message: 'Usuario agregado a automatización',
          automationResult,
        }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 200,
        });
      }

      default:
        throw new Error("Invalid action");
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR in clientify-sync", { message: errorMessage });
    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});