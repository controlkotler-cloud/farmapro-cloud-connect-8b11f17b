
import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Trash2, Plus } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import type { QuizQuestion } from '@/types/quiz';

interface QuestionFormDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  quizId: string;
  editingQuestion: QuizQuestion | null;
  onSaved: () => void;
  questionCount: number;
}

interface OptionData {
  id?: string;
  option_text: string;
  is_correct: boolean;
}

export const QuestionFormDialog: React.FC<QuestionFormDialogProps> = ({
  isOpen,
  onOpenChange,
  quizId,
  editingQuestion,
  onSaved,
  questionCount
}) => {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    question_text: '',
    question_type: 'multiple_choice' as 'multiple_choice' | 'true_false' | 'short_answer',
    points: 1,
    explanation: '',
    order_index: questionCount
  });
  const [options, setOptions] = useState<OptionData[]>([
    { option_text: '', is_correct: false },
    { option_text: '', is_correct: false },
    { option_text: '', is_correct: false },
    { option_text: '', is_correct: false }
  ]);
  const { toast } = useToast();

  useEffect(() => {
    if (editingQuestion) {
      setFormData({
        question_text: editingQuestion.question_text,
        question_type: editingQuestion.question_type,
        points: editingQuestion.points,
        explanation: editingQuestion.explanation || '',
        order_index: editingQuestion.order_index
      });
      
      if (editingQuestion.options && editingQuestion.options.length > 0) {
        setOptions(editingQuestion.options.map(opt => ({
          id: opt.id,
          option_text: opt.option_text,
          is_correct: opt.is_correct
        })));
      }
    } else {
      setFormData({
        question_text: '',
        question_type: 'multiple_choice',
        points: 1,
        explanation: '',
        order_index: questionCount
      });
      setOptions([
        { option_text: '', is_correct: false },
        { option_text: '', is_correct: false },
        { option_text: '', is_correct: false },
        { option_text: '', is_correct: false }
      ]);
    }
  }, [editingQuestion, questionCount, isOpen]);

  const addOption = () => {
    setOptions([...options, { option_text: '', is_correct: false }]);
  };

  const removeOption = (index: number) => {
    if (options.length > 2) {
      setOptions(options.filter((_, i) => i !== index));
    }
  };

  const updateOption = (index: number, field: keyof OptionData, value: string | boolean) => {
    const newOptions = [...options];
    newOptions[index] = { ...newOptions[index], [field]: value };
    setOptions(newOptions);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.question_text.trim()) {
      toast({
        title: "Error",
        description: "La pregunta es obligatoria",
        variant: "destructive"
      });
      return;
    }

    if (formData.question_type === 'multiple_choice') {
      const validOptions = options.filter(opt => opt.option_text.trim());
      if (validOptions.length < 2) {
        toast({
          title: "Error",
          description: "Debe haber al menos 2 opciones válidas",
          variant: "destructive"
        });
        return;
      }

      const correctOptions = validOptions.filter(opt => opt.is_correct);
      if (correctOptions.length === 0) {
        toast({
          title: "Error",
          description: "Debe haber al menos una opción correcta",
          variant: "destructive"
        });
        return;
      }
    }

    setLoading(true);

    try {
      const questionData = {
        quiz_id: quizId,
        question: formData.question_text.trim(),
        question_text: formData.question_text.trim(),
        question_type: formData.question_type,
        points: formData.points,
        explanation: formData.explanation?.trim() || null,
        order_index: formData.order_index
      } as any;

      let questionId: string;

      if (editingQuestion) {
        const { error } = await supabase
          .from('quiz_questions')
          .update(questionData)
          .eq('id', editingQuestion.id);

        if (error) throw error;
        
        questionId = editingQuestion.id;

        // Delete existing options
        await supabase
          .from('quiz_question_options')
          .delete()
          .eq('question_id', questionId);
      } else {
        const { data, error } = await supabase
          .from('quiz_questions')
          .insert([questionData])
          .select()
          .single();

        if (error) throw error;
        questionId = data.id;
      }

      // Insert options for multiple choice questions
      if (formData.question_type === 'multiple_choice') {
        const validOptions = options
          .filter(opt => opt.option_text.trim())
          .map((opt, index) => ({
            question_id: questionId,
            option_text: opt.option_text.trim(),
            is_correct: opt.is_correct,
            order_index: index
          }));

        if (validOptions.length > 0) {
          const { error } = await supabase
            .from('quiz_question_options')
            .insert(validOptions);

          if (error) throw error;
        }
      }

      toast({
        title: "Éxito",
        description: `Pregunta ${editingQuestion ? 'actualizada' : 'creada'} correctamente`
      });

      onSaved();
    } catch (error: any) {
      console.error('Error saving question:', error);
      toast({
        title: "Error",
        description: `Error al ${editingQuestion ? 'actualizar' : 'crear'} la pregunta: ${error.message}`,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {editingQuestion ? 'Editar Pregunta' : 'Crear Nueva Pregunta'}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="question_text">Pregunta *</Label>
            <Textarea
              id="question_text"
              value={formData.question_text}
              onChange={(e) => setFormData(prev => ({ ...prev, question_text: e.target.value }))}
              placeholder="Escribe tu pregunta aquí..."
              rows={3}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="question_type">Tipo de Pregunta</Label>
              <Select
                value={formData.question_type}
                onValueChange={(value: 'multiple_choice' | 'true_false' | 'short_answer') => 
                  setFormData(prev => ({ ...prev, question_type: value }))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="multiple_choice">Opción Múltiple</SelectItem>
                  <SelectItem value="true_false">Verdadero/Falso</SelectItem>
                  <SelectItem value="short_answer">Respuesta Corta</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="points">Puntos</Label>
              <Input
                id="points"
                type="number"
                min="1"
                value={formData.points}
                onChange={(e) => setFormData(prev => ({ ...prev, points: parseInt(e.target.value) || 1 }))}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="order_index">Orden</Label>
              <Input
                id="order_index"
                type="number"
                min="0"
                value={formData.order_index}
                onChange={(e) => setFormData(prev => ({ ...prev, order_index: parseInt(e.target.value) || 0 }))}
              />
            </div>
          </div>

          {formData.question_type === 'multiple_choice' && (
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <Label>Opciones de Respuesta</Label>
                <Button type="button" onClick={addOption} size="sm" variant="outline">
                  <Plus className="h-4 w-4 mr-1" />
                  Agregar Opción
                </Button>
              </div>
              
              <div className="space-y-3">
                {options.map((option, index) => (
                  <div key={index} className="flex items-center space-x-2 p-3 border rounded-lg">
                    <Switch
                      checked={option.is_correct}
                      onCheckedChange={(checked) => updateOption(index, 'is_correct', checked)}
                    />
                    <Input
                      value={option.option_text}
                      onChange={(e) => updateOption(index, 'option_text', e.target.value)}
                      placeholder={`Opción ${index + 1}`}
                      className="flex-1"
                    />
                    {options.length > 2 && (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => removeOption(index)}
                        className="text-red-600"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="explanation">Explicación (Opcional)</Label>
            <Textarea
              id="explanation"
              value={formData.explanation}
              onChange={(e) => setFormData(prev => ({ ...prev, explanation: e.target.value }))}
              placeholder="Explica por qué esta es la respuesta correcta..."
              rows={3}
            />
          </div>

          <div className="flex justify-end space-x-3 pt-4 border-t">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Guardando...' : editingQuestion ? 'Actualizar' : 'Crear'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
