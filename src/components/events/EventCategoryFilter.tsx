
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Calendar, Video, Users, Wrench, ShoppingBag, BookOpen } from 'lucide-react';

export const eventTypes = [
  { id: 'all', name: 'Todos', icon: Calendar, color: 'from-orange-500 to-orange-600' },
  { id: 'webinar', name: 'Webinars', icon: Video, color: 'from-blue-500 to-blue-600' },
  { id: 'conferencia', name: 'Conferencias', icon: Users, color: 'from-purple-500 to-purple-600' },
  { id: 'workshop', name: 'Workshops', icon: Wrench, color: 'from-green-500 to-green-600' },
  { id: 'feria', name: 'Ferias', icon: ShoppingBag, color: 'from-yellow-500 to-yellow-600' },
  { id: 'curso', name: 'Cursos', icon: BookOpen, color: 'from-indigo-500 to-indigo-600' }
];

interface EventCategoryFilterProps {
  selectedType: string;
  onTypeChange: (type: string) => void;
}

export const EventCategoryFilter = ({ selectedType, onTypeChange }: EventCategoryFilterProps) => {
  return (
    <div className="mb-8">
      <h2 className="text-lg font-semibold text-gray-900 mb-4">Categorías</h2>
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
