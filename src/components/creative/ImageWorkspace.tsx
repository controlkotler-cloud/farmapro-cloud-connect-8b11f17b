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
import { IAFarmaDefaults } from '@/hooks/useIAFarmaDefaults';
import { useImageGeneration } from '@/hooks/useImageGeneration';
import { IMAGE_ADDONS, PACKS_CHECKOUT_READY } from '@/lib/plans';
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

export const ImageWorkspace = ({ defaults }: ImageWorkspaceProps) => {
  const { toast } = useToast();
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

  const pieceInfo = getPieceType(piece);

  // Precargar la descripción con la plantilla de pieza + datos de la farmacia
  // mientras el usuario no la haya editado. Si la toca, respetamos su texto.
  useEffect(() => {
    if (!touched) {
      setPrompt(pieceInfo.buildPrompt(defaults));
    }
  }, [defaults, pieceInfo, touched]);

  const handleSelectPiece = (id: PieceTypeId) => {
    setPiece(id);
    setFormat(getPieceType(id).defaultFormat);
  };

  const canSubmit = Boolean(brief.trim() || prompt.trim());

  const handleSubmit = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!canSubmit || loading) return;
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
      const blob = await response.blob();
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
        } de imagen este mes`
      : null;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
      <motion.div
        className="lg:col-span-2"
        initial={{ opacity: 0, x: -12 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.3 }}
      >
        <div className="bg-white rounded-xl ring-1 ring-gray-100 shadow-sm p-6 sticky top-4">
          <div className="flex items-center gap-2 mb-5">
            <ImageIcon className="h-6 w-6 text-green-600" />
            <h3 className="font-semibold text-gray-800">Imagen</h3>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <div className="flex items-center justify-between mb-1">
                <label htmlFor="iafarma-brief" className="block text-sm font-medium text-gray-700">
                  ¿Qué quieres comunicar?
                </label>
                <span className="text-xs text-gray-400">{brief.length}/200</span>
              </div>
              <Textarea
                id="iafarma-brief"
                value={brief}
                maxLength={200}
                onChange={(e) => setBrief(e.target.value)}
                placeholder="ej: consejos para tomar el sol este verano"
                className="min-h-[72px] resize-none"
              />
              <p className="text-xs text-gray-500 mt-1">
                Escribe solo el tema: IAFarma redacta el titular y los textos de la pieza por ti.
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Tipo de pieza</label>
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
                          ? 'border-green-500 bg-green-50 ring-1 ring-green-500'
                          : 'border-gray-200 hover:border-green-300 hover:bg-green-50/40'
                      }`}
                    >
                      <Icon
                        className={`h-4 w-4 mb-1.5 ${selected ? 'text-green-600' : 'text-gray-400'}`}
                      />
                      <span className="block text-sm font-medium text-gray-800">{p.label}</span>
                      <span className="block text-xs text-gray-500">{p.hint}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label htmlFor="iafarma-headline" className="block text-sm font-medium text-gray-700">
                  Titular <span className="font-normal text-gray-400">(opcional)</span>
                </label>
                <span className="text-xs text-gray-400">
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
              <p className="text-xs text-gray-500 mt-1">
                Se rotula tal cual en la imagen. Si lo dejas vacío, IAFarma lo escribe por ti.
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Estilo</label>
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
                          ? 'border-green-500 bg-green-500 text-white'
                          : 'border-gray-200 text-gray-600 hover:border-green-300'
                      }`}
                    >
                      {s.label}
                    </button>
                  );
                })}
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Diseño gráfico crea una pieza con titular e iconos; Fotografía crea una escena realista.
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Formato</label>
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
                          ? 'border-green-500 bg-green-500 text-white'
                          : 'border-gray-200 text-gray-600 hover:border-green-300'
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
                className="text-xs font-medium text-gray-500 hover:text-green-700 underline underline-offset-2"
              >
                {showAdvanced ? 'Ocultar ajustes avanzados' : 'Ajustes avanzados: describe tú la pieza'}
              </button>
              {showAdvanced && (
                <div className="mt-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Describe la imagen</label>
                  <Textarea
                    value={prompt}
                    onChange={(e) => {
                      setTouched(true);
                      setPrompt(e.target.value);
                    }}
                    placeholder="ej: Promoción de protección solar, producto destacado, tono profesional"
                    className="min-h-[120px] resize-none"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Describe la PIEZA (composición, elementos, colores), no tu farmacia. Los textos
                    que deban salir escritos ponlos literales.
                  </p>
                </div>
              )}
            </div>

            <Button
              type="submit"
              disabled={loading || !canSubmit}
              className="w-full bg-green-500 hover:bg-green-600 text-white"
              size="lg"
            >
              {loading ? (
                <>
                  <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                  Generando imagen...
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4 mr-2" />
                  Generar imagen
                </>
              )}
            </Button>

            {(imageUrl || error) && (
              <Button
                type="button"
                variant="ghost"
                onClick={handleReset}
                className="w-full text-gray-500 hover:text-gray-700"
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
          className="w-full flex items-center justify-between rounded-lg border border-green-200 bg-white px-4 py-3 hover:border-green-400 hover:bg-green-50/50 transition-colors disabled:opacity-60"
        >
          <span className="text-sm font-medium text-gray-800">
            {pack.credits} créditos de imagen
          </span>
          <span className="text-sm font-semibold text-green-700">
            {buying === pack.credits ? 'Abriendo pago...' : formatPrice(pack.price)}
          </span>
        </button>
      ))}
      <p className="text-xs text-gray-400 text-left pt-1">
        Pago único, sin caducidad mensual. Disponible en los planes Plus y Equipo.
      </p>
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
  onDownload,
  onRegenerate,
}: ImageResultProps) => {
  if (loading) {
    return (
      <div className="min-h-[500px] rounded-xl border border-green-100 bg-white flex flex-col items-center justify-center text-center p-8">
        <div className="h-10 w-10 border-2 border-green-400 border-t-transparent rounded-full animate-spin mb-4" />
        <p className="text-gray-500 text-sm">Creando tu imagen, esto puede tardar unos segundos...</p>
      </div>
    );
  }

  if (error?.code === 'quota') {
    return (
      <div className="min-h-[500px] rounded-xl bg-gradient-to-br from-green-50 via-white to-emerald-50 ring-1 ring-green-100 flex flex-col items-center justify-center text-center p-8">
        <div className="flex items-center justify-center w-14 h-14 rounded-2xl bg-green-100 text-green-600 mb-5">
          <ImageIcon className="h-7 w-7" />
        </div>
        <h3 className="text-lg font-bold text-gray-900 mb-2">
          Has gastado tus créditos de imagen de este mes
        </h3>
        <p className="text-gray-500 mb-6 max-w-sm">
          Recarga créditos al momento con un pack o mejora tu plan para seguir creando.
        </p>
        <ImageCreditPacks />
        <Button asChild variant="ghost" className="mt-4 text-gray-500 hover:text-gray-700" size="sm">
          <Link to="/precios">Ver planes</Link>
        </Button>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-[500px] rounded-xl border border-dashed border-red-200 bg-red-50/40 flex flex-col items-center justify-center text-center p-8">
        <p className="text-red-600 font-medium">No se pudo generar la imagen</p>
        <p className="text-red-500/80 text-sm mt-1 max-w-sm">{error.message}</p>
      </div>
    );
  }

  if (!imageUrl) {
    return (
      <div className="min-h-[500px] rounded-xl border border-dashed border-gray-200 bg-gray-50/50 flex flex-col items-center justify-center text-center p-8">
        <ImageIcon className="h-12 w-12 text-green-300 mb-4" />
        <p className="text-gray-400 text-lg font-medium">Tu imagen aparecerá aquí</p>
        <p className="text-gray-400 text-sm mt-1">
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
        className="rounded-xl ring-1 ring-green-100 bg-white p-4 shadow-sm"
      >
        <span className="text-xs font-semibold text-green-600 block mb-3">Imagen generada</span>
        <img
          src={imageUrl}
          alt="Imagen generada por IAFarma"
          className="w-full rounded-lg ring-1 ring-gray-100"
        />
        {copy && (
          <div className="mt-4 rounded-lg bg-green-50/60 ring-1 ring-green-100 p-4">
            <span className="text-xs font-semibold text-green-700 block mb-2">
              Texto de la pieza (escrito por IAFarma)
            </span>
            <p className="text-sm font-semibold text-gray-800">{copy.headline}</p>
            {copy.lines.length > 0 && (
              <ul className="mt-1.5 space-y-0.5">
                {copy.lines.map((line, i) => (
                  <li key={i} className="text-sm text-gray-600">
                    · {line}
                  </li>
                ))}
              </ul>
            )}
            <button
              type="button"
              onClick={onRegenerate}
              className="mt-3 text-xs font-medium text-green-700 hover:text-green-800 underline underline-offset-2"
            >
              ¿No te convence? Regenerar pieza (gasta 1 crédito)
            </button>
          </div>
        )}
        {revisedPrompt && (
          <p className="text-xs text-gray-400 mt-3 leading-relaxed">
            <span className="font-medium text-gray-500">Descripción usada: </span>
            {revisedPrompt}
          </p>
        )}
      </motion.div>

      <div className="flex flex-wrap items-center gap-3">
        <Button
          onClick={onDownload}
          disabled={downloading}
          className="bg-green-500 hover:bg-green-600 text-white"
        >
          {downloading ? (
            <>
              <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
              Descargando...
            </>
          ) : (
            <>
              <Download className="h-4 w-4 mr-2" />
              Descargar
            </>
          )}
        </Button>
        {remainingLabel && <span className="text-sm text-gray-500">{remainingLabel}</span>}
        {remaining === 0 && (
          <Button asChild variant="outline" size="sm" className="border-green-300 text-green-700 hover:bg-green-50">
            <Link to="/precios">Recargar créditos</Link>
          </Button>
        )}
      </div>
    </div>
  );
};
