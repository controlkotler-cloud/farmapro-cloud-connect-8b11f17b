
import React from 'react';
import { Badge } from '@/components/ui/badge';

interface QuizProgressProps {
  currentQuestion: number;
  totalQuestions: number;
  courseTitle: string;
}

export const QuizProgress: React.FC<QuizProgressProps> = ({
  currentQuestion,
  totalQuestions,
  courseTitle
}) => {
  const progress = ((currentQuestion + 1) / totalQuestions) * 100;

  return (
    <>
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Quiz de Evaluación - {courseTitle}</h1>
        <Badge variant="outline">
          {currentQuestion + 1} / {totalQuestions}
        </Badge>
      </div>
      <div className="w-full bg-gray-200 rounded-full h-2">
        <div 
          className="bg-green-600 h-2 rounded-full transition-all duration-300"
          style={{ width: `${progress}%` }}
        ></div>
      </div>
    </>
  );
};
