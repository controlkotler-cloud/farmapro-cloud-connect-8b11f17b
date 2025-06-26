
import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus, BookOpen, BarChart3 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { QuizCard } from '@/components/admin/quiz/QuizCard';
import { QuizFormDialog } from '@/components/admin/quiz/QuizFormDialog';
import { QuizStatsDialog } from '@/components/admin/quiz/QuizStatsDialog';
import type { CourseQuiz } from '@/types/quiz';

interface Course {
  id: string;
  title: string;
  slug: string;
}

const AdminQuizzes = () => {
  const [quizzes, setQuizzes] = useState<CourseQuiz[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isStatsDialogOpen, setIsStatsDialogOpen] = useState(false);
  const [editingQuiz, setEditingQuiz] = useState<CourseQuiz | null>(null);
  const [selectedQuizStats, setSelectedQuizStats] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    await Promise.all([loadQuizzes(), loadCourses()]);
    setLoading(false);
  };

  const loadQuizzes = async () => {
    const { data, error } = await supabase
      .from('course_quizzes')
      .select(`
        *,
        courses!inner(title, slug)
      `)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error loading quizzes:', error);
      toast({
        title: "Error",
        description: "No se pudieron cargar los quizzes",
        variant: "destructive"
      });
    } else {
      setQuizzes(data || []);
    }
  };

  const loadCourses = async () => {
    const { data, error } = await supabase
      .from('courses')
      .select('id, title, slug')
      .order('title');

    if (error) {
      console.error('Error loading courses:', error);
    } else {
      setCourses(data || []);
    }
  };

  const handleCreateNew = () => {
    setEditingQuiz(null);
    setIsCreateDialogOpen(true);
  };

  const handleEdit = (quiz: CourseQuiz) => {
    setEditingQuiz(quiz);
    setIsCreateDialogOpen(true);
  };

  const handleDelete = async (quizId: string) => {
    if (!confirm('¿Estás seguro de que quieres eliminar este quiz? Esta acción no se puede deshacer.')) return;

    const { error } = await supabase
      .from('course_quizzes')
      .delete()
      .eq('id', quizId);

    if (error) {
      toast({
        title: "Error",
        description: "Error al eliminar el quiz",
        variant: "destructive"
      });
    } else {
      toast({
        title: "Éxito",
        description: "Quiz eliminado correctamente"
      });
      loadQuizzes();
    }
  };

  const handleViewStats = (quizId: string) => {
    setSelectedQuizStats(quizId);
    setIsStatsDialogOpen(true);
  };

  const handleQuizSaved = () => {
    loadQuizzes();
    setIsCreateDialogOpen(false);
    setEditingQuiz(null);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Gestión de Quizzes</h1>
          <p className="text-gray-600">Crear y gestionar quizzes de evaluación para cursos</p>
        </div>
        <Button onClick={handleCreateNew}>
          <Plus className="h-4 w-4 mr-2" />
          Nuevo Quiz
        </Button>
      </div>

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
        ) : quizzes.length === 0 ? (
          <div className="col-span-full">
            <Card>
              <CardContent className="p-12 text-center">
                <BookOpen className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No hay quizzes</h3>
                <p className="text-gray-600 mb-4">Comienza creando tu primer quiz de evaluación</p>
                <Button onClick={handleCreateNew}>
                  <Plus className="h-4 w-4 mr-2" />
                  Crear Primer Quiz
                </Button>
              </CardContent>
            </Card>
          </div>
        ) : (
          quizzes.map((quiz) => (
            <QuizCard
              key={quiz.id}
              quiz={quiz}
              onEdit={handleEdit}
              onDelete={handleDelete}
              onViewStats={handleViewStats}
            />
          ))
        )}
      </div>

      <QuizFormDialog
        isOpen={isCreateDialogOpen}
        onOpenChange={setIsCreateDialogOpen}
        editingQuiz={editingQuiz}
        courses={courses}
        onSaved={handleQuizSaved}
      />

      <QuizStatsDialog
        isOpen={isStatsDialogOpen}
        onOpenChange={setIsStatsDialogOpen}
        quizId={selectedQuizStats}
      />
    </div>
  );
};

export default AdminQuizzes;
