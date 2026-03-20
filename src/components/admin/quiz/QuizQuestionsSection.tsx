
import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Plus, Edit2, Trash2, CheckCircle, XCircle } from 'lucide-react';
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

  const getQuestionTypeLabel = (type: string) => {
    switch (type) {
      case 'multiple_choice': return 'Opción Múltiple';
      case 'true_false': return 'Verdadero/Falso';
      case 'short_answer': return 'Respuesta Corta';
      default: return type;
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="text-center py-8">
          <div className="text-center py-4">Cargando preguntas...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <div>
            <CardTitle>Preguntas del Quiz</CardTitle>
            <p className="text-sm text-gray-600 mt-1">
              {questions.length} pregunta{questions.length !== 1 ? 's' : ''} creada{questions.length !== 1 ? 's' : ''}
            </p>
          </div>
          <Button onClick={handleCreateQuestion} size="sm">
            <Plus className="h-4 w-4 mr-1" />
            Agregar Pregunta
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {questions.length === 0 ? (
          <div className="text-center py-8">
            <div className="bg-gray-50 rounded-lg p-8">
              <h3 className="text-lg font-medium text-gray-900 mb-2">No hay preguntas</h3>
              <p className="text-gray-600 mb-4">
                Comienza agregando preguntas a este quiz para que los usuarios puedan realizarlo.
              </p>
              <Button onClick={handleCreateQuestion} variant="outline">
                <Plus className="h-4 w-4 mr-1" />
                Crear Primera Pregunta
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {questions.map((question, index) => (
              <div key={question.id} className="border rounded-lg p-4 hover:bg-gray-50 transition-colors">
                <div className="flex justify-between items-start mb-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <Badge variant="outline" className="text-xs">
                        Pregunta {index + 1}
                      </Badge>
                      <Badge variant="secondary" className="text-xs">
                        {getQuestionTypeLabel(question.question_type)}
                      </Badge>
                      <Badge variant="outline" className="text-xs">
                        {question.points} punto{question.points !== 1 ? 's' : ''}
                      </Badge>
                    </div>
                    <h4 className="font-medium text-gray-900 mb-2">
                      {question.question_text}
                    </h4>
                    {question.explanation && (
                      <p className="text-sm text-gray-600 italic">
                        Explicación: {question.explanation}
                      </p>
                    )}
                  </div>
                  <div className="flex space-x-2 ml-4">
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
                  <div className="mt-3 pl-4 border-l-2 border-gray-200">
                    <p className="text-sm font-medium text-gray-700 mb-2">Opciones:</p>
                    <div className="grid gap-2">
                      {question.options.map((option) => (
                        <div key={option.id} className="flex items-center text-sm p-2 rounded bg-white border">
                          {option.is_correct ? (
                            <CheckCircle className="h-4 w-4 text-green-600 mr-2 flex-shrink-0" />
                          ) : (
                            <XCircle className="h-4 w-4 text-gray-400 mr-2 flex-shrink-0" />
                          )}
                          <span className={option.is_correct ? 'font-medium text-green-800' : 'text-gray-700'}>
                            {option.option_text}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {question.question_type === 'true_false' && (
                  <div className="mt-3 pl-4 border-l-2 border-gray-200">
                    <p className="text-sm text-gray-600">
                      Pregunta de Verdadero/Falso
                    </p>
                  </div>
                )}

                {question.question_type === 'short_answer' && (
                  <div className="mt-3 pl-4 border-l-2 border-gray-200">
                    <p className="text-sm text-gray-600">
                      Respuesta de texto libre (evaluación manual requerida)
                    </p>
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
