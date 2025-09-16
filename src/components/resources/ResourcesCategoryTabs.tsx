
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { FileText, Briefcase, Target, Trophy, Heart, Users } from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';

interface ResourcesCategoryTabsProps {
  selectedCategory: string;
  onCategoryChange: (category: string) => void;
}

export const ResourcesCategoryTabs = ({ selectedCategory, onCategoryChange }: ResourcesCategoryTabsProps) => {
  const isMobile = useIsMobile();
  
  const categories = [
    { value: 'all', label: 'Todos', icon: FileText, color: 'from-gray-500 to-gray-600' },
    { value: 'gestion', label: 'Gestión', icon: Briefcase, color: 'from-blue-500 to-blue-600' },
    { value: 'marketing', label: 'Marketing', icon: Target, color: 'from-green-500 to-green-600' },
    { value: 'liderazgo', label: 'Liderazgo', icon: Trophy, color: 'from-purple-500 to-purple-600' },
    { value: 'atencion_cliente', label: 'Atención al Cliente', icon: Heart, color: 'from-pink-500 to-pink-600' },
    { value: 'tecnologia', label: 'Tecnología', icon: Users, color: 'from-orange-500 to-orange-600' }
  ];

  const selectedCategoryData = categories.find(cat => cat.value === selectedCategory);

  if (isMobile) {
    return (
      <motion.div 
        className="w-full"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <Select value={selectedCategory} onValueChange={onCategoryChange}>
          <SelectTrigger className="w-full">
            <SelectValue>
              <div className="flex items-center">
                <div className={`p-2 rounded-lg bg-gradient-to-r ${selectedCategoryData?.color} shadow-lg mr-3`}>
                  {selectedCategoryData?.icon && <selectedCategoryData.icon className="h-4 w-4 text-white" />}
                </div>
                <span>{selectedCategoryData?.label}</span>
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
    <motion.div 
      className="flex flex-wrap gap-2"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
    >
      {categories.map((category) => (
        <Button
          key={category.value}
          variant={selectedCategory === category.value ? "default" : "outline"}
          onClick={() => onCategoryChange(category.value)}
          className={`relative group transition-all duration-300 transform hover:scale-105 ${
            selectedCategory === category.value
              ? `bg-gradient-to-r ${category.color} text-white shadow-lg`
              : 'hover:shadow-md'
          }`}
        >
          <div className={`p-2 rounded-lg bg-gradient-to-r ${category.color} shadow-lg mr-2 transition-transform group-hover:scale-110`}>
            <category.icon className="h-4 w-4 text-white" />
          </div>
          {category.label}
        </Button>
      ))}
    </motion.div>
  );
};
