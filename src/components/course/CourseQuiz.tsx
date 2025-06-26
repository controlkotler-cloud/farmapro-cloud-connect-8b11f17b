
import React, { useState } from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';
import { QuizResults } from './quiz/QuizResults';
import { QuizQuestion } from './quiz/QuizQuestion';
import { QuizProgress } from './quiz/QuizProgress';
import { getQuizQuestions } from './quiz/quizData';

interface CourseQuizProps {
  courseId: string;
  courseTitle: string;
  onComplete: (passed: boolean, score: number) => void;
}

const CourseQuiz: React.FC<CourseQuizProps> = ({ courseId, courseTitle, onComplete }) => {
  const { profile } = useAuth();
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<number[]>([]);
  const [showResults, setShowResults] = useState(false);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);

  const quizQuestions = getQuizQuestions(courseId);

  const handleAnswerSelect = (optionIndex: number) => {
    setSelectedOption(optionIndex);
  };

  const handleNextQuestion = () => {
    if (selectedOption === null) return;

    const newAnswers = [...selectedAnswers];
    newAnswers[currentQuestion] = selectedOption;
    setSelectedAnswers(newAnswers);
    setSelectedOption(null);

    if (currentQuestion < quizQuestions.length - 1) {
      setCurrentQuestion(currentQuestion + 1);
    } else {
      // Calcular resultados
      const correctCount = newAnswers.reduce((count, answer, index) => {
        return answer === quizQuestions[index].correctAnswer ? count + 1 : count;
      }, 0);
      
      setShowResults(true);
      const score = Math.round((correctCount / quizQuestions.length) * 100);
      const passed = score >= 70;
      
      // Marcar quiz como completado en localStorage
      if (profile?.id) {
        const quizKey = `quiz_completed_${courseId}_${profile.id}`;
        localStorage.setItem(quizKey, 'true');
      }
      
      onComplete(passed, score);
    }
  };

  const resetQuiz = () => {
    setCurrentQuestion(0);
    setSelectedAnswers([]);
    setShowResults(false);
    setSelectedOption(null);
    
    // Limpiar el estado de completado para permitir repetir
    if (profile?.id) {
      const quizKey = `quiz_completed_${courseId}_${profile.id}`;
      localStorage.removeItem(quizKey);
    }
  };

  const calculateScore = () => {
    const correctCount = selectedAnswers.reduce((count, answer, index) => {
      return answer === quizQuestions[index].correctAnswer ? count + 1 : count;
    }, 0);
    return Math.round((correctCount / quizQuestions.length) * 100);
  };

  if (showResults) {
    const score = calculateScore();
    const passed = score >= 70;

    return (
      <QuizResults
        score={score}
        passed={passed}
        questions={quizQuestions}
        selectedAnswers={selectedAnswers}
        onResetQuiz={resetQuiz}
      />
    );
  }

  if (quizQuestions.length === 0) {
    return (
      <Card className="w-full max-w-4xl mx-auto">
        <CardContent className="text-center py-8">
          <p className="text-gray-600">Quiz no disponible para este curso.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <QuizProgress
          currentQuestion={currentQuestion}
          totalQuestions={quizQuestions.length}
          courseTitle={courseTitle}
        />
      </CardHeader>
      <CardContent className="space-y-6">
        <QuizQuestion
          question={quizQuestions[currentQuestion].question}
          options={quizQuestions[currentQuestion].options}
          selectedOption={selectedOption}
          onAnswerSelect={handleAnswerSelect}
        />

        <div className="flex justify-end">
          <Button 
            onClick={handleNextQuestion}
            disabled={selectedOption === null}
            className="px-6"
          >
            {currentQuestion < quizQuestions.length - 1 ? 'Siguiente' : 'Finalizar Quiz'}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default CourseQuiz;
