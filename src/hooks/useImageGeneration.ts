import { useCallback, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

/**
 * Generación de imágenes de IAFarma (parte cliente).
 *
 * Llama a la edge function `ai-generate-image` mediante `supabase.functions.invoke`.
 * NO pasa por el stream de texto de `useCreativeChat`: la imagen es una llamada
 * puntual que devuelve una URL pública permanente de Supabase Storage.
 *
 * Contrato con el backend:
 *  - Petición: { prompt, size, style, headline?, pieceType? }
 *    `headline` (máx. 60 caracteres) se rotula LITERAL en la imagen y `pieceType`
 *    ('promo'|'cartel'|'post'|'story') ajusta la descripción. El backend anterior
 *    al punto 6 del prompt Lovable nº 1 ignora ambos campos sin romper.
 *  - Respuesta OK: { imageUrl, revisedPrompt?, remaining? }
 *  - Errores por código HTTP:
 *      402 → créditos de imagen agotados
 *      403 → sin acceso (free_locked)
 *      401 → sesión expirada
 */

export interface ImageGenerationOptions {
  size?: string;
  style?: string;
  /** Titular que debe aparecer rotulado tal cual en la imagen (máx. 60 caracteres). */
  headline?: string;
  /** Tipo de pieza: 'promo' | 'cartel' | 'post' | 'story'. */
  pieceType?: string;
  /** TEMA de la pieza (máx. 200 chars): dispara el copy automático en el backend. */
  brief?: string;
  /** Nombre de la farmacia para la firma al pie de la imagen. */
  pharmacyName?: string;
  /** Localidad para la firma al pie de la imagen. */
  locality?: string;
}

/** Copy generado por el backend (titular + líneas) e incluido en la imagen. */
export interface GeneratedCopy {
  headline: string;
  lines: string[];
}

/** Código de error normalizado para que la UI pueda reaccionar (p. ej. 402 → /precios). */
export type ImageGenerationErrorCode = 'quota' | 'forbidden' | 'unauthorized' | 'generic';

export interface ImageGenerationError {
  code: ImageGenerationErrorCode;
  message: string;
}

const DEFAULT_SIZE = '1024x1024';
const DEFAULT_STYLE = 'vivid';

/**
 * Intenta extraer el código de estado HTTP de un error de `functions.invoke`.
 * En `FunctionsHttpError` el campo `context` es la `Response` original.
 */
const extractStatus = (error: unknown): number | undefined => {
  if (!error || typeof error !== 'object') return undefined;
  const ctx = (error as { context?: unknown }).context;
  if (ctx && typeof ctx === 'object' && 'status' in ctx) {
    const status = (ctx as { status?: unknown }).status;
    if (typeof status === 'number') return status;
  }
  // Algunos errores exponen el estado directamente.
  const direct = (error as { status?: unknown }).status;
  return typeof direct === 'number' ? direct : undefined;
};

/** Intenta leer el cuerpo JSON de la `Response` adjunta al error (si existe). */
const extractBodyMessage = async (error: unknown): Promise<string | undefined> => {
  if (!error || typeof error !== 'object') return undefined;
  const ctx = (error as { context?: unknown }).context;
  if (ctx && typeof (ctx as Response).json === 'function') {
    try {
      const body = await (ctx as Response).clone().json();
      if (body && typeof body === 'object' && typeof body.error === 'string') {
        return body.error;
      }
    } catch {
      /* el cuerpo no es JSON o ya se consumió: se ignora */
    }
  }
  return undefined;
};

const messageForStatus = (status: number | undefined, fallback?: string): ImageGenerationError => {
  switch (status) {
    case 402:
      return { code: 'quota', message: 'Has gastado tus créditos de imagen de este mes' };
    case 403:
      return {
        code: 'forbidden',
        message: 'No tienes acceso a la generación de imágenes con tu plan actual.',
      };
    case 401:
      return { code: 'unauthorized', message: 'Sesión expirada. Por favor, vuelve a iniciar sesión.' };
    default:
      return { code: 'generic', message: fallback || 'No se pudo generar la imagen. Inténtalo de nuevo.' };
  }
};

export const useImageGeneration = () => {
  const [loading, setLoading] = useState(false);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [revisedPrompt, setRevisedPrompt] = useState<string | null>(null);
  const [remaining, setRemaining] = useState<number | null>(null);
  const [copy, setCopy] = useState<GeneratedCopy | null>(null);
  const [error, setError] = useState<ImageGenerationError | null>(null);
  const { toast } = useToast();

  const reset = useCallback(() => {
    setImageUrl(null);
    setRevisedPrompt(null);
    setRemaining(null);
    setCopy(null);
    setError(null);
  }, []);

  const generate = useCallback(
    async (prompt: string, opts?: ImageGenerationOptions) => {
      const trimmed = prompt.trim();
      if (!trimmed) return;

      setLoading(true);
      setError(null);
      setImageUrl(null);
      setRevisedPrompt(null);

      try {
        const headline = opts?.headline?.trim();
        const brief = opts?.brief?.trim();
        const pharmacyName = opts?.pharmacyName?.trim();
        const locality = opts?.locality?.trim();
        const { data, error: invokeError } = await supabase.functions.invoke('ai-generate-image', {
          body: {
            prompt: trimmed,
            size: opts?.size ?? DEFAULT_SIZE,
            style: opts?.style ?? DEFAULT_STYLE,
            ...(headline ? { headline } : {}),
            ...(opts?.pieceType ? { pieceType: opts.pieceType } : {}),
            ...(brief ? { brief } : {}),
            ...(pharmacyName ? { pharmacyName } : {}),
            ...(locality ? { locality } : {}),
          },
        });

        if (invokeError) {
          const status = extractStatus(invokeError);
          const bodyMessage = await extractBodyMessage(invokeError);
          const normalized = messageForStatus(
            status,
            bodyMessage || (invokeError instanceof Error ? invokeError.message : undefined),
          );
          setError(normalized);
          toast({
            title: normalized.code === 'quota' ? 'Sin imágenes disponibles' : 'Error',
            description: normalized.message,
            variant: 'destructive',
          });
          return;
        }

        const result = (data ?? {}) as {
          imageUrl?: string;
          revisedPrompt?: string;
          remaining?: number;
          copy?: GeneratedCopy | null;
        };

        if (!result.imageUrl) {
          const normalized = messageForStatus(undefined);
          setError(normalized);
          toast({ title: 'Error', description: normalized.message, variant: 'destructive' });
          return;
        }

        setImageUrl(result.imageUrl);
        setRevisedPrompt(result.revisedPrompt ?? null);
        setRemaining(typeof result.remaining === 'number' ? result.remaining : null);
        setCopy(
          result.copy && typeof result.copy.headline === 'string'
            ? { headline: result.copy.headline, lines: Array.isArray(result.copy.lines) ? result.copy.lines : [] }
            : null,
        );
      } catch (err) {
        const normalized = messageForStatus(
          undefined,
          err instanceof Error ? err.message : undefined,
        );
        setError(normalized);
        toast({ title: 'Error', description: normalized.message, variant: 'destructive' });
      } finally {
        setLoading(false);
      }
    },
    [toast],
  );

  return { generate, loading, imageUrl, revisedPrompt, remaining, copy, error, reset };
};
