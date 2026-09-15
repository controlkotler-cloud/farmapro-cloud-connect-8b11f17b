
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface Resource {
  id: string;
  /** Identificador estable para enlazar a un recurso concreto desde fuera
      (p. ej. el resumen de los lunes enlaza /recursos?r=<slug>). */
  slug: string | null;
  title: string;
  description: string;
  category: string;
  type: string;
  file_url: string;
  format: string;
  is_premium: boolean;
  /** Descargable entregado con una newsletter Impulso: no consume el tope de
      3 descargas del plan Gratis (decisión Francesc 15-09-2026, se prometió
      gratis desde N1). Ver src/pages/Recursos.tsx handleDownload. */
  is_newsletter: boolean;
  created_at: string;
}

export const useResources = () => {
  const [resources, setResources] = useState<Resource[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadResources();
  }, []);

  const loadResources = async () => {
    setLoading(true);
    // Cargamos TODOS los recursos publicados una sola vez. El filtrado por
    // categoría, tipo, acceso y orden se hace en cliente (la página filtra).
    // `is_newsletter` es columna nueva (ventana-descargables-impulso-2026-09-15.sql)
    // y aún no está en los types generados: de ahí el `as any` del cliente.
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await (supabase as any)
      .from('resources')
      .select('id, slug, title, description, category, type, file_url, format, is_premium, is_newsletter, created_at')
      .eq('is_published', true)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error loading resources:', error);
      setResources([]);
    } else {
      const transformedData: Resource[] = (data || []).map(resource => ({
        id: resource.id,
        slug: resource.slug ?? null,
        title: resource.title,
        description: resource.description || '',
        category: resource.category || 'otros',
        type: resource.type || 'otro',
        file_url: resource.file_url || '',
        format: resource.format || 'pdf',
        is_premium: resource.is_premium,
        is_newsletter: resource.is_newsletter ?? false,
        created_at: resource.created_at,
      }));
      setResources(transformedData);
    }
    setLoading(false);
  };

  return {
    resources,
    loading,
  };
};
