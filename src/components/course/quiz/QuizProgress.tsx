
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
        <h1 className="text-xl font-semibold text-foreground">Quiz de Evaluación - {courseTitle}</h1>
        <Badge variant="outline">
          {currentQuestion + 1} / {totalQuestions}
        </Badge>
      </div>
      <div className="h-2 w-full overflow-hidden rounded-full border border-border bg-secondary">
        <div
          className="h-full rounded-full bg-brand transition-all duration-300"
          style={{ width: `${progress}%` }}
        ></div>
      </div>
    </>
  );
};
