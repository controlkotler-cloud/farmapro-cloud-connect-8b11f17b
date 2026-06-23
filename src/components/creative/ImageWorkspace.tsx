import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Download, ImageIcon, Sparkles } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { IAFarmaDefaults } from '@/hooks/useIAFarmaDefaults';
import { useImageGeneration } from '@/hooks/useImageGeneration';

interface ImageWorkspaceProps {
  defaults: IAFarmaDefaults;
}

/**
 * Construye una descripción inicial para la imagen combinando los datos de la
 * farmacia (PharmacyDefaults / useIAFarmaDefaults). El usuario puede editarla
 * libremente antes de generar.
 */
const buildDefaultPrompt = (defaults: IAFarmaDefaults): string => {
  const lugar = defaults.localidad?.trim();
  const tono = defaults.tono?.trim();

  const parts: string[] = [];
  parts.push(lugar ? `Escaparate de farmacia en ${lugar}` : 'Escaparate de farmacia');
  parts.push('protección solar');
  parts.push(tono ? `tono ${tono.toLowerCase()}` : 'tono profesional');

  return parts.join(', ');
};

const formatToday = (): string => {
  const now = new Date();
  const yyyy = now.getFullYear();
  const mm = String(now.getMonth() + 1).padStart(2, '0');
  const dd = String(now.getDate()).padStart(2, '0');
  return `${yyyy}${mm}${dd}`;
};

export const ImageWorkspace = ({ defaults }: ImageWorkspaceProps) => {
  const { toast } = useToast();
  const { generate, loading, imageUrl, revisedPrompt, remaining, error, reset } = useImageGeneration();
  const [prompt, setPrompt] = useState('');
  const [touched, setTouched] = useState(false);
  const [downloading, setDownloading] = useState(false);

  // Precargar la descripción con los datos de la farmacia mientras el usuario no
  // la haya editado. Si la toca, respetamos su texto.
  useEffect(() => {
    if (!touched) {
      setPrompt(buildDefaultPrompt(defaults));
    }
  }, [defaults, touched]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!prompt.trim()) return;
    generate(prompt);
  };

  const handleReset = () => {
    reset();
    setTouched(false);
    setPrompt(buildDefaultPrompt(defaults));
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
      anchor.download = `iafarma-${formatToday()}.png`;
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
      ? `Te queda ${remaining} ${remaining === 1 ? 'imagen' : 'imágenes'} este mes`
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
              <label className="block text-sm font-medium text-gray-700 mb-1">Describe la imagen</label>
              <Textarea
                value={prompt}
                onChange={e => {
                  setTouched(true);
                  setPrompt(e.target.value);
                }}
                placeholder="ej: Escaparate de farmacia en Tarragona, protección solar, tono profesional"
                className="min-h-[140px] resize-none"
              />
              <p className="text-xs text-gray-500 mt-1">
                Hemos rellenado una descripción con los datos de tu farmacia. Edítala como quieras.
              </p>
            </div>

            <Button
              type="submit"
              disabled={loading || !prompt.trim()}
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
          error={error}
          downloading={downloading}
          onDownload={handleDownload}
        />
      </div>
    </div>
  );
};

interface ImageResultProps {
  loading: boolean;
  imageUrl: string | null;
  revisedPrompt: string | null;
  remainingLabel: string | null;
  error: ReturnType<typeof useImageGeneration>['error'];
  downloading: boolean;
  onDownload: () => void;
}

const ImageResult = ({
  loading,
  imageUrl,
  revisedPrompt,
  remainingLabel,
  error,
  downloading,
  onDownload,
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
        <h3 className="text-lg font-bold text-gray-900 mb-2">Has agotado tu imagen de este mes</h3>
        <p className="text-gray-500 mb-6 max-w-sm">
          Mejora tu plan para seguir generando imágenes para tus publicaciones.
        </p>
        <Button asChild className="bg-green-500 hover:bg-green-600 text-white" size="lg">
          <Link to="/precios">
            <Sparkles className="h-4 w-4 mr-2" />
            Ver planes
          </Link>
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
        <p className="text-gray-400 text-sm mt-1">Describe la imagen y pulsa "Generar imagen"</p>
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
      </div>
    </div>
  );
};
