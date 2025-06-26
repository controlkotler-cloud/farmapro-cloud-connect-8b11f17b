
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { BookOpen, Award, Users, Target, Briefcase } from 'lucide-react';

interface CategoryTabsProps {
  selectedCategory: string;
  onCategoryChange: (category: string) => void;
}

export const CategoryTabs = ({ selectedCategory, onCategoryChange }: CategoryTabsProps) => {
  const categories = [
    { value: 'all', label: 'Todos los Cursos', icon: BookOpen, color: 'from-gray-500 to-gray-600' },
    { value: 'management', label: 'Gestión', icon: Briefcase, color: 'from-blue-500 to-blue-600' },
    { value: 'clinical', label: 'Clínico', icon: Award, color: 'from-green-500 to-green-600' },
    { value: 'technology', label: 'Tecnología', icon: Target, color: 'from-purple-500 to-purple-600' },
    { value: 'customer_service', label: 'Atención al Cliente', icon: Users, color: 'from-pink-500 to-pink-600' }
  ];

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
                  : 'hover:shadow-md hover:bg-gradient-to-r hover:from-gray-50 hover:to-gray-100'
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
