import { motion } from 'framer-motion';
import { getResourceStyle } from '@/lib/resourceCategory';
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

interface ResourcesCategorySectionProps {
  category: string;
  resources: Resource[];
  onDownload: (resource: Resource) => void;
}

// Sección de una categoría dentro de la vista "Todos": cabecera (icono + label
// + "N recursos") y su sub-rejilla de tarjetas.
export const ResourcesCategorySection = ({ category, resources, onDownload }: ResourcesCategorySectionProps) => {
  if (resources.length === 0) return null;
  const style = getResourceStyle(category);
  const count = resources.length;

  return (
    <motion.section
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-4"
    >
      <div className="flex items-center gap-3">
        <div className={`p-2.5 rounded-lg ${style.bg} shadow-soft`}>
          <style.Icon className={`h-5 w-5 ${style.text}`} />
        </div>
        <div>
          <h2 className="text-xl font-bold text-foreground leading-tight">{style.label}</h2>
          <p className="text-sm text-muted-foreground">
            {count} {count === 1 ? 'recurso' : 'recursos'}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {resources.map((resource, index) => (
          <ResourceCard
            key={resource.id}
            resource={resource}
            index={index}
            onDownload={onDownload}
          />
        ))}
      </div>
    </motion.section>
  );
};
