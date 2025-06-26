
import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { QuizQuestionsSection } from './QuizQuestionsSection';
import type { CourseQuiz } from '@/types/quiz';

interface Course {
  id: string;
  title: string;
  slug: string;
}

interface QuizFormDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  editingQuiz: CourseQuiz | null;
  courses: Course[];
  onSaved: () => void;
}

export const QuizFormDialog: React.FC<QuizFormDialogProps> = ({
  isOpen,
  onOpenChange,
  editingQuiz,
  courses,
  onSaved
}) => {
  const [loading, setLoading] = useState(false);
  const [savedQuizId, setSavedQuizId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('details');
  const [formData, setFormData] = useState({
    course_id: '',
    title: '',
    description: '',
    passing_score: 70,
    time_limit_minutes: 30,
    max_attempts: 3,
    is_active: true
  });
  const { toast } = useToast();

  useEffect(() => {
    if (editingQuiz) {
      setFormData({
        course_id: editingQuiz.course_id,
        title: editingQuiz.title,
        description: editingQuiz.description || '',
        passing_score: editingQuiz.passing_score,
        time_limit_minutes: editingQuiz.time_limit_minutes || 30,
        max_attempts: editingQuiz.max_attempts,
        is_active: editingQuiz.is_active
      });
      setSavedQuizId(editingQuiz.id);
      setActiveTab('details');
    } else {
      setFormData({
        course_id: '',
        title: '',
        description: '',
        passing_score: 70,
        time_limit_minutes: 30,
        max_attempts: 3,
        is_active: true
      });
      setSavedQuizId(null);
      setActiveTab('details');
    }
  }, [editingQuiz, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.course_id || !formData.title) {
      toast({
        title: "Error",
        description: "Por favor completa los campos obligatorios",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);

    try {
      const quizData = {
        course_id: formData.course_id,
        title: formData.title.trim(),
        description: formData.description?.trim() || null,
        passing_score: formData.passing_score,
        time_limit_minutes: formData.time_limit_minutes > 0 ? formData.time_limit_minutes : null,
        max_attempts: formData.max_attempts,
        is_active: formData.is_active
      };

      if (editingQuiz) {
        const { error } = await supabase
          .from('course_quizzes')
          .update(quizData)
          .eq('id', editingQuiz.id);

        if (error) throw error;

        toast({
          title: "Éxito",
          description: "Quiz actualizado correctamente"
        });
      } else {
        const { data, error } = await supabase
          .from('course_quizzes')
          .insert([quizData])
          .select()
          .single();

        if (error) throw error;

        setSavedQuizId(data.id);
        setActiveTab('questions');

        toast({
          title: "Éxito",
          description: "Quiz creado correctamente. Ahora puedes agregar preguntas."
        });
      }

      if (editingQuiz) {
        onSaved();
      }
    } catch (error: any) {
      console.error('Error saving quiz:', error);
      toast({
        title: "Error",
        description: `Error al ${editingQuiz ? 'actualizar' : 'crear'} el quiz: ${error.message}`,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (savedQuizId && !editingQuiz) {
      // Si creamos un nuevo quiz, actualizamos la lista
      onSaved();
    }
    onOpenChange(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {editingQuiz ? 'Editar Quiz' : 'Crear Nuevo Quiz'}
          </DialogTitle>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="details">Detalles del Quiz</TabsTrigger>
            <TabsTrigger value="questions" disabled={!savedQuizId && !editingQuiz}>
              Preguntas ({savedQuizId || editingQuiz ? 'Disponible' : 'Guarda primero'})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="details" className="space-y-6">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="course">Curso *</Label>
                  <Select
                    value={formData.course_id}
                    onValueChange={(value) => setFormData(prev => ({ ...prev, course_id: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecciona un curso" />
                    </SelectTrigger>
                    <SelectContent>
                      {courses.map((course) => (
                        <SelectItem key={course.id} value={course.id}>
                          {course.title}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="title">Título del Quiz *</Label>
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                    placeholder="Evaluación del curso..."
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Descripción</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Descripción opcional del quiz..."
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="passing_score">Puntuación mínima (%)</Label>
                  <Input
                    id="passing_score"
                    type="number"
                    min="0"
                    max="100"
                    value={formData.passing_score}
                    onChange={(e) => setFormData(prev => ({ ...prev, passing_score: parseInt(e.target.value) || 0 }))}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="time_limit">Tiempo límite (min)</Label>
                  <Input
                    id="time_limit"
                    type="number"
                    min="0"
                    value={formData.time_limit_minutes}
                    onChange={(e) => setFormData(prev => ({ ...prev, time_limit_minutes: parseInt(e.target.value) || 0 }))}
                    placeholder="0 = sin límite"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="max_attempts">Intentos máximos</Label>
                  <Input
                    id="max_attempts"
                    type="number"
                    min="-1"
                    value={formData.max_attempts}
                    onChange={(e) => setFormData(prev => ({ ...prev, max_attempts: parseInt(e.target.value) || 1 }))}
                    placeholder="-1 = sin límite"
                  />
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  id="is_active"
                  checked={formData.is_active}
                  onCheckedChange={(checked) => setFormData(prev => ({ ...prev, is_active: checked }))}
                />
                <Label htmlFor="is_active">Quiz activo</Label>
              </div>

              <div className="flex justify-end space-x-3 pt-4 border-t">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleClose}
                  disabled={loading}
                >
                  {savedQuizId && !editingQuiz ? 'Cerrar' : 'Cancelar'}
                </Button>
                <Button type="submit" disabled={loading}>
                  {loading ? 'Guardando...' : editingQuiz ? 'Actualizar' : 'Crear Quiz'}
                </Button>
                {savedQuizId && !editingQuiz && (
                  <Button
                    type="button"
                    onClick={() => setActiveTab('questions')}
                    disabled={loading}
                  >
                    Agregar Preguntas
                  </Button>
                )}
              </div>
            </form>
          </TabsContent>

          <TabsContent value="questions">
            {(savedQuizId || editingQuiz) && (
              <QuizQuestionsSection quizId={savedQuizId || editingQuiz!.id} />
            )}
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};
