import { useCallback, useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { ContentType } from '@/hooks/useCreativeChat';

/**
 * Historial de lo generado en IAFarma (textos e imágenes), para que al volver
 * a la herramienta no se pierda lo ya hecho.
 *
 * Textos: tabla `ai_creative_generations` (la escribe el cliente al terminar
 * cada generación; el trigger de BD poda a 50 por usuario). Imágenes:
 * `generated_images` (la escribe la edge `ai-generate-image`); la URL guardada
 * es firmada y caduca, así que se vuelve a firmar desde `storage_path`.
 */
export interface HistoryText {
  id: string;
  contentType: ContentType | string;
  brief: string | null;
  output: string;
  createdAt: string;
}

export interface HistoryImage {
  id: string;
  prompt: string | null;
  url: string | null;
  createdAt: string;
}

const TEXT_LIMIT = 12;
const IMAGE_LIMIT = 8;

export const useIAFarmaHistory = (enabled = true) => {
  const [texts, setTexts] = useState<HistoryText[]>([]);
  const [images, setImages] = useState<HistoryImage[]>([]);
  const [loading, setLoading] = useState(enabled);

  const refresh = useCallback(async () => {
    if (!enabled) return;
    setLoading(true);
    const [textsRes, imagesRes] = await Promise.all([
      supabase
        .from('ai_creative_generations')
        .select('id, content_type, brief, output, created_at')
        .order('created_at', { ascending: false })
        .limit(TEXT_LIMIT),
      supabase
        .from('generated_images')
        .select('id, prompt, storage_path, created_at')
        .order('created_at', { ascending: false })
        .limit(IMAGE_LIMIT),
    ]);

    if (!textsRes.error && textsRes.data) {
      setTexts(
        textsRes.data.map((t) => ({
          id: t.id,
          contentType: t.content_type,
          brief: t.brief,
          output: t.output,
          createdAt: t.created_at,
        })),
      );
    }

    if (!imagesRes.error && imagesRes.data) {
      const rows = imagesRes.data.filter((i) => i.storage_path);
      let signed: Record<string, string> = {};
      if (rows.length > 0) {
        const { data: urls } = await supabase.storage
          .from('iafarma-images')
          .createSignedUrls(rows.map((r) => r.storage_path as string), 60 * 60);
        signed = Object.fromEntries((urls || []).filter((u) => u.signedUrl && u.path).map((u) => [u.path as string, u.signedUrl]));
      }
      setImages(
        rows.map((i) => ({
          id: i.id,
          prompt: i.prompt,
          url: signed[i.storage_path as string] ?? null,
          createdAt: i.created_at,
        })),
      );
    }
    setLoading(false);
  }, [enabled]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  /** Guarda un texto terminado. Falla en silencio: el historial nunca debe romper la generación. */
  const saveText = useCallback(async (contentType: string, brief: string, output: string) => {
    if (!output.trim()) return;
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { error } = await supabase
      .from('ai_creative_generations')
      .insert({ user_id: user.id, content_type: contentType, brief: brief.slice(0, 2000), output });
    if (error) {
      console.error('No se pudo guardar el historial de IAFarma:', error);
      return;
    }
    void refresh();
  }, [refresh]);

  const deleteText = useCallback(async (id: string) => {
    const { error } = await supabase.from('ai_creative_generations').delete().eq('id', id);
    if (!error) setTexts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  return { texts, images, loading, refresh, saveText, deleteText };
};
