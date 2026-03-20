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
    const { messages } = await req.json();
    const openAIApiKey = Deno.env.get('OPENAI_API_KEY');
    
    if (!openAIApiKey) {
      throw new Error('OPENAI_API_KEY not configured');
    }

    // Get auth header to create authenticated Supabase client
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('No authorization header');
    }

    // Create Supabase client with user's auth
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } }
    );

    // Get current user
    const { data: { user } } = await supabaseClient.auth.getUser();
    if (!user) {
      throw new Error('User not authenticated');
    }

    // Get user profile
    const { data: profile } = await supabaseClient
      .from('profiles')
      .select('subscription_role')
      .eq('id', user.id)
      .single();

    // Build context from portal data
    const context = await buildPortalContext(supabaseClient, profile?.subscription_role);

    // System prompt with portal context
    const systemPrompt = `Eres el asistente AI de farmapro, un portal para profesionales de farmacia.

INFORMACIÓN DEL PORTAL:
${context}

INSTRUCCIONES:
- Responde preguntas sobre cursos, recursos, eventos, promociones y empleo del portal
- Proporciona información precisa basada en los datos del portal
- Si no tienes información específica, indícalo claramente
- Sé conciso y profesional
- Si el usuario pregunta sobre contenido premium, indica si necesita suscripción
- Mantén el tono profesional y amigable`;

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
    console.error('Error in ai-portal-chat:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});

async function buildPortalContext(supabase: any, userRole: string) {
  let context = '';

  try {
    // Get courses count and categories
    const { data: courses, error: coursesError } = await supabase
      .from('courses')
      .select('id, title, category, is_premium')
      .limit(10);

    if (!coursesError && courses) {
      context += `\nCURSOS DISPONIBLES (${courses.length}):\n`;
      courses.forEach((course: any) => {
        context += `- ${course.title} (${course.category})${course.is_premium ? ' [PREMIUM]' : ''}\n`;
      });
    }

    // Get resources count
    const { count: resourcesCount } = await supabase
      .from('resources')
      .select('*', { count: 'exact', head: true });

    context += `\nRECURSOS TOTALES: ${resourcesCount || 0}\n`;

    // Get active events
    const { data: events, error: eventsError } = await supabase
      .from('events')
      .select('title, event_type, start_date')
      .gte('start_date', new Date().toISOString())
      .limit(5);

    if (!eventsError && events && events.length > 0) {
      context += `\nPRÓXIMOS EVENTOS (${events.length}):\n`;
      events.forEach((event: any) => {
        context += `- ${event.title} (${event.event_type}) - ${new Date(event.start_date).toLocaleDateString()}\n`;
      });
    }

    // Get active job listings
    const { count: jobsCount } = await supabase
      .from('job_listings_public')
      .select('*', { count: 'exact', head: true })
      .eq('is_active', true);

    context += `\nOFERTAS DE EMPLEO ACTIVAS: ${jobsCount || 0}\n`;

    // Get active promotions
    const { count: promotionsCount } = await supabase
      .from('promotions')
      .select('*', { count: 'exact', head: true })
      .eq('is_active', true);

    context += `\nPROMOCIONES ACTIVAS: ${promotionsCount || 0}\n`;

    context += `\nROL DEL USUARIO: ${userRole || 'freemium'}\n`;

  } catch (error) {
    console.error('Error building context:', error);
  }

  return context;
}
