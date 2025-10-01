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
    const openAIApiKey = Deno.env.get('OPENAI_API_KEY');
    
    if (!openAIApiKey) {
      throw new Error('OPENAI_API_KEY not configured');
    }

    // Get auth header
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('No authorization header');
    }

    // Create Supabase client
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } }
    );

    // Get user info
    const { data: { user } } = await supabaseClient.auth.getUser();
    if (!user) {
      throw new Error('User not authenticated');
    }

    const { data: profile } = await supabaseClient
      .from('profiles')
      .select('full_name, pharmacy_name, position')
      .eq('id', user.id)
      .single();

    // Build system prompt based on content type
    const systemPrompt = getSystemPrompt(contentType, profile);

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: systemPrompt },
          ...messages
        ],
        stream: true,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      console.error('OpenAI error:', error);
      throw new Error('OpenAI API error');
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

  const baseContext = `Eres un asistente creativo especializado en contenido para profesionales de farmacia.
Usuario: ${userName} (${position} en ${pharmacyName})`;

  switch (contentType) {
    case 'blog':
      return `${baseContext}

TAREA: Crear contenido para blog profesional de farmacia
ESTILO: Profesional, informativo, con base científica pero accesible
ESTRUCTURA: 
- Título atractivo
- Introducción enganchadora
- Desarrollo con datos y evidencia
- Conclusión práctica
- Call to action relevante

TEMAS SUGERIDOS: Actualidad farmacéutica, nuevos medicamentos, atención farmacéutica, gestión de farmacia, salud pública`;

    case 'social-media':
      return `${baseContext}

TAREA: Crear copy para redes sociales de farmacia (Instagram, Facebook, Twitter, etc.)
CARACTERÍSTICAS:
- Máximo 2200 caracteres
- Tono cercano y profesional
- 3-5 hashtags relevantes
- Include emoji apropiados
- Call to action claro
- Enfoque visual (menciona qué imagen usar)
- Adaptable a diferentes plataformas`;

    case 'promotion':
      return `${baseContext}

TAREA: Crear copy promocional para farmacia
CARACTERÍSTICAS:
- Mensaje claro y directo
- Beneficios destacados
- Sentido de urgencia (si aplica)
- Call to action potente
- Cumplimiento normativo farmacéutico
- Sugerencias de diseño visual`;

    default:
      return `${baseContext}

TAREA: Crear contenido para blog profesional de farmacia
ESTILO: Profesional, informativo, con base científica pero accesible
ESTRUCTURA: 
- Título atractivo
- Introducción enganchadora
- Desarrollo con datos y evidencia
- Conclusión práctica
- Call to action relevante`;
  }
  }
}
