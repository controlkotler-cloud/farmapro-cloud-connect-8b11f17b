
import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { 
  MessageSquare, 
  Star, 
  Hash,
  RefreshCw,
  Users,
  Target,
  Heart
} from 'lucide-react';
import { ThreadList } from '@/components/forum/ThreadList';
import { NewThreadDialog } from '@/components/forum/NewThreadDialog';

interface ForumThread {
  id: string;
  title: string;
  content: string;
  author_id: string;
  category_id: string;
  replies_count: number;
  is_pinned: boolean;
  last_reply_at: string;
  created_at: string;
  profiles?: {
    full_name: string;
  };
  forum_categories?: {
    name: string;
  };
}

interface ForumCategory {
  id: string;
  name: string;
  description: string;
  is_premium: boolean;
}

interface CommunityContentProps {
  onThreadClick: (threadId: string) => void;
  onDataChange: () => void;
}

export const CommunityContent = ({ onThreadClick, onDataChange }: CommunityContentProps) => {
  const { profile } = useAuth();
  const [threads, setThreads] = useState<ForumThread[]>([]);
  const [categories, setCategories] = useState<ForumCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  useEffect(() => {
    loadCategories();
    loadThreads();
  }, [selectedCategory]);

  const loadCategories = async () => {
    const { data, error } = await supabase
      .from('forum_categories')
      .select('*')
      .order('name');

    if (error) {
      console.error('Error loading categories:', error);
    } else {
      setCategories(data || []);
    }
  };

  const loadThreads = async () => {
    setLoading(true);
    let query = supabase
      .from('forum_threads')
      .select(`
        *,
        profiles(full_name),
        forum_categories(name)
      `)
      .order('is_pinned', { ascending: false })
      .order('last_reply_at', { ascending: false });

    if (selectedCategory !== 'all') {
      query = query.eq('category_id', selectedCategory);
    }

    const { data, error } = await query;
    if (error) {
      console.error('Error loading threads:', error);
    } else {
      setThreads(data || []);
    }
    setLoading(false);
  };

  const canAccessCategory = (category: ForumCategory) => {
    if (!category.is_premium) return true;
    return profile?.subscription_role && profile.subscription_role !== 'freemium';
  };

  const createThread = async (title: string, content: string) => {
    if (!profile?.id) return;

    const categoryId = selectedCategory !== 'all' ? selectedCategory : categories[0]?.id;

    const { error } = await supabase
      .from('forum_threads')
      .insert([{
        title,
        content,
        author_id: profile.id,
        category_id: categoryId
      }]);

    if (error) {
      console.error('Error creating thread:', error);
    } else {
      // Add points for creating a thread
      try {
        const { error: pointsError } = await supabase.rpc('add_user_points', {
          user_id: profile.id,
          points: 100
        } as any);
        if (pointsError) {
          console.error('Error adding points:', pointsError);
        }
      } catch (error) {
        console.error('Error calling add_user_points:', error);
      }

      loadThreads();
      onDataChange();
    }
  };

  const getCategoryIcon = (categoryName: string) => {
    const icons: { [key: string]: any } = {
      'Consultas Generales': MessageSquare,
      'Farmacovigilancia': Target,
      'Atención Farmacéutica': Heart,
      'Gestión Farmacéutica': Users,
      'Nuevos Medicamentos': Star
    };
    return icons[categoryName] || Hash;
  };

  const getCategoryColor = (index: number) => {
    const colors = [
      'from-blue-500 to-blue-600',
      'from-green-500 to-green-600',
      'from-purple-500 to-purple-600',
      'from-pink-500 to-pink-600',
      'from-orange-500 to-orange-600'
    ];
    return colors[index % colors.length];
  };

  return (
    <motion.div 
      className="space-y-8"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ staggerChildren: 0.1 }}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="p-2 rounded-lg bg-gradient-to-r from-blue-500 to-blue-600 shadow-lg">
            <MessageSquare className="h-6 w-6 text-white" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Foro de Discusión</h2>
            <p className="text-gray-600">Participa en conversaciones con profesionales</p>
          </div>
        </div>
        <NewThreadDialog 
          categories={categories}
          selectedCategory={selectedCategory}
          onCreateThread={createThread}
        />
      </div>

      <Card className="border-0 shadow-lg">
        <CardHeader className="bg-gradient-to-r from-gray-50 to-gray-100 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg font-semibold text-gray-900">
              Categorías de Discusión
            </CardTitle>
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => loadThreads()}
              className="hover:bg-gray-100"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Actualizar
            </Button>
          </div>
        </CardHeader>

        <CardContent className="p-0">
          <Tabs value={selectedCategory} onValueChange={setSelectedCategory}>
            <div className="p-6 border-b border-gray-200">
              <TabsList className="grid grid-cols-auto bg-transparent gap-2 h-auto">
                <TabsTrigger 
                  value="all" 
                  className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-gray-500 data-[state=active]:to-gray-600 data-[state=active]:text-white rounded-lg px-4 py-2 transition-all duration-300 hover:scale-105"
                >
                  <div className="p-2 rounded-lg bg-gradient-to-r from-gray-500 to-gray-600 shadow-lg mr-2">
                    <Hash className="h-4 w-4 text-white" />
                  </div>
                  Todas
                </TabsTrigger>
                {categories.map((category, index) => {
                  const IconComponent = getCategoryIcon(category.name);
                  const colorClass = getCategoryColor(index);
                  return (
                    <TabsTrigger 
                      key={category.id} 
                      value={category.id}
                      disabled={!canAccessCategory(category)}
                      className="data-[state=active]:bg-gradient-to-r data-[state=active]:text-white rounded-lg px-4 py-2 transition-all duration-300 hover:scale-105"
                      style={{
                        '--tw-gradient-from': `var(--${colorClass.split(' ')[0].replace('from-', '')})`,
                        '--tw-gradient-to': `var(--${colorClass.split(' ')[1].replace('to-', '')})`
                      } as any}
                    >
                      <div className={`p-2 rounded-lg bg-gradient-to-r ${colorClass} shadow-lg mr-2`}>
                        <IconComponent className="h-4 w-4 text-white" />
                      </div>
                      {category.name}
                      {category.is_premium && <Star className="h-3 w-3 ml-2 text-yellow-500" />}
                    </TabsTrigger>
                  );
                })}
              </TabsList>
            </div>

            <TabsContent value={selectedCategory} className="p-6 space-y-6">
              <div className="flex items-center justify-between">
                <div className="text-sm text-gray-600">
                  {threads.length} {threads.length === 1 ? 'discusión' : 'discusiones'} activas
                </div>
              </div>

              <ThreadList
                threads={threads}
                loading={loading}
                onThreadClick={onThreadClick}
                onCreateThread={() => {/* Handled by NewThreadDialog */}}
              />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </motion.div>
  );
};
