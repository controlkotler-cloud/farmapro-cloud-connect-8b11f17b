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

    const { action, userId, email, data } = await req.json();
    logStep("Request data", { action, userId, email, data });

    const authHeader = req.headers.get("Authorization")!;
    const token = authHeader.replace("Bearer ", "");
    const { data: user } = await supabaseClient.auth.getUser(token);
    
    if (!user?.user?.email) {
      throw new Error("User not authenticated");
    }

    const clientifyAPI = new ClientifyAPI(Deno.env.get("CLIENTIFY_API_KEY")!);

    switch (action) {
      case 'sync_user':
        // Sincronizar usuario con Clientify
        const { data: profile, error: profileError } = await supabaseClient
          .from('profiles')
          .select('*')
          .eq('id', userId || user.user.id)
          .single();

        if (profileError) throw profileError;

        // Obtener puntos del usuario
        const { data: userPoints } = await supabaseClient
          .from('user_points')
          .select('*')
          .eq('user_id', userId || user.user.id)
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
        logStep("User synced to Clientify", { userId: profile.id, clientifyId: syncResult.id });

        return new Response(JSON.stringify({ 
          success: true, 
          message: 'Usuario sincronizado con Clientify',
          clientifyContact: syncResult
        }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 200,
        });

      case 'send_email':
        // Enviar email personalizado
        const emailResult = await clientifyAPI.sendEmail({
          to: email || user.user.email,
          subject: data.subject,
          content: data.content,
          template_id: data.template_id,
          personalization: data.personalization,
        });

        logStep("Email sent via Clientify", { to: email, subject: data.subject });

        return new Response(JSON.stringify({ 
          success: true, 
          message: 'Email enviado via Clientify',
          emailId: emailResult.id
        }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 200,
        });

      case 'team_invitation':
        // Enviar invitación de equipo con plantilla personalizada
        const invitationUrl = `${Deno.env.get("SUPABASE_URL")}/invitation?token=${data.invitationToken}`;
        
        const invitationEmail = await clientifyAPI.sendEmail({
          to: email,
          subject: "Invitación al equipo farmapro",
          content: `
            <h1>¡Te han invitado a unirte al equipo farmapro!</h1>
            <p>Hola,</p>
            <p>Has sido invitado/a a formar parte del plan Team de farmapro.</p>
            <p>Con esta invitación tendrás acceso completo a:</p>
            <ul>
              <li>📚 Todos los cursos y formaciones premium</li>
              <li>🎯 Retos y gamificación avanzada</li>
              <li>💬 Comunidad profesional exclusiva</li>
              <li>📊 Herramientas de gestión farmacéutica</li>
              <li>🎁 Promociones y descuentos especiales</li>
            </ul>
            <p><a href="${invitationUrl}" style="background-color: #0066cc; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; display: inline-block;">Aceptar Invitación</a></p>
            <p>Si tienes alguna pregunta, no dudes en contactarnos.</p>
            <p>¡Bienvenido/a al equipo!</p>
            <br>
            <p>El equipo de farmapro</p>
          `,
          personalization: {
            invitation_url: invitationUrl,
            team_name: data.teamName || 'farmapro Team',
          }
        });

        // Sincronizar también el contacto invitado
        await clientifyAPI.createOrUpdateContact({
          email: email,
          custom_fields: {
            invitation_status: 'pending',
            invitation_token: data.invitationToken,
            team_id: data.teamId,
          }
        });

        logStep("Team invitation sent via Clientify", { email, invitationToken: data.invitationToken });

        return new Response(JSON.stringify({ 
          success: true, 
          message: `Invitación enviada a ${email} via Clientify`,
          invitationUrl,
          emailId: invitationEmail.id
        }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 200,
        });

      case 'add_to_automation':
        // Agregar usuario a automatización específica
        const automationResult = await clientifyAPI.addToAutomation(
          email || user.user.email, 
          data.automationId
        );

        logStep("User added to automation", { email, automationId: data.automationId });

        return new Response(JSON.stringify({ 
          success: true, 
          message: 'Usuario agregado a automatización',
          automationResult
        }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 200,
        });

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