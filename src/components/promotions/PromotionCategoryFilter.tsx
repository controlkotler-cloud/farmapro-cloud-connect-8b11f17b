import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Gift, Building2, Tag, ExternalLink, Star, Calendar, Clock } from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';

// Paleta reducida a tokens de marca (7 categorías, 5 tonos disponibles: brand-dark/
// salvia/terracota/ciruela/miel). 'formacion' reutiliza salvia (con 'laboratorio') y
// 'servicios' reutiliza terracota (con 'distribuidor'); son categorías que rara vez
// coinciden en el mismo filtro visible, así que el choque es mínimo. Fondos sólidos:
// se usan aquí (no -soft) porque estos chips son botones reales de filtro.
// `onSolid`: color legible ENCIMA del fondo sólido. Sobre miel va tinta (el blanco
// da ~2:1 de contraste); sobre salvia, terracota, ciruela y brand-dark va blanco.
export const companyTypes = [
  { id: 'all', name: 'Todas las Ofertas', icon: Gift, color: 'bg-brand-dark', onSolid: 'text-white' },
  { id: 'laboratorio', name: 'Laboratorios', icon: Building2, color: 'bg-salvia', onSolid: 'text-white' },
  { id: 'distribuidor', name: 'Distribuidores', icon: Tag, color: 'bg-terracota', onSolid: 'text-white' },
  { id: 'software', name: 'Software', icon: ExternalLink, color: 'bg-ciruela', onSolid: 'text-white' },
  { id: 'equipos', name: 'Equipos', icon: Star, color: 'bg-miel', onSolid: 'text-foreground' },
  { id: 'formacion', name: 'Formación', icon: Calendar, color: 'bg-salvia', onSolid: 'text-white' },
  { id: 'servicios', name: 'Servicios', icon: Clock, color: 'bg-terracota', onSolid: 'text-white' },
];

interface PromotionCategoryFilterProps {
  selectedType: string;
  onTypeChange: (type: string) => void;
}

export const PromotionCategoryFilter = ({ selectedType, onTypeChange }: PromotionCategoryFilterProps) => {
  const isMobile = useIsMobile();

  const selectedCategory = companyTypes.find(cat => cat.id === selectedType) || companyTypes[0];

  if (isMobile) {
    return (
      <div className="mb-8">
        <h2 className="text-lg font-semibold text-foreground mb-4">Categorías</h2>
        <Select value={selectedType} onValueChange={onTypeChange}>
          <SelectTrigger className="w-full">
            <SelectValue>
              <div className="flex items-center">
                <div className={`p-1 rounded ${selectedCategory.color} mr-2`}>
                  <selectedCategory.icon className={`h-4 w-4 ${selectedCategory.onSolid}`} />
                </div>
                {selectedCategory.name}
              </div>
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            {companyTypes.map((category) => (
              <SelectItem key={category.id} value={category.id}>
                <div className="flex items-center">
                  <div className={`p-1 rounded ${category.color} mr-2`}>
                    <category.icon className={`h-4 w-4 ${category.onSolid}`} />
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
        {companyTypes.map((category, index) => (
          <motion.div
            key={category.id}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <Button
              variant={selectedType === category.id ? "default" : "outline"}
              onClick={() => onTypeChange(category.id)}
              className={`relative group transition-all duration-300 hover:-translate-y-0.5 ${
                selectedType === category.id
                  ? `${category.color} ${category.onSolid} shadow-soft`
                  : 'hover:shadow-lift hover:bg-primary hover:text-primary-foreground'
              }`}
            >
              <div className={`p-2 rounded-lg ${category.color} shadow-soft mr-2`}>
                <category.icon className={`h-4 w-4 ${category.onSolid}`} />
              </div>
              {category.name}
            </Button>
          </motion.div>
        ))}
      </motion.div>
    </div>
  );
};