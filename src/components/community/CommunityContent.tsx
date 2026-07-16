import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useIsMobile } from '@/hooks/use-mobile';
import { MessageSquare, Star, RefreshCw } from 'lucide-react';
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
  author_display_name?: string | null;
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

  const createThread = async (title: string, content: string, showFullName: boolean) => {
    if (!profile?.id) return;

    const categoryId = selectedCategory !== 'all' ? selectedCategory : categories[0]?.id;
    const nameDisplayChoice = showFullName ? 'full' : 'initials';

    const { error } = await supabase
      .from('forum_threads')
      .insert([{
        title,
        content,
        author_id: profile.id,
        category_id: categoryId,
        name_display_choice: nameDisplayChoice
      } as any]);

    if (nameDisplayChoice !== profile.name_display_preference) {
      supabase.from('profiles').update({ name_display_preference: nameDisplayChoice } as any).eq('id', profile.id);
    }

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
    <div className="space-y-4 md:space-y-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 flex-none items-center justify-center rounded-full bg-terracota-soft">
            <MessageSquare className="h-5 w-5 text-terracota" />
          </div>
          <div>
            <h2 className="text-lg font-extrabold tracking-tight text-foreground md:text-xl">Foro de discusión</h2>
            <p className="text-sm text-muted-foreground">Participa en conversaciones con profesionales</p>
          </div>
        </div>
        <NewThreadDialog
          categories={categories}
          selectedCategory={selectedCategory}
          showFullNameDefault={profile?.name_display_preference !== 'initials'}
          onCreateThread={createThread}
        />
      </div>

      {/* Categorías de discusión */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 border-b border-border">
          <CardTitle className="text-base font-extrabold text-foreground">
            Categorías
          </CardTitle>
          <Button
            variant="outline"
            size="sm"
            onClick={() => loadThreads()}
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Actualizar
          </Button>
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
                        {category.is_premium && <Star className="h-3 w-3 text-terracota" />}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ) : (
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => setSelectedCategory('all')}
                  className={`rounded-full px-4 py-2 text-sm font-semibold transition-colors ${
                    selectedCategory === 'all'
                      ? 'bg-terracota-soft text-terracota'
                      : 'bg-muted text-muted-foreground hover:bg-accent'
                  }`}
                >
                  Todas las discusiones
                </button>
                {categories.map((category) => (
                  <button
                    key={category.id}
                    onClick={() => setSelectedCategory(category.id)}
                    disabled={!canAccessCategory(category)}
                    className={`inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-sm font-semibold transition-colors ${
                      selectedCategory === category.id
                        ? 'bg-terracota-soft text-terracota'
                        : canAccessCategory(category)
                        ? 'bg-muted text-muted-foreground hover:bg-accent'
                        : 'bg-muted/50 text-muted-foreground/60 cursor-not-allowed'
                    }`}
                  >
                    <span>{category.name}</span>
                    {category.is_premium && <Star className="h-3 w-3 text-terracota" />}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Información de hilos */}
          <div className="mb-4 text-sm text-muted-foreground">
            {threads.length} {threads.length === 1 ? 'discusión' : 'discusiones'}
            {selectedCategory !== 'all' && (
              <span className="ml-1">
                en {categories.find(c => c.id === selectedCategory)?.name}
              </span>
            )}
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
    </div>
  );
};
