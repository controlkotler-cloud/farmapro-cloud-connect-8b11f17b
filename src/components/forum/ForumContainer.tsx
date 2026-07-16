import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { ForumFilters } from './ForumFilters';
import { ThreadList } from './ThreadList';
import { NewThreadDialog } from './NewThreadDialog';

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

interface ForumContainerProps {
  onThreadClick: (threadId: string) => void;
  onDataChange: () => void;
}

export const ForumContainer = ({ onThreadClick, onDataChange }: ForumContainerProps) => {
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
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-foreground sm:text-3xl [text-wrap:balance]">
            Comunidad <em className="italic-display">farmapro</em>
          </h1>
          <p className="mt-1.5 text-sm text-muted-foreground">Conecta con otros profesionales y comparte conocimientos</p>
        </div>
        <NewThreadDialog
          categories={categories}
          selectedCategory={selectedCategory}
          showFullNameDefault={profile?.name_display_preference !== 'initials'}
          onCreateThread={createThread}
        />
      </div>

      <ForumFilters
        categories={categories}
        selectedCategory={selectedCategory}
        onCategoryChange={setSelectedCategory}
        canAccessCategory={canAccessCategory}
      >
        <ThreadList
          threads={threads}
          loading={loading}
          onThreadClick={onThreadClick}
          onCreateThread={() => {/* This will be handled by NewThreadDialog */}}
        />
      </ForumFilters>
    </div>
  );
};
