
import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus, Edit2, Trash2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { QuestionFormDialog } from './QuestionFormDialog';
import type { QuizQuestion } from '@/types/quiz';

interface QuizQuestionsSectionProps {
  quizId: string;
}

export const QuizQuestionsSection: React.FC<QuizQuestionsSectionProps> = ({ quizId }) => {
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [isQuestionDialogOpen, setIsQuestionDialogOpen] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState<QuizQuestion | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    loadQuestions();
  }, [quizId]);

  const loadQuestions = async () => {
    const { data, error } = await supabase
      .from('quiz_questions')
      .select(`
        *,
        quiz_question_options (*)
      `)
      .eq('quiz_id', quizId)
      .order('order_index');

    if (error) {
      console.error('Error loading questions:', error);
    } else {
      const transformedQuestions = data?.map(question => ({
        ...question,
        question_type: question.question_type as 'multiple_choice' | 'true_false' | 'short_answer',
        options: question.quiz_question_options?.sort((a, b) => a.order_index - b.order_index) || []
      })) || [];
      setQuestions(transformedQuestions);
    }
    setLoading(false);
  };

  const handleCreateQuestion = () => {
    setEditingQuestion(null);
    setIsQuestionDialogOpen(true);
  };

  const handleEditQuestion = (question: QuizQuestion) => {
    setEditingQuestion(question);
    setIsQuestionDialogOpen(true);
  };

  const handleDeleteQuestion = async (questionId: string) => {
    if (!confirm('¿Estás seguro de que quieres eliminar esta pregunta?')) return;

    const { error } = await supabase
      .from('quiz_questions')
      .delete()
      .eq('id', questionId);

    if (error) {
      toast({
        title: "Error",
        description: "Error al eliminar la pregunta",
        variant: "destructive"
      });
    } else {
      toast({
        title: "Éxito",
        description: "Pregunta eliminada correctamente"
      });
      loadQuestions();
    }
  };

  const handleQuestionSaved = () => {
    loadQuestions();
    setIsQuestionDialogOpen(false);
    setEditingQuestion(null);
  };

  if (loading) {
    return <div className="text-center py-4">Cargando preguntas...</div>;
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle>Preguntas del Quiz</CardTitle>
          <Button onClick={handleCreateQuestion} size="sm">
            <Plus className="h-4 w-4 mr-1" />
            Agregar Pregunta
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {questions.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <p>No hay preguntas en este quiz.</p>
            <Button onClick={handleCreateQuestion} variant="outline" className="mt-2">
              <Plus className="h-4 w-4 mr-1" />
              Crear Primera Pregunta
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            {questions.map((question, index) => (
              <div key={question.id} className="border rounded-lg p-4">
                <div className="flex justify-between items-start mb-2">
                  <div className="flex-1">
                    <h4 className="font-medium">
                      {index + 1}. {question.question_text}
                    </h4>
                    <p className="text-sm text-gray-600 mt-1">
                      Tipo: {question.question_type} | Puntos: {question.points}
                    </p>
                  </div>
                  <div className="flex space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEditQuestion(question)}
                    >
                      <Edit2 className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDeleteQuestion(question.id)}
                      className="text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                {question.options && question.options.length > 0 && (
                  <div className="mt-3 pl-4">
                    <p className="text-sm font-medium text-gray-700 mb-2">Opciones:</p>
                    <ul className="space-y-1">
                      {question.options.map((option) => (
                        <li key={option.id} className="text-sm flex items-center">
                          <span className={`mr-2 ${option.is_correct ? 'text-green-600 font-medium' : 'text-gray-500'}`}>
                            {option.is_correct ? '✓' : '○'}
                          </span>
                          {option.option_text}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        <QuestionFormDialog
          isOpen={isQuestionDialogOpen}
          onOpenChange={setIsQuestionDialogOpen}
          quizId={quizId}
          editingQuestion={editingQuestion}
          onSaved={handleQuestionSaved}
          questionCount={questions.length}
        />
      </CardContent>
    </Card>
  );
};
