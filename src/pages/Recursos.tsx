
import { useState } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useResources } from '@/hooks/useResources';
import { ResourcesHeader } from '@/components/resources/ResourcesHeader';
import { ResourcesSearch } from '@/components/resources/ResourcesSearch';
import { ResourcesCategoryTabs } from '@/components/resources/ResourcesCategoryTabs';
import { ResourcesGrid } from '@/components/resources/ResourcesGrid';

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

export const Recursos = () => {
  const { profile } = useAuth();
  const { toast } = useToast();
  const { resources, loading, selectedCategory, setSelectedCategory } = useResources();
  const [searchTerm, setSearchTerm] = useState('');

  const handleDownload = async (resource: Resource) => {
    if (resource.is_premium && (!profile?.subscription_role || profile.subscription_role === 'freemium')) {
      toast({
        title: "Recurso Premium",
        description: "Necesitas una suscripción premium para descargar este recurso.",
        variant: "destructive"
      });
      return;
    }

    try {
      if (profile?.id) {
        await supabase.rpc('add_user_points', {
          user_id: profile.id,
          points: 25
        });
      }
    } catch (error) {
      console.error('Error adding points:', error);
    }

    window.open(resource.file_url, '_blank');
    
    toast({
      title: "Descarga iniciada",
      description: `Has ganado 25 puntos por descargar ${resource.title}`,
    });
  };

  const filteredResources = resources.filter(resource =>
    resource.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    resource.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <motion.div 
      className="space-y-8"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ staggerChildren: 0.1 }}
    >
      <ResourcesHeader />
      
      <ResourcesSearch 
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
      />

      <ResourcesCategoryTabs 
        selectedCategory={selectedCategory}
        onCategoryChange={setSelectedCategory}
      />

      <ResourcesGrid 
        resources={filteredResources}
        loading={loading}
        searchTerm={searchTerm}
        onDownload={handleDownload}
      />
    </motion.div>
  );
};
