
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar, Video, Users, Wrench, ShoppingBag, BookOpen } from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';

// Paleta reducida a los tokens de marca (brand/brand-dark, miel, terracota,
// salvia, ciruela) en vez del arcoíris original. "Todos" usa terracota como
// acento de la sección; los 5 tipos reales se reparten 1:1 entre los tokens
// restantes, y "Cursos" reutiliza brand-dark (variante de workshop) porque
// solo hay 5 tokens disponibles para 5 categorías + "Todos".
// `soft`/`text` es el par usado en todas partes (tile del selector móvil y
// pastilla activa) para no poner nunca blanco sobre un acento: prohibido en
// brand y de bajo contraste en el resto.
export const eventTypes = [
  { id: 'all', name: 'Todos', icon: Calendar, bg: 'bg-terracota', soft: 'bg-terracota-soft', text: 'text-terracota' },
  { id: 'webinar', name: 'Webinars', icon: Video, bg: 'bg-salvia', soft: 'bg-salvia-soft', text: 'text-salvia' },
  { id: 'conferencia', name: 'Conferencias', icon: Users, bg: 'bg-ciruela', soft: 'bg-ciruela-soft', text: 'text-ciruela' },
  { id: 'workshop', name: 'Workshops', icon: Wrench, bg: 'bg-brand', soft: 'bg-brand-soft', text: 'text-brand-dark' },
  { id: 'feria', name: 'Ferias', icon: ShoppingBag, bg: 'bg-miel', soft: 'bg-miel-soft', text: 'text-miel' },
  { id: 'curso', name: 'Cursos', icon: BookOpen, bg: 'bg-brand-dark', soft: 'bg-brand-soft', text: 'text-brand-dark' }
];

interface EventCategoryFilterProps {
  selectedType: string;
  onTypeChange: (type: string) => void;
}

export const EventCategoryFilter = ({ selectedType, onTypeChange }: EventCategoryFilterProps) => {
  const isMobile = useIsMobile();

  const selectedCategory = eventTypes.find(cat => cat.id === selectedType) || eventTypes[0];

  if (isMobile) {
    return (
      <div>
        <h2 className="mb-4 text-xl font-extrabold tracking-tight text-foreground">Categorías</h2>
        <Select value={selectedType} onValueChange={onTypeChange}>
          <SelectTrigger className="w-full">
            <SelectValue>
              <div className="flex items-center">
                <div className={`p-2 rounded-lg ${selectedCategory.soft} shadow-soft mr-3`}>
                  <selectedCategory.icon className={`h-4 w-4 ${selectedCategory.text}`} />
                </div>
                {selectedCategory.name}
              </div>
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            {eventTypes.map((category) => (
              <SelectItem key={category.id} value={category.id}>
                <div className="flex items-center">
                  <div className={`p-2 rounded-lg ${category.soft} shadow-soft mr-3`}>
                    <category.icon className={`h-4 w-4 ${category.text}`} />
                  </div>
                  {category.name}
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    );
  }

  return (
    <div>
      <h2 className="mb-4 text-xl font-extrabold tracking-tight text-foreground">Categorías</h2>
      <motion.div
        className="flex flex-wrap gap-2"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        {eventTypes.map((category) => (
          <Button
            key={category.id}
            variant={selectedType === category.id ? 'default' : 'outline'}
            onClick={() => onTypeChange(category.id)}
            className="gap-2 rounded-full transition-all"
          >
            <category.icon className="h-4 w-4" />
            {category.name}
          </Button>
        ))}
      </motion.div>
    </div>
  );
};
