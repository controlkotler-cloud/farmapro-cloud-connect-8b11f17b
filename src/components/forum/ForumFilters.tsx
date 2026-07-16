
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Star, LayoutList, MessageSquare, AlertTriangle, Stethoscope, BarChart3, Pill, MessagesSquare } from 'lucide-react';

interface ForumCategory {
  id: string;
  name: string;
  description: string;
  is_premium: boolean;
}

const getCategoryIcon = (name: string) => {
  switch (name) {
    case 'Consultas Generales':
      return <MessageSquare className="h-4 w-4" />;
    case 'Farmacovigilancia':
      return <AlertTriangle className="h-4 w-4" />;
    case 'Atención Farmacéutica':
      return <Stethoscope className="h-4 w-4" />;
    case 'Gestión Farmacéutica':
      return <BarChart3 className="h-4 w-4" />;
    case 'Nuevos Medicamentos':
      return <Pill className="h-4 w-4" />;
    default:
      return <MessagesSquare className="h-4 w-4" />;
  }
};

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
      <TabsList className="grid w-full grid-cols-auto border border-border bg-card">
        <TabsTrigger value="all" className="data-[state=active]:bg-terracota-soft data-[state=active]:text-terracota">
          <div className="flex items-center space-x-1">
            <LayoutList className="h-4 w-4" />
            <span>Todos</span>
          </div>
        </TabsTrigger>
        {categories.map((category) => (
          <TabsTrigger
            key={category.id}
            value={category.id}
            disabled={!canAccessCategory(category)}
            className="data-[state=active]:bg-terracota-soft data-[state=active]:text-terracota"
          >
            <div className="flex items-center space-x-1">
              {getCategoryIcon(category.name)}
              <span>{category.name}</span>
              {category.is_premium && <Star className="h-3 w-3 text-terracota" />}
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
