
import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
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
    console.log('Enviando datos del curso:', formData);
    console.log('Editando curso:', editingCourse);

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
        course_modules: formData.course_modules && formData.course_modules.length > 0 ? formData.course_modules : []
      };

      console.log('Datos a enviar a Supabase:', courseData);

      if (editingCourse) {
        console.log('Actualizando curso con ID:', editingCourse.id);
        
        const { data, error } = await supabase
          .from('courses')
          .update(courseData)
          .eq('id', editingCourse.id)
          .select()
          .single();

        if (error) {
          console.error('Error al actualizar curso:', error);
          throw error;
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
          console.error('Error al crear curso:', error);
          throw error;
        }

        console.log('Curso creado exitosamente:', data);
        
        setCourses(prevCourses => [data, ...prevCourses]);
        
        toast({
          title: "Éxito",
          description: `Curso "${data.title}" creado correctamente`
        });
      }

      resetForm();
    } catch (error: any) {
      console.error('Error completo:', error);
      toast({
        title: "Error",
        description: `Error al ${editingCourse ? 'actualizar' : 'crear'} el curso: ${error.message || 'Error desconocido'}`,
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
    console.log('Preparando edición de curso:', course);
    console.log('Módulos del curso a editar:', course.course_modules);
    
    let modules = [];
    if (course.course_modules) {
      if (Array.isArray(course.course_modules)) {
        modules = course.course_modules;
      } else if (typeof course.course_modules === 'string') {
        try {
          modules = JSON.parse(course.course_modules);
        } catch (e) {
          console.error('Error parsing course_modules:', e);
          modules = [];
        }
      } else if (typeof course.course_modules === 'object') {
        modules = [course.course_modules];
      }
    }
    
    console.log('Módulos procesados:', modules);
    
    setFormData({
      title: course.title || '',
      description: course.description || '',
      category: course.category || '',
      duration_minutes: course.duration_minutes || 0,
      is_premium: course.is_premium || false,
      content: course.content || '',
      thumbnail_url: course.thumbnail_url || '',
      featured_image_url: course.featured_image_url || '',
      course_modules: modules
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
        console.error('Error al eliminar curso:', error);
        throw error;
      }

      console.log('Curso eliminado correctamente');
      
      setCourses(prevCourses => prevCourses.filter(course => course.id !== courseId));
      
      toast({
        title: "Éxito",
        description: "Curso eliminado correctamente"
      });
    } catch (error: any) {
      console.error('Error al eliminar curso:', error);
      toast({
        title: "Error",
        description: `Error al eliminar el curso: ${error.message || 'Error desconocido'}`,
        variant: "destructive"
      });
    }
  };

  const handleCreateNew = () => {
    resetForm();
    setIsCreateDialogOpen(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Gestión de Cursos</h1>
          <p className="text-gray-600">Crear y gestionar cursos de formación</p>
        </div>
        <Button onClick={handleCreateNew}>
          <Plus className="h-4 w-4 mr-2" />
          Nuevo Curso
        </Button>
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
                <Button onClick={handleCreateNew}>
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
