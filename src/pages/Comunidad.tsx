
import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { MessageSquare, Users, Clock, Plus, Pin, Star, TrendingUp, Award } from 'lucide-react';
import { motion } from 'framer-motion';
import { ThreadCard } from '@/components/forum/ThreadCard';
import { ThreadView } from '@/components/forum/ThreadView';
import { ForumStats } from '@/components/forum/ForumStats';

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

const Comunidad = () => {
  const { profile } = useAuth();
  const [threads, setThreads] = useState<ForumThread[]>([]);
  const [categories, setCategories] = useState<ForumCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [newThreadTitle, setNewThreadTitle] = useState('');
  const [newThreadContent, setNewThreadContent] = useState('');
  const [showNewThreadDialog, setShowNewThreadDialog] = useState(false);
  const [selectedThreadId, setSelectedThreadId] = useState<string | null>(null);
  const [forumStats, setForumStats] = useState({
    totalThreads: 0,
    totalReplies: 0,
    userForumPosts: 0
  });

  useEffect(() => {
    loadCategories();
    loadThreads();
    loadForumStats();
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

  const loadForumStats = async () => {
    // Total threads
    const { count: totalThreads } = await supabase
      .from('forum_threads')
      .select('*', { count: 'exact', head: true });

    // Total replies
    const { count: totalReplies } = await supabase
      .from('forum_replies')
      .select('*', { count: 'exact', head: true });

    // User forum posts (threads + replies)
    let userForumPosts = 0;
    if (profile?.id) {
      const { count: userThreads } = await supabase
        .from('forum_threads')
        .select('*', { count: 'exact', head: true })
        .eq('author_id', profile.id);

      const { count: userReplies } = await supabase
        .from('forum_replies')
        .select('*', { count: 'exact', head: true })
        .eq('author_id', profile.id);

      userForumPosts = (userThreads || 0) + (userReplies || 0);
    }

    setForumStats({
      totalThreads: totalThreads || 0,
      totalReplies: totalReplies || 0,
      userForumPosts
    });
  };

  const createThread = async () => {
    if (!profile?.id || !newThreadTitle || !newThreadContent) return;

    const categoryId = selectedCategory !== 'all' ? selectedCategory : categories[0]?.id;

    const { error } = await supabase
      .from('forum_threads')
      .insert([{
        title: newThreadTitle,
        content: newThreadContent,
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

      setNewThreadTitle('');
      setNewThreadContent('');
      setShowNewThreadDialog(false);
      loadThreads();
      loadForumStats();
    }
  };

  const canAccessCategory = (category: ForumCategory) => {
    if (!category.is_premium) return true;
    return profile?.subscription_role && profile.subscription_role !== 'freemium';
  };

  const handleCategoryChange = (value: string) => {
    setSelectedCategory(value);
  };

  const handleThreadClick = (threadId: string) => {
    setSelectedThreadId(threadId);
  };

  const handleBackToForum = () => {
    setSelectedThreadId(null);
    loadThreads();
    loadForumStats();
  };

  // Show thread view if a thread is selected
  if (selectedThreadId) {
    return (
      <ThreadView 
        threadId={selectedThreadId} 
        onBack={handleBackToForum}
      />
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">🏥 Comunidad farmapro</h1>
          <p className="text-gray-600">Conecta con otros profesionales y comparte conocimientos</p>
        </div>
        <Dialog open={showNewThreadDialog} onOpenChange={setShowNewThreadDialog}>
          <DialogTrigger asChild>
            <Button className="bg-blue-600 hover:bg-blue-700">
              <Plus className="h-4 w-4 mr-2" />
              Nuevo Hilo
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>✍️ Crear Nuevo Hilo</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <Input
                placeholder="Título del hilo"
                value={newThreadTitle}
                onChange={(e) => setNewThreadTitle(e.target.value)}
              />
              <Textarea
                placeholder="Contenido del hilo - Comparte tu consulta, experiencia o conocimiento..."
                value={newThreadContent}
                onChange={(e) => setNewThreadContent(e.target.value)}
                rows={5}
              />
              <div className="flex items-center justify-between">
                <div className="text-sm text-gray-600">
                  💰 +100 puntos por crear un hilo
                </div>
                <Button 
                  onClick={createThread} 
                  disabled={!newThreadTitle || !newThreadContent}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  Crear Hilo
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Forum Stats */}
      <ForumStats 
        totalThreads={forumStats.totalThreads}
        totalReplies={forumStats.totalReplies}
        userForumPosts={forumStats.userForumPosts}
        userLevel={profile?.level || 1}
        userPoints={profile?.total_points || 0}
      />

      <Tabs value={selectedCategory} onValueChange={handleCategoryChange}>
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
          {loading ? (
            <div className="space-y-4">
              {[...Array(5)].map((_, i) => (
                <Card key={i} className="animate-pulse">
                  <CardContent className="p-6">
                    <div className="h-4 bg-gray-200 rounded mb-2"></div>
                    <div className="h-3 bg-gray-200 rounded"></div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="space-y-4">
              {threads.length === 0 ? (
                <Card className="text-center py-12">
                  <CardContent>
                    <MessageSquare className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">
                      No hay hilos en esta categoría
                    </h3>
                    <p className="text-gray-600 mb-4">
                      ¡Sé el primero en crear un hilo y empezar la conversación!
                    </p>
                    <Button onClick={() => setShowNewThreadDialog(true)}>
                      <Plus className="h-4 w-4 mr-2" />
                      Crear Primer Hilo
                    </Button>
                  </CardContent>
                </Card>
              ) : (
                threads.map((thread, index) => (
                  <ThreadCard
                    key={thread.id}
                    thread={thread}
                    index={index}
                    onClick={() => handleThreadClick(thread.id)}
                  />
                ))
              )}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Comunidad;
