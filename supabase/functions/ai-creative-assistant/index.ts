import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from 'jsr:@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
  // El cliente lee aquí cuántos textos de prueba le quedan (solo free_trial).
  'Access-Control-Expose-Headers': 'x-iafarma-texts-remaining',
};

// Alineado con src/lib/plans.ts y ai-generate-image.
const PAID_ROLES = ['plus', 'equipo', 'premium', 'profesional', 'admin'];
const TRIAL_DAYS = 30;
const TEXTS_PER_MONTH_TRIAL = 2;

// Techo anti-abuso para planes de pago. El texto es "ilimitado" para un humano
// (nadie genera 300 piezas al mes a mano), pero un script sí: sin tope el coste
// del gateway queda abierto.
//
// 31-08-2026: los números viven ahora en la BD (text_limits_for_role), no aquí.
// Motivo: a 0,012 EUR/texto el tope anterior de 150/día permitía 54 EUR/mes de
// coste por un Plus de 19,90 EUR. Al estar en la BD, ajustar la cuota es un
// CREATE OR REPLACE (gratis) en vez de un redeploy. La bolsa de Equipo es
// compartida por farmacia, igual que la de imagen.
// Este valor solo se usa como red de seguridad si la RPC no está disponible.
const PAID_DAILY_FALLBACK = 30;

// Modelo de texto. ai-portal-chat migró a 3.6-flash el 12-08 (B8); aquí igual.
const TEXT_MODEL = 'google/gemini-3.6-flash';

// Blindaje de entrada (mismo criterio que el fix B6 de ai-portal-chat).
const MAX_MESSAGES = 50;
const MAX_MESSAGE_CHARS = 8000;

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

/** Sanea un campo de texto del contexto: string recortado o cadena vacía. */
function s(value: unknown, max: number): string {
  return typeof value === 'string' ? value.trim().slice(0, max) : '';
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  try {
    const { messages, contentType, context } = await req.json();

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return json({ error: 'Mensajes inválidos' }, 400);
    }
    if (messages.length > MAX_MESSAGES) {
      return json({ error: 'Conversación demasiado larga' }, 400);
    }
    // Solo user/assistant con contenido de texto: nadie inyecta mensajes
    // 'system' por detrás del prompt ni cuela payloads gigantes.
    const safeMessages = messages
      .filter((m: any) => m && (m.role === 'user' || m.role === 'assistant') && typeof m.content === 'string')
      .map((m: any) => ({ role: m.role, content: m.content.slice(0, MAX_MESSAGE_CHARS) }));
    if (!safeMessages.length) return json({ error: 'Mensajes inválidos' }, 400);

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
      .select('subscription_role, created_at, full_name, pharmacy_name, pharmacy_city, iafarma_tone')
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

    // Consumo atómico solo para free_trial. Los planes de pago son ilimitados
    // (con techo diario anti-abuso más abajo).
    let textsRemaining: number | null = null;
    if (access === 'free_trial') {
      const { data: remainingData, error: creditError } = await userClient.rpc('consume_text_credit', {
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
      textsRemaining = Number(remainingData ?? 0);
    } else {
      // Cuota de los planes de pago: la decide la BD (check_text_quota), que
      // cuenta día y mes contra la cuenta de cargo (el titular, si el usuario
      // pertenece a un equipo) y aplica los límites de text_limits_for_role.
      const { data: quota, error: quotaError } = await userClient.rpc('check_text_quota');
      if (quotaError) {
        // La RPC no respondió: no se bloquea al cliente por un fallo nuestro,
        // pero se mantiene una red de seguridad con el conteo diario propio.
        console.error('check_text_quota error:', quotaError);
        const since = new Date();
        since.setHours(0, 0, 0, 0);
        const { count: usedToday } = await admin
          .from('ai_creative_usage')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', user.id)
          .gte('created_at', since.toISOString());
        if ((usedToday ?? 0) >= PAID_DAILY_FALLBACK) {
          return json({ error: 'Has alcanzado el tope de uso de hoy. Inténtalo de nuevo mañana.' }, 429);
        }
      } else if (quota && quota.allowed === false) {
        return json({
          error: quota.reason === 'month'
            ? 'Has alcanzado el tope de uso de este mes. Se renueva el día 1.'
            : 'Has alcanzado el tope de uso de hoy. Inténtalo de nuevo mañana.',
        }, 429);
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
        model: TEXT_MODEL,
        messages: [{ role: 'system', content: systemPrompt }, ...safeMessages],
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

    // Métrica de uso (M1): solo metadatos — usuario, tipo de pieza y fecha.
    // Sirve también de base del techo diario. No se guarda contenido (RGPD).
    const { error: usageError } = await admin
      .from('ai_creative_usage')
      .insert({ user_id: user.id, content_type: String(contentType || 'instagram-post').slice(0, 40) });
    if (usageError) console.error('usage log error:', usageError.message);

    const responseHeaders: Record<string, string> = {
      ...corsHeaders,
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    };
    if (textsRemaining !== null) {
      responseHeaders['x-iafarma-texts-remaining'] = String(textsRemaining);
    }

    return new Response(aiResponse.body, { headers: responseHeaders });
  } catch (error) {
    console.error('Error:', error);
    return json({ error: (error as Error).message || 'Error interno' }, 500);
  }
});

async function refundTextCredit(admin: ReturnType<typeof createClient>, userId: string, access: string) {
  if (access !== 'free_trial') return;
  try {
    // RPC atómica (sustituye al read-then-update de la v1).
    const { error } = await admin.rpc('refund_text_credit', { p_user: userId });
    if (error) console.error('Text refund failed:', error.message);
  } catch (e) {
    console.error('Text refund failed:', e);
  }
}

// =====================================================================
// Prompt v2. La regla de oro: TODO lo que el formulario pide al usuario
// llega al modelo (la v1 recogía 14 campos y usaba 5). Cada tipo de pieza
// define además el contrato de formato exacto que espera ResultsArea
// (SLIDE n / GANCHO-DESARROLLO-CIERRE), para que la UI estructurada
// funcione siempre y no "a veces".
// =====================================================================
function getSystemPrompt(contentType: string, profile: any, context: any) {
  const userName = s(profile?.full_name, 80) || 'profesional';
  const pharmacyName = s(context?.pharmacyName, 80) || s(profile?.pharmacy_name, 80) || 'tu farmacia';
  const location = s(context?.location, 80) || s(profile?.pharmacy_city, 80) || '';
  const topic = s(context?.topic, 300);
  const tone = s(context?.tone, 60) || s(profile?.iafarma_tone, 60) || 'Cercano y profesional';
  const extraInstructions = s(context?.extraInstructions, 1000);

  const baseRules = `
Eres IAFarma, el asistente de contenido con inteligencia artificial de Farmapro. Generas contenido profesional listo para publicar para farmacias comunitarias españolas.

CONTEXTO:
- Farmacia: ${pharmacyName}${location ? ` en ${location}` : ''}
- Usuario: ${userName}
- Fecha actual: ${new Date().toLocaleDateString('es-ES', { month: 'long', year: 'numeric' })}

IDIOMA Y TONO:
- Escribe SIEMPRE en castellano de España (tuteo, léxico peninsular), con ortografía y tildes perfectas.
- Tono de comunicación elegido por la farmacia: ${tone}. Respétalo en todo el texto.

RESTRICCIONES (ligeras, sentido común farmacéutico):
- Evita mencionar medicamentos concretos por su nombre
- Evita dar diagnósticos ("si tienes estos síntomas es que tienes X")
- Evita promesas de salud ("cura", "elimina", "garantiza resultados")
- Puedes hablar con libertad de categorías de producto, consejo general, hábitos saludables, dermocosmética, parafarmacia, servicios de la farmacia e ingredientes cosméticos (retinol, niacinamida, ácido hialurónico...)
- Emojis: sí pero uso reducido y profesional (2-4 por pieza, no más)
- Sin hashtags
`;

  const formatBase = `
FORMATO DE RESPUESTA:
- Responde en texto plano, sin markdown (nada de #, *, guiones de lista de markdown)
- Usa saltos de línea para separar secciones
- Para énfasis usa MAYÚSCULAS puntuales
- No expliques lo que has hecho ni añadas comentarios: devuelve solo la pieza lista para usar
`;

  const imageSuggestion = `- Cierra SIEMPRE con una sección que empiece exactamente por "SUGERENCIA DE IMAGEN:" describiendo en 1-2 frases qué visual acompañaría este contenido
`;

  const contextInfo = extraInstructions ? `\nINSTRUCCIONES ADICIONALES DEL USUARIO (prioridad alta): ${extraInstructions}\n` : '';

  switch (contentType) {
    case 'reel-script': {
      const duration = s(context?.duration, 40) || '30-60 segundos';
      const who = s(context?.who, 60);
      return `${baseRules}${formatBase}${contextInfo}
TAREA: Genera un guión completo para un Reel de Instagram.
${topic ? `Tema: ${topic}` : ''}
Duración objetivo: ${duration}${who ? `\nQuién aparece en el vídeo: ${who} (adapta el guión a ello: si es "Solo texto/producto", todo se resuelve con planos de producto y rótulos, sin nadie hablando a cámara)` : ''}

ESTRUCTURA OBLIGATORIA (usa estas etiquetas literales, en mayúsculas, cada una al inicio de su línea):
GANCHO: los primeros 1-3 segundos, una frase que pare el scroll.
DESARROLLO: el cuerpo del reel, plano a plano, con lo que se dice y lo que se ve.
CIERRE: llamada a la acción final (visita, pregunta, guarda el vídeo...).
Dentro de cada sección incluye una línea "TEXTO EN PANTALLA:" con los rótulos exactos que deben sobreimpresionarse.`;
    }

    case 'carousel': {
      const slides = Number(context?.slides) >= 3 && Number(context?.slides) <= 5 ? Number(context.slides) : 4;
      const style = s(context?.style, 40);
      return `${baseRules}${formatBase}${imageSuggestion}${contextInfo}
TAREA: Genera el contenido completo de un carrusel de Instagram de ${slides} slides.
${topic ? `Tema: ${topic}` : ''}${style ? `\nEstilo del carrusel: ${style} (respétalo: "Paso a paso" numera acciones, "Antes/Después" contrapone situaciones, "Listado" enumera, "Educativo" explica)` : ''}

ESTRUCTURA OBLIGATORIA: exactamente ${slides} bloques, cada uno empezando por "SLIDE 1:", "SLIDE 2:"... en mayúsculas y al inicio de línea.
- SLIDE 1 es la portada: un titular gancho de máximo 8 palabras.
- Cada slide intermedio: un titular corto y 1-2 frases de apoyo.
- El último SLIDE es el cierre con llamada a la acción (guarda, comparte, pásate por la farmacia).
Después de los slides, añade una sección "CAPTION:" con el texto para la descripción de la publicación (2-4 frases + CTA).`;
    }

    case 'google-business': {
      const postType = s(context?.postType, 40);
      return `${baseRules}${formatBase}${imageSuggestion}${contextInfo}
TAREA: Genera una publicación para Google Business Profile.
${topic ? `Mensaje principal: ${topic}` : ''}${postType ? `\nTipo de publicación: ${postType}` : ''}
- Máximo 1500 caracteres.
- Menciona ${location ? `${location}` : 'la localidad de la farmacia'} de forma natural (SEO local).
- Termina con una llamada a la acción clara (ven a vernos, pregúntanos, reserva...).
- Sin emojis o máximo 1: Google Business es un canal más sobrio que Instagram.`;
    }

    case 'blog': {
      const keywords = s(context?.keywords, 200);
      const lengthChoice = s(context?.length, 40);
      const words = lengthChoice.includes('400') ? '400' : lengthChoice.includes('1200') ? '1200' : '800';
      return `${baseRules}${formatBase}${imageSuggestion}${contextInfo}
TAREA: Genera un artículo de blog para la web de la farmacia, pensado para posicionar en Google.
${topic ? `Tema o título orientativo: ${topic}` : ''}
Longitud objetivo: unas ${words} palabras.${keywords ? `\nPalabras clave SEO que deben aparecer de forma natural (en el título si es posible, en algún subtítulo y repartidas por el texto): ${keywords}` : ''}

ESTRUCTURA OBLIGATORIA (en texto plano, sin #):
TÍTULO: un titular atractivo que incluya el tema principal.
A continuación una entradilla de 2-3 frases.
Después 3-5 secciones, cada una con su subtítulo corto EN MAYÚSCULAS en línea propia y 1-3 párrafos debajo.
Cierra con una conclusión breve que invite a pasarse por la farmacia o consultar al farmacéutico.
Y al final una línea "META DESCRIPCIÓN:" con un resumen de máximo 155 caracteres para Google.
- Sin emojis: es un artículo web.`;
    }

    case 'promotion': {
      const product = s(context?.product, 120);
      const discount = s(context?.discount, 120);
      const deadline = s(context?.deadline, 40);
      const channel = s(context?.channel, 40);
      const channelRules = channel === 'WhatsApp'
        ? 'Formato: mensaje corto de WhatsApp (máximo 500 caracteres), directo y personal, máximo 2 emojis.'
        : channel === 'Escaparate'
          ? 'Formato: texto de cartel para escaparate: un TITULAR potente de máximo 8 palabras, 2-3 líneas cortas de apoyo y la condición de la oferta. Sin emojis: se imprime.'
          : channel === 'Todos'
            ? 'Formato: genera TRES versiones separadas, cada una precedida por su encabezado en mayúsculas: "VERSIÓN INSTAGRAM:" (copy de post con CTA), "VERSIÓN WHATSAPP:" (mensaje corto, máximo 500 caracteres, máximo 2 emojis) y "VERSIÓN ESCAPARATE:" (titular de máximo 8 palabras + 2-3 líneas de apoyo, sin emojis).'
            : 'Formato: copy de post de Instagram con gancho inicial, beneficio claro y CTA.';
      return `${baseRules}${formatBase}${imageSuggestion}${contextInfo}
TAREA: Genera el copy promocional de una campaña de la farmacia.
${product ? `Producto o servicio: ${product}` : ''}${discount ? `\nOferta o beneficio (inclúyelo de forma destacada y literal): ${discount}` : ''}${deadline ? `\nFecha límite de la promoción: ${deadline}. Menciónala para crear urgencia ("hasta el...", "solo hasta el...").` : ''}
${channelRules}
- Recuerda: sin promesas de salud; la promoción es de parafarmacia/dermocosmética/servicios.`;
    }

    case 'whatsapp': {
      const messageType = s(context?.messageType, 60);
      return `${baseRules}${contextInfo}
TAREA: Genera un mensaje de WhatsApp para enviar a los clientes de la farmacia.
${topic ? `Mensaje principal: ${topic}` : ''}${messageType ? `\nTipo de mensaje: ${messageType}` : ''}
FORMATO:
- Texto plano listo para copiar y enviar tal cual. NO añadas comentarios, alternativas ni sugerencia de imagen.
- Corto: máximo 500 caracteres. Saludo breve, el mensaje al grano y despedida con el nombre de la farmacia (${pharmacyName}).
- Máximo 2 emojis.
- Si es un recordatorio, deja claro qué debe hacer el cliente (pasar a recoger, confirmar cita...).`;
    }

    case 'responder-resena': {
      const stars = s(context?.reviewStars, 20);
      const reviewTone = s(context?.reviewTone, 20);
      const reviewText = s(context?.reviewText, 1500) || topic;
      const isNegative = reviewTone === 'Negativa' || stars.startsWith('1') || stars.startsWith('2');
      const strategy = isNegative
        ? `ESTRATEGIA (reseña negativa):
- Agradece que se haya tomado el tiempo de escribir y lamenta que su experiencia no fuera buena.
- Empatiza SIN admitir negligencias sanitarias ni entrar a discutir públicamente.
- Ofrece continuar la conversación por un canal privado (usa el que indiquen las instrucciones adicionales; si no hay, invita a pasarse por la farmacia o escribir).
- Sin emojis. Tono sereno y profesional.`
        : reviewTone === 'Positiva' || stars.startsWith('5') || stars.startsWith('4')
          ? `ESTRATEGIA (reseña positiva):
- Agradece con calidez y personaliza la respuesta citando algún detalle concreto de la reseña.
- Invita a volver. Máximo 1 emoji, opcional.`
          : `ESTRATEGIA (reseña neutra o mixta):
- Agradece la valoración, refuerza lo positivo que mencione y aborda brevemente lo mejorable con voluntad de mejora.
- Sin emojis o máximo 1.`;
      return `${baseRules}${contextInfo}
TAREA: Redacta la respuesta pública de la farmacia a esta reseña de Google${stars ? ` (valoración: ${stars})` : ''}.
RESEÑA DEL CLIENTE: "${reviewText}"

${strategy}

FORMATO:
- Devuelve SOLO el texto de la respuesta, breve (2-5 frases), sin markdown, sin sugerencia de imagen.
- Firma al final con el nombre de la farmacia: ${pharmacyName}.`;
    }

    case 'instagram-post':
    default: {
      const objective = s(context?.objective, 60);
      const objectiveRules: Record<string, string> = {
        'Educar': 'Objetivo: EDUCAR. Aporta 3-5 datos o consejos útiles y concretos; posiciona a la farmacia como referente de confianza.',
        'Promocionar servicio': 'Objetivo: PROMOCIONAR UN SERVICIO. Destaca el beneficio para el cliente y cómo pedirlo o reservarlo (CTA clara).',
        'Mostrar equipo': 'Objetivo: MOSTRAR AL EQUIPO. Tono humano y cercano, presenta a las personas detrás del mostrador.',
        'Engagement': 'Objetivo: ENGAGEMENT. Termina con una pregunta directa que invite a responder en comentarios.',
      };
      return `${baseRules}${formatBase}${imageSuggestion}${contextInfo}
TAREA: Genera un post para Instagram (feed).
${topic ? `Tema: ${topic}` : ''}
${objective && objectiveRules[objective] ? objectiveRules[objective] : ''}
- La primera línea es el gancho: máximo 125 caracteres (es lo que se ve antes del "ver más").
- Máximo 2200 caracteres en total. Sin hashtags.
- Cierra con una llamada a la acción coherente con el objetivo.`;
    }
  }
}
