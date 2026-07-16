
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
// `bg` es solo para el icono de portada (glifo, no texto, admite blanco);
// `soft`/`text` es el par usado en el botón de filtro seleccionado, para no
// poner nunca texto blanco sobre un acento (prohibido en brand y de bajo
// contraste en el resto).
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
      <div className="mb-8">
        <h2 className="text-lg font-semibold text-foreground mb-4">Categorías</h2>
        <Select value={selectedType} onValueChange={onTypeChange}>
          <SelectTrigger className="w-full">
            <SelectValue>
              <div className="flex items-center">
                <div className={`p-1 rounded ${selectedCategory.bg} mr-2`}>
                  <selectedCategory.icon className="h-4 w-4 text-primary-foreground" />
                </div>
                {selectedCategory.name}
              </div>
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            {eventTypes.map((category) => (
              <SelectItem key={category.id} value={category.id}>
                <div className="flex items-center">
                  <div className={`p-1 rounded ${category.bg} mr-2`}>
                    <category.icon className="h-4 w-4 text-primary-foreground" />
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
    <div className="mb-8">
      <h2 className="text-lg font-semibold text-foreground mb-4">Categorías</h2>
      <motion.div
        className="flex flex-wrap gap-2"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        {eventTypes.map((category, index) => (
          <motion.div
            key={category.id}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <Button
              variant={selectedType === category.id ? "default" : "outline"}
              onClick={() => onTypeChange(category.id)}
              className={`relative group transition-all transform hover:scale-105 ${
                selectedType === category.id
                  ? `${category.soft} ${category.text} shadow-soft hover:opacity-90`
                  : 'hover:shadow-lift hover:bg-accent hover:text-accent-foreground'
              }`}
            >
              <div className={`p-2 rounded-lg ${category.bg} shadow-soft mr-2 transition-transform group-hover:scale-110`}>
                <category.icon className="h-4 w-4 text-primary-foreground" />
              </div>
              {category.name}
            </Button>
          </motion.div>
        ))}
      </motion.div>
    </div>
  );
};
