
import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useIsMobile } from '@/hooks/use-mobile';
import { 
  MessageSquare, 
  Star, 
  RefreshCw,
  Plus
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
  const isMobile = useIsMobile();
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
      // Update challenge progress for forum post
      const { updateChallengeProgress } = await import('@/utils/challengeUtils');
      await updateChallengeProgress(profile.id, 'forum_post', 1);

      loadThreads();
      onDataChange();
    }
  };

  return (
    <motion.div 
      className="space-y-4 md:space-y-8"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ staggerChildren: 0.1 }}
    >
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
        <div className="flex items-center space-x-3">
          <div className="p-2 rounded-lg bg-gradient-to-r from-pink-500 to-pink-600 shadow-lg">
            <MessageSquare className="h-6 w-6 text-white" />
          </div>
          <div>
            <h2 className="text-xl md:text-2xl font-bold text-gray-900">Foro de Discusión</h2>
            <p className="text-sm md:text-base text-gray-600">Participa en conversaciones con profesionales</p>
          </div>
        </div>
        <NewThreadDialog 
          categories={categories}
          selectedCategory={selectedCategory}
          onCreateThread={createThread}
        />
      </div>

      {/* Categorías reorganizadas de manera más amigable */}
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

        <CardContent className="p-4 md:p-6">
          {/* Filtros de categoría responsivos */}
          <div className="mb-6">
            {isMobile ? (
              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Selecciona una categoría" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas las discusiones</SelectItem>
                  {categories.map((category) => (
                    <SelectItem 
                      key={category.id} 
                      value={category.id}
                      disabled={!canAccessCategory(category)}
                    >
                      <div className="flex items-center space-x-2">
                        <span>{category.name}</span>
                        {category.is_premium && <Star className="h-3 w-3 text-yellow-500" />}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ) : (
              <div className="flex flex-wrap gap-3">
                <button
                  onClick={() => setSelectedCategory('all')}
                  className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-300 ${
                    selectedCategory === 'all'
                      ? 'bg-pink-500 text-white shadow-lg'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  Todas las discusiones
                </button>
                {categories.map((category) => (
                  <button
                    key={category.id}
                    onClick={() => setSelectedCategory(category.id)}
                    disabled={!canAccessCategory(category)}
                    className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-300 flex items-center space-x-2 ${
                      selectedCategory === category.id
                        ? 'bg-pink-500 text-white shadow-lg'
                        : canAccessCategory(category)
                        ? 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        : 'bg-gray-50 text-gray-400 cursor-not-allowed'
                    }`}
                  >
                    <span>{category.name}</span>
                    {category.is_premium && <Star className="h-3 w-3 text-yellow-500" />}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Información de hilos */}
          <div className="flex items-center justify-between mb-6">
            <div className="text-sm text-gray-600">
              {threads.length} {threads.length === 1 ? 'discusión' : 'discusiones'} 
              {selectedCategory !== 'all' && (
                <span className="ml-1">
                  en {categories.find(c => c.id === selectedCategory)?.name}
                </span>
              )}
            </div>
          </div>

          {/* Lista de hilos */}
          <ThreadList
            threads={threads}
            loading={loading}
            onThreadClick={onThreadClick}
            onCreateThread={() => {/* Handled by NewThreadDialog */}}
          />
        </CardContent>
      </Card>
    </motion.div>
  );
};
