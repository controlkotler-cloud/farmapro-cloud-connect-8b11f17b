
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "npm:resend@2.0.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.50.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));
const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

// Create Supabase client with service role key for admin access
const supabase = createClient(supabaseUrl, supabaseServiceKey);

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface NotificationRequest {
  conversation_id: string;
  recipient_email: string;
  job_title: string;
  sender_name: string;
  message_preview: string;
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { 
      conversation_id, 
      recipient_email, 
      job_title, 
      sender_name, 
      message_preview 
    }: NotificationRequest = await req.json();

    console.log('Sending job message notification:', { 
      conversation_id, 
      recipient_email, 
      job_title 
    });

    // Validate required fields
    if (!conversation_id || !recipient_email || !job_title) {
      throw new Error('Missing required fields');
    }

    const emailResponse = await resend.emails.send({
      from: "farmapro <noreply@farmapro.es>",
      to: [recipient_email],
      subject: `Nuevo mensaje sobre: ${job_title}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #3b82f6, #1e40af); padding: 30px; border-radius: 10px 10px 0 0; text-align: center;">
            <h1 style="color: white; margin: 0; font-size: 24px;">farmapro</h1>
            <p style="color: #e0e7ff; margin: 10px 0 0 0;">Portal de empleo farmacéutico</p>
          </div>
          
          <div style="background: white; padding: 30px; border-radius: 0 0 10px 10px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
            <h2 style="color: #1f2937; margin-top: 0;">¡Tienes un nuevo mensaje!</h2>
            
            <div style="background: #f8fafc; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <h3 style="color: #374151; margin-top: 0; font-size: 16px;">Oferta de trabajo:</h3>
              <p style="color: #1f2937; font-weight: 600; margin: 5px 0;">${job_title}</p>
              
              ${sender_name ? `
                <h3 style="color: #374151; margin-top: 20px; margin-bottom: 5px; font-size: 16px;">Mensaje de:</h3>
                <p style="color: #1f2937; margin: 5px 0;">${sender_name}</p>
              ` : ''}
              
              ${message_preview ? `
                <h3 style="color: #374151; margin-top: 20px; margin-bottom: 5px; font-size: 16px;">Vista previa:</h3>
                <p style="color: #6b7280; font-style: italic; margin: 5px 0;">"${message_preview}"</p>
              ` : ''}
            </div>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${supabaseUrl.replace('supabase.co', 'farmapro.es')}/empleo/conversaciones/${conversation_id}" 
                 style="background: #3b82f6; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; font-weight: 600; display: inline-block;">
                Ver conversación completa
              </a>
            </div>
            
            <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">
            
            <p style="color: #6b7280; font-size: 14px; line-height: 1.5; margin: 0;">
              Este email se envía porque tienes una conversación activa en farmapro. 
              Si no deseas recibir estas notificaciones, puedes desactivarlas en tu perfil.
            </p>
            
            <p style="color: #9ca3af; font-size: 12px; text-align: center; margin-top: 20px;">
              © 2024 farmapro - Portal de empleo farmacéutico
            </p>
          </div>
        </div>
      `,
    });

    console.log("Job notification email sent successfully:", emailResponse);

    return new Response(JSON.stringify({ 
      success: true, 
      message: "Notification sent successfully",
      emailResponse 
    }), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders,
      },
    });
  } catch (error: any) {
    console.error("Error in send-job-notification function:", error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message 
      }),
      {
        status: 500,
        headers: { 
          "Content-Type": "application/json", 
          ...corsHeaders 
        },
      }
    );
  }
};

serve(handler);
