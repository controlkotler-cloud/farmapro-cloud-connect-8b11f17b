
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Clock, CheckCircle, Lock } from 'lucide-react';
import type { CourseModule } from '@/types/course';

interface ModuleCardProps {
  module: CourseModule;
  index: number;
  isActive: boolean;
  isCompleted: boolean;
  isLocked?: boolean;
  onClick: () => void;
}

export const ModuleCard = ({ 
  module, 
  index, 
  isActive, 
  isCompleted, 
  isLocked = false,
  onClick 
}: ModuleCardProps) => {
  return (
    <Card 
      className={`cursor-pointer transition-all duration-200 ${
        isActive 
          ? 'ring-2 ring-blue-500 bg-blue-50' 
          : isLocked 
            ? 'opacity-60 cursor-not-allowed bg-gray-50' 
            : 'hover:shadow-md hover:bg-gray-50'
      }`}
      onClick={!isLocked ? onClick : undefined}
    >
      <CardContent className="p-4">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-sm font-medium text-gray-600">
                Módulo {index + 1}
              </span>
              {isCompleted && (
                <CheckCircle className="h-4 w-4 text-green-500" />
              )}
              {isLocked && (
                <Lock className="h-4 w-4 text-gray-400" />
              )}
            </div>
            <h4 className={`font-medium mb-2 ${isLocked ? 'text-gray-400' : 'text-gray-900'}`}>
              {module.title}
            </h4>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="text-xs">
                <Clock className="h-3 w-3 mr-1" />
                {module.duration} min
              </Badge>
              {isCompleted && (
                <Badge className="text-xs bg-green-100 text-green-700 hover:bg-green-100">
                  Completado
                </Badge>
              )}
              {isLocked && (
                <Badge variant="outline" className="text-xs text-gray-400 border-gray-300">
                  Bloqueado
                </Badge>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
