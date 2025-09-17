import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { BookOpen, Award, Users, Target, Briefcase, Heart } from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';

interface CategoryTabsProps {
  selectedCategory: string;
  onCategoryChange: (category: string) => void;
}

export const CategoryTabs = ({ selectedCategory, onCategoryChange }: CategoryTabsProps) => {
  const isMobile = useIsMobile();
  
  const categories = [
    { value: 'all', label: 'Todos los Cursos', icon: BookOpen, color: 'from-gray-500 to-gray-600' },
    { value: 'gestion', label: 'Gestión', icon: Briefcase, color: 'from-blue-500 to-blue-600' },
    { value: 'marketing', label: 'Marketing', icon: Target, color: 'from-green-500 to-green-600' },
    { value: 'liderazgo', label: 'Liderazgo', icon: Award, color: 'from-purple-500 to-purple-600' },
    { value: 'atencion_cliente', label: 'Atención al Cliente', icon: Heart, color: 'from-pink-500 to-pink-600' },
    { value: 'tecnologia', label: 'Tecnología', icon: Users, color: 'from-orange-500 to-orange-600' }
  ];

  const selectedCategoryData = categories.find(cat => cat.value === selectedCategory);

  if (isMobile) {
    return (
      <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-100">
        <Select value={selectedCategory} onValueChange={onCategoryChange}>
          <SelectTrigger className="w-full">
            <SelectValue>
              <div className="flex items-center">
                <div className={`p-2 rounded-lg bg-gradient-to-r ${selectedCategoryData?.color} shadow-lg mr-3`}>
                  {selectedCategoryData?.icon && <selectedCategoryData.icon className="h-4 w-4 text-white" />}
                </div>
                <span className="font-semibold">{selectedCategoryData?.label}</span>
              </div>
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            {categories.map((category) => (
              <SelectItem key={category.value} value={category.value}>
                <div className="flex items-center">
                  <div className={`p-2 rounded-lg bg-gradient-to-r ${category.color} shadow-lg mr-3`}>
                    <category.icon className="h-4 w-4 text-white" />
                  </div>
                  <span className="font-semibold">{category.label}</span>
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-100">
      <div className="flex flex-wrap gap-3">
        {categories.map((category, index) => (
          <motion.div
            key={category.value}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <Button
              variant={selectedCategory === category.value ? "default" : "outline"}
              onClick={() => onCategoryChange(category.value)}
              className={`relative group transition-all duration-300 transform hover:scale-105 ${
                selectedCategory === category.value
                  ? `bg-gradient-to-r ${category.color} text-white shadow-lg ring-1 ring-opacity-50`
                  : 'hover:shadow-md hover:bg-green-600 hover:text-white'
              }`}
            >
              {selectedCategory === category.value && (
                <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-white/30 rounded-r-full"></div>
              )}
              
              <div className={`p-2 rounded-lg bg-gradient-to-r ${category.color} shadow-lg mr-3 transition-transform group-hover:scale-110`}>
                <category.icon className="h-4 w-4 text-white" />
                {selectedCategory === category.value && (
                  <div className="absolute inset-0 rounded-lg bg-white/20 animate-pulse"></div>
                )}
              </div>
              
              <span className="font-semibold tracking-wide">{category.label}</span>
            </Button>
          </motion.div>
        ))}
      </div>
    </div>
  );
};