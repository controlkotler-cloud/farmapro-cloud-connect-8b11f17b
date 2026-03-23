
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { CheckCircle, XCircle, RotateCcw, Clock, Trophy, AlertCircle, ArrowRight, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useQuiz } from '@/hooks/useQuiz';
import type { QuizAttempt } from '@/types/quiz';

interface DatabaseQuizProps {
  courseId: string;
  courseTitle: string;
  onComplete: (passed: boolean, score: number) => void;
}

type QuizPhase = 'start' | 'question' | 'feedback' | 'results';

interface AnswerRecord {
  questionId: string;
  selectedOptionId: string;
  isCorrect: boolean;
  correctOptionId: string | null;
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
    loading,
    canTakeQuiz,
    getBestAttempt,
    startQuizAttempt,
    saveAnswer,
    finishQuizAttempt
  } = useQuiz(courseId);

  const [phase, setPhase] = useState<QuizPhase>('start');
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [quizStartTime, setQuizStartTime] = useState<Date | null>(null);
  const [completedAttempt, setCompletedAttempt] = useState<QuizAttempt | null>(null);
  const [answerRecords, setAnswerRecords] = useState<AnswerRecord[]>([]);
  const [currentFeedback, setCurrentFeedback] = useState<{ isCorrect: boolean; correctOptionId: string | null } | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const handleStartQuiz = async () => {
    if (!quiz) return;

    const attempt = await startQuizAttempt(quiz.id);
    if (attempt) {
      setCurrentQuestion(0);
      setSelectedOption(null);
      setCompletedAttempt(null);
      setAnswerRecords([]);
      setCurrentFeedback(null);
      setQuizStartTime(new Date());
      setPhase('question');
    }
  };

  const handleAnswerSelect = (optionId: string) => {
    if (phase !== 'question') return;
    setSelectedOption(optionId);
  };

  const handleConfirmAnswer = async () => {
    if (!selectedOption || !currentAttempt || !questions[currentQuestion]) return;

    setSubmitting(true);
    const question = questions[currentQuestion];

    const result = await saveAnswer(currentAttempt.id, question.id, selectedOption);

    if (result) {
      setCurrentFeedback(result);
      setAnswerRecords(prev => [...prev, {
        questionId: question.id,
        selectedOptionId: selectedOption,
        isCorrect: result.isCorrect,
        correctOptionId: result.correctOptionId
      }]);
      setPhase('feedback');
    }
    setSubmitting(false);
  };

  const handleNextQuestion = async () => {
    setSelectedOption(null);
    setCurrentFeedback(null);

    if (currentQuestion < questions.length - 1) {
      setCurrentQuestion(currentQuestion + 1);
      setPhase('question');
    } else {
      // Finish quiz
      if (quizStartTime && currentAttempt) {
        const result = await finishQuizAttempt(currentAttempt.id, quizStartTime);
        if (result) {
          setCompletedAttempt(result);
          onComplete(result.passed, result.percentage);
          setPhase('results');
        }
      }
    }
  };

  const resetQuiz = () => {
    setPhase('start');
    setCurrentQuestion(0);
    setSelectedOption(null);
    setCompletedAttempt(null);
    setAnswerRecords([]);
    setCurrentFeedback(null);
    setQuizStartTime(null);
  };

  // Loading state
  if (loading) {
    return (
      <Card className="w-full max-w-4xl mx-auto">
        <CardContent className="text-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Cargando evaluación...</p>
        </CardContent>
      </Card>
    );
  }

  // No quiz available
  if (!quiz) {
    return (
      <Card className="w-full max-w-4xl mx-auto">
        <CardContent className="text-center py-8">
          <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground">No hay evaluación disponible para este curso.</p>
        </CardContent>
      </Card>
    );
  }

  // ── RESULTS SCREEN ──
  if (phase === 'results' && completedAttempt) {
    const passed = completedAttempt.passed;
    const correctCount = answerRecords.filter(r => r.isCorrect).length;

    return (
      <Card className="w-full max-w-4xl mx-auto">
        <CardHeader className="text-center pb-2">
          <div className="text-5xl mb-3">{passed ? '🎉' : '💪'}</div>
          <CardTitle className="text-2xl">
            {passed
              ? '¡Enhorabuena! Has completado la evaluación del curso'
              : 'No te preocupes, puedes volver a intentarlo'}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="text-center">
            <div className={`text-5xl font-bold mb-2 ${passed ? 'text-green-600' : 'text-orange-600'}`}>
              {Math.round(completedAttempt.percentage)}%
            </div>
            <p className="text-lg text-muted-foreground">
              Has acertado <strong>{correctCount}</strong> de <strong>{questions.length}</strong> preguntas
            </p>
            <p className="text-sm text-muted-foreground mt-1">
              Nota mínima para aprobar: {quiz.passing_score}%
            </p>
          </div>

          {/* Question review */}
          <div className="space-y-4 mt-6">
            <h3 className="text-lg font-semibold">Revisión de respuestas:</h3>
            {questions.map((question, index) => {
              const record = answerRecords[index];
              if (!record) return null;

              const selectedOpt = question.options?.find(o => o.id === record.selectedOptionId);
              const correctOpt = question.options?.find(o => o.is_correct);

              return (
                <div key={question.id} className="border rounded-lg p-4">
                  <div className="flex items-start gap-3">
                    {record.isCorrect ? (
                      <CheckCircle className="h-5 w-5 text-green-600 mt-0.5 shrink-0" />
                    ) : (
                      <XCircle className="h-5 w-5 text-red-600 mt-0.5 shrink-0" />
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="font-medium">{question.question_text || question.question}</p>
                      <p className={`text-sm mt-1 ${record.isCorrect ? 'text-green-600' : 'text-red-600'}`}>
                        Tu respuesta: {selectedOpt?.option_text || '—'}
                      </p>
                      {!record.isCorrect && correctOpt && (
                        <p className="text-sm text-green-600">
                          Respuesta correcta: {correctOpt.option_text}
                        </p>
                      )}
                      {question.explanation && (
                        <p className="text-sm text-muted-foreground mt-2 bg-muted/50 p-2 rounded">
                          💡 {question.explanation}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="flex justify-center pt-4">
            <Button onClick={resetQuiz} size="lg" className="flex items-center gap-2">
              <RotateCcw className="h-4 w-4" />
              {passed ? 'Repetir evaluación' : 'Mejorar mi nota'}
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  // ── START SCREEN ──
  if (phase === 'start') {
    const bestAttempt = getBestAttempt;
    const hasAttempts = userAttempts.length > 0;

    return (
      <Card className="w-full max-w-4xl mx-auto">
        <CardHeader className="text-center">
          <div className="text-4xl mb-2">📝</div>
          <CardTitle className="text-2xl">{quiz.title || `Evaluación - ${courseTitle}`}</CardTitle>
          {quiz.description && (
            <p className="text-muted-foreground mt-2">{quiz.description}</p>
          )}
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center p-4 bg-blue-50 dark:bg-blue-950/30 rounded-lg">
              <div className="text-2xl font-bold text-blue-600">{questions.length}</div>
              <div className="text-sm text-muted-foreground">Preguntas</div>
            </div>
            <div className="text-center p-4 bg-green-50 dark:bg-green-950/30 rounded-lg">
              <div className="text-2xl font-bold text-green-600">{quiz.passing_score}%</div>
              <div className="text-sm text-muted-foreground">Nota mínima</div>
            </div>
            <div className="text-center p-4 bg-orange-50 dark:bg-orange-950/30 rounded-lg">
              <div className="text-2xl font-bold text-orange-600">
                {quiz.time_limit_minutes ? `${quiz.time_limit_minutes} min` : '∞'}
              </div>
              <div className="text-sm text-muted-foreground">Tiempo</div>
            </div>
          </div>

          {bestAttempt && (
            <div className={`border rounded-lg p-4 ${bestAttempt.passed ? 'bg-green-50 border-green-200 dark:bg-green-950/20' : 'bg-orange-50 border-orange-200 dark:bg-orange-950/20'}`}>
              <h3 className={`font-semibold mb-1 ${bestAttempt.passed ? 'text-green-800 dark:text-green-300' : 'text-orange-800 dark:text-orange-300'}`}>
                Mejor resultado previo:
              </h3>
              <div className="flex items-center justify-between">
                <span className={bestAttempt.passed ? 'text-green-700 dark:text-green-400' : 'text-orange-700 dark:text-orange-400'}>
                  {Math.round(bestAttempt.percentage)}% — {bestAttempt.passed ? '✅ Aprobado' : '❌ No aprobado'}
                </span>
                <span className="text-sm text-muted-foreground">
                  {userAttempts.length} intento{userAttempts.length !== 1 ? 's' : ''} realizado{userAttempts.length !== 1 ? 's' : ''}
                </span>
              </div>
            </div>
          )}

          <div className="text-center">
            <Button onClick={handleStartQuiz} size="lg" className="px-10 py-4 text-lg">
              {!hasAttempts
                ? 'Comenzar evaluación'
                : bestAttempt?.passed
                  ? 'Repetir evaluación'
                  : 'Mejorar mi nota'}
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  // ── QUESTION / FEEDBACK SCREEN ──
  if (questions.length === 0) {
    return (
      <Card className="w-full max-w-4xl mx-auto">
        <CardContent className="text-center py-8">
          <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Cargando preguntas...</p>
        </CardContent>
      </Card>
    );
  }

  const progressValue = ((currentQuestion + 1) / questions.length) * 100;
  const question = questions[currentQuestion];

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <div className="flex items-center justify-between mb-2">
          <CardTitle className="text-lg">Evaluación - {courseTitle}</CardTitle>
          <Badge variant="outline" className="text-sm">
            Pregunta {currentQuestion + 1} de {questions.length}
          </Badge>
        </div>
        <Progress value={progressValue} className="h-2" />
      </CardHeader>
      <CardContent className="space-y-6">
        <AnimatePresence mode="wait">
          <motion.div
            key={`${currentQuestion}-${phase}`}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.25 }}
          >
            <h3 className="text-lg font-semibold mb-4">
              {question.question_text || question.question}
            </h3>

            <div className="space-y-3">
              {question.options?.map((option) => {
                let borderClass = 'border-border hover:border-muted-foreground/50 hover:bg-muted/30';
                let bgClass = '';

                if (phase === 'feedback' && currentFeedback) {
                  if (option.id === currentFeedback.correctOptionId) {
                    borderClass = 'border-green-500';
                    bgClass = 'bg-green-50 dark:bg-green-950/30';
                  } else if (option.id === selectedOption && !currentFeedback.isCorrect) {
                    borderClass = 'border-red-500';
                    bgClass = 'bg-red-50 dark:bg-red-950/30';
                  } else {
                    borderClass = 'border-border opacity-50';
                  }
                } else if (selectedOption === option.id) {
                  borderClass = 'border-primary';
                  bgClass = 'bg-primary/5';
                }

                return (
                  <button
                    key={option.id}
                    onClick={() => handleAnswerSelect(option.id)}
                    disabled={phase === 'feedback'}
                    className={`w-full text-left p-4 rounded-lg border-2 transition-all duration-200 ${borderClass} ${bgClass} disabled:cursor-default`}
                  >
                    <div className="flex items-center gap-3">
                      {phase === 'feedback' && currentFeedback ? (
                        option.id === currentFeedback.correctOptionId ? (
                          <CheckCircle className="h-5 w-5 text-green-600 shrink-0" />
                        ) : option.id === selectedOption && !currentFeedback.isCorrect ? (
                          <XCircle className="h-5 w-5 text-red-600 shrink-0" />
                        ) : (
                          <div className="w-5 h-5 rounded-full border-2 border-border shrink-0" />
                        )
                      ) : (
                        <div className={`w-5 h-5 rounded-full border-2 shrink-0 ${
                          selectedOption === option.id ? 'border-primary bg-primary' : 'border-border'
                        }`} />
                      )}
                      <span>{option.option_text}</span>
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Feedback section */}
            {phase === 'feedback' && currentFeedback && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className={`mt-4 p-4 rounded-lg border ${
                  currentFeedback.isCorrect
                    ? 'bg-green-50 border-green-200 dark:bg-green-950/20'
                    : 'bg-red-50 border-red-200 dark:bg-red-950/20'
                }`}
              >
                <p className={`font-semibold ${currentFeedback.isCorrect ? 'text-green-700 dark:text-green-300' : 'text-red-700 dark:text-red-300'}`}>
                  {currentFeedback.isCorrect ? '✅ ¡Correcto!' : '❌ Incorrecto'}
                </p>
                {question.explanation && (
                  <p className="text-sm text-muted-foreground mt-1">
                    {question.explanation}
                  </p>
                )}
              </motion.div>
            )}
          </motion.div>
        </AnimatePresence>

        <div className="flex justify-end pt-2">
          {phase === 'question' ? (
            <Button
              onClick={handleConfirmAnswer}
              disabled={selectedOption === null || submitting}
              className="px-6"
            >
              {submitting ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : null}
              Confirmar respuesta
            </Button>
          ) : (
            <Button onClick={handleNextQuestion} className="px-6 flex items-center gap-2">
              {currentQuestion < questions.length - 1 ? (
                <>Siguiente pregunta <ArrowRight className="h-4 w-4" /></>
              ) : (
                <>Ver resultados <Trophy className="h-4 w-4" /></>
              )}
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
