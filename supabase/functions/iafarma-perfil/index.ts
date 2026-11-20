// IAFarma · alta guiada (20-11-2026).
// Busca en la web y el Instagram de la farmacia su logo, colores, nombre
// comercial, tono, servicios y marcas, y devuelve una PROPUESTA que la
// farmacia edita o valida en el portal. No guarda nada en su perfil: eso lo
// hace el cliente al pulsar «Está bien así».
//
// POST { nombre, localidad, web?, instagram? } -> RespuestaPerfil
// Límite: 3 búsquedas por usuario cada 24 h (tabla iafarma_perfil_busquedas).
// Instagram solo si existen los secrets IG_GRAPH_TOKEN e IG_BUSINESS_ID.
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { comprobarUrl } from '../_shared/iafarmaPerfil/urlSegura.ts';
import { coloresDeCss, extraerDeHtml, RESERVADAS_IG } from '../_shared/iafarmaPerfil/extraerWeb.ts';
import { filtrarConCita, quitarVetadas } from '../_shared/iafarmaPerfil/citas.ts';
import type { Dato, Fuente, PropuestaPerfil, RespuestaPerfil } from '../_shared/iafarmaPerfil/tipos.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

const LIMITE_DIARIO = 3;
const MSG_LIMITE = 'Ya has hecho 3 búsquedas hoy. Puedes rellenar tu ficha a mano o volver mañana.';
const TIEMPO_FUENTE_MS = 8_000;
const TIEMPO_MODELO_MS = 20_000;
const TIEMPO_TOTAL_MS = 40_000;
const MAX_HTML = 1_500_000;
const MAX_CSS = 1_500_000;
const MAX_LOGO = 2_000_000;
const MAX_SALTOS = 3;
const MAX_ITEMS = 8;
const BUCKET_LOGOS = 'iafarma-logos';
const TEXT_MODEL = 'google/gemini-3.6-flash';
// Estimación por búsqueda (una llamada de texto a Gemini Flash). Solo para
// vigilar el gasto; la factura real es la del gateway.
const COSTE_MODELO = 0.002;
// Los mismos valores que el selector de PharmacyDefaults.tsx.
const TONOS = ['Cercano y profesional', 'Divertido', 'Serio/científico'];
const UA = 'Mozilla/5.0 (compatible; IAFarma/1.0; +https://portal.farmapro.es)';

// ------------------------------------------------------------- red segura

async function resolver(host: string): Promise<string[]> {
  const res = await Promise.allSettled([
    Deno.resolveDns(host, 'A'),
    Deno.resolveDns(host, 'AAAA'),
  ]);
  const ips = res.flatMap((r) => (r.status === 'fulfilled' ? r.value : []));
  if (ips.length === 0 && res.every((r) => r.status === 'rejected')) throw new Error('dns');
  return ips;
}

/** Une un límite propio con el de toda la búsqueda. */
function señal(total: AbortSignal, ms: number): AbortSignal {
  const propia = AbortSignal.timeout(ms);
  const any = (AbortSignal as unknown as { any?: (s: AbortSignal[]) => AbortSignal }).any;
  return any ? any([total, propia]) : propia;
}

type Descarga = { url: string; tipo: string; bytes: Uint8Array; cortada: boolean };

/**
 * Descarga una URL pública comprobando cada salto (SSRF) con redirect manual.
 * `cortar`: si el cuerpo pasa de `max`, se queda con los primeros bytes (HTML,
 * CSS); si no, se descarta (logo).
 */
async function descargar(
  url: string,
  opts: { max: number; cortar: boolean; signal: AbortSignal; accept: string },
): Promise<{ ok: true; d: Descarga } | { ok: false; motivo: string }> {
  let actual = url;
  for (let salto = 0; salto <= MAX_SALTOS; salto++) {
    const check = await comprobarUrl(actual, resolver);
    if (!check.ok) return { ok: false, motivo: check.motivo };
    const res = await fetch(check.url.href, {
      redirect: 'manual',
      signal: opts.signal,
      headers: { 'User-Agent': UA, Accept: opts.accept },
    });
    if (res.status >= 300 && res.status < 400) {
      const loc = res.headers.get('location');
      await res.body?.cancel();
      if (!loc) return { ok: false, motivo: 'Redirección sin destino' };
      actual = new URL(loc, check.url).href;
      continue;
    }
    if (!res.ok) {
      await res.body?.cancel();
      return { ok: false, motivo: `Respuesta ${res.status}` };
    }
    const tipo = (res.headers.get('content-type') ?? '').toLowerCase();
    const largo = Number(res.headers.get('content-length') ?? '0');
    if (!opts.cortar && largo > opts.max) {
      await res.body?.cancel();
      return { ok: false, motivo: 'Archivo demasiado grande' };
    }
    const partes: Uint8Array[] = [];
    let total = 0;
    let cortada = false;
    const reader = res.body?.getReader();
    if (reader) {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        if (total + value.length > opts.max) {
          if (!opts.cortar) {
            await reader.cancel();
            return { ok: false, motivo: 'Archivo demasiado grande' };
          }
          partes.push(value.slice(0, opts.max - total));
          total = opts.max;
          cortada = true;
          await reader.cancel();
          break;
        }
        partes.push(value);
        total += value.length;
      }
    }
    const bytes = new Uint8Array(total);
    let o = 0;
    for (const p of partes) { bytes.set(p, o); o += p.length; }
    return { ok: true, d: { url: check.url.href, tipo, bytes, cortada } };
  }
  return { ok: false, motivo: 'Demasiadas redirecciones' };
}

function aTexto(d: Descarga): string {
  const charset = /charset=([\w-]+)/i.exec(d.tipo)?.[1];
  try {
    return new TextDecoder(charset || 'utf-8').decode(d.bytes);
  } catch {
    return new TextDecoder('utf-8').decode(d.bytes);
  }
}

const sinWww = (h: string) => h.toLowerCase().replace(/^www\./, '');

function normalizarWeb(web: string): string {
  const w = web.trim();
  return /^https?:\/\//i.test(w) ? w : `https://${w}`;
}

function normalizarInstagram(ig: string): string | null {
  const s = ig.trim().replace(/^@/, '');
  const m = /instagram\.com\/([A-Za-z0-9._]+)/i.exec(s);
  const u = (m ? m[1] : s).toLowerCase().replace(/\/+$/, '').replace(/\.+$/, '');
  return /^[a-z0-9._]{1,30}$/.test(u) && !RESERVADAS_IG.has(u) ? u : null;
}

// ------------------------------------------------------------------ fuentes

type ResultadoWeb = {
  url: string;
  texto: string;
  logos: string[];
  colores: string[];
  instagram: string | null;
};

async function leerWeb(web: string, total: AbortSignal): Promise<ResultadoWeb> {
  const r = await descargar(normalizarWeb(web), {
    max: MAX_HTML, cortar: true, signal: señal(total, TIEMPO_FUENTE_MS),
    accept: 'text/html,application/xhtml+xml',
  });
  if (!r.ok) throw new Error(r.motivo);
  if (r.d.tipo && !/html|xml|text\/plain/.test(r.d.tipo)) throw new Error('No es una página web');
  const html = aTexto(r.d);
  const ext = extraerDeHtml(html, r.d.url);

  // Colores de la primera hoja CSS del propio sitio (no de CDNs ajenos).
  let delCss: string[] = [];
  if (ext.hojaCss && sinWww(new URL(ext.hojaCss).host) === sinWww(new URL(r.d.url).host)) {
    try {
      const css = await descargar(ext.hojaCss, {
        max: MAX_CSS, cortar: true, signal: señal(total, TIEMPO_FUENTE_MS), accept: 'text/css',
      });
      if (css.ok) delCss = coloresDeCss(aTexto(css.d));
    } catch (e) {
      console.warn('css:', (e as Error).message);
    }
  }
  const colores = [...new Set([...ext.colores, ...delCss])].slice(0, 6);
  return { url: r.d.url, texto: ext.texto, logos: ext.logos, colores, instagram: ext.instagram };
}

type ResultadoIg = { usuario: string; texto: string; foto: string | null };

class ErrorIg extends Error {}

async function leerInstagram(usuario: string, total: AbortSignal): Promise<ResultadoIg> {
  const token = Deno.env.get('IG_GRAPH_TOKEN');
  const negocio = Deno.env.get('IG_BUSINESS_ID');
  if (!token || !negocio) throw new ErrorIg('sin-secrets');
  const campos = `business_discovery.username(${usuario}){username,name,biography,website,profile_picture_url,media.limit(6){caption}}`;
  const url = `https://graph.facebook.com/v21.0/${negocio}?fields=${encodeURIComponent(campos)}`;
  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${token}` },
    signal: señal(total, TIEMPO_FUENTE_MS),
  });
  const body = await res.json().catch(() => ({}));
  const bd = body?.business_discovery;
  if (!res.ok || !bd) {
    console.warn('instagram:', res.status, body?.error?.code, body?.error?.error_subcode);
    throw new Error('Tu Instagram es personal o no lo encontramos');
  }
  const captions = (bd.media?.data ?? [])
    .map((m: { caption?: string }) => m.caption ?? '')
    .filter(Boolean);
  const texto = [bd.name, bd.biography, ...captions].filter(Boolean).join('\n').slice(0, 6000);
  return { usuario: bd.username ?? usuario, texto, foto: bd.profile_picture_url ?? null };
}

// --------------------------------------------------------------------- logo

const EXT_IMAGEN: Record<string, string> = {
  'image/png': 'png', 'image/jpeg': 'jpg', 'image/jpg': 'jpg', 'image/webp': 'webp', 'image/gif': 'gif',
};

async function subirLogo(
  // deno-lint-ignore no-explicit-any
  admin: any,
  userId: string,
  candidatos: { url: string; fuente: Fuente }[],
  total: AbortSignal,
): Promise<PropuestaPerfil['logoProvisional']> {
  for (const c of candidatos) {
    try {
      const r = await descargar(c.url, {
        max: MAX_LOGO, cortar: false, signal: señal(total, TIEMPO_FUENTE_MS),
        accept: 'image/png,image/jpeg,image/webp,image/gif',
      });
      if (!r.ok) continue;
      const tipo = r.d.tipo.split(';')[0].trim();
      // SVG fuera a propósito: puede llevar scripts y se serviría desde un bucket público.
      const ext = EXT_IMAGEN[tipo];
      if (!ext || r.d.bytes.length < 200) continue;
      const path = `${userId}/provisional-${Date.now()}.${ext}`;
      const { error } = await admin.storage.from(BUCKET_LOGOS)
        .upload(path, r.d.bytes, { contentType: tipo, upsert: true });
      if (error) {
        console.error('logo upload:', error.message);
        continue;
      }
      const { data } = admin.storage.from(BUCKET_LOGOS).getPublicUrl(path);
      return { url: data.publicUrl, path, fuente: c.fuente };
    } catch (e) {
      console.warn('logo:', c.url, (e as Error).message);
    }
  }
  return undefined;
}

// ------------------------------------------------------------------- modelo

type Extraido = {
  nombreComercial?: Dato<string> | null;
  tono?: Dato<string> | null;
  servicios?: Dato<string>[];
  marcas?: Dato<string>[];
};

function promptExtraccion(nombre: string, localidad: string): string {
  return `Eres un asistente que lee la web y el Instagram de una farmacia española (${nombre}, ${localidad}) y extrae datos para su ficha.

Devuelve SOLO un objeto JSON con esta forma:
{
  "nombreComercial": { "valor": string, "fuente": "web" | "instagram", "cita": string } | null,
  "tono": { "valor": ${TONOS.map((t) => `"${t}"`).join(' | ')}, "fuente": "web" | "instagram", "cita": string } | null,
  "servicios": [ { "valor": string, "fuente": "web" | "instagram", "cita": string } ],
  "marcas": [ { "valor": string, "fuente": "web" | "instagram", "cita": string } ]
}

Reglas:
- "cita" es un fragmento LITERAL, copiado tal cual (de 4 a 120 caracteres), del texto de la fuente indicada que demuestra el dato. Si no puedes citarlo literalmente, no lo incluyas.
- "nombreComercial": el nombre con el que la farmacia se presenta al público.
- "tono": el que mejor describe cómo escribe la farmacia; la cita es una frase suya que lo muestre.
- "servicios": servicios que la farmacia ofrece (p. ej. "Ortopedia", "Formulación magistral", "Medición de tensión"), nombre corto. Máximo ${MAX_ITEMS}.
- "marcas": marcas comerciales de productos que la farmacia menciona que trabaja o vende. Máximo ${MAX_ITEMS}. Nada de nombres de laboratorios genéricos ni de la propia farmacia.
- No inventes nada. Si una fuente no dice algo, déjalo fuera. Mejor una lista corta y cierta que larga.`;
}

function parsearJson(s: string): Extraido | null {
  try {
    return JSON.parse(s);
  } catch {
    const m = /\{[\s\S]*\}/.exec(s);
    if (!m) return null;
    try { return JSON.parse(m[0]); } catch { return null; }
  }
}

function limpiarDatos(v: unknown): Dato<string>[] {
  if (!Array.isArray(v)) return [];
  return v
    .filter((d) => d && typeof d.valor === 'string' && typeof d.cita === 'string')
    .map((d) => ({
      valor: String(d.valor).trim().slice(0, 60),
      fuente: d.fuente as Fuente,
      cita: String(d.cita).slice(0, 200),
    }))
    .filter((d) => d.valor.length > 0);
}

function sinDuplicados(items: Dato<string>[]): Dato<string>[] {
  const vistos = new Set<string>();
  return items.filter((d) => {
    const k = d.valor.toLowerCase();
    if (vistos.has(k)) return false;
    vistos.add(k);
    return true;
  });
}

async function extraerConModelo(
  nombre: string,
  localidad: string,
  textos: Partial<Record<Fuente, string>>,
  total: AbortSignal,
): Promise<Extraido | null> {
  const key = Deno.env.get('LOVABLE_API_KEY');
  if (!key) {
    console.error('LOVABLE_API_KEY ausente');
    return null;
  }
  const contenido = (['web', 'instagram'] as Fuente[])
    .filter((f) => textos[f])
    .map((f) => `=== FUENTE: ${f} ===\n${textos[f]}`)
    .join('\n\n');
  const res = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
    method: 'POST',
    headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
    signal: señal(total, TIEMPO_MODELO_MS),
    body: JSON.stringify({
      model: TEXT_MODEL,
      messages: [
        { role: 'system', content: promptExtraccion(nombre, localidad) },
        { role: 'user', content: contenido },
      ],
      response_format: { type: 'json_object' },
      temperature: 0.2,
      max_tokens: 1500,
    }),
  });
  if (!res.ok) {
    console.error('modelo:', res.status, (await res.text()).slice(0, 300));
    return null;
  }
  const data = await res.json();
  return parsearJson(data?.choices?.[0]?.message?.content ?? '');
}

// --------------------------------------------------------------------- serve

const texto = (v: unknown, max: number) => (typeof v === 'string' ? v.trim().slice(0, max) : '');

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });
  if (req.method !== 'POST') return json({ error: 'Método no permitido' }, 405);

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) return json({ error: 'No autorizado' }, 401);
    const token = authHeader.replace('Bearer ', '');

    const admin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      { auth: { persistSession: false, autoRefreshToken: false } },
    );
    const { data: { user }, error: authError } = await admin.auth.getUser(token);
    if (authError || !user) return json({ error: 'Sesión inválida' }, 401);

    const body = await req.json().catch(() => ({}));
    const nombre = texto(body.nombre, 120);
    const localidad = texto(body.localidad, 120);
    const web = texto(body.web, 300);
    const igBruto = texto(body.instagram, 120);
    if (!nombre || !localidad) return json({ error: 'Faltan el nombre o la localidad' }, 400);
    if (!web && !igBruto) return json({ error: 'Indica tu web o tu Instagram' }, 400);

    // Límite diario. Se reserva la fila ANTES de buscar y se cuenta con ella:
    // así ni las peticiones en paralelo ni un error a mitad dejan buscar gratis.
    const { data: reserva, error: reservaError } = await admin
      .from('iafarma_perfil_busquedas')
      .insert({ user_id: user.id })
      .select('id')
      .single();
    if (reservaError || !reserva) {
      console.error('reserva:', reservaError?.message);
      return json({ error: 'No hemos podido comprobar tu límite de búsquedas' }, 500);
    }
    const desde = new Date(Date.now() - 24 * 3600 * 1000).toISOString();
    const { count, error: countError } = await admin
      .from('iafarma_perfil_busquedas')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .gte('created_at', desde);
    if (countError) {
      console.error('limite:', countError.message);
      return json({ error: 'No hemos podido comprobar tu límite de búsquedas' }, 500);
    }
    if ((count ?? 0) > LIMITE_DIARIO) {
      await admin.from('iafarma_perfil_busquedas').delete().eq('id', reserva.id);
      return json({ estado: 'limite', mensaje: MSG_LIMITE } satisfies RespuestaPerfil);
    }

    const total = AbortSignal.timeout(TIEMPO_TOTAL_MS);
    const fallidas: PropuestaPerfil['fuentesFallidas'] = [];
    let igUsuario = igBruto ? normalizarInstagram(igBruto) : null;
    if (igBruto && !igUsuario) fallidas.push({ fuente: 'instagram', motivo: 'El usuario de Instagram no es válido' });

    const motivoWeb = (e: unknown) =>
      `No hemos podido leer tu web (${(e as Error)?.message || 'error'})`;
    const motivoIg = (e: unknown) =>
      e instanceof ErrorIg ? null : ((e as Error)?.message || 'No hemos podido leer tu Instagram');

    let rWeb: ResultadoWeb | null = null;
    let rIg: ResultadoIg | null = null;

    if (igUsuario || !web) {
      // Instagram conocido: las dos fuentes en paralelo.
      const [w, i] = await Promise.allSettled([
        web ? leerWeb(web, total) : Promise.reject(null),
        igUsuario ? leerInstagram(igUsuario, total) : Promise.reject(null),
      ]);
      if (w.status === 'fulfilled') rWeb = w.value;
      else if (web) fallidas.push({ fuente: 'web', motivo: motivoWeb(w.reason) });
      if (i.status === 'fulfilled') rIg = i.value;
      else if (igUsuario) {
        const m = motivoIg(i.reason);
        if (m) fallidas.push({ fuente: 'instagram', motivo: m });
      }
    } else {
      // Sin Instagram: primero la web, que puede enlazarlo.
      try {
        rWeb = await leerWeb(web, total);
      } catch (e) {
        fallidas.push({ fuente: 'web', motivo: motivoWeb(e) });
      }
      igUsuario = rWeb?.instagram ?? null;
      if (igUsuario) {
        try {
          rIg = await leerInstagram(igUsuario, total);
        } catch (e) {
          const m = motivoIg(e);
          if (m) fallidas.push({ fuente: 'instagram', motivo: m });
        }
      }
    }

    const textos: Partial<Record<Fuente, string>> = {};
    if (rWeb?.texto) textos.web = rWeb.texto;
    if (rIg?.texto) textos.instagram = rIg.texto;

    const candidatosLogo = [
      ...(rWeb?.logos ?? []).slice(0, 4).map((url) => ({ url, fuente: 'web' as Fuente })),
      ...(rIg?.foto ? [{ url: rIg.foto, fuente: 'instagram' as Fuente }] : []),
    ];

    const [extraido, logo] = await Promise.all([
      Object.keys(textos).length
        ? extraerConModelo(nombre, localidad, textos, total).catch((e) => {
          console.error('modelo:', (e as Error).message);
          return null;
        })
        : Promise.resolve(null),
      subirLogo(admin, user.id, candidatosLogo, total),
    ]);

    const propuesta: PropuestaPerfil = {
      localidad: { valor: localidad, fuente: 'manual' },
      servicios: [],
      marcas: [],
      coloresCss: rWeb?.colores ?? [],
      fuentesFallidas: fallidas,
    };
    if (rWeb) propuesta.web = rWeb.url;
    if (rIg) propuesta.instagram = rIg.usuario;
    else if (igUsuario && !igBruto) propuesta.instagram = igUsuario; // enlazado en su web
    if (logo) propuesta.logoProvisional = logo;

    if (extraido) {
      const unico = (d: Dato<string> | null | undefined) =>
        d ? filtrarConCita(limpiarDatos([d]), textos)[0] : undefined;
      const nc = unico(extraido.nombreComercial);
      if (nc) propuesta.nombreComercial = nc;
      const tono = unico(extraido.tono);
      if (tono && TONOS.includes(tono.valor)) propuesta.tono = tono;
      propuesta.servicios = sinDuplicados(
        quitarVetadas(filtrarConCita(limpiarDatos(extraido.servicios), textos)),
      ).slice(0, MAX_ITEMS);
      propuesta.marcas = sinDuplicados(
        quitarVetadas(filtrarConCita(limpiarDatos(extraido.marcas), textos)),
      ).slice(0, MAX_ITEMS);
    } else if (Object.keys(textos).length) {
      console.warn('sin extracción del modelo');
    }

    const fuentes = (Object.keys(textos) as Fuente[]);
    const { error: logError } = await admin
      .from('iafarma_perfil_busquedas')
      .update({ fuentes, coste_estimado: fuentes.length ? COSTE_MODELO : 0 })
      .eq('id', reserva.id);
    if (logError) console.error('registro búsqueda:', logError.message);

    return json({ estado: 'ok', propuesta } satisfies RespuestaPerfil);
  } catch (error) {
    console.error('iafarma-perfil:', error);
    return json({ error: 'Error interno' }, 500);
  }
});
