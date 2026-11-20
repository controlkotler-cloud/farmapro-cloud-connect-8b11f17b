import { useEffect, useRef } from 'react';

const ANCHO = 1080;
const ALTO = 1350;
const FONDO_POR_DEFECTO = '#5b2a4a';

function textoSobre(hex: string): string {
  const m = /^#([0-9a-f]{6})$/i.exec(hex);
  if (!m) return '#ffffff';
  const n = parseInt(m[1], 16);
  const l = (0.2126 * ((n >> 16) & 255) + 0.7152 * ((n >> 8) & 255) + 0.0722 * (n & 255)) / 255;
  return l > 0.6 ? '#1f1a1d' : '#ffffff';
}

interface Props {
  colorPrimario?: string;
  colorSecundario?: string;
  nombreComercial: string;
  logoUrl?: string;
}

/** Muestra a escala de una pieza 4:5 con los datos de la ficha: fondo, firma y logo
 *  en la esquina inferior derecha (16 % del ancho, margen del 4 %, como overlayLogo). */
export function MuestraCanvas({ colorPrimario, colorSecundario, nombreComercial, logoUrl }: Props) {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;
    let cancelado = false;

    const fondo = colorPrimario || FONDO_POR_DEFECTO;
    const tinta = textoSobre(fondo);
    const pintar = (logo?: HTMLImageElement) => {
      if (cancelado) return;
      ctx.clearRect(0, 0, ANCHO, ALTO);
      ctx.fillStyle = fondo;
      ctx.fillRect(0, 0, ANCHO, ALTO);
      if (colorSecundario) {
        ctx.fillStyle = colorSecundario;
        ctx.fillRect(0, ALTO - 24, ANCHO, 24);
      }
      ctx.fillStyle = tinta;
      ctx.textBaseline = 'top';
      ctx.font = '700 92px system-ui, -apple-system, sans-serif';
      ['Así se verán', 'tus piezas'].forEach((l, i) => ctx.fillText(l, 86, 150 + i * 108));
      ctx.font = '500 44px system-ui, -apple-system, sans-serif';
      ctx.globalAlpha = 0.85;
      ctx.fillText((nombreComercial || 'Tu farmacia').slice(0, 40), 86, ALTO - 150);
      ctx.globalAlpha = 1;
      if (logo && logo.naturalWidth > 0) {
        const w = ANCHO * 0.16;
        const h = (logo.naturalHeight / logo.naturalWidth) * w;
        const m = ANCHO * 0.04;
        ctx.drawImage(logo, ANCHO - w - m, ALTO - h - m, w, h);
      }
    };

    pintar();
    if (logoUrl) {
      const img = new Image();
      img.onload = () => pintar(img);
      img.src = logoUrl;
    }
    return () => {
      cancelado = true;
    };
  }, [colorPrimario, colorSecundario, nombreComercial, logoUrl]);

  return (
    <canvas
      ref={ref}
      width={ANCHO}
      height={ALTO}
      className="w-full max-w-[240px] rounded-md shadow-sm ring-1 ring-black/10"
      aria-label="Muestra de cómo se verán tus piezas"
      role="img"
    />
  );
}
