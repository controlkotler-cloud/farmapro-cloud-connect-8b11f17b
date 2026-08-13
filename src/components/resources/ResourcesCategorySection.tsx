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

// Sección de una categoría dentro de la vista "Todos": cabecera con el nombre
// en mayúsculas pequeñas y en el color de la categoría, con el número de
// recursos al lado, y su sub-rejilla de tarjetas.
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
      <div className="flex items-center gap-3 border-b border-border pb-2">
        <span className={`h-2.5 w-2.5 flex-none rounded-full ${style.accent}`} aria-hidden="true" />
        <h2 className={`text-[13px] font-extrabold uppercase tracking-[0.16em] ${style.text}`}>
          {style.label}
        </h2>
        <span className="text-[13px] font-semibold text-muted-foreground">
          {count} {count === 1 ? 'recurso' : 'recursos'}
        </span>
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
