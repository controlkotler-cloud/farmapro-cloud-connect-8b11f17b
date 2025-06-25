
import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Plus, Edit, Trash2, Eye } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import type { Database } from '@/integrations/supabase/types';

type Course = Database['public']['Tables']['courses']['Row'];
type CourseCategory = Database['public']['Enums']['course_category'];

const AdminCursos = () => {
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [editingCourse, setEditingCourse] = useState<Course | null>(null);
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: '' as CourseCategory,
    duration_minutes: 0,
    is_premium: false,
    content: '',
    thumbnail_url: ''
  });

  const categories = [
    { value: 'gestion', label: 'Gestión Farmacéutica' },
    { value: 'marketing', label: 'Marketing y Ventas' },
    { value: 'liderazgo', label: 'Liderazgo' },
    { value: 'atencion_cliente', label: 'Atención al Cliente' },
    { value: 'tecnologia', label: 'Tecnología' }
  ];

  useEffect(() => {
    loadCourses();
  }, []);

  const loadCourses = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('courses')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error loading courses:', error);
      toast({
        title: "Error",
        description: "No se pudieron cargar los cursos",
        variant: "destructive"
      });
    } else {
      setCourses(data || []);
    }
    setLoading(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.title || !formData.category) {
      toast({
        title: "Error",
        description: "Por favor completa los campos obligatorios",
        variant: "destructive"
      });
      return;
    }

    try {
      if (editingCourse) {
        const { error } = await supabase
          .from('courses')
          .update(formData)
          .eq('id', editingCourse.id);

        if (error) throw error;
        
        toast({
          title: "Éxito",
          description: "Curso actualizado correctamente"
        });
      } else {
        const { error } = await supabase
          .from('courses')
          .insert([formData]);

        if (error) throw error;
        
        toast({
          title: "Éxito",
          description: "Curso creado correctamente"
        });
      }

      resetForm();
      loadCourses();
    } catch (error) {
      console.error('Error saving course:', error);
      toast({
        title: "Error",
        description: "No se pudo guardar el curso",
        variant: "destructive"
      });
    }
  };

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      category: '' as CourseCategory,
      duration_minutes: 0,
      is_premium: false,
      content: '',
      thumbnail_url: ''
    });
    setEditingCourse(null);
    setIsCreateDialogOpen(false);
  };

  const handleEdit = (course: Course) => {
    setFormData({
      title: course.title,
      description: course.description || '',
      category: course.category,
      duration_minutes: course.duration_minutes || 0,
      is_premium: course.is_premium || false,
      content: course.content || '',
      thumbnail_url: course.thumbnail_url || ''
    });
    setEditingCourse(course);
    setIsCreateDialogOpen(true);
  };

  const handleDelete = async (courseId: string) => {
    if (!confirm('¿Estás seguro de que quieres eliminar este curso?')) return;

    try {
      const { error } = await supabase
        .from('courses')
        .delete()
        .eq('id', courseId);

      if (error) throw error;

      toast({
        title: "Éxito",
        description: "Curso eliminado correctamente"
      });
      loadCourses();
    } catch (error) {
      console.error('Error deleting course:', error);
      toast({
        title: "Error",
        description: "No se pudo eliminar el curso",
        variant: "destructive"
      });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Gestión de Cursos</h1>
          <p className="text-gray-600">Crear y gestionar cursos de formación</p>
        </div>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => resetForm()}>
              <Plus className="h-4 w-4 mr-2" />
              Nuevo Curso
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingCourse ? 'Editar Curso' : 'Crear Nuevo Curso'}
              </DialogTitle>
              <DialogDescription>
                Completa la información del curso
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="title">Título *</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  required
                />
              </div>
              
              <div>
                <Label htmlFor="description">Descripción</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="category">Categoría *</Label>
                  <Select 
                    value={formData.category} 
                    onValueChange={(value) => setFormData({ ...formData, category: value as CourseCategory })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecciona una categoría" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map((cat) => (
                        <SelectItem key={cat.value} value={cat.value}>
                          {cat.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <Label htmlFor="duration">Duración (minutos)</Label>
                  <Input
                    id="duration"
                    type="number"
                    value={formData.duration_minutes}
                    onChange={(e) => setFormData({ ...formData, duration_minutes: parseInt(e.target.value) || 0 })}
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="thumbnail_url">URL de la imagen</Label>
                <Input
                  id="thumbnail_url"
                  value={formData.thumbnail_url}
                  onChange={(e) => setFormData({ ...formData, thumbnail_url: e.target.value })}
                />
              </div>

              <div>
                <Label htmlFor="content">Contenido del curso</Label>
                <Textarea
                  id="content"
                  value={formData.content}
                  onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                  rows={5}
                  placeholder="Contenido detallado del curso..."
                />
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  id="premium"
                  checked={formData.is_premium}
                  onCheckedChange={(checked) => setFormData({ ...formData, is_premium: checked })}
                />
                <Label htmlFor="premium">Curso Premium</Label>
              </div>

              <div className="flex justify-end space-x-2">
                <Button type="button" variant="outline" onClick={resetForm}>
                  Cancelar
                </Button>
                <Button type="submit">
                  {editingCourse ? 'Actualizar' : 'Crear'} Curso
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Courses List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {loading ? (
          Array.from({ length: 6 }).map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-6">
                <div className="h-4 bg-gray-200 rounded mb-2"></div>
                <div className="h-3 bg-gray-200 rounded mb-4"></div>
                <div className="h-8 bg-gray-200 rounded"></div>
              </CardContent>
            </Card>
          ))
        ) : (
          courses.map((course) => (
            <Card key={course.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-lg line-clamp-2">{course.title}</CardTitle>
                    <div className="flex items-center space-x-2 mt-2">
                      <Badge variant="outline">
                        {categories.find(c => c.value === course.category)?.label}
                      </Badge>
                      {course.is_premium && (
                        <Badge className="bg-gradient-to-r from-yellow-400 to-orange-500">
                          Premium
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
                <CardDescription className="line-clamp-3">
                  {course.description}
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="flex items-center justify-between text-sm text-gray-600 mb-4">
                  <span>{course.duration_minutes} min</span>
                  <span>{new Date(course.created_at).toLocaleDateString()}</span>
                </div>
                <div className="flex space-x-2">
                  <Button size="sm" variant="outline" onClick={() => handleEdit(course)}>
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button size="sm" variant="outline">
                    <Eye className="h-4 w-4" />
                  </Button>
                  <Button 
                    size="sm" 
                    variant="destructive" 
                    onClick={() => handleDelete(course.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
};

export default AdminCursos;
