import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from 'jsr:@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

// Alineado con src/lib/plans.ts y ai-generate-image.
const PAID_ROLES = ['plus', 'equipo', 'premium', 'profesional', 'admin'];
const TRIAL_DAYS = 30;
const TEXTS_PER_MONTH_TRIAL = 2;

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  try {
    const { messages, contentType, context } = await req.json();

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return json({ error: 'Mensajes inválidos' }, 400);
    }

    const authHeader = req.headers.get('Authorization');
    if (!authHeader) return json({ error: 'No autorizado' }, 401);
    const token = authHeader.replace('Bearer ', '');

    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
    const admin = createClient(supabaseUrl, serviceKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });

    const { data: { user }, error: authError } = await admin.auth.getUser(token);
    if (authError || !user) return json({ error: 'Usuario no autenticado' }, 401);

    const userClient = createClient(supabaseUrl, Deno.env.get('SUPABASE_ANON_KEY') ?? '', {
      global: { headers: { Authorization: authHeader } },
      auth: { persistSession: false, autoRefreshToken: false },
    });

    const { data: profile, error: profileError } = await admin
      .from('profiles')
      .select('subscription_role, created_at, full_name, pharmacy_name, pharmacy_city, position')
      .eq('id', user.id)
      .single();
    if (profileError || !profile) return json({ error: 'Error al verificar el perfil' }, 500);

    const role = profile.subscription_role as string | null;
    let access: 'paid' | 'free_trial' | 'free_locked';
    if (role && PAID_ROLES.includes(role)) {
      access = 'paid';
    } else if (!profile.created_at) {
      access = 'free_trial';
    } else {
      const days = (Date.now() - new Date(profile.created_at).getTime()) / 86_400_000;
      access = days <= TRIAL_DAYS ? 'free_trial' : 'free_locked';
    }

    if (access === 'free_locked') {
      return json({ error: 'Tu periodo de prueba ha terminado. Hazte Plus para seguir generando contenido.' }, 403);
    }

    // Consumo atómico solo para free_trial. Los planes de pago son ilimitados.
    if (access === 'free_trial') {
      const { error: creditError } = await userClient.rpc('consume_text_credit', {
        p_limit: TEXTS_PER_MONTH_TRIAL,
      });
      if (creditError) {
        const msg = (creditError.message || '').toLowerCase();
        if (msg.includes('quota')) {
          return json({ error: 'Has alcanzado el límite de 2 textos mensuales de tu prueba. Hazte Plus para generar sin límite.' }, 402);
        }
        console.error('consume_text_credit error:', creditError);
        return json({ error: 'No se pudo verificar la cuota' }, 500);
      }
    }

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      await refundTextCredit(admin, user.id, access);
      return json({ error: 'Configuración del servidor incompleta' }, 500);
    }

    const systemPrompt = getSystemPrompt(contentType || 'instagram-post', profile, context || {});

    const aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
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

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      console.error('AI error:', aiResponse.status, errorText);
      await refundTextCredit(admin, user.id, access);
      if (aiResponse.status === 429) return json({ error: 'Límite excedido. Intenta en unos momentos.' }, 429);
      if (aiResponse.status === 402) return json({ error: 'Créditos insuficientes.' }, 402);
      return json({ error: 'Error al comunicarse con el servicio de IA' }, 500);
    }

    return new Response(aiResponse.body, {
      headers: { ...corsHeaders, 'Content-Type': 'text/event-stream', 'Cache-Control': 'no-cache', 'Connection': 'keep-alive' },
    });
  } catch (error) {
    console.error('Error:', error);
    return json({ error: (error as Error).message || 'Error interno' }, 500);
  }
});

async function refundTextCredit(admin: ReturnType<typeof createClient>, userId: string, access: string) {
  if (access !== 'free_trial') return;
  try {
    const period = new Date().toISOString().slice(0, 7);
    const { data } = await admin
      .from('ai_text_usage')
      .select('used')
      .eq('user_id', userId)
      .eq('period', period)
      .maybeSingle();
    if (data && typeof data.used === 'number' && data.used > 0) {
      await admin
        .from('ai_text_usage')
        .update({ used: data.used - 1, updated_at: new Date().toISOString() })
        .eq('user_id', userId)
        .eq('period', period);
    }
  } catch (e) {
    console.error('Text refund failed:', e);
  }
}

function getSystemPrompt(contentType: string, profile: any, context: any) {
  const userName = profile?.full_name || 'profesional';
  const pharmacyName = context?.pharmacyName || profile?.pharmacy_name || 'tu farmacia';
  const location = context?.location || profile?.pharmacy_city || '';
  const topic = context?.topic || '';
  const extraInstructions = context?.extraInstructions || '';

  const baseRules = `
Eres IAFarma, el asistente de contenido con inteligencia artificial de Farmapro. Generas contenido profesional para farmacias españolas.

CONTEXTO:
- Farmacia: ${pharmacyName}${location ? ` en ${location}` : ''}
- Usuario: ${userName}
- Fecha actual: ${new Date().toLocaleDateString('es-ES', { month: 'long', year: 'numeric' })}

RESTRICCIONES (ligeras, sentido común farmacéutico):
- Evita mencionar medicamentos concretos por su nombre
- Evita dar diagnósticos ("si tienes estos síntomas es que tienes X")
- Evita promesas de salud ("cura", "elimina", "garantiza resultados")
- Puedes hablar con libertad de categorías de producto, consejo general, hábitos saludables, dermocosmética, parafarmacia, servicios de la farmacia e ingredientes cosméticos (retinol, niacinamida, ácido hialurónico...)
- Tuteo siempre
- Emojis: sí pero uso reducido y profesional (2-4 por post, no más)
- Sin hashtags
- Tono: cercano, profesional, de confianza
`;

  const formatInstruction = `
FORMATO DE RESPUESTA:
- Responde en texto plano, sin markdown
- Usa saltos de línea para separar secciones
- Para énfasis usa MAYÚSCULAS puntuales
- Siempre incluye al final una sección "SUGERENCIA DE IMAGEN:" describiendo qué visual acompañaría este contenido
`;

  const contextInfo = extraInstructions ? `\nINSTRUCCIONES ADICIONALES DEL USUARIO: ${extraInstructions}\n` : '';

  switch (contentType) {
    case 'reel-script':
      return `${baseRules}${formatInstruction}${contextInfo}
TAREA: Genera un guión completo para un Reel de Instagram.
${topic ? `Tema: ${topic}` : ''}
${context?.duration ? `Duración objetivo: ${context.duration}` : 'Duración: 30-60 segundos'}`;
    case 'carousel':
      return `${baseRules}${formatInstruction}${contextInfo}
TAREA: Genera el contenido completo de un carrusel de Instagram.
${topic ? `Tema: ${topic}` : ''}`;
    case 'google-business':
      return `${baseRules}${formatInstruction}${contextInfo}
TAREA: Genera una publicación para Google Business Profile.
${topic ? `Mensaje: ${topic}` : ''}
Máximo 1500 caracteres.`;
    case 'blog':
      return `${baseRules}${formatInstruction}${contextInfo}
TAREA: Genera un artículo para el blog de la farmacia.
${topic ? `Tema: ${topic}` : ''}`;
    case 'promotion':
      return `${baseRules}${formatInstruction}${contextInfo}
TAREA: Genera copy promocional para la farmacia.
${context?.product ? `Producto/servicio: ${context.product}` : ''}`;
    case 'whatsapp':
      return `${baseRules}${formatInstruction}${contextInfo}
TAREA: Genera un mensaje de WhatsApp profesional para clientes.
${topic ? `Mensaje: ${topic}` : ''}`;
    case 'responder-resena':
      return `${baseRules}${contextInfo}
TAREA: Redacta la respuesta pública a una reseña de Google.
RESEÑA: "${context?.reviewText || topic || ''}"
Devuelve solo el texto, breve y empático, sin markdown ni sugerencia de imagen.`;
    case 'instagram-post':
    default:
      return `${baseRules}${formatInstruction}${contextInfo}
TAREA: Genera un post para Instagram (feed).
${topic ? `Tema: ${topic}` : ''}
Máximo 2200 caracteres. Sin hashtags.`;
  }
}
