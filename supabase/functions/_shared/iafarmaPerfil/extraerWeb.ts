// Extracción de logo, colores, Instagram y texto del HTML de la web de una
// farmacia. Con expresiones regulares a propósito: corre en una edge function
// sin DOM y sin imports de Deno.

const ENTIDADES: Record<string, string> = {
  amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", nbsp: ' ',
  aacute: 'á', eacute: 'é', iacute: 'í', oacute: 'ó', uacute: 'ú',
  Aacute: 'Á', Eacute: 'É', Iacute: 'Í', Oacute: 'Ó', Uacute: 'Ú',
  ntilde: 'ñ', Ntilde: 'Ñ', uuml: 'ü', Uuml: 'Ü', ccedil: 'ç', Ccedil: 'Ç',
  agrave: 'à', egrave: 'è', ograve: 'ò', Agrave: 'À', Egrave: 'È', Ograve: 'Ò',
  iuml: 'ï', middot: '·', laquo: '«', raquo: '»', ordf: 'ª', ordm: 'º',
};

function decodificar(s: string): string {
  return s.replace(/&(#x[0-9a-f]+|#\d+|[a-z]+);/gi, (m, e: string) => {
    if (e[0] === '#') {
      const n = e[1] === 'x' || e[1] === 'X' ? parseInt(e.slice(2), 16) : parseInt(e.slice(1), 10);
      return Number.isFinite(n) && n > 0 && n < 0x110000 ? String.fromCodePoint(n) : m;
    }
    return ENTIDADES[e] ?? m;
  });
}

type Attrs = Record<string, string>;

function atributos(tag: string): Attrs {
  const out: Attrs = {};
  const re = /([a-zA-Z_:][-a-zA-Z0-9_:.]*)\s*(?:=\s*(?:"([^"]*)"|'([^']*)'|([^\s"'=<>`]+)))?/g;
  // Saltar el nombre de la etiqueta
  const cuerpo = tag.replace(/^<\s*[a-zA-Z0-9]+/, '').replace(/\/?>$/, '');
  let m: RegExpExecArray | null;
  while ((m = re.exec(cuerpo))) {
    const k = m[1].toLowerCase();
    if (!(k in out)) out[k] = decodificar(m[2] ?? m[3] ?? m[4] ?? '');
  }
  return out;
}

const etiquetas = (html: string, nombre: string): Attrs[] =>
  [...html.matchAll(new RegExp(`<${nombre}\\b[^>]*>`, 'gi'))].map((m) => atributos(m[0]));

function absoluta(u: string | undefined, base: string): string | null {
  if (!u || !u.trim()) return null;
  try {
    const r = new URL(u.trim(), base);
    return r.protocol === 'http:' || r.protocol === 'https:' ? r.href : null;
  } catch {
    return null;
  }
}

// ----------------------------------------------------------------- colores

function normalizarHex(h: string): string | null {
  const x = h.toLowerCase();
  if (x.length === 3 || x.length === 4) return '#' + [...x.slice(0, 3)].map((c) => c + c).join('');
  if (x.length === 6 || x.length === 8) return '#' + x.slice(0, 6);
  return null;
}

const aHex = (n: number) => Math.min(255, Math.max(0, n)).toString(16).padStart(2, '0');

/** Fuera blancos, negros y grises: no dicen nada de la marca. */
function esNeutro(hex: string): boolean {
  const [r, g, b] = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16));
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  return min >= 240 || max <= 20 || max - min < 12;
}

function ordenarColores(lista: string[]): string[] {
  const cuenta = new Map<string, number>();
  for (const c of lista) if (!esNeutro(c)) cuenta.set(c, (cuenta.get(c) ?? 0) + 1);
  return [...cuenta.entries()]
    .sort((a, b) => b[1] - a[1]) // estable: a igual frecuencia, el primero que apareció
    .map(([c]) => c)
    .slice(0, 6);
}

function coloresEnValores(css: string): string[] {
  const out: string[] = [];
  // Solo dentro de valores (tras «:»), para no confundir ids de selector (#add) con colores.
  for (const v of css.match(/:[^;{}]*/g) ?? []) {
    for (const m of v.matchAll(/#([0-9a-fA-F]{3,8})\b/g)) {
      const h = normalizarHex(m[1]);
      if (h) out.push(h);
    }
    for (const m of v.matchAll(/rgba?\(\s*(\d{1,3})[\s,]+(\d{1,3})[\s,]+(\d{1,3})/gi)) {
      out.push('#' + aHex(+m[1]) + aHex(+m[2]) + aHex(+m[3]));
    }
  }
  return out;
}

export function coloresDeCss(css: string): string[] {
  return ordenarColores(coloresEnValores(css));
}

// ---------------------------------------------------------------- instagram

const RESERVADAS_IG = new Set([
  'p', 'reel', 'reels', 'explore', 'stories', 'tv', 'accounts', 'direct', 'about', 'legal',
  'developer', 'web', 'share', 'sharer',
]);

function usuarioInstagram(href: string): string | null {
  const m = /instagram\.com\/([A-Za-z0-9._]+)/i.exec(href);
  if (!m) return null;
  const u = m[1].toLowerCase().replace(/\.+$/, '');
  return u && !RESERVADAS_IG.has(u) ? u : null;
}

// -------------------------------------------------------------------- texto

function textoVisible(html: string): string {
  const sin = html
    .replace(/<!--[\s\S]*?-->/g, ' ')
    .replace(/<(script|style|noscript|svg|template|iframe)\b[\s\S]*?<\/\1\s*>/gi, ' ')
    .replace(/<[^>]+>/g, ' ');
  return decodificar(sin).replace(/\s+/g, ' ').trim();
}

// --------------------------------------------------------------------- todo

export function extraerDeHtml(
  html: string,
  base: string,
): { logos: string[]; colores: string[]; instagram: string | null; texto: string; hojaCss: string | null } {
  const imgs = etiquetas(html, 'img');
  const links = etiquetas(html, 'link');
  const metas = etiquetas(html, 'meta');
  const anclas = etiquetas(html, 'a');

  // Logos, por orden de fiabilidad.
  const logos: string[] = [];
  const meter = (u: string | null) => { if (u && !logos.includes(u)) logos.push(u); };
  for (const a of imgs) {
    const src = a.src || a['data-src'] || a['data-lazy-src'] || (a.srcset ?? '').split(/[\s,]/)[0];
    const pista = `${a.class ?? ''} ${a.id ?? ''} ${a.alt ?? ''} ${src ?? ''}`;
    if (/logo/i.test(pista)) meter(absoluta(src, base));
  }
  const rels = (a: Attrs) => (a.rel ?? '').toLowerCase().split(/\s+/);
  for (const a of links) if (rels(a).includes('apple-touch-icon')) meter(absoluta(a.href, base));
  for (const a of links) {
    if (!rels(a).includes('icon')) continue;
    const s = (a.sizes ?? '').toLowerCase();
    const n = parseInt(s, 10);
    if (s === 'any' || n >= 128) meter(absoluta(a.href, base));
  }
  for (const a of metas) {
    const p = (a.property ?? a.name ?? '').toLowerCase();
    if (p === 'og:image' || p === 'og:image:url') meter(absoluta(a.content, base));
  }

  // Colores: theme-color primero, luego los del CSS en línea.
  const theme: string[] = [];
  for (const a of metas) {
    if ((a.name ?? '').toLowerCase() !== 'theme-color') continue;
    const m = /^#([0-9a-f]{3,8})$/i.exec((a.content ?? '').trim());
    const h = m && normalizarHex(m[1]);
    if (h) theme.push(h);
  }
  const estilos = [...html.matchAll(/<style\b[^>]*>([\s\S]*?)<\/style\s*>/gi)].map((m) => m[1]);
  const enLinea = [...html.matchAll(/\sstyle\s*=\s*("([^"]*)"|'([^']*)')/gi)].map((m) => ':' + (m[2] ?? m[3]));
  const delCss = coloresEnValores([...estilos, ...enLinea].join('\n'));
  const colores = ordenarColores([...theme, ...theme, ...theme, ...delCss]); // el theme-color pesa más

  // Instagram: el primer perfil enlazado.
  let instagram: string | null = null;
  for (const a of anclas) {
    instagram = usuarioInstagram(a.href ?? '');
    if (instagram) break;
  }

  // Hoja de estilos: la primera del propio dominio; si no hay, la primera.
  const hojas = links
    .filter((a) => rels(a).includes('stylesheet'))
    .map((a) => absoluta(a.href, base))
    .filter((u): u is string => !!u);
  let host = '';
  try { host = new URL(base).host; } catch { /* base inválida */ }
  const hojaCss = hojas.find((u) => new URL(u).host === host) ?? hojas[0] ?? null;

  // Texto: título, descripción y cuerpo visible.
  const titulo = /<title\b[^>]*>([\s\S]*?)<\/title\s*>/i.exec(html)?.[1] ?? '';
  const descripcion = metas.find((a) => (a.name ?? '').toLowerCase() === 'description')?.content ?? '';
  const cuerpo = html.replace(/<head\b[\s\S]*?<\/head\s*>/i, ' ');
  const texto = [decodificar(titulo), descripcion, textoVisible(cuerpo)]
    .join(' ')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 12000);

  return { logos, colores, instagram, texto, hojaCss };
}
