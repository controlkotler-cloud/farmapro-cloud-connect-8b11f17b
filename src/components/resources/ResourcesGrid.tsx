
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { FileText } from 'lucide-react';
import { ResourceCard } from './ResourceCard';

interface Resource {
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

interface ResourcesGridProps {
  resources: Resource[];
  loading: boolean;
  searchTerm: string;
  onDownload: (resource: Resource) => void;
  // Si hay filtros activos, el estado vacío ofrece "Quitar filtros".
  hasActiveFilters?: boolean;
  onClearFilters?: () => void;
}

export const ResourcesGrid = ({
  resources,
  loading,
  searchTerm,
  onDownload,
  hasActiveFilters,
  onClearFilters,
}: ResourcesGridProps) => {
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.05,
      },
    },
  };

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[...Array(6)].map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardHeader>
              <div className="h-4 bg-muted rounded w-3/4"></div>
              <div className="h-3 bg-muted rounded w-1/2"></div>
            </CardHeader>
            <CardContent>
              <div className="h-20 bg-muted rounded"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (resources.length === 0) {
    // Vacío honesto: sin filtros activos es el vault real (aún llenándose);
    // con filtros/búsqueda es un "no hay resultados" normal de exploración.
    return (
      <motion.div
        className="text-center py-12"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <FileText className="h-16 w-16 text-muted-foreground/40 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-foreground mb-2">
          {hasActiveFilters ? 'No hemos encontrado recursos' : 'El vault se está llenando'}
        </h3>
        <p className="text-muted-foreground mb-4">
          {searchTerm
            ? `No hay resultados para "${searchTerm}". Probad con otros términos o quitad algún filtro.`
            : hasActiveFilters
              ? 'No hay recursos que coincidan con los filtros seleccionados.'
              : 'Plantillas y guías listas para el mostrador, muy pronto.'}
        </p>
        {hasActiveFilters && onClearFilters && (
          <Button variant="outline" onClick={onClearFilters}>
            Quitar filtros
          </Button>
        )}
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
