
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
  Hash
} from 'lucide-react';
import { ThreadList } from '@/components/forum/ThreadList';
import { NewThreadDialog } from '@/components/forum/NewThreadDialog';
import { motion } from 'framer-motion';

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
    <div className="px-6 pb-12">
      <div className="max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          <Card className="border-0 shadow-xl bg-white/80 backdrop-blur-sm">
            <CardHeader className="bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-t-lg">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <MessageSquare className="h-8 w-8" />
                  <div>
                    <CardTitle className="text-2xl font-bold">
                      💬 Foro de Discusión
                    </CardTitle>
                    <p className="text-blue-100 mt-1">
                      Participa en conversaciones con profesionales de toda España
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
                <div className="border-b bg-gray-50/50">
                  <TabsList className="w-full bg-transparent p-0 h-auto">
                    <div className="flex flex-wrap gap-2 p-4">
                      <TabsTrigger 
                        value="all" 
                        className="data-[state=active]:bg-blue-500 data-[state=active]:text-white rounded-full px-4 py-2"
                      >
                        <Hash className="h-4 w-4 mr-2" />
                        Todas las categorías
                      </TabsTrigger>
                      {categories.map((category) => (
                        <TabsTrigger 
                          key={category.id} 
                          value={category.id}
                          disabled={!canAccessCategory(category)}
                          className="data-[state=active]:bg-blue-500 data-[state=active]:text-white rounded-full px-4 py-2"
                        >
                          <span className="mr-2">{getCategoryIcon(category.name)}</span>
                          {category.name}
                          {category.is_premium && <Star className="h-3 w-3 ml-2 text-yellow-500" />}
                        </TabsTrigger>
                      ))}
                    </div>
                  </TabsList>
                </div>

                <TabsContent value={selectedCategory} className="p-6 space-y-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <Badge variant="outline" className="px-3 py-1">
                        <TrendingUp className="h-4 w-4 mr-2" />
                        {threads.length} hilos activos
                      </Badge>
                      <Badge variant="outline" className="px-3 py-1">
                        <Clock className="h-4 w-4 mr-2" />
                        Actualizado hace pocos minutos
                      </Badge>
                    </div>
                    
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => loadThreads()}
                      className="hover:bg-blue-50"
                    >
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
          </Card>
        </motion.div>

        {/* Quick Actions Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6"
        >
          <Card className="hover:shadow-lg transition-all duration-300 border-0 shadow-md">
            <CardContent className="p-6 text-center">
              <div className="bg-blue-50 rounded-full p-4 w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                <Users className="h-8 w-8 text-blue-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Conecta con Profesionales
              </h3>
              <p className="text-gray-600 text-sm">
                Únete a conversaciones con farmacéuticos de toda España
              </p>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-all duration-300 border-0 shadow-md">
            <CardContent className="p-6 text-center">
              <div className="bg-green-50 rounded-full p-4 w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                <MessageSquare className="h-8 w-8 text-green-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Comparte Experiencias
              </h3>
              <p className="text-gray-600 text-sm">
                Ayuda a otros con tu conocimiento y aprende de sus experiencias
              </p>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-all duration-300 border-0 shadow-md">
            <CardContent className="p-6 text-center">
              <div className="bg-purple-50 rounded-full p-4 w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                <Star className="h-8 w-8 text-purple-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Gana Puntos
              </h3>
              <p className="text-gray-600 text-sm">
                Participa activamente y sube de nivel en la comunidad
              </p>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
};
