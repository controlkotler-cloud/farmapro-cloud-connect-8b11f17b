
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Clock, Award, BookOpen, Users, Play } from 'lucide-react';
import type { Course, CourseEnrollment } from '@/types/course';

interface CourseCardProps {
  course: Course;
  index: number;
  enrollments: CourseEnrollment[];
  canAccessCourse: (course: Course) => boolean;
  onEnroll: (courseSlug: string) => void;
}

export const CourseCard = ({ course, index, enrollments, canAccessCourse, onEnroll }: CourseCardProps) => {
  const isEnrolled = enrollments.some(enrollment => enrollment.course_id === course.id);
  const isCompleted = enrollments.some(enrollment => 
    enrollment.course_id === course.id && enrollment.completed_at !== null
  );
  const canAccess = canAccessCourse(course);
  
  const totalModules = course.course_modules?.length || 0;
  const totalDuration = course.course_modules?.reduce((sum, module) => sum + module.duration, 0) || course.duration_minutes;

  const handleClick = () => {
    if (isEnrolled) {
      window.location.href = `/curso/${course.slug}`;
    } else if (canAccess) {
      onEnroll(course.slug);
    }
  };

  return (
    <Card className="h-full flex flex-col hover:shadow-lg transition-shadow duration-300">
      {/* Imagen del curso */}
      <div className="aspect-video overflow-hidden rounded-t-lg">
        <img 
          src={course.featured_image_url || course.thumbnail_url} 
          alt={course.title}
          className="w-full h-full object-cover transition-transform duration-300 hover:scale-105"
        />
      </div>

      <CardHeader className="flex-grow">
        <div className="flex items-start justify-between mb-2">
          <CardTitle className="text-xl line-clamp-2">{course.title}</CardTitle>
          <div className="flex flex-col space-y-1 ml-2">
            {course.is_premium && (
              <Badge className="bg-gradient-to-r from-yellow-400 to-orange-500 text-xs">
                <Award className="h-3 w-3 mr-1" />
                Premium
              </Badge>
            )}
            {isCompleted && (
              <Badge className="bg-green-500 text-xs">
                <Award className="h-3 w-3 mr-1" />
                Completado
              </Badge>
            )}
          </div>
        </div>
        
        <CardDescription className="line-clamp-3 text-sm leading-relaxed">
          {course.description}
        </CardDescription>

        {/* Estadísticas del curso */}
        <div className="flex items-center space-x-4 text-xs text-gray-600 mt-3">
          <div className="flex items-center">
            <Clock className="h-3 w-3 mr-1" />
            {Math.floor(totalDuration / 60)}h {totalDuration % 60}m
          </div>
          <div className="flex items-center">
            <BookOpen className="h-3 w-3 mr-1" />
            {totalModules} módulos
          </div>
          <div className="flex items-center">
            <Users className="h-3 w-3 mr-1" />
            {course.is_premium ? 'Avanzado' : 'Intermedio'}
          </div>
        </div>
      </CardHeader>

      <CardContent className="pt-0">
        <div className="space-y-2">
          {/* Mostrar algunos módulos destacados */}
          {course.course_modules && course.course_modules.length > 0 && (
            <div className="text-xs text-gray-600 mb-3">
              <p className="font-medium mb-1">Incluye:</p>
              <ul className="space-y-1">
                {course.course_modules.slice(0, 2).map((module, i) => (
                  <li key={module.id} className="flex items-center">
                    <div className="w-1 h-1 bg-blue-500 rounded-full mr-2" />
                    {module.title}
                  </li>
                ))}
                {course.course_modules.length > 2 && (
                  <li className="text-gray-500 italic">
                    + {course.course_modules.length - 2} módulos más
                  </li>
                )}
              </ul>
            </div>
          )}

          {/* Botón de acción */}
          {!canAccess ? (
            <Button disabled className="w-full" variant="outline">
              Requiere suscripción Premium
            </Button>
          ) : isEnrolled ? (
            <Button onClick={handleClick} className="w-full">
              <Play className="h-4 w-4 mr-2" />
              {isCompleted ? 'Revisar Curso' : 'Continuar Curso'}
            </Button>
          ) : (
            <Button onClick={handleClick} className="w-full" variant="outline">
              Comenzar Curso
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
