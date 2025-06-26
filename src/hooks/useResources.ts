
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface Resource {
  id: string;
  title: string;
  description: string;
  category: string;
  file_url: string;
  format: string;
  is_premium: boolean;
  created_at: string;
}

export const useResources = () => {
  const [resources, setResources] = useState<Resource[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('all');

  useEffect(() => {
    loadResources();
  }, [selectedCategory]);

  const loadResources = async () => {
    setLoading(true);
    let query = supabase.from('resources').select('*').order('created_at', { ascending: false });
    
    if (selectedCategory !== 'all') {
      query = query.eq('category', selectedCategory as any);
    }

    const { data, error } = await query;
    if (error) {
      console.error('Error loading resources:', error);
    } else {
      const transformedData = data?.map(resource => ({
        ...resource,
        format: resource.format || 'pdf'
      })) || [];
      setResources(transformedData);
    }
    setLoading(false);
  };

  return {
    resources,
    loading,
    selectedCategory,
    setSelectedCategory
  };
};
