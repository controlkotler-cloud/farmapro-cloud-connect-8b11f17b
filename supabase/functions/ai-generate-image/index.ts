import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const PAID_ROLES = ['plus', 'equipo', 'premium', 'profesional', 'admin'];
const TRIAL_DAYS = 30;
const IMAGES_PER_MONTH = 1;
const BUCKET = 'iafarma-images';

// Modelo de generación. Cambia a 'openai/gpt-image-2' para alternar.
const IMAGE_MODEL = 'google/gemini-3.1-flash-image';

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

function sanitizeHeadline(raw: unknown): string | null {
  if (typeof raw !== 'string') return null;
  const trimmed = raw.trim();
  if (!trimmed) return null;
  return trimmed.slice(0, 60);
}

function pieceGuidance(pieceType: string | null): string {
  switch (pieceType) {
    case 'promo':
      return 'Format: promotional pack shot for a product line, generous headline area at the top, product-forward composition, retail marketing look.';
    case 'cartel':
      return 'Format: in-store service poster (vertical A3-like framing), calm iconic composition, clear focal area for a headline.';
    case 'story':
      return 'Format: vertical 9:16 Instagram/story frame, mobile-first, headline zone at the top third, one clear focal subject.';
    case 'post':
    default:
      return 'Format: square social media post, balanced composition with headroom for a headline.';
  }
}

// Modelo de texto para generar el copy (mismo que ai-creative-assistant).
const COPY_MODEL = 'google/gemini-3-flash-preview';

type PieceCopy = { headline: string; lines: string[] };

function stripJsonFences(raw: string): string {
  let s = raw.trim();
  if (s.startsWith('```')) {
    s = s.replace(/^```(?:json)?\s*/i, '').replace(/```\s*$/i, '').trim();
  }
  const first = s.indexOf('{');
  const last = s.lastIndexOf('}');
  if (first >= 0 && last > first) s = s.slice(first, last + 1);
  return s;
}

function normalizeCopy(parsed: unknown, forcedHeadline: string | null): PieceCopy | null {
  if (!parsed || typeof parsed !== 'object') return null;
  const p = parsed as Record<string, unknown>;
  const headline = forcedHeadline
    ?? (typeof p.headline === 'string' ? p.headline.trim().slice(0, 60) : '');
  const linesRaw = Array.isArray(p.lines) ? p.lines : [];
  const lines = linesRaw
    .filter((l): l is string => typeof l === 'string')
    .map((l) => l.trim())
    .filter(Boolean)
    .slice(0, 5);
  if (!headline) return null;
  return { headline, lines };
}

async function generateCopy(
  lovableKey: string,
  brief: string,
  pieceType: string,
  forcedHeadline: string | null,
): Promise<PieceCopy | null> {
  const systemPrompt =
    'Eres redactor publicitario de una farmacia comunitaria en España. Escribes copy corto para piezas de marketing (posts, carteles, stories, promos). ' +
    'Reglas OBLIGATORIAS: castellano de España, ortografía y tildes perfectas, sin emojis, sin nombres de medicamentos ni marcas concretas, ' +
    'sin promesas de salud, curación, adelgazamiento ni afirmaciones sanitarias (código deontológico farmacéutico), tono cercano y profesional. ' +
    'Devuelves SOLO un objeto JSON válido con esta forma exacta: {"headline": string, "lines": string[]}. ' +
    'headline: gancho comercial máximo 8 palabras. ' +
    'lines: entre 3 y 5 elementos, cada uno máximo 6 palabras, útiles y concretos (consejos, argumentos o pasos según el tipo de pieza). ' +
    'Nada de texto adicional fuera del JSON, sin markdown.';

  const userPrompt = forcedHeadline
    ? `Tipo de pieza: ${pieceType}. Tema: ${brief}. El headline ya está decidido: "${forcedHeadline}". Genera SOLO las lines (3-5), coherentes con ese headline. Devuelve el JSON con ese mismo headline y las lines.`
    : `Tipo de pieza: ${pieceType}. Tema: ${brief}. Genera headline y lines siguiendo las reglas.`;

  const call = async () => {
    const res = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${lovableKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: COPY_MODEL,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
        response_format: { type: 'json_object' },
      }),
    });
    if (!res.ok) {
      console.error('Copy gen HTTP error:', res.status, await res.text().catch(() => ''));
      return null;
    }
    const data = await res.json();
    const content: string = data?.choices?.[0]?.message?.content ?? '';
    if (!content) return null;
    try {
      return normalizeCopy(JSON.parse(stripJsonFences(content)), forcedHeadline);
    } catch (e) {
      console.error('Copy parse error:', e, 'content:', content.slice(0, 400));
      return null;
    }
  };

  const first = await call();
  if (first) return first;
  const retry = await call();
  if (retry) return retry;
  // Fallback: solo headline (si venía forzado o si el brief se puede usar como titular corto).
  if (forcedHeadline) return { headline: forcedHeadline, lines: [] };
  return null;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) return json({ error: 'No autorizado' }, 401);
    const token = authHeader.replace('Bearer ', '');

    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
    const admin = createClient(supabaseUrl, serviceKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });

    const { data: { user }, error: authError } = await admin.auth.getUser(token);
    if (authError || !user) return json({ error: 'Sesión inválida' }, 401);

    const userClient = createClient(supabaseUrl, Deno.env.get('SUPABASE_ANON_KEY') ?? '', {
      global: { headers: { Authorization: authHeader } },
      auth: { persistSession: false, autoRefreshToken: false },
    });

    // Estado de acceso
    const { data: profile, error: profileError } = await admin
      .from('profiles')
      .select('subscription_role, created_at')
      .eq('id', user.id)
      .single();
    if (profileError || !profile) return json({ error: 'Perfil no encontrado' }, 500);

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
      return json({ error: 'Tu periodo de prueba ha terminado. Hazte Plus para seguir generando imágenes.' }, 403);
    }

    const body = await req.json().catch(() => ({}));
    const { prompt, size = '1024x1024', style = 'vivid' } = body ?? {};
    const headline = sanitizeHeadline(body?.headline);
    const pieceType = ['promo', 'cartel', 'post', 'story'].includes(body?.pieceType) ? body.pieceType : 'post';
    const briefRaw = typeof body?.brief === 'string' ? body.brief.trim() : '';
    const brief = briefRaw ? briefRaw.slice(0, 200) : '';

    if (!prompt || typeof prompt !== 'string' || !prompt.trim()) {
      return json({ error: 'Prompt requerido' }, 400);
    }
    if (prompt.length > 1000) {
      return json({ error: 'Prompt demasiado largo (máx. 1000 caracteres)' }, 400);
    }

    // Consumir crédito atómico
    const { data: remainingData, error: creditError } = await userClient.rpc('consume_image_credit', {
      p_limit: IMAGES_PER_MONTH,
    });
    if (creditError) {
      const msg = (creditError.message || '').toLowerCase();
      if (msg.includes('quota')) {
        return json({ error: 'Has alcanzado el límite mensual de imágenes IAFarma.' }, 402);
      }
      console.error('consume_image_credit error:', creditError);
      return json({ error: 'No se pudo verificar la cuota' }, 500);
    }
    const remaining = Number(remainingData ?? 0);

    const lovableKey = Deno.env.get('LOVABLE_API_KEY');
    if (!lovableKey) {
      await refundCredit(admin, user.id);
      return json({ error: 'LOVABLE_API_KEY no configurada' }, 500);
    }

    // Prompt de marketing retail de farmacia + guardrails.
    const guardrails =
      'Guardrails: no real medication packaging or medical brand logos; ' +
      'no health claims or therapeutic promises; no recognizable people or faces. ' +
      'Generic product categories are fine (sun care, skincare/dermocosmetics, vitamins, baby care, oral care).';

    const headlineBlock = headline
      ? ` The image MUST include this exact headline, rendered legibly and spelled EXACTLY as written, ` +
        `as the main typographic title in the composition: "${headline}". ` +
        `Do not paraphrase, translate, autocorrect or truncate it. Elegant, editorial sans-serif type; high contrast; no other text.`
      : ' Do not include any text or typography in the image.';

    const enhancedPrompt =
      `Marketing image for a Spanish retail pharmacy (parafarmacia): ${prompt}. ` +
      `Commercial, bright, professional aesthetic; clean composition with space for a headline; ` +
      `suitable for social media or in-store poster. ${pieceGuidance(pieceType)} ` +
      `Style hint: ${style}. Target size: ${size}.` +
      `${headlineBlock} ${guardrails}`;

    // Routing por familia de modelo:
    //  - openai/gpt-image-* -> /v1/images/generations (payload OpenAI-style, b64_json)
    //  - google/gemini-*-image -> /v1/chat/completions con modalities=['image','text']
    const isGemini = IMAGE_MODEL.startsWith('google/');
    let endpoint: string;
    let requestBody: Record<string, unknown>;
    if (isGemini) {
      endpoint = 'https://ai.gateway.lovable.dev/v1/chat/completions';
      requestBody = {
        model: IMAGE_MODEL,
        messages: [{ role: 'user', content: enhancedPrompt }],
        modalities: ['image', 'text'],
      };
    } else {
      endpoint = 'https://ai.gateway.lovable.dev/v1/images/generations';
      requestBody = {
        model: IMAGE_MODEL,
        prompt: enhancedPrompt,
        n: 1,
        size,
        quality: 'low',
      };
    }

    const aiRes = await fetch(endpoint, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${lovableKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    });

    if (!aiRes.ok) {
      const errText = await aiRes.text();
      console.error('Lovable AI image error:', aiRes.status, errText);
      await refundCredit(admin, user.id);
      if (aiRes.status === 429) return json({ error: 'Demasiadas solicitudes. Inténtalo en unos minutos.' }, 429);
      if (aiRes.status === 402) return json({ error: 'Créditos de IA agotados.' }, 402);
      return json({ error: 'No se pudo generar la imagen' }, 502);
    }

    const aiData = await aiRes.json();

    // Extraer imagen b64. Formatos posibles:
    //  A) OpenAI images: aiData.data[0].b64_json
    //  B) Gemini chat: aiData.choices[0].message.images[0].image_url.url (data URL)
    let b64: string | undefined;
    let revisedPrompt: string | undefined;

    if (aiData?.data?.[0]?.b64_json) {
      b64 = aiData.data[0].b64_json;
      revisedPrompt = aiData.data[0].revised_prompt ?? undefined;
    } else {
      const imgs = aiData?.choices?.[0]?.message?.images;
      const url: string | undefined = imgs?.[0]?.image_url?.url ?? imgs?.[0]?.url;
      if (url && url.startsWith('data:image/')) {
        b64 = url.split(',')[1];
      } else if (aiData?.choices?.[0]?.message?.content) {
        const content = aiData.choices[0].message.content;
        if (typeof content === 'string' && content.startsWith('data:image/')) {
          b64 = content.split(',')[1];
        }
      }
      revisedPrompt = aiData?.choices?.[0]?.message?.content_text ?? undefined;
    }

    if (!b64) {
      console.error('Empty image payload:', JSON.stringify(aiData).slice(0, 800));
      await refundCredit(admin, user.id);
      return json({ error: 'Respuesta de imagen vacía' }, 502);
    }

    const binary = atob(b64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);

    const fileId = crypto.randomUUID();
    const path = `${user.id}/${fileId}.png`;

    const { error: uploadError } = await admin.storage.from(BUCKET).upload(path, bytes, {
      contentType: 'image/png',
      upsert: false,
    });
    if (uploadError) {
      console.error('Upload error:', uploadError);
      await refundCredit(admin, user.id);
      return json({ error: 'No se pudo guardar la imagen' }, 500);
    }

    const { data: signed, error: signError } = await admin.storage
      .from(BUCKET)
      .createSignedUrl(path, 60 * 60 * 24 * 365 * 10);
    if (signError || !signed?.signedUrl) {
      console.error('Sign URL error:', signError);
      await refundCredit(admin, user.id);
      return json({ error: 'No se pudo generar la URL de la imagen' }, 500);
    }
    const imageUrl = signed.signedUrl;

    await admin.from('generated_images').insert({
      user_id: user.id,
      prompt,
      revised_prompt: revisedPrompt ?? null,
      storage_path: path,
      image_url: imageUrl,
    });

    return json({ imageUrl, revisedPrompt, remaining });
  } catch (error) {
    console.error('Error in ai-generate-image:', error);
    return json({ error: (error as Error).message ?? 'Error interno' }, 500);
  }
});

async function refundCredit(admin: ReturnType<typeof createClient>, userId: string) {
  try {
    const period = new Date().toISOString().slice(0, 7);
    const { data } = await admin
      .from('ai_image_usage')
      .select('used')
      .eq('user_id', userId)
      .eq('period', period)
      .maybeSingle();
    if (data && typeof data.used === 'number' && data.used > 0) {
      await admin
        .from('ai_image_usage')
        .update({ used: data.used - 1, updated_at: new Date().toISOString() })
        .eq('user_id', userId)
        .eq('period', period);
    }
  } catch (e) {
    console.error('Refund failed:', e);
  }
}
