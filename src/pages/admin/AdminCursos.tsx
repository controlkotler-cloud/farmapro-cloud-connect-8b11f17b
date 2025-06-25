
import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { DialogTrigger } from '@/components/ui/dialog';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import CourseFormDialog from '@/components/admin/courses/CourseFormDialog';
import CourseCard from '@/components/admin/courses/CourseCard';
import type { Database } from '@/integrations/supabase/types';

type Course = Database['public']['Tables']['courses']['Row'];
type CourseCategory = Database['public']['Enums']['course_category'];

const AdminCursos = () => {
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [editingCourse, setEditingCourse] = useState<Course | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: '' as CourseCategory | '',
    duration_minutes: 0,
    is_premium: false,
    content: '',
    thumbnail_url: '',
    featured_image_url: '',
    course_modules: [] as any[]
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
    console.log('Cargando cursos...');
    
    const { data, error } = await supabase
      .from('courses')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error loading courses:', error);
      toast({
        title: "Error",
        description: "No se pudieron cargar los cursos: " + error.message,
        variant: "destructive"
      });
    } else {
      console.log('Cursos cargados:', data);
      setCourses(data || []);
    }
    setLoading(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.title || !formData.category) {
      toast({
        title: "Error",
        description: "Por favor completa los campos obligatorios (título y categoría)",
        variant: "destructive"
      });
      return;
    }

    setSubmitting(true);
    console.log('Guardando curso:', { formData, editingCourse });

    try {
      const courseData = {
        title: formData.title.trim(),
        description: formData.description?.trim() || null,
        category: formData.category as CourseCategory,
        duration_minutes: formData.duration_minutes > 0 ? formData.duration_minutes : null,
        is_premium: formData.is_premium,
        content: formData.content?.trim() || null,
        thumbnail_url: formData.thumbnail_url?.trim() || null,
        featured_image_url: formData.featured_image_url?.trim() || null,
        course_modules: formData.course_modules.length > 0 ? formData.course_modules : []
      };

      if (editingCourse) {
        console.log('Actualizando curso con ID:', editingCourse.id);
        
        const { data, error } = await supabase
          .from('courses')
          .update({
            ...courseData,
            updated_at: new Date().toISOString()
          })
          .eq('id', editingCourse.id)
          .select()
          .single();

        if (error) {
          console.error('Error detallado al actualizar:', error);
          throw new Error(`Error al actualizar: ${error.message}`);
        }

        if (!data) {
          throw new Error('No se recibieron datos después de la actualización');
        }

        console.log('Curso actualizado exitosamente:', data);
        
        setCourses(prevCourses => 
          prevCourses.map(course => 
            course.id === editingCourse.id ? data : course
          )
        );
        
        toast({
          title: "Éxito",
          description: `Curso "${data.title}" actualizado correctamente`
        });
      } else {
        console.log('Creando nuevo curso...');
        
        const { data, error } = await supabase
          .from('courses')
          .insert([courseData])
          .select()
          .single();

        if (error) {
          console.error('Error detallado al crear:', error);
          throw new Error(`Error al crear: ${error.message}`);
        }

        if (!data) {
          throw new Error('No se recibieron datos después de la creación');
        }

        console.log('Curso creado exitosamente:', data);
        
        setCourses(prevCourses => [data, ...prevCourses]);
        
        toast({
          title: "Éxito",
          description: `Curso "${data.title}" creado correctamente`
        });
      }

      resetForm();
    } catch (error) {
      console.error('Error al guardar curso:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Error desconocido al guardar el curso",
        variant: "destructive"
      });
    } finally {
      setSubmitting(false);
    }
  };

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      category: '',
      duration_minutes: 0,
      is_premium: false,
      content: '',
      thumbnail_url: '',
      featured_image_url: '',
      course_modules: []
    });
    setEditingCourse(null);
    setIsCreateDialogOpen(false);
  };

  const handleEdit = (course: Course) => {
    console.log('Editando curso:', course);
    setFormData({
      title: course.title,
      description: course.description || '',
      category: course.category,
      duration_minutes: course.duration_minutes || 0,
      is_premium: course.is_premium || false,
      content: course.content || '',
      thumbnail_url: course.thumbnail_url || '',
      featured_image_url: course.featured_image_url || '',
      course_modules: Array.isArray(course.course_modules) ? course.course_modules : []
    });
    setEditingCourse(course);
    setIsCreateDialogOpen(true);
  };

  const handleDelete = async (courseId: string) => {
    if (!confirm('¿Estás seguro de que quieres eliminar este curso? Esta acción no se puede deshacer.')) return;

    console.log('Eliminando curso:', courseId);

    try {
      const { error } = await supabase
        .from('courses')
        .delete()
        .eq('id', courseId);

      if (error) {
        console.error('Error deleting course:', error);
        throw new Error(`Error al eliminar: ${error.message}`);
      }

      console.log('Curso eliminado correctamente');
      
      setCourses(prevCourses => prevCourses.filter(course => course.id !== courseId));
      
      toast({
        title: "Éxito",
        description: "Curso eliminado correctamente"
      });
    } catch (error) {
      console.error('Error deleting course:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Error desconocido al eliminar el curso",
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
        <DialogTrigger asChild>
          <Button onClick={() => resetForm()}>
            <Plus className="h-4 w-4 mr-2" />
            Nuevo Curso
          </Button>
        </DialogTrigger>
      </div>

      <CourseFormDialog
        isOpen={isCreateDialogOpen}
        onOpenChange={setIsCreateDialogOpen}
        editingCourse={editingCourse}
        formData={formData}
        onFormDataChange={setFormData}
        onSubmit={handleSubmit}
        onCancel={resetForm}
        submitting={submitting}
        categories={categories}
      />

      {/* Lista de cursos */}
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
        ) : courses.length === 0 ? (
          <div className="col-span-full">
            <Card>
              <CardContent className="p-12 text-center">
                <h3 className="text-lg font-medium text-gray-900 mb-2">No hay cursos</h3>
                <p className="text-gray-600 mb-4">Comienza creando tu primer curso</p>
                <Button onClick={() => setIsCreateDialogOpen(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Crear Primer Curso
                </Button>
              </CardContent>
            </Card>
          </div>
        ) : (
          courses.map((course) => (
            <CourseCard
              key={course.id}
              course={course}
              categories={categories}
              onEdit={handleEdit}
              onDelete={handleDelete}
            />
          ))
        )}
      </div>
    </div>
  );
};

export default AdminCursos;
