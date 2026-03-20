
import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import ForumStatsComponent from '@/components/admin/community/ForumStats';
import CategoryManagement from '@/components/admin/community/CategoryManagement';
import ThreadManagement from '@/components/admin/community/ThreadManagement';

interface ForumCategory {
  id: string;
  name: string;
  description: string;
  is_premium: boolean;
  created_at: string;
  _count?: {
    threads: number;
  };
}

interface ForumThread {
  id: string;
  title: string;
  content: string;
  author_id: string;
  category_id: string;
  is_pinned: boolean;
  replies_count: number;
  created_at: string;
  profiles?: {
    full_name: string;
    email: string;
  };
  forum_categories?: {
    name: string;
  };
}

interface ForumStats {
  totalThreads: number;
  totalReplies: number;
  totalCategories: number;
  activeUsers: number;
}

const AdminComunidad = () => {
  const { profile } = useAuth();
  const [categories, setCategories] = useState<ForumCategory[]>([]);
  const [threads, setThreads] = useState<ForumThread[]>([]);
  const [stats, setStats] = useState<ForumStats>({
    totalThreads: 0,
    totalReplies: 0,
    totalCategories: 0,
    activeUsers: 0
  });
  const [loading, setLoading] = useState(true);
  const [selectedTab, setSelectedTab] = useState('overview');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      await Promise.all([
        loadCategories(),
        loadThreads(),
        loadStats()
      ]);
    } catch (error) {
      console.error('Error loading data:', error);
      toast.error('Error al cargar los datos');
    } finally {
      setLoading(false);
    }
  };

  const loadCategories = async () => {
    try {
      const { data: categoriesData, error: categoriesError } = await supabase
        .from('forum_categories')
        .select('*')
        .order('created_at', { ascending: false });

      if (categoriesError) {
        console.error('Error loading categories:', categoriesError);
        toast.error('Error al cargar categorías');
        return;
      }

      const categoriesWithCounts = await Promise.all(
        (categoriesData || []).map(async (category) => {
          const { count } = await supabase
            .from('forum_threads')
            .select('*', { count: 'exact', head: true })
            .eq('category_id', category.id);

          return {
            ...category,
            _count: { threads: count || 0 }
          };
        })
      );

      setCategories(categoriesWithCounts);
    } catch (error) {
      console.error('Error loading categories with counts:', error);
      toast.error('Error al cargar categorías');
    }
  };

  const loadThreads = async () => {
    const { data, error } = await supabase
      .from('forum_threads')
      .select(`
        *,
        profiles(full_name, email),
        forum_categories(name)
      `)
      .order('created_at', { ascending: false })
      .limit(50);

    if (error) {
      console.error('Error loading threads:', error);
      toast.error('Error al cargar hilos');
    } else {
      setThreads(data || []);
    }
  };

  const loadStats = async () => {
    try {
      const { count: totalThreads } = await supabase
        .from('forum_threads')
        .select('*', { count: 'exact', head: true });

      const { count: totalReplies } = await supabase
        .from('forum_replies')
        .select('*', { count: 'exact', head: true });

      const { count: totalCategories } = await supabase
        .from('forum_categories')
        .select('*', { count: 'exact', head: true });

      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      
      const { data: activeUsersData } = await supabase
        .from('forum_threads')
        .select('author_id')
        .gte('created_at', thirtyDaysAgo.toISOString());

      const { data: activeUsersReplies } = await supabase
        .from('forum_replies')
        .select('author_id')
        .gte('created_at', thirtyDaysAgo.toISOString());

      const uniqueUsers = new Set([
        ...(activeUsersData?.map(t => t.author_id) || []),
        ...(activeUsersReplies?.map(r => r.author_id) || [])
      ]);

      setStats({
        totalThreads: totalThreads || 0,
        totalReplies: totalReplies || 0,
        totalCategories: totalCategories || 0,
        activeUsers: uniqueUsers.size
      });
    } catch (error) {
      console.error('Error loading stats:', error);
    }
  };

  const handleCreateCategory = async (data: { name: string; description: string; is_premium: boolean }) => {
    try {
      const { error } = await supabase
        .from('forum_categories')
        .insert([{
          name: data.name.trim(),
          slug: data.name.trim().toLowerCase().replace(/\s+/g, '-'),
          description: data.description.trim() || null,
          is_premium: data.is_premium
        }]);

      if (error) {
        console.error('Error creating category:', error);
        toast.error('Error al crear categoría: ' + error.message);
        throw error;
      } else {
        toast.success('Categoría creada exitosamente');
        await loadCategories();
        await loadStats();
      }
    } catch (error) {
      console.error('Unexpected error:', error);
      toast.error('Error inesperado al crear categoría');
      throw error;
    }
  };

  const handleUpdateCategory = async (id: string, data: { name: string; description: string; is_premium: boolean }) => {
    try {
      const { error } = await supabase
        .from('forum_categories')
        .update({
          name: data.name.trim(),
          description: data.description.trim() || null,
          is_premium: data.is_premium
        })
        .eq('id', id);

      if (error) {
        console.error('Error updating category:', error);
        toast.error('Error al actualizar categoría: ' + error.message);
        throw error;
      } else {
        toast.success('Categoría actualizada exitosamente');
        await loadCategories();
      }
    } catch (error) {
      console.error('Unexpected error:', error);
      toast.error('Error inesperado al actualizar categoría');
      throw error;
    }
  };

  const handleDeleteCategory = async (categoryId: string) => {
    try {
      const { count } = await supabase
        .from('forum_threads')
        .select('*', { count: 'exact', head: true })
        .eq('category_id', categoryId);

      if (count && count > 0) {
        toast.error(`No se puede eliminar la categoría porque tiene ${count} hilo(s) asociado(s)`);
        return;
      }

      const { error } = await supabase
        .from('forum_categories')
        .delete()
        .eq('id', categoryId);

      if (error) {
        console.error('Error deleting category:', error);
        toast.error('Error al eliminar categoría: ' + error.message);
      } else {
        toast.success('Categoría eliminada exitosamente');
        await loadCategories();
        await loadStats();
      }
    } catch (error) {
      console.error('Unexpected error:', error);
      toast.error('Error inesperado al eliminar categoría');
    }
  };

  const handleTogglePin = async (threadId: string, isPinned: boolean) => {
    try {
      const { error } = await supabase
        .from('forum_threads')
        .update({ is_pinned: !isPinned })
        .eq('id', threadId);

      if (error) {
        console.error('Error toggling pin:', error);
        toast.error('Error al cambiar estado del hilo: ' + error.message);
      } else {
        toast.success(isPinned ? 'Hilo despinneado' : 'Hilo pinneado');
        await loadThreads();
      }
    } catch (error) {
      console.error('Unexpected error:', error);
      toast.error('Error inesperado al cambiar estado del hilo');
    }
  };

  const handleDeleteThread = async (threadId: string) => {
    try {
      const { error: repliesError } = await supabase
        .from('forum_replies')
        .delete()
        .eq('thread_id', threadId);

      if (repliesError) {
        console.error('Error deleting replies:', repliesError);
        toast.error('Error al eliminar respuestas del hilo');
        return;
      }

      const { error: threadError } = await supabase
        .from('forum_threads')
        .delete()
        .eq('id', threadId);

      if (threadError) {
        console.error('Error deleting thread:', threadError);
        toast.error('Error al eliminar hilo: ' + threadError.message);
      } else {
        toast.success('Hilo eliminado exitosamente');
        await loadThreads();
        await loadStats();
      }
    } catch (error) {
      console.error('Unexpected error:', error);
      toast.error('Error inesperado al eliminar hilo');
    }
  };

  const viewThread = (threadId: string) => {
    window.open(`/comunidad?thread=${threadId}`, '_blank');
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Gestión de Comunidad</h1>
          <p className="text-gray-600">Cargando datos de la comunidad...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Gestión de Comunidad</h1>
        <p className="text-gray-600">Administra categorías, hilos y modera el contenido del foro</p>
      </div>

      <Tabs value={selectedTab} onValueChange={setSelectedTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="overview">Resumen</TabsTrigger>
          <TabsTrigger value="categories">Categorías</TabsTrigger>
          <TabsTrigger value="threads">Hilos</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <ForumStatsComponent 
            stats={stats} 
            threads={threads} 
            onViewThread={viewThread} 
          />
        </TabsContent>

        <TabsContent value="categories" className="space-y-6">
          <CategoryManagement 
            categories={categories}
            onCreateCategory={handleCreateCategory}
            onUpdateCategory={handleUpdateCategory}
            onDeleteCategory={handleDeleteCategory}
          />
        </TabsContent>

        <TabsContent value="threads" className="space-y-6">
          <ThreadManagement 
            threads={threads}
            onTogglePin={handleTogglePin}
            onDeleteThread={handleDeleteThread}
            onViewThread={viewThread}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AdminComunidad;
