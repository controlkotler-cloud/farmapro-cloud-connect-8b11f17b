
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { FileText, Briefcase, Target, Trophy, Heart, Users } from 'lucide-react';

interface ResourcesCategoryTabsProps {
  selectedCategory: string;
  onCategoryChange: (category: string) => void;
}

export const ResourcesCategoryTabs = ({ selectedCategory, onCategoryChange }: ResourcesCategoryTabsProps) => {
  const categories = [
    { value: 'all', label: 'Todos', icon: FileText, color: 'from-gray-500 to-gray-600' },
    { value: 'gestion', label: 'Gestión', icon: Briefcase, color: 'from-blue-500 to-blue-600' },
    { value: 'marketing', label: 'Marketing', icon: Target, color: 'from-green-500 to-green-600' },
    { value: 'liderazgo', label: 'Liderazgo', icon: Trophy, color: 'from-purple-500 to-purple-600' },
    { value: 'atencion_cliente', label: 'Atención al Cliente', icon: Heart, color: 'from-pink-500 to-pink-600' },
    { value: 'tecnologia', label: 'Tecnología', icon: Users, color: 'from-orange-500 to-orange-600' }
  ];

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
