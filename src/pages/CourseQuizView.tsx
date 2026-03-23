
import { useState } from 'react';
import { useParams, Navigate, Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { DatabaseQuiz } from '@/components/course/DatabaseQuiz';

const CourseQuizView = () => {
  const { courseSlug } = useParams();
  const [quizCompleted, setQuizCompleted] = useState(false);

  if (!courseSlug) {
    return <Navigate to="/formacion" replace />;
  }

  const handleQuizComplete = async (passed: boolean, score: number) => {
    setQuizCompleted(true);
    console.log(`Quiz completed: ${passed ? 'PASSED' : 'FAILED'} with score ${score}%`);

    if (passed) {
      try {
        const { supabase } = await import('@/integrations/supabase/client');

        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const { data: profile } = await supabase
          .from('profiles')
          .select('id')
          .eq('id', user.id)
          .single();

        if (profile) {
          const { data: course } = await supabase
            .from('courses')
            .select('id')
            .eq('slug', courseSlug)
            .single();

          if (course) {
            await supabase
              .from('course_enrollments')
              .update({
                completed_at: new Date().toISOString(),
                progress: 100
              })
              .eq('course_id', course.id)
              .eq('user_id', profile.id);

            const { updateChallengeProgress } = await import('@/utils/challengeUtils');
            await updateChallengeProgress(profile.id, 'course_completed', 1);
          }
        }
      } catch (error) {
        console.error('Error marking course as completed:', error);
      }
    }
  };

  return (
    <div className="space-y-6">
      <Link to={`/curso/${courseSlug}`}>
        <Button variant="ghost" className="mb-4">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Volver al Curso
        </Button>
      </Link>

      <DatabaseQuiz
        courseId={courseSlug}
        courseTitle=""
        onComplete={handleQuizComplete}
      />
    </div>
  );
};

export default CourseQuizView;
