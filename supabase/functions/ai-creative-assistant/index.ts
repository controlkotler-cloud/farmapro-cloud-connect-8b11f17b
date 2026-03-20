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

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return new Response(JSON.stringify({ error: 'Mensajes inválidos' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'No autorizado' }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const token = authHeader.replace('Bearer ', '');

    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      { auth: { persistSession: false, autoRefreshToken: false } }
    );

    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);
    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Usuario no autenticado' }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const { data: profile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('subscription_role, subscription_status, full_name, pharmacy_name, pharmacy_city, position')
      .eq('id', user.id)
      .single();

    if (profileError || !profile) {
      return new Response(JSON.stringify({ error: 'Error al verificar el perfil' }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const allowedRoles = ['premium', 'profesional', 'admin'];
    if (!allowedRoles.includes(profile.subscription_role) || profile.subscription_status !== 'active') {
      return new Response(JSON.stringify({ error: 'No tienes acceso. Necesitas un plan Premium, Profesional o Admin activo.' }), { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      return new Response(JSON.stringify({ error: 'Configuración del servidor incompleta' }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const systemPrompt = getSystemPrompt(contentType || 'instagram-post', profile);

    const aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [{ role: 'system', content: systemPrompt }, ...messages],
        stream: true,
      }),
    });

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      console.error('AI error:', aiResponse.status, errorText);
      if (aiResponse.status === 429) return new Response(JSON.stringify({ error: 'Límite excedido. Intenta en unos momentos.' }), { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      if (aiResponse.status === 402) return new Response(JSON.stringify({ error: 'Créditos insuficientes.' }), { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      return new Response(JSON.stringify({ error: 'Error al comunicarse con el servicio de IA' }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    return new Response(aiResponse.body, {
      headers: { ...corsHeaders, 'Content-Type': 'text/event-stream', 'Cache-Control': 'no-cache', 'Connection': 'keep-alive' },
    });
  } catch (error) {
    console.error('Error:', error);
    return new Response(JSON.stringify({ error: error.message || 'Error interno' }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }
});

function getSystemPrompt(contentType: string, profile: any) {
  const userName = profile?.full_name || 'profesional';
  const pharmacyName = profile?.pharmacy_name || 'tu farmacia';
  const city = profile?.pharmacy_city || '';
  const position = profile?.position || 'profesional';

  const base = `Eres un asistente experto en marketing farmacéutico y creación de contenido para farmacias españolas. Usuario: ${userName} (${position} en ${pharmacyName}${city ? `, ${city}` : ''}).

REGLAS GENERALES:
- Responde en texto plano, sin markdown (sin asteriscos, almohadillas ni formato especial)
- El contenido debe poder copiarse y pegarse directamente
- Cumple siempre la normativa farmacéutica española
- Usa saltos de línea para separar secciones
- Para énfasis usa MAYÚSCULAS
- Integra el nombre de la farmacia y la localidad de forma natural
`;

  switch (contentType) {
    case 'instagram-post':
      return `${base}
Crea un post de Instagram para farmacia:
- Copy optimizado (máx 2200 caracteres)
- Incluye emojis relevantes pero sin excederte
- Call to action claro
- Sugiere 5-8 hashtags relevantes al final
- Sugiere brevemente qué tipo de imagen acompañaría el post`;

    case 'reel-script':
      return `${base}
Crea un guión de Reel para Instagram con esta estructura:

GANCHO (primeros 3 segundos - lo más importante para captar atención)
[Texto del gancho + indicación de lo que se ve en pantalla]

DESARROLLO (cuerpo del reel)
[Contenido paso a paso con indicaciones de lo que aparece en pantalla]

CIERRE (call to action final)
[CTA + texto en pantalla sugerido]

Incluye al final sugerencias de: audio/música, textos overlay, y hashtags`;

    case 'carousel':
      return `${base}
Crea contenido para un carrusel de Instagram. Estructura el contenido slide por slide:

Slide 1: Portada llamativa (título que enganche)
Slide 2-N: Contenido (un concepto por slide, texto conciso)
Último slide: Call to action + branding

Para cada slide indica:
- Texto principal (grande, legible)
- Texto secundario si aplica
- Sugerencia visual breve`;

    case 'google-business':
      return `${base}
Crea una publicación para Google Business Profile:
- Máximo 1500 caracteres
- Tono profesional y local
- Incluye keywords relevantes para SEO local
- Call to action claro (Llamar, Visitar web, Pedir cita...)
- Optimizado para búsquedas locales (menciona la ciudad/zona)`;

    case 'blog':
      return `${base}
Crea un artículo para el blog de la web de la farmacia:
- Título SEO atractivo
- Introducción que enganche
- Desarrollo estructurado con subtítulos
- Datos y consejos prácticos
- Conclusión con call to action
- Integra las palabras clave de forma natural para SEO
- Tono profesional pero accesible`;

    case 'promotion':
      return `${base}
Crea copy promocional para farmacia:
- Mensaje directo y claro
- Destaca el beneficio principal
- Genera urgencia si hay fecha límite
- Call to action potente
- IMPORTANTE: Cumple la normativa farmacéutica (no prometer curas, no exagerar beneficios)
- Adapta el formato al canal indicado`;

    case 'whatsapp':
      return `${base}
Crea un mensaje de WhatsApp para enviar a clientes de la farmacia:
- Breve y directo (máx 500 caracteres)
- Tono cercano y personal
- Incluye emoji relevante pero sin excederte (1-3 máximo)
- Call to action claro
- No debe parecer spam
- Cumple normativa de protección de datos (no incluir datos sensibles)`;

    default:
      return `${base}
Crea contenido profesional según las necesidades del usuario.`;
  }
}
