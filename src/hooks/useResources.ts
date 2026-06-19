
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface Resource {
  id: string;
  title: string;
  description: string;
  category: string;
  type: string;
  file_url: string;
  format: string;
  is_premium: boolean;
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
    const { data, error } = await supabase
      .from('resources')
      .select('id, title, description, category, type, file_url, format, is_premium, created_at')
      .eq('is_published', true)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error loading resources:', error);
      setResources([]);
    } else {
      const transformedData: Resource[] = (data || []).map(resource => ({
        id: resource.id,
        title: resource.title,
        description: resource.description || '',
        category: resource.category || 'otros',
        type: resource.type || 'otro',
        file_url: resource.file_url || '',
        format: resource.format || 'pdf',
        is_premium: resource.is_premium,
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
