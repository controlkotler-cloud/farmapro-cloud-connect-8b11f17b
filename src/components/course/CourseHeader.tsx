
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Clock, Users, BookOpen, CheckCircle, Lock } from 'lucide-react';
import type { Course } from '@/types/course';

interface CourseHeaderProps {
  course: Course;
  isEnrolled: boolean;
  isCompleted: boolean;
}

export const CourseHeader = ({ course, isEnrolled, isCompleted }: CourseHeaderProps) => {
  const getCategoryEmoji = (category: string) => {
    switch (category) {
      case 'gestion': return '📊';
      case 'marketing': return '📈';
      case 'liderazgo': return '👑';
      case 'atencion': return '🤝';
      case 'finanzas': return '💰';
      case 'digital': return '💻';
      default: return '📚';
    }
  };

  const getCategoryLabel = (category: string) => {
    switch (category) {
      case 'gestion': return 'Gestión';
      case 'marketing': return 'Marketing';
      case 'liderazgo': return 'Liderazgo';
      case 'atencion': return 'Atención al Cliente';
      case 'finanzas': return 'Finanzas';
      case 'digital': return 'Transformación Digital';
      default: return 'General';
    }
  };

  return (
    <Card className="overflow-hidden border-0 shadow-xl bg-gradient-to-br from-white via-purple-50/30 to-blue-50/50">
      <div className="relative">
        {/* Decorative gradient bar */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-purple-400 via-blue-500 to-green-400"></div>
        
        <CardHeader className="relative bg-gradient-to-r from-gray-50/80 to-purple-50/60 pb-8">
          <div className="flex flex-col md:flex-row gap-6">
            {/* Course Image */}
            {course.thumbnail_url && (
              <div className="relative flex-shrink-0">
                <div className="w-full md:w-48 h-32 rounded-xl overflow-hidden shadow-lg ring-1 ring-white/20">
                  <img 
                    src={course.thumbnail_url} 
                    alt={course.title}
                    className="w-full h-full object-cover"
                  />
                </div>
                {isCompleted && (
                  <div className="absolute -top-2 -right-2">
                    <div className="bg-green-500 text-white p-2 rounded-full shadow-lg">
                      <CheckCircle className="h-5 w-5" />
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Course Info */}
            <div className="flex-1 space-y-4">
              <div className="flex items-start justify-between">
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <Badge className="bg-gradient-to-r from-purple-500 to-blue-600 text-white px-3 py-1">
                      <span className="mr-1">{getCategoryEmoji(course.category)}</span>
                      {getCategoryLabel(course.category)}
                    </Badge>
                    {course.is_premium && (
                      <Badge className="bg-gradient-to-r from-yellow-400 to-orange-500 text-white px-3 py-1">
                        <Lock className="h-3 w-3 mr-1" />
                        Premium
                      </Badge>
                    )}
                  </div>
                  
                  <CardTitle className="text-2xl md:text-3xl font-bold text-gray-900 leading-tight">
                    {course.title}
                  </CardTitle>
                  
                  <CardDescription className="text-base text-gray-600 leading-relaxed max-w-2xl">
                    {course.description}
                  </CardDescription>
                </div>
              </div>

              {/* Course Stats */}
              <div className="flex flex-wrap items-center gap-6 text-sm text-gray-600">
                {course.duration_minutes && (
                  <div className="flex items-center gap-2 bg-white/60 px-3 py-2 rounded-lg">
                    <Clock className="h-4 w-4 text-blue-500" />
                    <span className="font-medium">{course.duration_minutes} minutos</span>
                  </div>
                )}
                
                <div className="flex items-center gap-2 bg-white/60 px-3 py-2 rounded-lg">
                  <BookOpen className="h-4 w-4 text-green-500" />
                  <span className="font-medium">
                    {course.course_modules?.length || 0} módulos
                  </span>
                </div>

                {isEnrolled && (
                  <div className="flex items-center gap-2 bg-blue-50 px-3 py-2 rounded-lg border border-blue-200">
                    <Users className="h-4 w-4 text-blue-500" />
                    <span className="font-medium text-blue-700">Inscrito</span>
                  </div>
                )}

                {isCompleted && (
                  <div className="flex items-center gap-2 bg-green-50 px-3 py-2 rounded-lg border border-green-200">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    <span className="font-medium text-green-700">Completado</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </CardHeader>
      </div>
    </Card>
  );
};
