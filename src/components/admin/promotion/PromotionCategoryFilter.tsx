import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Gift, Building2, Tag, ExternalLink, Star, Calendar, Clock } from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';

export const companyTypes = [
  { id: 'all', name: 'Todas las Ofertas', icon: Gift, color: 'from-red-500 to-red-600' },
  { id: 'laboratorio', name: 'Laboratorios', icon: Building2, color: 'from-blue-500 to-blue-600' },
  { id: 'distribuidor', name: 'Distribuidores', icon: Tag, color: 'from-green-500 to-green-600' },
  { id: 'software', name: 'Software', icon: ExternalLink, color: 'from-purple-500 to-purple-600' },
  { id: 'equipos', name: 'Equipos', icon: Star, color: 'from-orange-500 to-orange-600' },
  { id: 'formacion', name: 'Formación', icon: Calendar, color: 'from-indigo-500 to-indigo-600' },
  { id: 'servicios', name: 'Servicios', icon: Clock, color: 'from-pink-500 to-pink-600' },
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
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Categorías</h2>
        <Select value={selectedType} onValueChange={onTypeChange}>
          <SelectTrigger className="w-full">
            <SelectValue>
              <div className="flex items-center">
                <div className={`p-1 rounded bg-gradient-to-r ${selectedCategory.color} mr-2`}>
                  <selectedCategory.icon className="h-4 w-4 text-white" />
                </div>
                {selectedCategory.name}
              </div>
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            {companyTypes.map((category) => (
              <SelectItem key={category.id} value={category.id}>
                <div className="flex items-center">
                  <div className={`p-1 rounded bg-gradient-to-r ${category.color} mr-2`}>
                    <category.icon className="h-4 w-4 text-white" />
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
      <h2 className="text-lg font-semibold text-gray-900 mb-4">Categorías</h2>
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
              className={`relative group transition-all duration-300 transform hover:scale-105 ${
                selectedType === category.id
                  ? `bg-gradient-to-r ${category.color} text-white shadow-lg`
                  : 'hover:shadow-md'
              }`}
            >
              <div className={`p-2 rounded-lg bg-gradient-to-r ${category.color} shadow-lg mr-2 transition-transform group-hover:scale-110`}>
                <category.icon className="h-4 w-4 text-white" />
              </div>
              {category.name}
            </Button>
          </motion.div>
        ))}
      </motion.div>
    </div>
  );
};