
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Star } from 'lucide-react';

interface ForumCategory {
  id: string;
  name: string;
  description: string;
  is_premium: boolean;
}

interface ForumFiltersProps {
  categories: ForumCategory[];
  selectedCategory: string;
  onCategoryChange: (value: string) => void;
  canAccessCategory: (category: ForumCategory) => boolean;
  children: React.ReactNode;
}

export const ForumFilters = ({ 
  categories, 
  selectedCategory, 
  onCategoryChange, 
  canAccessCategory,
  children 
}: ForumFiltersProps) => {
  return (
    <Tabs value={selectedCategory} onValueChange={onCategoryChange}>
      <TabsList className="grid w-full grid-cols-auto bg-white border">
        <TabsTrigger value="all" className="data-[state=active]:bg-blue-100 data-[state=active]:text-blue-700">
          📋 Todos
        </TabsTrigger>
        {categories.map((category) => (
          <TabsTrigger 
            key={category.id} 
            value={category.id}
            disabled={!canAccessCategory(category)}
            className="data-[state=active]:bg-blue-100 data-[state=active]:text-blue-700"
          >
            <div className="flex items-center space-x-1">
              <span>
                {category.name === 'Consultas Generales' && '💬'}
                {category.name === 'Farmacovigilancia' && '⚠️'}
                {category.name === 'Atención Farmacéutica' && '👨‍⚕️'}
                {category.name === 'Gestión Farmacéutica' && '📊'}
                {category.name === 'Nuevos Medicamentos' && '💊'}
                {' '}{category.name}
              </span>
              {category.is_premium && <Star className="h-3 w-3 text-yellow-500" />}
            </div>
          </TabsTrigger>
        ))}
      </TabsList>

      <TabsContent value={selectedCategory} className="mt-6">
        {children}
      </TabsContent>
    </Tabs>
  );
};
