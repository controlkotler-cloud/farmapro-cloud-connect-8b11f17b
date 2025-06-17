
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import type { CategoryItem } from '@/types/course';

interface CategoryTabsProps {
  categories: CategoryItem[];
  selectedCategory: string;
  onCategoryChange: (value: string) => void;
  children: React.ReactNode;
}

export const CategoryTabs = ({ categories, selectedCategory, onCategoryChange, children }: CategoryTabsProps) => {
  return (
    <Tabs value={selectedCategory} onValueChange={onCategoryChange}>
      <TabsList className="grid w-full grid-cols-6">
        {categories.map((category) => (
          <TabsTrigger key={category.id} value={category.id} className="text-xs">
            {category.name}
          </TabsTrigger>
        ))}
      </TabsList>
      <TabsContent value={selectedCategory} className="mt-6">
        {children}
      </TabsContent>
    </Tabs>
  );
};
