
import { Badge } from '@/components/ui/badge';
import { Clock, Users, Award, BookOpen } from 'lucide-react';
import type { Course } from '@/types/course';

interface CourseHeaderProps {
  course: Course;
  isEnrolled: boolean;
  isCompleted: boolean;
}

export const CourseHeader = ({ course, isEnrolled, isCompleted }: CourseHeaderProps) => {
  const totalModules = course.course_modules?.length || 0;
  const totalDuration = course.course_modules?.reduce((sum, module) => sum + module.duration, 0) || course.duration_minutes;

  return (
    <div className="bg-white rounded-lg shadow-lg overflow-hidden mb-8">
      {course.featured_image_url && (
        <div className="h-64 overflow-hidden">
          <img 
            src={course.featured_image_url} 
            alt={course.title}
            className="w-full h-full object-cover"
          />
        </div>
      )}
      <div className="p-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <h1 className="text-3xl font-bold text-gray-900 mb-3">{course.title}</h1>
            <p className="text-gray-600 text-lg leading-relaxed">{course.description}</p>
          </div>
          <div className="flex flex-col items-end space-y-2 ml-6">
            <Badge variant="outline" className="capitalize">
              {course.category.replace('_', ' ')}
            </Badge>
            {course.is_premium && (
              <Badge className="bg-gradient-to-r from-yellow-400 to-orange-500">
                <Award className="h-3 w-3 mr-1" />
                Premium
              </Badge>
            )}
            {isCompleted && (
              <Badge className="bg-green-500">
                <Award className="h-3 w-3 mr-1" />
                Completado
              </Badge>
            )}
            {isEnrolled && !isCompleted && (
              <Badge variant="secondary">
                En progreso
              </Badge>
            )}
          </div>
        </div>
        
        <div className="flex items-center space-x-6 text-sm text-gray-600 bg-gray-50 p-4 rounded-lg">
          <div className="flex items-center">
            <Clock className="h-4 w-4 mr-2" />
            <span className="font-medium">Duración:</span>
            <span className="ml-1">
              {Math.floor(totalDuration / 60)}h {totalDuration % 60}m
            </span>
          </div>
          <div className="flex items-center">
            <BookOpen className="h-4 w-4 mr-2" />
            <span className="font-medium">Módulos:</span>
            <span className="ml-1">{totalModules}</span>
          </div>
          <div className="flex items-center">
            <Users className="h-4 w-4 mr-2" />
            <span className="font-medium">Nivel:</span>
            <span className="ml-1">
              {course.is_premium ? 'Avanzado' : 'Intermedio'}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
