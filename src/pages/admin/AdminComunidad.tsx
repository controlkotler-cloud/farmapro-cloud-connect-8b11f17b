
import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { 
  MessageSquare, 
  Plus, 
  Edit, 
  Trash2, 
  Pin, 
  PinOff,
  Eye,
  Users,
  Hash,
  MessageCircle,
  Activity
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { toast } from 'sonner';

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

  // Category form state
  const [categoryForm, setCategoryForm] = useState({
    name: '',
    description: '',
    is_premium: false
  });
  const [editingCategory, setEditingCategory] = useState<ForumCategory | null>(null);
  const [showCategoryDialog, setShowCategoryDialog] = useState(false);
  const [submittingCategory, setSubmittingCategory] = useState(false);

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
      // First get categories
      const { data: categoriesData, error: categoriesError } = await supabase
        .from('forum_categories')
        .select('*')
        .order('created_at', { ascending: false });

      if (categoriesError) {
        console.error('Error loading categories:', categoriesError);
        toast.error('Error al cargar categorías');
        return;
      }

      // Then get thread counts for each category
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
      // Total threads
      const { count: totalThreads } = await supabase
        .from('forum_threads')
        .select('*', { count: 'exact', head: true });

      // Total replies
      const { count: totalReplies } = await supabase
        .from('forum_replies')
        .select('*', { count: 'exact', head: true });

      // Total categories
      const { count: totalCategories } = await supabase
        .from('forum_categories')
        .select('*', { count: 'exact', head: true });

      // Active users (users who have posted in the last 30 days)
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

  const handleCreateCategory = async () => {
    if (!categoryForm.name.trim()) {
      toast.error('El nombre de la categoría es requerido');
      return;
    }

    setSubmittingCategory(true);
    try {
      const { error } = await supabase
        .from('forum_categories')
        .insert([{
          name: categoryForm.name.trim(),
          description: categoryForm.description.trim() || null,
          is_premium: categoryForm.is_premium
        }]);

      if (error) {
        console.error('Error creating category:', error);
        toast.error('Error al crear categoría: ' + error.message);
      } else {
        toast.success('Categoría creada exitosamente');
        setCategoryForm({ name: '', description: '', is_premium: false });
        setShowCategoryDialog(false);
        loadCategories();
      }
    } catch (error) {
      console.error('Unexpected error:', error);
      toast.error('Error inesperado al crear categoría');
    } finally {
      setSubmittingCategory(false);
    }
  };

  const handleUpdateCategory = async () => {
    if (!editingCategory || !categoryForm.name.trim()) {
      toast.error('El nombre de la categoría es requerido');
      return;
    }

    setSubmittingCategory(true);
    try {
      const { error } = await supabase
        .from('forum_categories')
        .update({
          name: categoryForm.name.trim(),
          description: categoryForm.description.trim() || null,
          is_premium: categoryForm.is_premium
        })
        .eq('id', editingCategory.id);

      if (error) {
        console.error('Error updating category:', error);
        toast.error('Error al actualizar categoría: ' + error.message);
      } else {
        toast.success('Categoría actualizada exitosamente');
        setEditingCategory(null);
        setCategoryForm({ name: '', description: '', is_premium: false });
        setShowCategoryDialog(false);
        loadCategories();
      }
    } catch (error) {
      console.error('Unexpected error:', error);
      toast.error('Error inesperado al actualizar categoría');
    } finally {
      setSubmittingCategory(false);
    }
  };

  const handleDeleteCategory = async (categoryId: string) => {
    try {
      // Check if category has threads
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
        loadCategories();
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
        loadThreads();
      }
    } catch (error) {
      console.error('Unexpected error:', error);
      toast.error('Error inesperado al cambiar estado del hilo');
    }
  };

  const handleDeleteThread = async (threadId: string) => {
    try {
      // First delete all replies
      const { error: repliesError } = await supabase
        .from('forum_replies')
        .delete()
        .eq('thread_id', threadId);

      if (repliesError) {
        console.error('Error deleting replies:', repliesError);
        toast.error('Error al eliminar respuestas del hilo');
        return;
      }

      // Then delete the thread
      const { error: threadError } = await supabase
        .from('forum_threads')
        .delete()
        .eq('id', threadId);

      if (threadError) {
        console.error('Error deleting thread:', threadError);
        toast.error('Error al eliminar hilo: ' + threadError.message);
      } else {
        toast.success('Hilo eliminado exitosamente');
        loadThreads();
        loadStats(); // Refresh stats after deletion
      }
    } catch (error) {
      console.error('Unexpected error:', error);
      toast.error('Error inesperado al eliminar hilo');
    }
  };

  const openCategoryDialog = (category?: ForumCategory) => {
    if (category) {
      setEditingCategory(category);
      setCategoryForm({
        name: category.name,
        description: category.description || '',
        is_premium: category.is_premium
      });
    } else {
      setEditingCategory(null);
      setCategoryForm({ name: '', description: '', is_premium: false });
    }
    setShowCategoryDialog(true);
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
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Hilos</CardTitle>
                <MessageSquare className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.totalThreads}</div>
                <p className="text-xs text-muted-foreground">Hilos de discusión</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Respuestas</CardTitle>
                <MessageCircle className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.totalReplies}</div>
                <p className="text-xs text-muted-foreground">Respuestas en hilos</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Categorías</CardTitle>
                <Hash className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.totalCategories}</div>
                <p className="text-xs text-muted-foreground">Categorías activas</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Usuarios Activos</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.activeUsers}</div>
                <p className="text-xs text-muted-foreground">Últimos 30 días</p>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5" />
                Hilos Recientes
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {threads.slice(0, 5).map((thread) => (
                  <div key={thread.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50">
                    <div className="flex-1">
                      <h4 className="font-medium text-gray-900">{thread.title}</h4>
                      <p className="text-sm text-gray-600 mt-1">
                        Por {thread.profiles?.full_name || 'Usuario desconocido'} en {thread.forum_categories?.name}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        {new Date(thread.created_at).toLocaleDateString('es-ES', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </p>
                    </div>
                    <div className="flex items-center space-x-2">
                      {thread.is_pinned && (
                        <Badge variant="secondary">
                          <Pin className="h-3 w-3 mr-1" />
                          Pinneado
                        </Badge>
                      )}
                      <Badge variant="outline">
                        {thread.replies_count} respuestas
                      </Badge>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => viewThread(thread.id)}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
                {threads.length === 0 && (
                  <p className="text-center text-gray-500 py-8">No hay hilos recientes</p>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="categories" className="space-y-6">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-lg font-semibold">Categorías del Foro</h3>
              <p className="text-sm text-gray-600">Gestiona las categorías disponibles en el foro</p>
            </div>
            <Button onClick={() => openCategoryDialog()}>
              <Plus className="h-4 w-4 mr-2" />
              Nueva Categoría
            </Button>
          </div>

          <div className="grid gap-4">
            {categories.map((category) => (
              <Card key={category.id}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-2">
                        <h4 className="font-medium text-gray-900">{category.name}</h4>
                        {category.is_premium && (
                          <Badge variant="default" className="bg-yellow-100 text-yellow-800">Premium</Badge>
                        )}
                        <Badge variant="outline">
                          {category._count?.threads || 0} hilos
                        </Badge>
                      </div>
                      {category.description && (
                        <p className="text-sm text-gray-600 mb-2">{category.description}</p>
                      )}
                      <p className="text-xs text-gray-500">
                        Creada el {new Date(category.created_at).toLocaleDateString('es-ES', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric'
                        })}
                      </p>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => openCategoryDialog(category)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="outline" size="sm">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>¿Eliminar categoría?</AlertDialogTitle>
                            <AlertDialogDescription>
                              Esta acción no se puede deshacer. Se eliminará la categoría "{category.name}".
                              {category._count && category._count.threads > 0 && (
                                <span className="block mt-2 text-red-600 font-medium">
                                  ⚠️ Esta categoría tiene {category._count.threads} hilo(s) asociado(s).
                                </span>
                              )}
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancelar</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => handleDeleteCategory(category.id)}
                              className="bg-red-600 hover:bg-red-700"
                            >
                              Eliminar
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
            {categories.length === 0 && (
              <Card>
                <CardContent className="p-8 text-center">
                  <Hash className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No hay categorías</h3>
                  <p className="text-gray-600 mb-4">Crea la primera categoría para organizar los hilos del foro</p>
                  <Button onClick={() => openCategoryDialog()}>
                    <Plus className="h-4 w-4 mr-2" />
                    Crear Primera Categoría
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>

        <TabsContent value="threads" className="space-y-6">
          <div>
            <h3 className="text-lg font-semibold">Hilos del Foro</h3>
            <p className="text-sm text-gray-600">Modera y gestiona los hilos de discusión</p>
          </div>

          <div className="space-y-4">
            {threads.map((thread) => (
              <Card key={thread.id}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-2">
                        <h4 className="font-medium text-gray-900">{thread.title}</h4>
                        {thread.is_pinned && (
                          <Badge variant="secondary">
                            <Pin className="h-3 w-3 mr-1" />
                            Pinneado
                          </Badge>
                        )}
                      </div>
                      
                      <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                        {thread.content}
                      </p>
                      
                      <div className="flex items-center space-x-4 text-xs text-gray-500">
                        <span>Por {thread.profiles?.full_name || 'Usuario desconocido'}</span>
                        <span>•</span>
                        <span>{thread.forum_categories?.name}</span>
                        <span>•</span>
                        <span>{thread.replies_count} respuestas</span>
                        <span>•</span>
                        <span>{new Date(thread.created_at).toLocaleDateString('es-ES')}</span>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-2 ml-4">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleTogglePin(thread.id, thread.is_pinned)}
                        title={thread.is_pinned ? 'Despinnear hilo' : 'Pinnear hilo'}
                      >
                        {thread.is_pinned ? (
                          <PinOff className="h-4 w-4" />
                        ) : (
                          <Pin className="h-4 w-4" />
                        )}
                      </Button>
                      
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => viewThread(thread.id)}
                        title="Ver hilo"
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="outline" size="sm" title="Eliminar hilo">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>¿Eliminar hilo?</AlertDialogTitle>
                            <AlertDialogDescription>
                              Esta acción no se puede deshacer. Se eliminará el hilo "{thread.title}" y todas sus {thread.replies_count} respuestas.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancelar</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => handleDeleteThread(thread.id)}
                              className="bg-red-600 hover:bg-red-700"
                            >
                              Eliminar
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
            {threads.length === 0 && (
              <Card>
                <CardContent className="p-8 text-center">
                  <MessageSquare className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No hay hilos</h3>
                  <p className="text-gray-600">Los hilos aparecerán aquí cuando los usuarios comiencen a crear discusiones</p>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>
      </Tabs>

      {/* Category Dialog */}
      <Dialog open={showCategoryDialog} onOpenChange={setShowCategoryDialog}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>
              {editingCategory ? 'Editar Categoría' : 'Nueva Categoría'}
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="categoryName">Nombre *</Label>
              <Input
                id="categoryName"
                value={categoryForm.name}
                onChange={(e) => setCategoryForm({ ...categoryForm, name: e.target.value })}
                placeholder="Nombre de la categoría"
                disabled={submittingCategory}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="categoryDescription">Descripción</Label>
              <Textarea
                id="categoryDescription"
                value={categoryForm.description}
                onChange={(e) => setCategoryForm({ ...categoryForm, description: e.target.value })}
                placeholder="Descripción de la categoría (opcional)"
                rows={3}
                disabled={submittingCategory}
              />
            </div>
            
            <div className="flex items-center space-x-2">
              <Switch
                id="isPremium"
                checked={categoryForm.is_premium}
                onCheckedChange={(checked) => setCategoryForm({ ...categoryForm, is_premium: checked })}
                disabled={submittingCategory}
              />
              <Label htmlFor="isPremium">Categoría Premium</Label>
            </div>
          </div>
          
          <div className="flex justify-end space-x-2">
            <Button
              variant="outline"
              onClick={() => setShowCategoryDialog(false)}
              disabled={submittingCategory}
            >
              Cancelar
            </Button>
            <Button
              onClick={editingCategory ? handleUpdateCategory : handleCreateCategory}
              disabled={submittingCategory || !categoryForm.name.trim()}
            >
              {submittingCategory ? 'Guardando...' : (editingCategory ? 'Actualizar' : 'Crear')}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminComunidad;
