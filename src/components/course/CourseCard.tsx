
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Clock, Star, Lock, CheckCircle } from 'lucide-react';
import { motion } from 'framer-motion';
import type { Course, CourseEnrollment } from '@/types/course';

interface CourseCardProps {
  course: Course;
  index: number;
  enrollments: CourseEnrollment[];
  canAccessCourse: (course: Course) => boolean;
  onEnroll: (courseId: string) => void;
}

export const CourseCard = ({ course, index, enrollments, canAccessCourse, onEnroll }: CourseCardProps) => {
  const getCourseEnrollment = (courseId: string) => {
    return enrollments.find(enrollment => enrollment.course_id === courseId);
  };

  const isEnrolled = (courseId: string) => {
    return enrollments.some(enrollment => enrollment.course_id === courseId);
  };

  const isCompleted = (courseId: string) => {
    const enrollment = getCourseEnrollment(courseId);
    return enrollment && enrollment.completed_at !== null;
  };

  const getCompletedDate = (courseId: string) => {
    const enrollment = getCourseEnrollment(courseId);
    if (enrollment && enrollment.completed_at) {
      return new Date(enrollment.completed_at).toLocaleDateString('es-ES');
    }
    return null;
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: index * 0.1 }}
    >
      <Card className="h-full hover:shadow-lg transition-shadow">
        <div className="relative">
          <img 
            src={course.thumbnail_url || "/placeholder.svg"} 
            alt={course.title}
            className="w-full h-48 object-cover rounded-t-lg"
          />
          {course.is_premium && (
            <Badge className="absolute top-2 right-2 bg-gradient-to-r from-yellow-400 to-orange-500">
              <Star className="h-3 w-3 mr-1" />
              Premium
            </Badge>
          )}
          {isCompleted(course.id) && (
            <Badge className="absolute top-2 left-2 bg-green-500">
              <CheckCircle className="h-3 w-3 mr-1" />
              Completado
            </Badge>
          )}
        </div>
        <CardHeader>
          <CardTitle className="text-lg">{course.title}</CardTitle>
          <CardDescription>{course.description}</CardDescription>
          {isCompleted(course.id) && (
            <div className="text-sm text-green-600 font-medium">
              Completado el {getCompletedDate(course.id)}
            </div>
          )}
        </CardHeader>
        <CardContent className="pt-0">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center text-sm text-gray-600">
              <Clock className="h-4 w-4 mr-1" />
              {Math.floor(course.duration_minutes / 60)}h {course.duration_minutes % 60}m
            </div>
            <Badge variant="outline">{course.category}</Badge>
          </div>
          <Button 
            className="w-full"
            onClick={() => onEnroll(course.id)}
            disabled={!canAccessCourse(course)}
            variant={isCompleted(course.id) ? "secondary" : "default"}
          >
            {!canAccessCourse(course) ? (
              <>
                <Lock className="h-4 w-4 mr-2" />
                Requiere Premium
              </>
            ) : isCompleted(course.id) ? (
              'Ver Curso'
            ) : isEnrolled(course.id) ? (
              'Continuar Curso'
            ) : (
              'Comenzar Curso'
            )}
          </Button>
        </CardContent>
      </Card>
    </motion.div>
  );
};
