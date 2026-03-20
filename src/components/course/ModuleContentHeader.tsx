
import { CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Clock, 
  CheckCircle,
  BookOpen,
  Target,
  Users,
  Lightbulb,
  Star,
  Award
} from 'lucide-react';
import type { CourseModule } from '@/types/course';

interface ModuleContentHeaderProps {
  module: CourseModule;
  moduleIndex: number;
  totalModules: number;
  isCompleted: boolean;
}

export const ModuleContentHeader = ({
  module,
  moduleIndex,
  totalModules,
  isCompleted
}: ModuleContentHeaderProps) => {
  const getModuleIcon = (index: number) => {
    const icons = [BookOpen, Target, Users, Lightbulb, Star, Award];
    const IconComponent = icons[index % icons.length];
    return <IconComponent className="h-6 w-6" />;
  };

  return (
    <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 border-b">
      <div className="flex items-start justify-between">
        <div className="flex items-center space-x-3">
          <div className="flex-shrink-0 p-2 bg-blue-100 rounded-lg">
            {getModuleIcon(moduleIndex)}
          </div>
          <div>
            <CardTitle className="text-xl flex items-center gap-2">
              Módulo {moduleIndex + 1}: {module.title}
              {isCompleted && (
                <CheckCircle className="h-5 w-5 text-green-500" />
              )}
            </CardTitle>
            <div className="flex items-center gap-4 mt-2 text-sm text-gray-600">
              <Badge variant="outline" className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                {module.duration} min
              </Badge>
              <span className="bg-blue-100 text-blue-700 px-2 py-1 rounded-full text-xs font-medium">
                {moduleIndex + 1} de {totalModules}
              </span>
            </div>
          </div>
        </div>
      </div>
    </CardHeader>
  );
};
