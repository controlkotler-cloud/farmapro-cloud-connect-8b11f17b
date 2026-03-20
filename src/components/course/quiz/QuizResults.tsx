
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, XCircle, RotateCcw } from 'lucide-react';

interface QuizQuestion {
  id: string;
  question: string;
  options: string[];
  correctAnswer: number;
  explanation: string;
}

interface QuizResultsProps {
  score: number;
  passed: boolean;
  questions: QuizQuestion[];
  selectedAnswers: number[];
  onResetQuiz: () => void;
}

export const QuizResults: React.FC<QuizResultsProps> = ({
  score,
  passed,
  questions,
  selectedAnswers,
  onResetQuiz
}) => {
  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader className="text-center">
        <CardTitle className="text-2xl">
          {passed ? (
            <div className="flex items-center justify-center space-x-2 text-green-600">
              <CheckCircle className="h-8 w-8" />
              <span>¡Felicidades! Quiz Completado</span>
            </div>
          ) : (
            <div className="flex items-center justify-center space-x-2 text-orange-600">
              <XCircle className="h-8 w-8" />
              <span>Quiz Completado - Necesitas Mejorar</span>
            </div>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="text-center">
          <div className="text-4xl font-bold mb-2">
            {score}%
          </div>
          <Badge variant={passed ? "default" : "destructive"} className="text-lg px-4 py-2">
            {selectedAnswers.filter((answer, index) => answer === questions[index].correctAnswer).length} / {questions.length} correctas
          </Badge>
        </div>

        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Revisión de Respuestas:</h3>
          {questions.map((question, index) => {
            const userAnswer = selectedAnswers[index];
            const isCorrect = userAnswer === question.correctAnswer;
            
            return (
              <div key={question.id} className="border rounded-lg p-4">
                <div className="flex items-start space-x-2 mb-2">
                  {isCorrect ? (
                    <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
                  ) : (
                    <XCircle className="h-5 w-5 text-red-600 mt-0.5" />
                  )}
                  <div className="flex-1">
                    <p className="font-medium">{question.question}</p>
                    <p className={`text-sm ${isCorrect ? 'text-green-600' : 'text-red-600'}`}>
                      Tu respuesta: {question.options[userAnswer]}
                    </p>
                    {!isCorrect && (
                      <p className="text-sm text-green-600">
                        Respuesta correcta: {question.options[question.correctAnswer]}
                      </p>
                    )}
                    <p className="text-sm text-gray-600 mt-1">{question.explanation}</p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <div className="flex justify-center space-x-4">
          <Button onClick={onResetQuiz} variant="outline" className="flex items-center space-x-2">
            <RotateCcw className="h-4 w-4" />
            <span>Repetir Quiz</span>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};
