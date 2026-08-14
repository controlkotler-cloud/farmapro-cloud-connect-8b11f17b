import { useState } from 'react';
import { motion } from 'framer-motion';
import { Download, GalleryHorizontalEnd, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { IAFarmaDefaults, brandPaletteOf } from '@/hooks/useIAFarmaDefaults';
import { getStyle } from './pieceTypes';
import { cropBlobToFormat, overlayLogo, downloadBlob, fileDate } from './imageUtils';

// =====================================================================
// Carrusel multi-imagen: un carrusel no es UNA imagen, son N (una por
// slide). Este componente coge el texto generado (SLIDE 1..N), extrae el
// titular y las líneas de cada slide y genera las N piezas EN SERIE
// compartiendo la misma dirección de arte y paleta, para que el carrusel
// se vea como un conjunto y no como collage de piezas sueltas.
// Cada slide consume 1 crédito (el admin no consume).
// =====================================================================

interface SlideCopy {
  headline: string;
  lines: string[];
}

interface SlideResult {
  url: string;
  headline: string;
}

/** Tamaño de slide de carrusel: feed 4:5 (1080x1350). */
const SLIDE_W = 1080;
const SLIDE_H = 1350;

// Paletas de serie para cuando la farmacia no tiene colores corporativos
// fijados: se elige UNA por carrusel y se aplica a todas las slides.
const SERIES_PALETTES = [
  'soft sage green, cream and charcoal',
  'deep navy, sky blue and off-white',
  'warm terracotta, sand and dark brown',
  'plum, blush pink and ivory',
  'teal, mint and warm grey',
];

/**
 * Dirección de arte FIJA de todo el carrusel (misma cadena para las N slides:
 * coherencia garantizada, sin depender de lo que improvise el modelo).
 * Estilo infografía editorial educativa, no cartel promocional: la primera
 * versión heredaba las direcciones de fallback pensadas para promos (sticker
 * de oferta, portada de revista...) y salían carteles espectaculares pero
 * incoherentes entre sí.
 */
const buildSeriesArt = (brandPalette: string): string => {
  const palette = brandPalette
    ? `STRICT series palette: ${brandPalette} as the dominant colors on a soft neutral background, identical across all slides`
    : `Series palette, identical across all slides: ${SERIES_PALETTES[Math.floor(Math.random() * SERIES_PALETTES.length)]}`;
  return (
    'Educational Instagram carousel slide, editorial infographic style, part of a matched series: ' +
    'IDENTICAL layout system on every slide — bold clear headline in the upper third, supporting items as a clean vertical list ' +
    'with small flat illustrated icons, generous even margins, soft flat background with subtle geometric shapes, ' +
    'minimal, friendly and consistent. NO promo poster look, no starburst badges, no discount stickers, no magazine cover style. ' +
    palette + '.'
  );
};

/**
 * Extrae el copy de cada slide del texto generado. El prompt del asistente
 * garantiza el formato "SLIDE n:" con titular + 1-2 frases; la sección
 * "CAPTION:" final se descarta (es la descripción del post, no una slide).
 */
export const parseSlides = (content: string): SlideCopy[] => {
  const withoutCaption = content.split(/CAPTION\s*:/i)[0];
  const parts = withoutCaption.split(/(?:slide|diapositiva)\s*\d+\s*[:.]?/gi);
  const slides: SlideCopy[] = [];
  // parts[0] es lo anterior al primer SLIDE (normalmente vacío): se ignora.
  for (let i = 1; i < parts.length; i++) {
    const rawLines = parts[i]
      .split('\n')
      .map((l) => l.replace(/^\s*(TITULAR|TÍTULO|TITLE)\s*:\s*/i, '').trim())
      .filter(Boolean);
    if (!rawLines.length) continue;
    const headline = rawLines[0].slice(0, 60);
    const lines = rawLines.slice(1, 4).map((l) => l.slice(0, 60));
    slides.push({ headline, lines });
  }
  return slides;
};

interface CarouselImagesProps {
  content: string;
  defaults: IAFarmaDefaults;
}

export const CarouselImages = ({ content, defaults }: CarouselImagesProps) => {
  const { toast } = useToast();
  const [results, setResults] = useState<SlideResult[]>([]);
  const [generating, setGenerating] = useState(false);
  const [progress, setProgress] = useState({ current: 0, total: 0 });
  const [error, setError] = useState<string | null>(null);
  const [includeLogo, setIncludeLogo] = useState(Boolean(defaults.logoUrl));
  const [downloadingAll, setDownloadingAll] = useState(false);

  const slides = parseSlides(content);
  if (slides.length < 2) return null;

  const withLogo = includeLogo && Boolean(defaults.logoUrl);

  const generateAll = async () => {
    if (generating) return;
    setGenerating(true);
    setError(null);
    setResults([]);
    setProgress({ current: 0, total: slides.length });

    const brandPalette = brandPaletteOf(defaults);
    // La MISMA dirección de arte para todas las slides, decidida aquí (no por
    // el modelo): coherencia visual garantizada de la 1 a la N.
    const seriesArt = buildSeriesArt(brandPalette);
    const collected: SlideResult[] = [];

    try {
      for (let i = 0; i < slides.length; i++) {
        setProgress({ current: i + 1, total: slides.length });
        const slide = slides[i];
        const { data, error: invokeError } = await supabase.functions.invoke('ai-generate-image', {
          body: {
            prompt: `Instagram carousel slide ${i + 1} of ${slides.length} for a pharmacy: cohesive graphic design piece built around the given headline and supporting items, consistent series style`,
            size: `${SLIDE_W}x${SLIDE_H}`,
            style: getStyle('diseno').promptStyle,
            headline: slide.headline,
            lines: slide.lines.length ? slide.lines : [],
            pieceType: 'post',
            artOverride: seriesArt,
            ...(brandPalette ? { brandPalette } : {}),
            ...(withLogo ? { logoCorner: true } : {}),
            ...(defaults.farmacia ? { pharmacyName: defaults.farmacia } : {}),
            ...(defaults.localidad ? { locality: defaults.localidad } : {}),
          },
        });

        if (invokeError) {
          const status = (invokeError as { context?: { status?: number } }).context?.status;
          if (status === 402) {
            throw new Error(`Te quedaste sin créditos en la slide ${i + 1} de ${slides.length}. Las ya generadas se conservan.`);
          }
          throw new Error(`No se pudo generar la slide ${i + 1}. Las ya generadas se conservan.`);
        }
        const result = data as { imageUrl?: string };
        if (!result?.imageUrl) {
          throw new Error(`Respuesta vacía en la slide ${i + 1}. Las ya generadas se conservan.`);
        }
        collected.push({ url: result.imageUrl, headline: slide.headline });
        setResults([...collected]);
      }
      toast({
        title: 'Carrusel listo',
        description: `${slides.length} imágenes generadas con estilo coherente.`,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo completar el carrusel.');
    } finally {
      setGenerating(false);
    }
  };

  const downloadSlide = async (result: SlideResult, index: number) => {
    const response = await fetch(result.url);
    if (!response.ok) throw new Error('No se pudo descargar la imagen');
    let blob = await response.blob();
    blob = await cropBlobToFormat(blob, SLIDE_W, SLIDE_H);
    if (withLogo && defaults.logoUrl) {
      try {
        blob = await overlayLogo(blob, defaults.logoUrl);
      } catch (e) {
        console.error('Logo overlay failed, downloading without logo:', e);
      }
    }
    downloadBlob(blob, `iafarma-carrusel-${fileDate()}-slide-${index + 1}.png`);
  };

  const handleDownloadAll = async () => {
    setDownloadingAll(true);
    try {
      for (let i = 0; i < results.length; i++) {
        await downloadSlide(results[i], i);
      }
    } catch (err) {
      toast({
        title: 'Error',
        description: err instanceof Error ? err.message : 'No se pudieron descargar todas.',
        variant: 'destructive',
      });
    } finally {
      setDownloadingAll(false);
    }
  };

  return (
    <div className="rounded-lg ring-1 ring-ciruela/20 bg-ciruela-soft/40 p-4">
      <div className="flex items-center gap-2 mb-1">
        <GalleryHorizontalEnd className="h-4 w-4 text-ciruela" />
        <span className="text-sm font-semibold text-foreground">Imágenes del carrusel</span>
      </div>
      <p className="text-xs text-muted-foreground mb-3">
        {slides.length} slides detectadas. Se generan una a una con el mismo estilo y paleta para
        que el carrusel sea un conjunto coherente.
      </p>

      {defaults.logoUrl && (
        <label className="flex items-center gap-2 text-xs text-muted-foreground mb-3 cursor-pointer">
          <input
            type="checkbox"
            checked={includeLogo}
            onChange={(e) => setIncludeLogo(e.target.checked)}
            className="h-3.5 w-3.5 accent-[var(--ciruela,#7c3a58)]"
          />
          Añadir mi logo a cada slide
        </label>
      )}

      {results.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-3">
          {results.map((r, i) => (
            <motion.div
              key={r.url}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              className="relative rounded-lg overflow-hidden ring-1 ring-border bg-card"
            >
              <div className="relative" style={{ aspectRatio: `${SLIDE_W} / ${SLIDE_H}` }}>
                <img src={r.url} alt={`Slide ${i + 1}: ${r.headline}`} className="absolute inset-0 h-full w-full object-cover" />
                {withLogo && defaults.logoUrl && (
                  <img
                    src={defaults.logoUrl}
                    alt=""
                    aria-hidden
                    className="absolute object-contain"
                    style={{ right: '4%', bottom: '4%', width: '16%' }}
                  />
                )}
              </div>
              <div className="flex items-center justify-between px-2 py-1.5">
                <span className="text-[11px] font-medium text-muted-foreground">Slide {i + 1}</span>
                <button
                  type="button"
                  onClick={() => downloadSlide(r, i).catch(() => toast({ title: 'Error', description: 'No se pudo descargar.', variant: 'destructive' }))}
                  className="text-ciruela hover:text-ciruela/80"
                  aria-label={`Descargar slide ${i + 1}`}
                >
                  <Download className="h-3.5 w-3.5" />
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {error && <p className="text-xs text-destructive mb-3">{error}</p>}

      <div className="flex flex-wrap items-center gap-2">
        <Button
          type="button"
          onClick={generateAll}
          disabled={generating}
          size="sm"
          className="bg-primary hover:bg-primary/90 text-primary-foreground"
        >
          {generating ? (
            <>
              <div className="h-3.5 w-3.5 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin mr-2" />
              Generando slide {progress.current} de {progress.total}...
            </>
          ) : (
            <>
              <Sparkles className="h-3.5 w-3.5 mr-2" />
              {results.length > 0
                ? `Regenerar las ${slides.length} imágenes (${slides.length} créditos)`
                : `Crear las ${slides.length} imágenes del carrusel (${slides.length} créditos)`}
            </>
          )}
        </Button>
        {results.length > 1 && !generating && (
          <Button type="button" variant="outline" size="sm" onClick={handleDownloadAll} disabled={downloadingAll}>
            <Download className="h-3.5 w-3.5 mr-2" />
            {downloadingAll ? 'Descargando...' : `Descargar las ${results.length}`}
          </Button>
        )}
      </div>
    </div>
  );
};
