import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { FileText, type LucideIcon } from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';
import { RESOURCE_CATEGORIES, getResourceStyle } from '@/lib/resourceCategory';

interface ResourcesCategoryTabsProps {
  selectedCategory: string;
  onCategoryChange: (category: string) => void;
  counts?: Record<string, number>;
}

interface CatOption {
  value: string;
  label: string;
  bg: string;
  text: string;
  Icon: LucideIcon;
}

const CATS: CatOption[] = [
  { value: 'all', label: 'Todos', bg: 'bg-muted', text: 'text-foreground', Icon: FileText },
  ...RESOURCE_CATEGORIES.map((c): CatOption => {
    const s = getResourceStyle(c);
    return { value: c, label: s.label, bg: s.bg, text: s.text, Icon: s.Icon };
  }),
];

export const ResourcesCategoryTabs = ({ selectedCategory, onCategoryChange, counts }: ResourcesCategoryTabsProps) => {
  const isMobile = useIsMobile();
  const visibleCats = CATS.filter(c => c.value === 'all' || (counts?.[c.value] ?? 0) > 0);
  const selected = visibleCats.find(c => c.value === selectedCategory) || visibleCats[0];
  const countFor = (value: string) => (value === 'all' ? counts?.all : counts?.[value]) ?? 0;

  if (isMobile) {
    return (
      <motion.div className="w-full" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <Select value={selectedCategory} onValueChange={onCategoryChange}>
          <SelectTrigger className="w-full">
            <SelectValue>
              <div className="flex items-center">
                <div className={`p-2 rounded-lg ${selected.bg} shadow-soft mr-3`}>
                  <selected.Icon className={`h-4 w-4 ${selected.text}`} />
                </div>
                <span>
                  {selected.label}
                  {counts ? ` (${countFor(selected.value)})` : ''}
                </span>
              </div>
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            {visibleCats.map(category => (
              <SelectItem key={category.value} value={category.value}>
                <div className="flex items-center">
                  <div className={`p-2 rounded-lg ${category.bg} shadow-soft mr-3`}>
                    <category.Icon className={`h-4 w-4 ${category.text}`} />
                  </div>
                  {category.label}
                  {counts ? ` (${countFor(category.value)})` : ''}
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
      {visibleCats.map(category => {
        const active = selectedCategory === category.value;
        return (
          <Button
            key={category.value}
            variant={active ? 'default' : 'outline'}
            onClick={() => onCategoryChange(category.value)}
            className="gap-2 rounded-full transition-all"
          >
            <category.Icon className="h-4 w-4" />
            {category.label}
            {counts ? (
              <span
                className={`ml-0.5 rounded-full px-1.5 text-xs font-semibold ${
                  active ? 'bg-white/25 text-white' : 'bg-muted text-muted-foreground'
                }`}
              >
                {countFor(category.value)}
              </span>
            ) : null}
          </Button>
        );
      })}
    </motion.div>
  );
};
