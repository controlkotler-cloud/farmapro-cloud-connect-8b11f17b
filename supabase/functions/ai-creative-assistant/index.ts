import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { messages, contentType } = await req.json();
    const lovableApiKey = Deno.env.get('LOVABLE_API_KEY');
    
    if (!lovableApiKey) {
      console.error('LOVABLE_API_KEY not configured');
      throw new Error('LOVABLE_API_KEY not configured');
    }

    // Get auth header
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      console.error('No authorization header provided');
      return new Response(
        JSON.stringify({ error: 'No authorization header' }),
        { 
          status: 401, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    console.log('Auth header present, creating Supabase client...');

    // Create Supabase client with hardcoded public values
    const supabaseClient = createClient(
      'https://fcqctkhvplmqukgosmya.supabase.co',
      'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZjcWN0a2h2cGxtcXVrZ29zbXlhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTAxNTMwNDIsImV4cCI6MjA2NTcyOTA0Mn0.JQLph5vaUOS0gphHbucjmE_yq-fIQiJmhh7h1ogCHx0',
      { global: { headers: { Authorization: authHeader } } }
    );

    // Get user info
    console.log('Getting user from token...');
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser();
    
    if (userError) {
      console.error('Error getting user:', userError);
      return new Response(
        JSON.stringify({ error: 'Error de autenticación: ' + userError.message }),
        { 
          status: 401, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }
    
    if (!user) {
      console.error('No user found in token');
      return new Response(
        JSON.stringify({ error: 'Usuario no autenticado' }),
        { 
          status: 401, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    console.log('User authenticated:', user.id);

    const { data: profile } = await supabaseClient
      .from('profiles')
      .select('full_name, pharmacy_name, position, subscription_role, subscription_status')
      .eq('id', user.id)
      .single();

    // Validate user has access (premium, profesional, or admin)
    const allowedRoles = ['premium', 'profesional', 'admin'];
    if (!profile || !allowedRoles.includes(profile.subscription_role) || profile.subscription_status !== 'active') {
      return new Response(
        JSON.stringify({ 
          error: 'Esta funcionalidad está disponible solo para usuarios Premium, Profesional y Admin. Actualiza tu plan para acceder.',
          requiresUpgrade: true 
        }),
        { 
          status: 403, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Build system prompt based on content type
    const systemPrompt = getSystemPrompt(contentType, profile);

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${lovableApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'system', content: systemPrompt },
          ...messages
        ],
        stream: true,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      console.error('Lovable AI error:', response.status, error);
      
      // Handle rate limits and payment errors
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: 'Límite de solicitudes alcanzado, intenta de nuevo en un momento.' }),
          { 
            status: 429, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        );
      }
      
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: 'Créditos insuficientes. Por favor, añade créditos a tu workspace de Lovable AI.' }),
          { 
            status: 402, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        );
      }
      
      throw new Error('Lovable AI API error');
    }

    return new Response(response.body, {
      headers: { ...corsHeaders, 'Content-Type': 'text/event-stream' },
    });

  } catch (error) {
    console.error('Error in ai-creative-assistant:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});

function getSystemPrompt(contentType: string, profile: any) {
  const userName = profile?.full_name || 'profesional';
  const pharmacyName = profile?.pharmacy_name || 'tu farmacia';
  const position = profile?.position || 'profesional';

  const baseContext = `Asistente creativo para farmacia. Usuario: ${userName} (${position} - ${pharmacyName})`;

  switch (contentType) {
    case 'blog':
      return `${baseContext}
Crea contenido profesional para blog farmacéutico: título atractivo, introducción clara, desarrollo con datos, conclusión práctica y call to action. Tono profesional pero accesible.`;

    case 'social-media':
      return `${baseContext}
Crea copy para redes sociales de farmacia (máx. 2200 caracteres): tono cercano, 3-5 hashtags, emojis apropiados, call to action claro. Sugiere tipo de imagen ideal.`;

    case 'promotion':
      return `${baseContext}
Crea copy promocional farmacéutico: mensaje directo, beneficios claros, call to action potente. Cumple normativa farmacéutica y sugiere diseño visual.`;

    default:
      return `${baseContext}
Crea contenido profesional para blog farmacéutico: título atractivo, introducción clara, desarrollo con datos, conclusión práctica y call to action.`;
  }
}
