import { motion } from 'framer-motion';
import { LayoutGrid } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { getCourseCover } from '@/lib/courseCover';
import { useIsMobile } from '@/hooks/use-mobile';

// Categorías reales del catálogo (enum course_category canónico).
// El color/icono/etiqueta se toma de getCourseCover para mantener una
// sola fuente de verdad visual con las tarjetas y las secciones.
const CATEGORY_ORDER = ['ventas', 'marketing', 'gestion', 'liderazgo', 'atencion', 'atencion_cliente', 'tecnologia', 'otros'] as const;

interface CategoryTabsProps {
  selectedCategory: string;
  onCategoryChange: (category: string) => void;
  /** Número de cursos por categoría (clave = valor de categoría). */
  counts: Record<string, number>;
  /** Total de cursos (para la pestaña "Todos"). */
  totalCount: number;
}

export const CategoryTabs = ({
  selectedCategory,
  onCategoryChange,
  counts,
  totalCount,
}: CategoryTabsProps) => {
  const isMobile = useIsMobile();

  // Solo mostramos categorías con al menos un curso, más "Todos".
  const visibleCategories = CATEGORY_ORDER.filter((value) => (counts[value] || 0) > 0);

  const tabs = [
    { value: 'all', label: 'Todos', cover: null, count: totalCount },
    ...visibleCategories.map((value) => ({
      value,
      label: getCourseCover(value).label,
      cover: getCourseCover(value),
      count: counts[value] || 0,
    })),
  ];

  const selectedTab = tabs.find((tab) => tab.value === selectedCategory) ?? tabs[0];

  if (isMobile) {
    return (
      <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
        <Select value={selectedCategory} onValueChange={onCategoryChange}>
          <SelectTrigger className="w-full">
            <SelectValue>
              <div className="flex items-center gap-2">
                <span className="font-semibold">{selectedTab.label}</span>
                <span className="text-xs text-gray-500">({selectedTab.count})</span>
              </div>
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            {tabs.map((tab) => (
              <SelectItem key={tab.value} value={tab.value}>
                <div className="flex items-center gap-2">
                  {tab.cover ? (
                    <tab.cover.Icon className="h-4 w-4 text-gray-500" strokeWidth={1.75} />
                  ) : (
                    <LayoutGrid className="h-4 w-4 text-gray-500" strokeWidth={1.75} />
                  )}
                  <span className="font-medium">{tab.label}</span>
                  <span className="text-xs text-gray-500">({tab.count})</span>
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl p-3 shadow-sm border border-gray-100">
      <div className="flex flex-wrap gap-2">
        {tabs.map((tab, index) => {
          const isActive = selectedCategory === tab.value;
          const Icon = tab.cover ? tab.cover.Icon : LayoutGrid;
          return (
            <motion.div
              key={tab.value}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.04 }}
            >
              <Button
                variant={isActive ? 'default' : 'outline'}
                size="sm"
                onClick={() => onCategoryChange(tab.value)}
                aria-pressed={isActive}
                className={`gap-2 transition-colors ${
                  isActive ? 'bg-blue-600 hover:bg-blue-700 text-white' : 'text-gray-700'
                }`}
              >
                <Icon className="h-4 w-4" strokeWidth={1.75} />
                <span className="font-medium">{tab.label}</span>
                <span
                  className={`ml-0.5 rounded-full px-1.5 py-0.5 text-xs font-semibold ${
                    isActive ? 'bg-white/20 text-white' : 'bg-gray-100 text-gray-600'
                  }`}
                >
                  {tab.count}
                </span>
              </Button>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
};
