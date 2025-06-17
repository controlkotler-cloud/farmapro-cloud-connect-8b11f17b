
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Clock, Play } from 'lucide-react';
import type { CourseModule } from '@/types/course';

interface ModuleCardProps {
  module: CourseModule;
  index: number;
  isActive: boolean;
  onClick: () => void;
}

export const ModuleCard = ({ module, index, isActive, onClick }: ModuleCardProps) => {
  return (
    <Card className={`cursor-pointer transition-all ${isActive ? 'ring-2 ring-blue-500' : 'hover:shadow-md'}`}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="text-lg">
              Módulo {index + 1}: {module.title}
            </CardTitle>
            {module.content && (
              <CardDescription className="mt-2">
                {module.content.substring(0, 100)}...
              </CardDescription>
            )}
          </div>
          <Badge variant="outline" className="ml-2">
            <Clock className="h-3 w-3 mr-1" />
            {module.duration}min
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <Button 
          onClick={onClick}
          variant={isActive ? "default" : "outline"}
          size="sm"
          className="w-full"
        >
          <Play className="h-4 w-4 mr-2" />
          {isActive ? 'Módulo Actual' : 'Ver Módulo'}
        </Button>
      </CardContent>
    </Card>
  );
};
