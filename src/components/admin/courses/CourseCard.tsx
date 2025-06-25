
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Edit, Trash2, Eye } from 'lucide-react';
import type { Database } from '@/integrations/supabase/types';

type Course = Database['public']['Tables']['courses']['Row'];

interface CourseCardProps {
  course: Course;
  categories: Array<{ value: string; label: string }>;
  onEdit: (course: Course) => void;
  onDelete: (courseId: string) => void;
}

const CourseCard = ({ course, categories, onEdit, onDelete }: CourseCardProps) => {
  return (
    <Card className="hover:shadow-lg transition-shadow">
      <CardHeader>
        <div className="flex justify-between items-start">
          <div className="flex-1">
            <CardTitle className="text-lg line-clamp-2">{course.title}</CardTitle>
            <div className="flex items-center space-x-2 mt-2">
              <Badge variant="outline">
                {categories.find(c => c.value === course.category)?.label}
              </Badge>
              {course.is_premium && (
                <Badge className="bg-gradient-to-r from-yellow-400 to-orange-500">
                  Premium
                </Badge>
              )}
            </div>
          </div>
        </div>
        <CardDescription className="line-clamp-3">
          {course.description || 'Sin descripción'}
        </CardDescription>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="flex items-center justify-between text-sm text-gray-600 mb-4">
          <span>{course.duration_minutes ? `${course.duration_minutes} min` : 'Sin duración'}</span>
          <span>{new Date(course.created_at).toLocaleDateString()}</span>
        </div>
        <div className="text-xs text-gray-500 mb-4">
          <div>Módulos: {Array.isArray(course.course_modules) ? course.course_modules.length : 0}</div>
          <div>ID: {course.id}</div>
        </div>
        <div className="flex space-x-2">
          <Button size="sm" variant="outline" onClick={() => onEdit(course)}>
            <Edit className="h-4 w-4" />
          </Button>
          <Button size="sm" variant="outline">
            <Eye className="h-4 w-4" />
          </Button>
          <Button 
            size="sm" 
            variant="destructive" 
            onClick={() => onDelete(course.id)}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default CourseCard;
