import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { FileText, type LucideIcon } from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';
import { RESOURCE_CATEGORIES, getResourceStyle } from '@/lib/resourceCategory';

interface ResourcesCategoryTabsProps {
  selectedCategory: string;
  onCategoryChange: (category: string) => void;
}

interface CatOption {
  value: string;
  label: string;
  gradient: string;
  Icon: LucideIcon;
}

// 'Todos' + categorías reales del enum (incluida 'impulso'). Antes apuntaban a
// valores inexistentes (atencion_cliente, tecnologia) y filtraban a vacío.
const CATS: CatOption[] = [
  { value: 'all', label: 'Todos', gradient: 'from-slate-500 to-slate-600', Icon: FileText },
  ...RESOURCE_CATEGORIES.map((c): CatOption => {
    const s = getResourceStyle(c);
    return { value: c, label: s.label, gradient: s.gradient, Icon: s.Icon };
  }),
];

export const ResourcesCategoryTabs = ({ selectedCategory, onCategoryChange }: ResourcesCategoryTabsProps) => {
  const isMobile = useIsMobile();
  const selected = CATS.find(c => c.value === selectedCategory) || CATS[0];

  if (isMobile) {
    return (
      <motion.div className="w-full" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <Select value={selectedCategory} onValueChange={onCategoryChange}>
          <SelectTrigger className="w-full">
            <SelectValue>
              <div className="flex items-center">
                <div className={`p-2 rounded-lg bg-gradient-to-r ${selected.gradient} shadow mr-3`}>
                  <selected.Icon className="h-4 w-4 text-white" />
                </div>
                <span>{selected.label}</span>
              </div>
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            {CATS.map(category => (
              <SelectItem key={category.value} value={category.value}>
                <div className="flex items-center">
                  <div className={`p-2 rounded-lg bg-gradient-to-r ${category.gradient} shadow mr-3`}>
                    <category.Icon className="h-4 w-4 text-white" />
                  </div>
                  {category.label}
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </motion.div>
    );
  }

  return (
    <motion.div className="flex flex-wrap gap-2" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
      {CATS.map(category => {
        const active = selectedCategory === category.value;
        return (
          <Button
            key={category.value}
            variant={active ? 'default' : 'outline'}
            onClick={() => onCategoryChange(category.value)}
            className={`gap-2 transition-all ${active ? `bg-gradient-to-r ${category.gradient} text-white border-0 shadow` : ''}`}
          >
            <category.Icon className="h-4 w-4" />
            {category.label}
          </Button>
        );
      })}
    </motion.div>
  );
};
