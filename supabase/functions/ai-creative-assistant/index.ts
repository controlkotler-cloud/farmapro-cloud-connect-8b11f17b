import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from 'jsr:@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { messages, contentType } = await req.json();
    
    console.log('Received request with contentType:', contentType);

    // Validate input
    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return new Response(
        JSON.stringify({ error: 'Mensajes inválidos' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Extract JWT token from Authorization header
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      console.error('No authorization header');
      return new Response(
        JSON.stringify({ error: 'No autorizado' }),
        { 
          status: 401, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    const token = authHeader.replace('Bearer ', '');
    console.log('Token extracted, creating Supabase admin client...');

    // Create Supabase client with service role for backend operations
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          persistSession: false,
          autoRefreshToken: false
        }
      }
    );

    // Verify JWT token directly with the extracted token
    console.log('Verifying JWT token...');
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);
    
    if (authError || !user) {
      console.error('JWT verification failed:', authError);
      return new Response(
        JSON.stringify({ 
          error: authError?.message === 'invalid JWT' 
            ? 'Sesión expirada. Por favor, vuelve a iniciar sesión.' 
            : 'Usuario no autenticado' 
        }),
        { 
          status: 401, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    console.log('User authenticated:', user.id);

    // Check user subscription with admin client
    const { data: profile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('subscription_role, subscription_status, full_name, pharmacy_name, position')
      .eq('id', user.id)
      .single();

    if (profileError || !profile) {
      console.error('Error fetching profile:', profileError);
      return new Response(
        JSON.stringify({ error: 'Error al verificar el perfil del usuario' }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    console.log('Profile validated for user:', user.id, 'Role:', profile.subscription_role);

    // Validate subscription access
    const allowedRoles = ['premium', 'profesional', 'admin'];
    if (!allowedRoles.includes(profile.subscription_role) || profile.subscription_status !== 'active') {
      console.error('Access denied - Role:', profile.subscription_role, 'Status:', profile.subscription_status);
      return new Response(
        JSON.stringify({ 
          error: 'No tienes acceso a esta funcionalidad. Necesitas un plan Premium, Profesional o Admin activo.' 
        }),
        { 
          status: 403, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      console.error('LOVABLE_API_KEY not configured');
      return new Response(
        JSON.stringify({ error: 'Configuración del servidor incompleta' }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    console.log('Calling Lovable AI for user:', user.id);

    const systemPrompt = getSystemPrompt(contentType || 'blog', profile);

    const aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
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

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      console.error('Lovable AI error:', aiResponse.status, errorText);
      
      // Handle specific error codes
      if (aiResponse.status === 429) {
        return new Response(
          JSON.stringify({ error: 'Límite de uso excedido. Por favor, intenta de nuevo en unos momentos.' }),
          { 
            status: 429, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        );
      }
      
      if (aiResponse.status === 402) {
        return new Response(
          JSON.stringify({ error: 'Créditos insuficientes. Por favor, contacta con soporte.' }),
          { 
            status: 402, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        );
      }
      
      return new Response(
        JSON.stringify({ error: 'Error al comunicarse con el servicio de IA' }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    console.log('AI response received, streaming to client...');

    return new Response(aiResponse.body, {
      headers: {
        ...corsHeaders,
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    });
  } catch (error) {
    console.error('Error in ai-creative-assistant:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'Error interno del servidor' }),
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
