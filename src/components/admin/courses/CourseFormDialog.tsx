
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import CourseModulesSection from './CourseModulesSection';
import type { Database } from '@/integrations/supabase/types';

type Course = Database['public']['Tables']['courses']['Row'];
type CourseCategory = Database['public']['Enums']['course_category'];

interface CourseFormData {
  title: string;
  description: string;
  category: CourseCategory | '';
  duration_minutes: number;
  is_premium: boolean;
  content: string;
  thumbnail_url: string;
  featured_image_url: string;
  course_modules: any[];
}

interface CourseFormDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  editingCourse: Course | null;
  formData: CourseFormData;
  onFormDataChange: (data: CourseFormData) => void;
  onSubmit: (e: React.FormEvent) => void;
  onCancel: () => void;
  submitting: boolean;
  categories: Array<{ value: string; label: string }>;
}

const CourseFormDialog = ({
  isOpen,
  onOpenChange,
  editingCourse,
  formData,
  onFormDataChange,
  onSubmit,
  onCancel,
  submitting,
  categories
}: CourseFormDialogProps) => {
  const handleFieldChange = (field: keyof CourseFormData, value: any) => {
    console.log(`Cambiando ${field}:`, value);
    onFormDataChange({ ...formData, [field]: value });
  };

  const handleModulesChange = (modules: any[]) => {
    console.log('Actualizando módulos:', modules);
    handleFieldChange('course_modules', modules);
  };

  console.log('FormData actual:', formData);
  console.log('Módulos en formData:', formData.course_modules);

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {editingCourse ? 'Editar Curso' : 'Crear Nuevo Curso'}
          </DialogTitle>
          <DialogDescription>
            Completa la información del curso. Los campos marcados con * son obligatorios.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={onSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="title">Título *</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => handleFieldChange('title', e.target.value)}
                required
                placeholder="Título del curso"
              />
            </div>
            
            <div>
              <Label htmlFor="category">Categoría *</Label>
              <Select 
                value={formData.category} 
                onValueChange={(value) => handleFieldChange('category', value as CourseCategory)}
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
          </div>
          
          <div>
            <Label htmlFor="description">Descripción</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => handleFieldChange('description', e.target.value)}
              rows={3}
              placeholder="Descripción breve del curso"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="duration">Duración (minutos)</Label>
              <Input
                id="duration"
                type="number"
                min="0"
                value={formData.duration_minutes}
                onChange={(e) => handleFieldChange('duration_minutes', parseInt(e.target.value) || 0)}
                placeholder="Duración total en minutos"
              />
            </div>
            
            <div className="flex items-center space-x-2 pt-6">
              <Switch
                id="premium"
                checked={formData.is_premium}
                onCheckedChange={(checked) => handleFieldChange('is_premium', checked)}
              />
              <Label htmlFor="premium">Curso Premium</Label>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="thumbnail_url">URL de la imagen miniatura</Label>
              <Input
                id="thumbnail_url"
                value={formData.thumbnail_url}
                onChange={(e) => handleFieldChange('thumbnail_url', e.target.value)}
                placeholder="https://ejemplo.com/imagen.jpg"
              />
            </div>
            
            <div>
              <Label htmlFor="featured_image_url">URL de la imagen destacada</Label>
              <Input
                id="featured_image_url"
                value={formData.featured_image_url}
                onChange={(e) => handleFieldChange('featured_image_url', e.target.value)}
                placeholder="https://ejemplo.com/imagen-destacada.jpg"
              />
            </div>
          </div>

          <div>
            <Label htmlFor="content">Contenido del curso</Label>
            <Textarea
              id="content"
              value={formData.content}
              onChange={(e) => handleFieldChange('content', e.target.value)}
              rows={5}
              placeholder="Contenido detallado del curso, objetivos, metodología..."
            />
          </div>

          <div className="border-t pt-6">
            <CourseModulesSection 
              modules={formData.course_modules || []}
              onModulesChange={handleModulesChange}
            />
          </div>

          <div className="flex justify-end space-x-2 pt-4 border-t">
            <Button type="button" variant="outline" onClick={onCancel}>
              Cancelar
            </Button>
            <Button type="submit" disabled={submitting}>
              {submitting ? 'Guardando...' : (editingCourse ? 'Actualizar' : 'Crear')} Curso
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default CourseFormDialog;
