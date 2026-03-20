
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { FileText } from 'lucide-react';
import { ResourceCard } from './ResourceCard';

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

interface ResourcesGridProps {
  resources: Resource[];
  loading: boolean;
  searchTerm: string;
  onDownload: (resource: Resource) => void;
}

export const ResourcesGrid = ({ resources, loading, searchTerm, onDownload }: ResourcesGridProps) => {
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[...Array(6)].map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardHeader>
              <div className="h-4 bg-gray-200 rounded w-3/4"></div>
              <div className="h-3 bg-gray-200 rounded w-1/2"></div>
            </CardHeader>
            <CardContent>
              <div className="h-20 bg-gray-200 rounded"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (resources.length === 0) {
    return (
      <motion.div 
        className="text-center py-12"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <FileText className="h-16 w-16 text-gray-300 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">No se encontraron recursos</h3>
        <p className="text-gray-500">
          {searchTerm ? 'Intenta con otros términos de búsqueda' : 'No hay recursos disponibles en esta categoría'}
        </p>
      </motion.div>
    );
  }

  return (
    <motion.div 
      className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      {resources.map((resource, index) => (
        <ResourceCard
          key={resource.id}
          resource={resource}
          index={index}
          onDownload={onDownload}
        />
      ))}
    </motion.div>
  );
};
