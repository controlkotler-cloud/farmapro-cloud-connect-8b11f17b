
export interface CourseQuiz {
  id: string;
  course_id: string;
  title: string;
  description?: string;
  passing_score: number;
  time_limit_minutes?: number;
  max_attempts: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface QuizQuestion {
  id: string;
  quiz_id: string;
  question_text: string;
  question_type: 'multiple_choice' | 'true_false' | 'short_answer';
  points: number;
  order_index: number;
  explanation?: string;
  created_at: string;
  options?: QuizQuestionOption[];
}

export interface QuizQuestionOption {
  id: string;
  question_id: string;
  option_text: string;
  is_correct: boolean;
  order_index: number;
  created_at: string;
}

export interface QuizAttempt {
  id: string;
  user_id: string;
  quiz_id: string;
  score: number;
  max_score: number;
  percentage: number;
  passed: boolean;
  started_at: string;
  completed_at?: string;
  time_taken_seconds?: number;
  attempt_number: number;
  answers?: any[];
}

export interface QuizAnswer {
  id: string;
  attempt_id: string;
  question_id: string;
  selected_option_id?: string;
  answer_text?: string;
  is_correct: boolean;
  points_earned: number;
  created_at: string;
}

export interface QuizStats {
  total_attempts: number;
  total_users: number;
  average_score: number;
  pass_rate: number;
}
