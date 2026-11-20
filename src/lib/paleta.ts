// Paleta de la farmacia a partir de su logo (en el navegador) y de los colores
// del CSS de su web (los da la edge function iafarma-perfil).

const hex2 = (n: number) => n.toString(16).padStart(2, '0');

function aRgb(hex: string): [number, number, number] | null {
  const m = /^#([0-9a-f]{6})$/i.exec(hex.trim());
  if (!m) return null;
  const n = parseInt(m[1], 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

const luminosidad = (r: number, g: number, b: number) => (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255;

/** Colores más frecuentes de una imagen RGBA, sin transparentes, casi blancos ni casi negros. */
export function paletaDeImagen(px: Uint8ClampedArray, n = 6): string[] {
  const cuenta = new Map<string, number>();
  for (let i = 0; i + 3 < px.length; i += 4) {
    if (px[i + 3] < 128) continue;
    const [r, g, b] = [px[i], px[i + 1], px[i + 2]];
    const l = luminosidad(r, g, b);
    if (l > 0.92 || l < 0.08) continue;
    const c = '#' + [r, g, b].map((v) => hex2((v & 0xf0) | 0x08)).join('');
    cuenta.set(c, (cuenta.get(c) ?? 0) + 1);
  }
  return [...cuenta.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, n)
    .map(([c]) => c);
}

function distancia(a: string, b: string): number {
  const x = aRgb(a);
  const y = aRgb(b);
  if (!x || !y) return Infinity;
  return Math.hypot(x[0] - y[0], x[1] - y[1], x[2] - y[2]);
}

/** Primario y secundario: manda un color del logo que también está en la web
 *  (con el hex exacto de la web); si no, los del logo; sin logo, los de la web. */
export function combinarPaleta(logo: string[], css: string[]): { primario?: string; secundario?: string } {
  for (const l of logo) {
    const igual = css.find((c) => distancia(l, c) < 40);
    if (!igual) continue;
    const otro = logo.find((x) => x !== l && distancia(x, igual) >= 40)
      ?? css.find((x) => distancia(x, igual) >= 40);
    return otro ? { primario: igual, secundario: otro } : { primario: igual };
  }
  const base = logo.length ? logo : css;
  const out: { primario?: string; secundario?: string } = {};
  if (base[0]) out.primario = base[0];
  if (base[1]) out.secundario = base[1];
  return out;
}

/** Paleta de una imagen por URL. Si no carga o el servidor no deja leerla (CORS), []. */
export function paletaDeUrl(url: string): Promise<string[]> {
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      try {
        const canvas = document.createElement('canvas');
        canvas.width = 64;
        canvas.height = 64;
        const ctx = canvas.getContext('2d');
        if (!ctx) return resolve([]);
        ctx.drawImage(img, 0, 0, 64, 64);
        resolve(paletaDeImagen(ctx.getImageData(0, 0, 64, 64).data));
      } catch {
        resolve([]);
      }
    };
    img.onerror = () => resolve([]);
    img.src = url;
  });
}
