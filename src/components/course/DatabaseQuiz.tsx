
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, XCircle, RotateCcw, Clock, Trophy, AlertCircle } from 'lucide-react';
import { motion } from 'framer-motion';
import { useQuiz } from '@/hooks/useQuiz';
import type { QuizAttempt } from '@/types/quiz';

interface DatabaseQuizProps {
  courseId: string;
  courseTitle: string;
  onComplete: (passed: boolean, score: number) => void;
}

export const DatabaseQuiz: React.FC<DatabaseQuizProps> = ({ 
  courseId, 
  courseTitle, 
  onComplete 
}) => {
  const {
    quiz,
    questions,
    currentAttempt,
    userAttempts,
    canTakeQuiz,
    getBestAttempt,
    startQuizAttempt,
    saveAnswer,
    finishQuizAttempt
  } = useQuiz(courseId);

  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<string, string>>({});
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [quizStartTime, setQuizStartTime] = useState<Date | null>(null);
  const [showResults, setShowResults] = useState(false);
  const [completedAttempt, setCompletedAttempt] = useState<QuizAttempt | null>(null);

  // Efecto para manejar el estado del quiz
  useEffect(() => {
    if (currentAttempt && !currentAttempt.completed_at) {
      setQuizStartTime(new Date(currentAttempt.started_at));
    }
  }, [currentAttempt]);

  // Efecto para mostrar resultados de intento completado
  useEffect(() => {
    if (currentAttempt?.completed_at) {
      setCompletedAttempt(currentAttempt);
      setShowResults(true);
      onComplete(currentAttempt.passed, currentAttempt.percentage);
    }
  }, [currentAttempt, onComplete]);

  const handleStartQuiz = async () => {
    if (!quiz) return;
    
    const attempt = await startQuizAttempt(quiz.id);
    if (attempt) {
      setCurrentQuestion(0);
      setSelectedAnswers({});
      setSelectedOption(null);
      setShowResults(false);
      setCompletedAttempt(null);
    }
  };

  const handleAnswerSelect = (optionId: string) => {
    setSelectedOption(optionId);
  };

  const handleNextQuestion = async () => {
    if (!selectedOption || !currentAttempt || !questions[currentQuestion]) return;

    const question = questions[currentQuestion];
    
    // Guardar respuesta
    await saveAnswer(currentAttempt.id, question.id, selectedOption);
    
    // Actualizar respuestas seleccionadas
    const newAnswers = { ...selectedAnswers };
    newAnswers[question.id] = selectedOption;
    setSelectedAnswers(newAnswers);
    
    setSelectedOption(null);

    if (currentQuestion < questions.length - 1) {
      setCurrentQuestion(currentQuestion + 1);
    } else {
      // Finalizar quiz
      if (quizStartTime) {
        await finishQuizAttempt(currentAttempt.id, quizStartTime);
      }
    }
  };

  const resetQuiz = () => {
    setCurrentQuestion(0);
    setSelectedAnswers({});
    setSelectedOption(null);
    setShowResults(false);
    setCompletedAttempt(null);
    setQuizStartTime(null);
  };

  // Si no hay quiz disponible
  if (!quiz) {
    return (
      <Card className="w-full max-w-4xl mx-auto">
        <CardContent className="text-center py-8">
          <AlertCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600">No hay quiz disponible para este curso.</p>
        </CardContent>
      </Card>
    );
  }

  // Mostrar resultados
  if (showResults && completedAttempt) {
    const passed = completedAttempt.passed;
    const score = completedAttempt.percentage;

    return (
      <Card className="w-full max-w-4xl mx-auto">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">
            {passed ? (
              <div className="flex items-center justify-center space-x-2 text-green-600">
                <Trophy className="h-8 w-8" />
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
              {Math.round(score)}%
            </div>
            <Badge variant={passed ? "default" : "destructive"} className="text-lg px-4 py-2">
              {completedAttempt.score} / {completedAttempt.max_score} puntos
            </Badge>
            <p className="text-sm text-gray-600 mt-2">
              Nota mínima requerida: {quiz.passing_score}%
            </p>
          </div>

          <div className="bg-gray-50 p-4 rounded-lg">
            <h3 className="font-semibold mb-2">Resumen del intento:</h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-600">Intento:</span>
                <span className="ml-2 font-medium">{completedAttempt.attempt_number}</span>
              </div>
              <div>
                <span className="text-gray-600">Tiempo:</span>
                <span className="ml-2 font-medium">
                  {completedAttempt.time_taken_seconds ? 
                    `${Math.floor(completedAttempt.time_taken_seconds / 60)}:${String(completedAttempt.time_taken_seconds % 60).padStart(2, '0')}` 
                    : 'N/A'
                  }
                </span>
              </div>
            </div>
          </div>

          <div className="flex justify-center space-x-4">
            {canTakeQuiz() && (
              <Button onClick={resetQuiz} variant="outline" className="flex items-center space-x-2">
                <RotateCcw className="h-4 w-4" />
                <span>Repetir Quiz</span>
              </Button>
            )}
            {!canTakeQuiz() && (
              <p className="text-sm text-gray-600">
                Has alcanzado el límite de {quiz.max_attempts} intentos para este quiz.
              </p>
            )}
          </div>
        </CardContent>
      </Card>
    );
  }

  // Pantalla de inicio del quiz
  if (!currentAttempt || currentAttempt.completed_at) {
    const bestAttempt = getBestAttempt;
    
    return (
      <Card className="w-full max-w-4xl mx-auto">
        <CardHeader>
          <CardTitle className="text-xl">Quiz de Evaluación - {courseTitle}</CardTitle>
          <p className="text-gray-600">{quiz.description}</p>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <div className="text-2xl font-bold text-blue-600">{questions.length}</div>
              <div className="text-sm text-gray-600">Preguntas</div>
            </div>
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <div className="text-2xl font-bold text-green-600">{quiz.passing_score}%</div>
              <div className="text-sm text-gray-600">Nota mínima</div>
            </div>
            <div className="text-center p-4 bg-orange-50 rounded-lg">
              <div className="text-2xl font-bold text-orange-600">
                {quiz.time_limit_minutes || 'Sin límite'}
              </div>
              <div className="text-sm text-gray-600">Minutos</div>
            </div>
          </div>

          {bestAttempt && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <h3 className="font-semibold text-green-800 mb-2">Mejor resultado:</h3>
              <div className="flex items-center justify-between">
                <span className="text-green-700">
                  {Math.round(bestAttempt.percentage)}% - {bestAttempt.passed ? 'Aprobado' : 'No aprobado'}
                </span>
                <Badge variant={bestAttempt.passed ? "default" : "destructive"}>
                  {bestAttempt.score}/{bestAttempt.max_score} puntos
                </Badge>
              </div>
            </div>
          )}

          <div className="text-center">
            <p className="text-sm text-gray-600 mb-4">
              Intentos realizados: {userAttempts.length} / {quiz.max_attempts === -1 ? '∞' : quiz.max_attempts}
            </p>
            
            {canTakeQuiz() ? (
              <Button onClick={handleStartQuiz} className="px-8 py-3 text-lg">
                {userAttempts.length === 0 ? 'Comenzar Quiz' : 'Nuevo Intento'}
              </Button>
            ) : (
              <p className="text-red-600 font-medium">
                Has alcanzado el límite máximo de intentos para este quiz.
              </p>
            )}
          </div>
        </CardContent>
      </Card>
    );
  }

  // Quiz en progreso
  if (questions.length === 0) {
    return (
      <Card className="w-full max-w-4xl mx-auto">
        <CardContent className="text-center py-8">
          <p className="text-gray-600">Cargando preguntas...</p>
        </CardContent>
      </Card>
    );
  }

  const progress = ((currentQuestion + 1) / questions.length) * 100;
  const question = questions[currentQuestion];

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-xl">Quiz de Evaluación - {courseTitle}</CardTitle>
          <Badge variant="outline">
            {currentQuestion + 1} / {questions.length}
          </Badge>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div 
            className="bg-green-600 h-2 rounded-full transition-all duration-300"
            style={{ width: `${progress}%` }}
          ></div>
        </div>
        {quiz.time_limit_minutes && (
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <Clock className="h-4 w-4" />
            <span>Tiempo límite: {quiz.time_limit_minutes} minutos</span>
          </div>
        )}
      </CardHeader>
      <CardContent className="space-y-6">
        <motion.div
          key={currentQuestion}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.3 }}
        >
          <h3 className="text-lg font-semibold mb-4">
            {question.question_text}
          </h3>
          
          <div className="space-y-3">
            {question.options?.map((option) => (
              <button
                key={option.id}
                onClick={() => handleAnswerSelect(option.id)}
                className={`w-full text-left p-4 rounded-lg border-2 transition-all duration-200 ${
                  selectedOption === option.id
                    ? 'border-green-500 bg-green-50'
                    : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                }`}
              >
                <div className="flex items-center space-x-3">
                  <div className={`w-4 h-4 rounded-full border-2 ${
                    selectedOption === option.id
                      ? 'border-green-500 bg-green-500'
                      : 'border-gray-300'
                  }`}>
                    {selectedOption === option.id && (
                      <div className="w-full h-full rounded-full bg-white scale-50"></div>
                    )}
                  </div>
                  <span>{option.option_text}</span>
                </div>
              </button>
            ))}
          </div>
        </motion.div>

        <div className="flex justify-end">
          <Button 
            onClick={handleNextQuestion}
            disabled={selectedOption === null}
            className="px-6"
          >
            {currentQuestion < questions.length - 1 ? 'Siguiente' : 'Finalizar Quiz'}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};
