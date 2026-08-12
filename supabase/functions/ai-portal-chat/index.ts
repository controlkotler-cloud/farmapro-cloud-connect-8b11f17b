import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const PAID_ROLES = ['plus', 'equipo', 'premium', 'profesional', 'admin'];
const TRIAL_DAYS = 30;
const DAILY_LIMIT = 100;

const KNOWLEDGE = `QUÉ ES farmapro
farmapro es el portal de formación, recursos y comunidad para profesionales de farmacia de
Mkpro Kotler SL (Zaragoza). Se escribe siempre en minúsculas. Va dirigido a profesionales de
farmacia, nunca al público final.

PLANES Y PRECIOS
- Gratis (0 €, 1 persona): hasta 2 cursos y 3 recursos, leer la comunidad, 2 textos y 1 imagen
  con IAFarma, ver los eventos del sector. A los 30 días se ve todo el catálogo pero queda
  bloqueado: solo lectura.
- Plus (1 persona): 19,90 €/mes de precio fundador (precio normal 39 €/mes) o 199 €/año.
  Todo el contenido sin límite, comunidad completa con retos y ranking, IAFarma texto
  ilimitado, 1 crédito de imagen al mes, eventos exclusivos de farmapro.
- Equipo (hasta 10 personas): 49 €/mes de precio fundador (precio normal 79 €/mes) o 490 €/año.
  Todo lo de Plus para toda la farmacia con una sola cuota y gestión de plazas.
- El precio fundador se mantiene de por vida para las 100 primeras plazas. El plan anual sale
  como dos meses gratis.
- Packs de créditos de imagen IAFarma (pago único sobre cualquier plan de pago): 20 por 4,99 €,
  50 por 9,99 €, 100 por 16,99 €.

CÓMO SE HACEN LAS COSAS
- Contratar o cambiar de plan: página Precios.
- Ver facturas, cambiar la tarjeta o dar de baja la suscripción: Perfil → Facturación, botón
  del portal de cliente de Stripe. La baja surte efecto al final del periodo ya pagado.
- Invitar a alguien del equipo (solo plan Equipo, lo hace el titular): Mi farmacia, a la que
  también se llega desde Perfil → Plan, botón "Gestionar mi equipo". Llega un email de
  invitación; al aceptarlo, esa persona pasa a plan Equipo.
- Cambiar la contraseña: Perfil → Seguridad. Si no puedes entrar, "¿Olvidaste tu contraseña?"
  en la pantalla de acceso.
- IAFarma (asistente creativo): textos ilimitados en los planes de pago; las imágenes gastan
  créditos.

LA REBOTICA
Es la campaña quincenal de sorteos del portal: eliges un cajón y lo abres para ver qué te toca.
Arranca el jueves 10 de septiembre de 2026. Las bases legales están en /rebotica/bases-legales.
No inventes premios: si te preguntan cuáles hay, remite a las bases legales.

SOPORTE
- Dudas, incidencias y problemas de pago: soporte@farmapro.es
- Datos personales y derechos RGPD: entra@farmapro.es
- Página de contacto dentro del portal: /contacto-soporte`;

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

    const safeMessages = messages.filter(
      (m: any) => m && (m.role === 'user' || m.role === 'assistant') && typeof m.content === 'string'
    );
    if (!safeMessages.length) return json({ error: 'Mensajes inválidos' }, 400);

    const authHeader = req.headers.get('Authorization');
    if (!authHeader) return json({ error: 'No autorizado' }, 401);

    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
    const supabaseClient = createClient(
      supabaseUrl,
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } }
    );

    const token = authHeader.replace('Bearer ', '');
    const { data: { user } } = await supabaseClient.auth.getUser(token);
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
    const systemPrompt = `Eres el asistente de soporte de farmapro, un portal para profesionales de farmacia.

INFORMACIÓN FIJA DE farmapro:
${KNOWLEDGE}

DATOS ACTUALES DEL PORTAL:
${context}

INSTRUCCIONES:
- Castellano de España, tratando de "tú". Tono profesional y cercano, respuestas breves.
- farmapro SIEMPRE en minúsculas. Sin emojis.
- NUNCA inventes precios, plazos, condiciones, premios ni funciones. Si algo no está en esta
  información ni en los datos del portal, dilo con claridad y remite a soporte@farmapro.es.
- No des consejo sanitario ni prometas resultados de salud.
- No hables de asuntos ajenos al portal.
- Cuando el usuario tenga plan Gratis y pregunte por contenido de pago, explícale qué incluye
  Plus y remítele a la página de Precios, sin presionar.
- Formato: texto conversacional. Puedes usar negritas y listas sencillas; no uses encabezados
  (#), tablas ni bloques de código.`;


    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-3.6-flash',
        messages: [{ role: 'system', content: systemPrompt }, ...safeMessages],
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
    const { count: coursesTotal } = await supabase
      .from('courses').select('*', { count: 'exact', head: true });

    const { data: courses } = await supabase
      .from('courses')
      .select('title, category, is_premium, total_lessons')
      .gt('total_lessons', 0)
      .order('is_featured', { ascending: false })
      .order('title', { ascending: true })
      .limit(20);

    context += `\nCURSOS PUBLICADOS EN TOTAL: ${coursesTotal ?? 0}\n`;
    if (courses?.length) {
      context += `MUESTRA DE CURSOS (${courses.length} de ${coursesTotal ?? 0}):\n`;
      courses.forEach((c: any) => {
        context += `- ${c.title} (${c.category})${c.is_premium ? ' [PLUS/EQUIPO]' : ' [incluido en Gratis]'}\n`;
      });
      context += `Si preguntan por un curso que no está en esta muestra, di que el catálogo completo está en la sección Formación.\n`;
    }

    const { count: resourcesCount } = await supabase
      .from('resources').select('*', { count: 'exact', head: true });
    context += `\nRECURSOS DESCARGABLES: ${resourcesCount || 0}\n`;

    const { data: events } = await supabase
      .from('events')
      .select('title, event_type, start_date')
      .eq('is_published', true)
      .gte('start_date', new Date().toISOString())
      .order('start_date', { ascending: true })
      .limit(5);
    if (events?.length) {
      context += `\nPRÓXIMOS EVENTOS:\n`;
      events.forEach((e: any) => {
        const f = new Date(e.start_date).toLocaleDateString('es-ES',
          { day: 'numeric', month: 'long', year: 'numeric' });
        context += `- ${e.title} (${e.event_type}) — ${f}\n`;
      });
    }

    const hoy = new Date().toISOString().slice(0, 10);
    const { count: jobsCount } = await supabase
      .from('job_listings_public').select('*', { count: 'exact', head: true })
      .eq('is_active', true).or(`expires_at.is.null,expires_at.gte.${hoy}`);
    context += `\nOFERTAS DE EMPLEO ACTIVAS: ${jobsCount || 0}\n`;

    const { count: promotionsCount } = await supabase
      .from('promotions').select('*', { count: 'exact', head: true }).eq('is_active', true);
    context += `PROMOCIONES ACTIVAS: ${promotionsCount || 0}\n`;
    context += `PLAN DEL USUARIO: ${userRole || 'gratis'}\n`;
  } catch (error) {
    console.error('Error building context:', error);
  }
  return context;
}
