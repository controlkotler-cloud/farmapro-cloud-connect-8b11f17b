
import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  MessageSquare, 
  Plus, 
  Star, 
  TrendingUp, 
  Clock,
  Users,
  Hash,
  RefreshCw
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
    const icons: { [key: string]: string } = {
      'Consultas Generales': '💬',
      'Farmacovigilancia': '⚠️',
      'Atención Farmacéutica': '👨‍⚕️',
      'Gestión Farmacéutica': '📊',
      'Nuevos Medicamentos': '💊'
    };
    return icons[categoryName] || '📋';
  };

  return (
    <Card className="border-gray-200">
      <CardHeader className="bg-gray-50 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <MessageSquare className="h-6 w-6 text-blue-600" />
            <div>
              <CardTitle className="text-xl font-bold text-gray-900">
                Foro de Discusión
              </CardTitle>
              <p className="text-gray-600 text-sm mt-1">
                Participa en conversaciones con profesionales
              </p>
            </div>
          </div>
          <NewThreadDialog 
            categories={categories}
            selectedCategory={selectedCategory}
            onCreateThread={createThread}
          />
        </div>
      </CardHeader>

      <CardContent className="p-0">
        <Tabs value={selectedCategory} onValueChange={setSelectedCategory}>
          <div className="border-b border-gray-200 bg-white">
            <TabsList className="w-full bg-transparent p-0 h-auto justify-start">
              <div className="flex flex-wrap gap-1 p-4">
                <TabsTrigger 
                  value="all" 
                  className="data-[state=active]:bg-blue-500 data-[state=active]:text-white rounded-md px-3 py-2 text-sm"
                >
                  <Hash className="h-4 w-4 mr-2" />
                  Todas
                </TabsTrigger>
                {categories.map((category) => (
                  <TabsTrigger 
                    key={category.id} 
                    value={category.id}
                    disabled={!canAccessCategory(category)}
                    className="data-[state=active]:bg-blue-500 data-[state=active]:text-white rounded-md px-3 py-2 text-sm"
                  >
                    <span className="mr-2">{getCategoryIcon(category.name)}</span>
                    {category.name}
                    {category.is_premium && <Star className="h-3 w-3 ml-2 text-yellow-500" />}
                  </TabsTrigger>
                ))}
              </div>
            </TabsList>
          </div>

          <TabsContent value={selectedCategory} className="p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <Badge variant="outline" className="px-3 py-1 border-gray-300">
                  <TrendingUp className="h-4 w-4 mr-2" />
                  {threads.length} hilos activos
                </Badge>
                <Badge variant="outline" className="px-3 py-1 border-gray-300">
                  <Clock className="h-4 w-4 mr-2" />
                  Actualizado recientemente
                </Badge>
              </div>
              
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => loadThreads()}
                className="hover:bg-gray-50"
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Actualizar
              </Button>
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

      {/* Quick Actions Section */}
      <div className="p-6 border-t border-gray-200 bg-gray-50">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="text-center p-4 bg-white rounded-lg border border-gray-200">
            <div className="bg-blue-50 rounded-full p-3 w-12 h-12 mx-auto mb-3 flex items-center justify-center">
              <Users className="h-6 w-6 text-blue-600" />
            </div>
            <h3 className="font-medium text-gray-900 mb-1">Conecta</h3>
            <p className="text-gray-600 text-xs">Con profesionales</p>
          </div>

          <div className="text-center p-4 bg-white rounded-lg border border-gray-200">
            <div className="bg-green-50 rounded-full p-3 w-12 h-12 mx-auto mb-3 flex items-center justify-center">
              <MessageSquare className="h-6 w-6 text-green-600" />
            </div>
            <h3 className="font-medium text-gray-900 mb-1">Comparte</h3>
            <p className="text-gray-600 text-xs">Experiencias</p>
          </div>

          <div className="text-center p-4 bg-white rounded-lg border border-gray-200">
            <div className="bg-purple-50 rounded-full p-3 w-12 h-12 mx-auto mb-3 flex items-center justify-center">
              <Star className="h-6 w-6 text-purple-600" />
            </div>
            <h3 className="font-medium text-gray-900 mb-1">Gana</h3>
            <p className="text-gray-600 text-xs">Puntos</p>
          </div>
        </div>
      </div>
    </Card>
  );
};
