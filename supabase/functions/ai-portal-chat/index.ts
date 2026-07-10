import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const PAID_ROLES = ['plus', 'equipo', 'premium', 'profesional', 'admin'];
const TRIAL_DAYS = 30;
const DAILY_LIMIT = 100;

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  try {
    const { messages } = await req.json();

    if (!Array.isArray(messages) || messages.length === 0) return json({ error: 'Mensajes inválidos' }, 400);
    if (messages.length > 50) return json({ error: 'Conversación demasiado larga' }, 400);

    const authHeader = req.headers.get('Authorization');
    if (!authHeader) return json({ error: 'No autorizado' }, 401);

    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
    const supabaseClient = createClient(
      supabaseUrl,
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user } } = await supabaseClient.auth.getUser();
    if (!user) return json({ error: 'Sesión inválida' }, 401);

    // Gating por plan
    const { data: profile } = await supabaseClient
      .from('profiles')
      .select('subscription_role, created_at')
      .eq('id', user.id)
      .single();

    const role = profile?.subscription_role as string | null;
    let access: 'paid' | 'free_trial' | 'free_locked';
    if (role && PAID_ROLES.includes(role)) {
      access = 'paid';
    } else if (!profile?.created_at) {
      access = 'free_trial';
    } else {
      const days = (Date.now() - new Date(profile.created_at).getTime()) / 86_400_000;
      access = days <= TRIAL_DAYS ? 'free_trial' : 'free_locked';
    }
    if (access === 'free_locked') {
      return json({ error: 'Tu periodo de prueba ha terminado. Hazte Plus para seguir usando el asistente.' }, 403);
    }

    // Rate-limit diario por usuario (aplica a trial y a pago).
    const since = new Date();
    since.setHours(0, 0, 0, 0);
    const { count: usageToday } = await supabaseClient
      .from('ai_chat_usage')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .gte('created_at', since.toISOString());
    if ((usageToday ?? 0) >= DAILY_LIMIT) {
      return json({ error: 'Has alcanzado el límite diario del asistente. Inténtalo mañana.' }, 429);
    }

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) return json({ error: 'LOVABLE_API_KEY no configurada' }, 500);

    const context = await buildPortalContext(supabaseClient, role);
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

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-3-flash-preview',
        messages: [{ role: 'system', content: systemPrompt }, ...messages],
        stream: true,
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error('Lovable AI chat error:', response.status, errText);
      if (response.status === 429) return json({ error: 'Demasiadas solicitudes. Inténtalo en unos minutos.' }, 429);
      if (response.status === 402) return json({ error: 'Créditos de IA agotados.' }, 402);
      return json({ error: 'Error al comunicarse con el servicio de IA' }, 502);
    }

    // Registrar uso SOLO si la llamada arranca con éxito.
    await supabaseClient.from('ai_chat_usage').insert({ user_id: user.id });

    return new Response(response.body, {
      headers: { ...corsHeaders, 'Content-Type': 'text/event-stream', 'Cache-Control': 'no-cache' },
    });
  } catch (error) {
    console.error('Error in ai-portal-chat:', error);
    return json({ error: (error as Error).message ?? 'Error interno' }, 500);
  }
});

async function buildPortalContext(supabase: any, userRole: string | null) {
  let context = '';
  try {
    const { data: courses } = await supabase
      .from('courses')
      .select('id, title, category, is_premium')
      .limit(10);
    if (courses?.length) {
      context += `\nCURSOS DISPONIBLES (${courses.length}):\n`;
      courses.forEach((c: any) => {
        context += `- ${c.title} (${c.category})${c.is_premium ? ' [PREMIUM]' : ''}\n`;
      });
    }
    const { count: resourcesCount } = await supabase
      .from('resources').select('*', { count: 'exact', head: true });
    context += `\nRECURSOS TOTALES: ${resourcesCount || 0}\n`;

    const { data: events } = await supabase
      .from('events').select('title, event_type, start_date')
      .gte('start_date', new Date().toISOString()).limit(5);
    if (events?.length) {
      context += `\nPRÓXIMOS EVENTOS (${events.length}):\n`;
      events.forEach((e: any) => {
        context += `- ${e.title} (${e.event_type}) - ${new Date(e.start_date).toLocaleDateString()}\n`;
      });
    }
    const { count: jobsCount } = await supabase
      .from('job_listings_public').select('*', { count: 'exact', head: true }).eq('is_active', true);
    context += `\nOFERTAS DE EMPLEO ACTIVAS: ${jobsCount || 0}\n`;
    const { count: promotionsCount } = await supabase
      .from('promotions').select('*', { count: 'exact', head: true }).eq('is_active', true);
    context += `\nPROMOCIONES ACTIVAS: ${promotionsCount || 0}\n`;
    context += `\nROL DEL USUARIO: ${userRole || 'freemium'}\n`;
  } catch (error) {
    console.error('Error building context:', error);
  }
  return context;
}
