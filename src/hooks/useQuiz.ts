
import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import type { CourseQuiz, QuizQuestion, QuizAttempt, QuizStats } from '@/types/quiz';

export const useQuiz = (courseIdOrSlug?: string) => {
  const { profile } = useAuth();
  const [quiz, setQuiz] = useState<CourseQuiz | null>(null);
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [currentAttempt, setCurrentAttempt] = useState<QuizAttempt | null>(null);
  const [userAttempts, setUserAttempts] = useState<QuizAttempt[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<QuizStats | null>(null);
  const [resolvedCourseId, setResolvedCourseId] = useState<string | null>(null);

  // Resolve slug to UUID if needed
  const resolveCourseId = async (idOrSlug: string): Promise<string | null> => {
    // Check if it's already a UUID
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (uuidRegex.test(idOrSlug)) {
      return idOrSlug;
    }

    // It's a slug, resolve to UUID
    const { data, error } = await supabase
      .from('courses')
      .select('id')
      .eq('slug', idOrSlug)
      .single();

    if (error || !data) {
      console.error('Could not resolve course slug:', idOrSlug, error);
      return null;
    }
    return data.id;
  };

  // Load quiz for the course
  const loadQuiz = async (courseUUID: string) => {
    try {
      const { data: quizData, error: quizError } = await supabase
        .from('course_quizzes')
        .select('*')
        .eq('course_id', courseUUID)
        .eq('is_active', true)
        .maybeSingle();

      if (quizError || !quizData) {
        console.log('No quiz found for course:', courseUUID);
        setQuiz(null);
        setLoading(false);
        return;
      }

      setQuiz(quizData);

      // Load questions with options via safe RPC (excludes correct_answer/is_correct)
      const { data: questionsData, error: questionsError } = await supabase
        .rpc('get_active_quiz_questions', { p_quiz_id: quizData.id });

      if (questionsError) {
        console.error('Error loading questions:', questionsError);
        setLoading(false);
        return;
      }

      const questionsWithOptions = (Array.isArray(questionsData) ? questionsData : []).map((question: any) => ({
        ...question,
        question_type: question.question_type as 'multiple_choice' | 'true_false' | 'short_answer',
        options: (question.options || []).sort((a: any, b: any) => a.order_index - b.order_index),
      }));

      setQuestions(questionsWithOptions);
    } catch (error) {
      console.error('Error loading quiz:', error);
    } finally {
      setLoading(false);
    }
  };

  // Load user attempts
  const loadUserAttempts = async (quizId: string) => {
    if (!profile?.id) return;

    try {
      const { data, error } = await supabase
        .from('quiz_attempts')
        .select('*')
        .eq('quiz_id', quizId)
        .eq('user_id', profile.id)
        .order('completed_at', { ascending: false });

      if (error) {
        console.error('Error loading user attempts:', error);
        return;
      }

      const transformedAttempts = data?.map(attempt => ({
        ...attempt,
        answers: Array.isArray(attempt.answers) ? attempt.answers : []
      })) as QuizAttempt[] || [];

      setUserAttempts(transformedAttempts);
    } catch (error) {
      console.error('Error loading user attempts:', error);
    }
  };

  // Start new attempt
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
      } as QuizAttempt;

      setCurrentAttempt(transformedAttempt);
      return transformedAttempt;
    } catch (error) {
      console.error('Error starting quiz attempt:', error);
      return null;
    }
  };

  // Save answer via SECURITY DEFINER RPC (scoring happens server-side)
  const saveAnswer = async (
    attemptId: string,
    questionId: string,
    selectedOptionId?: string,
    answerText?: string
  ): Promise<{ isCorrect: boolean; correctOptionId: string | null } | null> => {
    try {
      const { data, error } = await supabase.rpc('submit_quiz_answer', {
        p_attempt_id: attemptId,
        p_question_id: questionId,
        p_selected_option_id: selectedOptionId ?? null,
        p_answer_text: answerText ?? null,
      });

      if (error) {
        console.error('Error saving answer:', error);
        return null;
      }

      const result = (data ?? {}) as { is_correct?: boolean; correct_option_id?: string | null };
      return {
        isCorrect: !!result.is_correct,
        correctOptionId: result.correct_option_id ?? null,
      };
    } catch (error) {
      console.error('Error saving answer:', error);
      return null;
    }
  };

  // Finish attempt
  const finishQuizAttempt = async (attemptId: string, startTime: Date) => {
    try {
      const { data: answersData, error: answersError } = await supabase
        .from('quiz_answers')
        .select('points_earned')
        .eq('attempt_id', attemptId);

      if (answersError) {
        console.error('Error calculating score:', answersError);
        return null;
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
      } as QuizAttempt;

      setCurrentAttempt(transformedAttempt);
      await loadUserAttempts(quiz?.id || '');
      return transformedAttempt;
    } catch (error) {
      console.error('Error finishing quiz attempt:', error);
      return null;
    }
  };

  // Load stats
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

  // Resolve and load on mount
  useEffect(() => {
    const init = async () => {
      if (!courseIdOrSlug) {
        setLoading(false);
        return;
      }
      setLoading(true);
      const uuid = await resolveCourseId(courseIdOrSlug);
      if (uuid) {
        setResolvedCourseId(uuid);
        await loadQuiz(uuid);
      } else {
        setLoading(false);
      }
    };
    init();
  }, [courseIdOrSlug]);

  // Load attempts when quiz is loaded
  useEffect(() => {
    if (quiz?.id && profile?.id) {
      loadUserAttempts(quiz.id);
      loadQuizStats(quiz.id);
    }
  }, [quiz?.id, profile?.id]);

  // Always allow retakes (unlimited)
  const canTakeQuiz = () => {
    if (!quiz || !profile) return false;
    return true; // Unlimited retakes
  };

  // Get best attempt
  const getBestAttempt = (): QuizAttempt | null => {
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
    resolvedCourseId,
    canTakeQuiz,
    getBestAttempt: getBestAttempt(),
    startQuizAttempt,
    saveAnswer,
    finishQuizAttempt,
    loadQuizStats
  };
};
