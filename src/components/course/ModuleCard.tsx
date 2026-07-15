
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
          ? 'ring-2 ring-brand bg-brand-soft'
          : isLocked
            ? 'opacity-60 cursor-not-allowed bg-muted'
            : 'hover:shadow-md hover:bg-muted'
      }`}
      onClick={!isLocked ? onClick : undefined}
    >
      <CardContent className="p-4">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-sm font-medium text-muted-foreground">
                Módulo {index + 1}
              </span>
              {isCompleted && (
                <CheckCircle className="h-4 w-4 text-success" />
              )}
              {isLocked && (
                <Lock className="h-4 w-4 text-muted-foreground" />
              )}
            </div>
            <h4 className={`font-medium mb-2 ${isLocked ? 'text-muted-foreground' : 'text-foreground'}`}>
              {module.title}
            </h4>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="text-xs">
                <Clock className="h-3 w-3 mr-1" />
                {module.duration} min
              </Badge>
              {isCompleted && (
                <Badge className="text-xs bg-success/15 text-success hover:bg-success/15">
                  Completado
                </Badge>
              )}
              {isLocked && (
                <Badge variant="outline" className="text-xs text-muted-foreground border-border">
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
