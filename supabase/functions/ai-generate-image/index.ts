import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Mantener sincronizado con src/lib/plans.ts
const PAID_ROLES = ['plus', 'equipo', 'premium', 'profesional', 'admin'];
const TRIAL_DAYS = 30;
const IMAGES_PER_MONTH = 1;
const BUCKET = 'iafarma-images';

// Modelo de generación de imagen. Cambia a 'openai/gpt-image-2' si lo prefieres.
const IMAGE_MODEL = 'google/gemini-3.1-flash-image';
// const IMAGE_MODEL = 'openai/gpt-image-2';

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
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

    // Estado de acceso (getAccessState)
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

    // Reglas farma + prompt
    const enhancedPrompt =
      `Professional pharmaceutical/medical context: ${prompt}. ` +
      `Style: Clean, modern, trustworthy (${style}). Suitable for healthcare communication. ` +
      `Target size: ${size}. ` +
      `Strict rules: no embedded text or typography, no brand logos, no real medication boxes or trademarked packaging.`;

    // Construir body según familia de modelo
    const isGemini = IMAGE_MODEL.startsWith('google/');
    const requestBody: Record<string, unknown> = isGemini
      ? {
          model: IMAGE_MODEL,
          messages: [{ role: 'user', content: enhancedPrompt }],
          modalities: ['image', 'text'],
        }
      : {
          model: IMAGE_MODEL,
          prompt: enhancedPrompt,
          n: 1,
          size,
          quality: 'low',
        };

    const aiRes = await fetch('https://ai.gateway.lovable.dev/v1/images/generations', {
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
      if (aiRes.status === 429) {
        return json({ error: 'Demasiadas solicitudes. Inténtalo de nuevo en unos minutos.' }, 429);
      }
      if (aiRes.status === 402) {
        return json({ error: 'Créditos de IA agotados en el espacio de trabajo.' }, 402);
      }
      return json({ error: 'No se pudo generar la imagen' }, 502);
    }

    const aiData = await aiRes.json();
    const b64: string | undefined = aiData?.data?.[0]?.b64_json;
    const revisedPrompt: string | undefined =
      aiData?.data?.[0]?.revised_prompt ?? undefined;

    if (!b64) {
      console.error('Empty image payload:', JSON.stringify(aiData).slice(0, 500));
      await refundCredit(admin, user.id);
      return json({ error: 'Respuesta de imagen vacía' }, 502);
    }

    // Decodificar base64 -> bytes
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
