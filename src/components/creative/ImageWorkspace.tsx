import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import {
  BadgePercent,
  Download,
  ImageIcon,
  LayoutGrid,
  Presentation,
  Smartphone,
  Sparkles,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { IAFarmaDefaults } from '@/hooks/useIAFarmaDefaults';
import { useImageGeneration } from '@/hooks/useImageGeneration';
import { IMAGE_ADDONS, PACKS_CHECKOUT_READY, PAID_ROLES } from '@/lib/plans';
import {
  FormatId,
  HEADLINE_MAX,
  IMAGE_FORMATS,
  IMAGE_STYLES,
  PIECE_TYPES,
  PieceTypeId,
  StyleId,
  getFormat,
  getPieceType,
  getStyle,
} from './pieceTypes';

interface ImageWorkspaceProps {
  defaults: IAFarmaDefaults;
  /** Brief precargado (p. ej. desde "Crear esta imagen" del asistente de texto). */
  initialBrief?: string | null;
}

const PIECE_ICONS: Record<PieceTypeId, typeof ImageIcon> = {
  promo: BadgePercent,
  cartel: Presentation,
  post: LayoutGrid,
  story: Smartphone,
};

const formatToday = (): string => {
  const now = new Date();
  const yyyy = now.getFullYear();
  const mm = String(now.getMonth() + 1).padStart(2, '0');
  const dd = String(now.getDate()).padStart(2, '0');
  return `${yyyy}${mm}${dd}`;
};

const formatPrice = (price: number): string => `${price.toFixed(2).replace('.', ',')} €`;

/**
 * Recorta el PNG generado a las dimensiones EXACTAS del formato elegido.
 * gpt-image-2 solo produce 1:1, 2:3 y 3:2; la edge ya avisa al modelo de la
 * zona segura y aquí se completa el contrato: "Feed 4:5" descarga un PNG
 * 1080x1350 de verdad (recorte centrado + reescalado), no un 2:3 que
 * Instagram recortaría a su manera.
 */
const cropBlobToFormat = async (blob: Blob, targetW: number, targetH: number): Promise<Blob> => {
  const bitmap = await createImageBitmap(blob);
  try {
    const targetRatio = targetW / targetH;
    const srcRatio = bitmap.width / bitmap.height;
    let sx = 0, sy = 0, sw = bitmap.width, sh = bitmap.height;
    if (srcRatio > targetRatio) {
      sw = Math.round(bitmap.height * targetRatio);
      sx = Math.round((bitmap.width - sw) / 2);
    } else if (srcRatio < targetRatio) {
      sh = Math.round(bitmap.width / targetRatio);
      sy = Math.round((bitmap.height - sh) / 2);
    }
    const canvas = document.createElement('canvas');
    canvas.width = targetW;
    canvas.height = targetH;
    const ctx = canvas.getContext('2d');
    if (!ctx) return blob;
    ctx.imageSmoothingQuality = 'high';
    ctx.drawImage(bitmap, sx, sy, sw, sh, 0, 0, targetW, targetH);
    return await new Promise<Blob>((resolve, reject) =>
      canvas.toBlob((b) => (b ? resolve(b) : reject(new Error('No se pudo procesar la imagen'))), 'image/png'),
    );
  } finally {
    bitmap.close();
  }
};

export const ImageWorkspace = ({ defaults, initialBrief }: ImageWorkspaceProps) => {
  const { toast } = useToast();
  const { profile } = useAuth();
  const { generate, loading, imageUrl, revisedPrompt, remaining, copy, error, reset } = useImageGeneration();
  const [piece, setPiece] = useState<PieceTypeId>('promo');
  const [format, setFormat] = useState<FormatId>(getPieceType('promo').defaultFormat);
  const [style, setStyle] = useState<StyleId>('diseno');
  const [brief, setBrief] = useState('');
  const [headline, setHeadline] = useState('');
  const [prompt, setPrompt] = useState('');
  const [touched, setTouched] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [downloading, setDownloading] = useState(false);
  // Formato con el que se generó la imagen visible (para previsualizar y
  // descargar recortado aunque el usuario cambie el selector después).
  const [generatedFormat, setGeneratedFormat] = useState<FormatId | null>(null);

  const isPaid = PAID_ROLES.includes((profile?.subscription_role as string) ?? '');

  const pieceInfo = getPieceType(piece);

  // Precargar la descripción con la plantilla de pieza + datos de la farmacia
  // mientras el usuario no la haya editado. Si la toca, respetamos su texto.
  useEffect(() => {
    if (!touched) {
      setPrompt(pieceInfo.buildPrompt(defaults));
    }
  }, [defaults, pieceInfo, touched]);

  // Brief que llega desde "Crear esta imagen" (sugerencia del asistente).
  useEffect(() => {
    if (initialBrief) {
      setBrief(initialBrief.slice(0, 200));
    }
  }, [initialBrief]);

  const handleSelectPiece = (id: PieceTypeId) => {
    setPiece(id);
    setFormat(getPieceType(id).defaultFormat);
  };

  // Sin brief no se genera (salvo que el usuario haya escrito su propia
  // descripción en avanzados). Antes el prompt precargado —oculto tras
  // "Ajustes avanzados"— dejaba el botón siempre activo: un clic en vacío
  // gastaba el único crédito del mes en una pieza genérica.
  const canSubmit = Boolean(brief.trim() || (touched && prompt.trim()));

  const handleSubmit = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!canSubmit || loading) return;
    setGeneratedFormat(format);
    generate(prompt, {
      size: getFormat(format).size,
      style: getStyle(style).promptStyle,
      headline,
      pieceType: piece,
      brief,
      pharmacyName: defaults.farmacia,
      locality: defaults.localidad,
    });
  };

  const handleReset = () => {
    reset();
    setTouched(false);
    setBrief('');
    setHeadline('');
    setGeneratedFormat(null);
    setPrompt(pieceInfo.buildPrompt(defaults));
  };

  const handleDownload = async () => {
    if (!imageUrl) return;
    setDownloading(true);
    try {
      // Importante: descargamos primero el blob y SOLO entonces creamos el <a> y
      // hacemos click de forma síncrona. Así evitamos el bloqueo de Safari al
      // abrir/descargar tras un await (window.open tras await queda bloqueado).
      const response = await fetch(imageUrl);
      if (!response.ok) throw new Error('No se pudo descargar la imagen');
      let blob = await response.blob();

      // Recorte al formato exacto elegido (Feed 4:5 = 1080x1350 de verdad).
      if (generatedFormat) {
        const [w, h] = getFormat(generatedFormat).size.split('x').map(Number);
        if (w > 0 && h > 0) {
          try {
            blob = await cropBlobToFormat(blob, w, h);
          } catch (cropErr) {
            console.error('Crop failed, downloading original:', cropErr);
          }
        }
      }

      const objectUrl = URL.createObjectURL(blob);
      const anchor = document.createElement('a');
      anchor.href = objectUrl;
      anchor.download = `iafarma-${piece}-${formatToday()}.png`;
      document.body.appendChild(anchor);
      anchor.click();
      document.body.removeChild(anchor);
      URL.revokeObjectURL(objectUrl);
    } catch (err) {
      toast({
        title: 'Error',
        description: err instanceof Error ? err.message : 'No se pudo descargar la imagen.',
        variant: 'destructive',
      });
    } finally {
      setDownloading(false);
    }
  };

  const remainingLabel =
    remaining !== null
      ? `Te ${remaining === 1 ? 'queda' : 'quedan'} ${remaining} ${
          remaining === 1 ? 'crédito' : 'créditos'
        } de imagen`
      : null;

  // Proporción de la imagen generada, para previsualizar el recorte real.
  const previewAspect = generatedFormat
    ? getFormat(generatedFormat).size.split('x').map(Number)
    : null;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
      <motion.div
        className="lg:col-span-2"
        initial={{ opacity: 0, x: -12 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.3 }}
      >
        <div className="bg-card rounded-lg ring-1 ring-border shadow-sm p-6 sticky top-4">
          <div className="flex items-center gap-2 mb-5">
            <ImageIcon className="h-6 w-6 text-ciruela" />
            <h3 className="font-semibold text-foreground">Imagen</h3>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <div className="flex items-center justify-between mb-1">
                <label htmlFor="iafarma-brief" className="block text-sm font-medium text-foreground">
                  ¿Qué quieres comunicar?
                </label>
                <span className="text-xs text-muted-foreground">{brief.length}/200</span>
              </div>
              <Textarea
                id="iafarma-brief"
                value={brief}
                maxLength={200}
                onChange={(e) => setBrief(e.target.value)}
                placeholder="ej: consejos para cuidar la piel esta temporada"
                className="min-h-[72px] resize-none"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Escribe solo el tema: IAFarma redacta el titular y los textos de la pieza por ti.
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-2">Tipo de pieza</label>
              <div className="grid grid-cols-2 gap-2">
                {PIECE_TYPES.map((p) => {
                  const Icon = PIECE_ICONS[p.id];
                  const selected = p.id === piece;
                  return (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => handleSelectPiece(p.id)}
                      aria-pressed={selected}
                      className={`text-left rounded-lg border p-3 transition-colors ${
                        selected
                          ? 'border-ciruela bg-ciruela-soft ring-1 ring-ciruela'
                          : 'border-border hover:border-ciruela hover:bg-ciruela-soft'
                      }`}
                    >
                      <Icon
                        className={`h-4 w-4 mb-1.5 ${selected ? 'text-ciruela' : 'text-muted-foreground'}`}
                      />
                      <span className="block text-sm font-medium text-foreground">{p.label}</span>
                      <span className="block text-xs text-muted-foreground">{p.hint}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label htmlFor="iafarma-headline" className="block text-sm font-medium text-foreground">
                  Titular <span className="font-normal text-muted-foreground">(opcional)</span>
                </label>
                <span className="text-xs text-muted-foreground">
                  {headline.length}/{HEADLINE_MAX}
                </span>
              </div>
              <Input
                id="iafarma-headline"
                value={headline}
                maxLength={HEADLINE_MAX}
                onChange={(e) => setHeadline(e.target.value)}
                placeholder={`ej: ${pieceInfo.headlineExample}`}
              />
              <p className="text-xs text-muted-foreground mt-1">
                Se rotula tal cual en la imagen. Si lo dejas vacío, IAFarma lo escribe por ti.
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-2">Estilo</label>
              <div className="flex flex-wrap gap-2">
                {IMAGE_STYLES.map((s) => {
                  const selected = s.id === style;
                  return (
                    <button
                      key={s.id}
                      type="button"
                      onClick={() => setStyle(s.id)}
                      aria-pressed={selected}
                      title={s.hint}
                      className={`rounded-full border px-3 py-1.5 text-xs font-medium transition-colors ${
                        selected
                          ? 'border-ciruela bg-ciruela text-primary-foreground'
                          : 'border-border text-muted-foreground hover:border-ciruela'
                      }`}
                    >
                      {s.label}
                    </button>
                  );
                })}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Diseño gráfico crea una pieza con titular e iconos; Fotografía crea una escena realista.
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-2">Formato</label>
              <div className="flex flex-wrap gap-2">
                {IMAGE_FORMATS.map((f) => {
                  const selected = f.id === format;
                  return (
                    <button
                      key={f.id}
                      type="button"
                      onClick={() => setFormat(f.id)}
                      aria-pressed={selected}
                      title={f.hint}
                      className={`rounded-full border px-3 py-1.5 text-xs font-medium transition-colors ${
                        selected
                          ? 'border-ciruela bg-ciruela text-primary-foreground'
                          : 'border-border text-muted-foreground hover:border-ciruela'
                      }`}
                    >
                      {f.label}
                    </button>
                  );
                })}
              </div>
            </div>

            <div>
              <button
                type="button"
                onClick={() => setShowAdvanced(!showAdvanced)}
                className="text-xs font-medium text-muted-foreground hover:text-ciruela underline underline-offset-2"
              >
                {showAdvanced ? 'Ocultar ajustes avanzados' : 'Ajustes avanzados: describe tú la pieza'}
              </button>
              {showAdvanced && (
                <div className="mt-2">
                  <label className="block text-sm font-medium text-foreground mb-1">Describe la imagen</label>
                  <Textarea
                    value={prompt}
                    onChange={(e) => {
                      setTouched(true);
                      setPrompt(e.target.value);
                    }}
                    placeholder="ej: Promoción de protección solar, producto destacado, tono profesional"
                    className="min-h-[120px] resize-none"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Describe la PIEZA (composición, elementos, colores), no tu farmacia. Los textos
                    que deban salir escritos ponlos literales.
                  </p>
                </div>
              )}
            </div>

            <Button
              type="submit"
              disabled={loading || !canSubmit}
              className="w-full bg-primary hover:bg-primary/90 text-primary-foreground"
              size="lg"
            >
              {loading ? (
                <>
                  <div className="h-4 w-4 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin mr-2" />
                  Generando imagen...
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4 mr-2" />
                  Generar imagen
                </>
              )}
            </Button>
            {!canSubmit && !loading && (
              <p className="text-xs text-muted-foreground text-center -mt-2">
                Escribe qué quieres comunicar para generar (cada imagen gasta 1 crédito).
              </p>
            )}

            {(imageUrl || error) && (
              <Button
                type="button"
                variant="ghost"
                onClick={handleReset}
                className="w-full text-muted-foreground hover:text-foreground"
                size="sm"
              >
                Empezar de nuevo
              </Button>
            )}
          </form>
        </div>
      </motion.div>

      <div className="lg:col-span-3">
        <ImageResult
          loading={loading}
          imageUrl={imageUrl}
          revisedPrompt={revisedPrompt}
          remainingLabel={remainingLabel}
          remaining={remaining}
          copy={copy}
          error={error}
          downloading={downloading}
          isPaid={isPaid}
          previewAspect={previewAspect}
          onDownload={handleDownload}
          onRegenerate={() => handleSubmit()}
        />
      </div>
    </div>
  );
};

/**
 * Packs de recarga de créditos de imagen. Con PACKS_CHECKOUT_READY el clic lanza
 * el checkout de Stripe (create-checkout con { pack }); mientras no esté, informa
 * de que la recarga instantánea llega con el pago online.
 */
const ImageCreditPacks = () => {
  const { toast } = useToast();
  const [buying, setBuying] = useState<number | null>(null);

  const handleBuy = async (credits: number) => {
    if (!PACKS_CHECKOUT_READY) {
      toast({
        title: 'Muy pronto',
        description:
          'La recarga instantánea de créditos llega en unos días con el pago online. De momento, escríbenos desde tu perfil.',
      });
      return;
    }
    setBuying(credits);
    try {
      const { data, error } = await supabase.functions.invoke('create-checkout', {
        body: { pack: credits },
      });
      const url = (data as { url?: string } | null)?.url;
      if (error || !url) throw new Error('No se pudo iniciar el pago. Inténtalo de nuevo.');
      window.location.href = url;
    } catch (err) {
      toast({
        title: 'Error',
        description: err instanceof Error ? err.message : 'No se pudo iniciar el pago.',
        variant: 'destructive',
      });
    } finally {
      setBuying(null);
    }
  };

  return (
    <div className="w-full max-w-sm space-y-2">
      {IMAGE_ADDONS.map((pack) => (
        <button
          key={pack.credits}
          type="button"
          onClick={() => handleBuy(pack.credits)}
          disabled={buying !== null}
          className="w-full flex items-center justify-between rounded-lg border border-border bg-card px-4 py-3 hover:border-ciruela hover:bg-ciruela-soft transition-colors disabled:opacity-60"
        >
          <span className="text-sm font-medium text-foreground">
            {pack.credits} créditos de imagen
          </span>
          <span className="text-sm font-semibold text-ciruela">
            {buying === pack.credits ? 'Abriendo pago...' : formatPrice(pack.price)}
          </span>
        </button>
      ))}
      <p className="text-xs text-muted-foreground text-left pt-1">
        Pago único. Los créditos no caducan: quedan en tu cuenta hasta que los usas.
      </p>
    </div>
  );
};

/** Mensajes de progreso durante la generación (copy → imagen tarda ~30-60 s). */
const LOADING_STEPS: { at: number; text: string }[] = [
  { at: 0, text: 'IAFarma está escribiendo el copy de tu pieza…' },
  { at: 8, text: 'Dibujando la pieza con tu titular…' },
  { at: 30, text: 'Últimos retoques: las piezas con texto tardan un poco más…' },
];

const LoadingSteps = () => {
  const [elapsed, setElapsed] = useState(0);
  useEffect(() => {
    const interval = setInterval(() => setElapsed((e) => e + 1), 1000);
    return () => clearInterval(interval);
  }, []);
  const current = [...LOADING_STEPS].reverse().find((s) => elapsed >= s.at) ?? LOADING_STEPS[0];
  return (
    <div className="min-h-[500px] rounded-lg border border-border bg-card flex flex-col items-center justify-center text-center p-8">
      <div className="h-10 w-10 border-2 border-ciruela border-t-transparent rounded-full animate-spin mb-4" />
      <p className="text-muted-foreground text-sm">{current.text}</p>
    </div>
  );
};

interface ImageResultProps {
  loading: boolean;
  imageUrl: string | null;
  revisedPrompt: string | null;
  remainingLabel: string | null;
  remaining: number | null;
  copy: ReturnType<typeof useImageGeneration>['copy'];
  error: ReturnType<typeof useImageGeneration>['error'];
  downloading: boolean;
  isPaid: boolean;
  /** [ancho, alto] del formato generado, para previsualizar el recorte real. */
  previewAspect: number[] | null;
  onDownload: () => void;
  onRegenerate: () => void;
}

const ImageResult = ({
  loading,
  imageUrl,
  revisedPrompt,
  remainingLabel,
  remaining,
  copy,
  error,
  downloading,
  isPaid,
  previewAspect,
  onDownload,
  onRegenerate,
}: ImageResultProps) => {
  if (loading) {
    return <LoadingSteps />;
  }

  if (error?.code === 'quota') {
    return (
      <div className="min-h-[500px] rounded-lg bg-ciruela-soft flex flex-col items-center justify-center text-center p-8">
        <div className="flex items-center justify-center w-14 h-14 rounded-lg bg-ciruela text-primary-foreground mb-5">
          <ImageIcon className="h-7 w-7" />
        </div>
        <h3 className="text-lg font-bold text-foreground mb-2">
          Te has quedado sin créditos de imagen
        </h3>
        {isPaid ? (
          <>
            <p className="text-muted-foreground mb-6 max-w-sm">
              Recarga créditos al momento con un pack y sigue creando. No caducan.
            </p>
            <ImageCreditPacks />
            <Button asChild variant="ghost" className="mt-4 text-muted-foreground hover:text-foreground" size="sm">
              <Link to="/precios">Ver planes</Link>
            </Button>
          </>
        ) : (
          <>
            <p className="text-muted-foreground mb-6 max-w-sm">
              Tu plan Gratis incluye 1 imagen al mes. Con Plus tienes texto ilimitado, 1 imagen al
              mes y packs de recarga que no caducan.
            </p>
            <Button asChild className="bg-primary hover:bg-primary/90 text-primary-foreground">
              <Link to="/precios">Hazte Plus</Link>
            </Button>
          </>
        )}
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-[500px] rounded-lg border border-dashed border-destructive/30 bg-destructive/5 flex flex-col items-center justify-center text-center p-8">
        <p className="text-destructive font-medium">No se pudo generar la imagen</p>
        <p className="text-destructive/80 text-sm mt-1 max-w-sm">{error.message}</p>
        <p className="text-muted-foreground text-xs mt-3 max-w-sm">
          Tranquilidad: cuando la generación falla, el crédito se devuelve solo a tu cuenta.
        </p>
      </div>
    );
  }

  if (!imageUrl) {
    return (
      <div className="min-h-[500px] rounded-lg border border-dashed border-border bg-secondary/50 flex flex-col items-center justify-center text-center p-8">
        <ImageIcon className="h-12 w-12 text-ciruela/60 mb-4" />
        <p className="text-muted-foreground text-lg font-medium">Tu imagen aparecerá aquí</p>
        <p className="text-muted-foreground text-sm mt-1">
          Elige el tipo de pieza, describe la imagen y pulsa "Generar imagen"
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="rounded-lg ring-1 ring-border bg-card p-4 shadow-sm"
      >
        <span className="text-xs font-semibold text-ciruela block mb-3">Imagen generada</span>
        <img
          src={imageUrl}
          alt="Imagen generada por IAFarma"
          className="w-full rounded-lg ring-1 ring-border object-cover"
          style={previewAspect ? { aspectRatio: `${previewAspect[0]} / ${previewAspect[1]}` } : undefined}
        />
        {copy && (
          <div className="mt-4 rounded-lg bg-ciruela-soft p-4">
            <span className="text-xs font-semibold text-ciruela block mb-2">
              Texto de la pieza (escrito por IAFarma)
            </span>
            <p className="text-sm font-semibold text-foreground">{copy.headline}</p>
            {copy.lines.length > 0 && (
              <ul className="mt-1.5 space-y-0.5">
                {copy.lines.map((line, i) => (
                  <li key={i} className="text-sm text-muted-foreground">
                    · {line}
                  </li>
                ))}
              </ul>
            )}
            <button
              type="button"
              onClick={onRegenerate}
              className="mt-3 text-xs font-medium text-ciruela hover:text-ciruela/80 underline underline-offset-2"
            >
              ¿No te convence? Regenerar pieza (gasta 1 crédito)
            </button>
          </div>
        )}
        {revisedPrompt && (
          <p className="text-xs text-muted-foreground mt-3 leading-relaxed">
            <span className="font-medium text-muted-foreground">Descripción usada: </span>
            {revisedPrompt}
          </p>
        )}
      </motion.div>

      <div className="flex flex-wrap items-center gap-3">
        <Button
          onClick={onDownload}
          disabled={downloading}
          className="bg-primary hover:bg-primary/90 text-primary-foreground"
        >
          {downloading ? (
            <>
              <div className="h-4 w-4 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin mr-2" />
              Descargando...
            </>
          ) : (
            <>
              <Download className="h-4 w-4 mr-2" />
              Descargar
            </>
          )}
        </Button>
        {remainingLabel && (
          <span className="inline-flex items-center rounded-full bg-ciruela-soft px-3 py-1 text-xs font-bold tabular-nums text-ciruela">
            {remainingLabel}
          </span>
        )}
        {remaining === 0 && isPaid && (
          <Button asChild variant="outline" size="sm" className="border-ciruela text-ciruela hover:bg-ciruela-soft">
            <Link to="/precios">Recargar créditos</Link>
          </Button>
        )}
        {remaining === 0 && !isPaid && (
          <Button asChild variant="outline" size="sm" className="border-ciruela text-ciruela hover:bg-ciruela-soft">
            <Link to="/precios">Hazte Plus</Link>
          </Button>
        )}
      </div>
    </div>
  );
};
