
import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import type { CourseQuiz, QuizQuestion, QuizAttempt, QuizAnswer, QuizStats } from '@/types/quiz';

export const useQuiz = (courseId?: string) => {
  const { profile } = useAuth();
  const [quiz, setQuiz] = useState<CourseQuiz | null>(null);
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [currentAttempt, setCurrentAttempt] = useState<QuizAttempt | null>(null);
  const [userAttempts, setUserAttempts] = useState<QuizAttempt[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<QuizStats | null>(null);

  // Cargar quiz del curso
  const loadQuiz = async (courseId: string) => {
    try {
      const { data: quizData, error: quizError } = await supabase
        .from('course_quizzes')
        .select('*')
        .eq('course_id', courseId)
        .eq('is_active', true)
        .single();

      if (quizError || !quizData) {
        console.log('No quiz found for course:', courseId);
        setQuiz(null);
        return;
      }

      setQuiz(quizData);

      // Cargar preguntas con opciones
      const { data: questionsData, error: questionsError } = await supabase
        .from('quiz_questions')
        .select(`
          *,
          quiz_question_options (*)
        `)
        .eq('quiz_id', quizData.id)
        .order('order_index');

      if (questionsError) {
        console.error('Error loading questions:', questionsError);
        return;
      }

      const questionsWithOptions = questionsData?.map(question => ({
        ...question,
        question_type: question.question_type as 'multiple_choice' | 'true_false' | 'short_answer',
        options: question.quiz_question_options?.sort((a, b) => a.order_index - b.order_index) || []
      })) || [];

      setQuestions(questionsWithOptions);

    } catch (error) {
      console.error('Error loading quiz:', error);
    }
  };

  // Cargar intentos del usuario
  const loadUserAttempts = async (quizId: string) => {
    if (!profile?.id) return;

    try {
      const { data, error } = await supabase
        .from('quiz_attempts')
        .select('*')
        .eq('quiz_id', quizId)
        .eq('user_id', profile.id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error loading user attempts:', error);
        return;
      }

      const transformedAttempts = data?.map(attempt => ({
        ...attempt,
        answers: Array.isArray(attempt.answers) ? attempt.answers : []
      })) || [];

      setUserAttempts(transformedAttempts);
    } catch (error) {
      console.error('Error loading user attempts:', error);
    }
  };

  // Iniciar nuevo intento
  const startQuizAttempt = async (quizId: string) => {
    if (!profile?.id || !quiz) return null;

    try {
      const attemptNumber = userAttempts.length + 1;
      const maxScore = questions.reduce((sum, q) => sum + q.points, 0);

      const { data, error } = await supabase
        .from('quiz_attempts')
        .insert([{
          user_id: profile.id,
          quiz_id: quizId,
          max_score: maxScore,
          attempt_number: attemptNumber
        }])
        .select()
        .single();

      if (error) {
        console.error('Error starting quiz attempt:', error);
        return null;
      }

      const transformedAttempt = {
        ...data,
        answers: Array.isArray(data.answers) ? data.answers : []
      };

      setCurrentAttempt(transformedAttempt);
      return transformedAttempt;
    } catch (error) {
      console.error('Error starting quiz attempt:', error);
      return null;
    }
  };

  // Guardar respuesta
  const saveAnswer = async (
    attemptId: string,
    questionId: string,
    selectedOptionId?: string,
    answerText?: string
  ) => {
    try {
      const question = questions.find(q => q.id === questionId);
      if (!question) return;

      let isCorrect = false;
      let pointsEarned = 0;

      if (question.question_type === 'multiple_choice' && selectedOptionId) {
        const selectedOption = question.options?.find(opt => opt.id === selectedOptionId);
        isCorrect = selectedOption?.is_correct || false;
        pointsEarned = isCorrect ? question.points : 0;
      }

      const { error } = await supabase
        .from('quiz_answers')
        .upsert([{
          attempt_id: attemptId,
          question_id: questionId,
          selected_option_id: selectedOptionId,
          answer_text: answerText,
          is_correct: isCorrect,
          points_earned: pointsEarned
        }]);

      if (error) {
        console.error('Error saving answer:', error);
      }
    } catch (error) {
      console.error('Error saving answer:', error);
    }
  };

  // Finalizar intento
  const finishQuizAttempt = async (attemptId: string, startTime: Date) => {
    try {
      // Calcular puntuación total
      const { data: answersData, error: answersError } = await supabase
        .from('quiz_answers')
        .select('points_earned')
        .eq('attempt_id', attemptId);

      if (answersError) {
        console.error('Error calculating score:', answersError);
        return;
      }

      const totalScore = answersData?.reduce((sum, answer) => sum + answer.points_earned, 0) || 0;
      const maxScore = questions.reduce((sum, q) => sum + q.points, 0);
      const percentage = maxScore > 0 ? (totalScore / maxScore) * 100 : 0;
      const passed = percentage >= (quiz?.passing_score || 70);
      const timeTaken = Math.floor((new Date().getTime() - startTime.getTime()) / 1000);

      const { data, error } = await supabase
        .from('quiz_attempts')
        .update({
          score: totalScore,
          percentage: percentage,
          passed: passed,
          completed_at: new Date().toISOString(),
          time_taken_seconds: timeTaken
        })
        .eq('id', attemptId)
        .select()
        .single();

      if (error) {
        console.error('Error finishing quiz attempt:', error);
        return null;
      }

      const transformedAttempt = {
        ...data,
        answers: Array.isArray(data.answers) ? data.answers : []
      };

      setCurrentAttempt(transformedAttempt);
      await loadUserAttempts(quiz?.id || '');
      return transformedAttempt;
    } catch (error) {
      console.error('Error finishing quiz attempt:', error);
      return null;
    }
  };

  // Cargar estadísticas
  const loadQuizStats = async (quizId: string) => {
    try {
      const { data, error } = await supabase
        .rpc('calculate_quiz_stats', { quiz_id_param: quizId });

      if (error) {
        console.error('Error loading quiz stats:', error);
        return;
      }

      if (data && data.length > 0) {
        setStats(data[0]);
      }
    } catch (error) {
      console.error('Error loading quiz stats:', error);
    }
  };

  // Efecto para cargar datos cuando cambia el courseId
  useEffect(() => {
    if (courseId) {
      loadQuiz(courseId);
    }
  }, [courseId]);

  // Efecto para cargar intentos cuando se carga el quiz
  useEffect(() => {
    if (quiz?.id && profile?.id) {
      loadUserAttempts(quiz.id);
      loadQuizStats(quiz.id);
    }
  }, [quiz?.id, profile?.id]);

  // Verificar si el usuario puede tomar el quiz
  const canTakeQuiz = () => {
    if (!quiz || !profile) return false;
    if (quiz.max_attempts === -1) return true; // Sin límite
    return userAttempts.length < quiz.max_attempts;
  };

  // Obtener el mejor intento
  const getBestAttempt = () => {
    if (userAttempts.length === 0) return null;
    return userAttempts.reduce((best, current) => 
      current.percentage > best.percentage ? current : best
    );
  };

  return {
    quiz,
    questions,
    currentAttempt,
    userAttempts,
    loading,
    stats,
    canTakeQuiz,
    getBestAttempt: getBestAttempt(),
    startQuizAttempt,
    saveAnswer,
    finishQuizAttempt,
    loadQuizStats
  };
};
