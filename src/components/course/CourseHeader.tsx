
import { Badge } from '@/components/ui/badge';
import { Clock, Users, Award } from 'lucide-react';
import type { Course } from '@/types/course';

interface CourseHeaderProps {
  course: Course;
  isEnrolled: boolean;
  isCompleted: boolean;
}

export const CourseHeader = ({ course, isEnrolled, isCompleted }: CourseHeaderProps) => {
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
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">{course.title}</h1>
            <p className="text-gray-600 text-lg">{course.description}</p>
          </div>
          <div className="flex flex-col items-end space-y-2">
            <Badge variant="outline">{course.category}</Badge>
            {course.is_premium && (
              <Badge className="bg-gradient-to-r from-yellow-400 to-orange-500">
                <Award className="h-3 w-3 mr-1" />
                Premium
              </Badge>
            )}
            {isCompleted && (
              <Badge className="bg-green-500">
                Completado
              </Badge>
            )}
          </div>
        </div>
        
        <div className="flex items-center space-x-6 text-sm text-gray-600">
          <div className="flex items-center">
            <Clock className="h-4 w-4 mr-1" />
            {Math.floor(course.duration_minutes / 60)}h {course.duration_minutes % 60}m
          </div>
          <div className="flex items-center">
            <Users className="h-4 w-4 mr-1" />
            {course.course_modules?.length || 0} módulos
          </div>
        </div>
      </div>
    </div>
  );
};
