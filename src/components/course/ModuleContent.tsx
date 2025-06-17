
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Clock } from 'lucide-react';
import type { CourseModule } from '@/types/course';

interface ModuleContentProps {
  module: CourseModule;
  moduleIndex: number;
}

export const ModuleContent = ({ module, moduleIndex }: ModuleContentProps) => {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between">
          <CardTitle className="text-xl">
            Módulo {moduleIndex + 1}: {module.title}
          </CardTitle>
          <Badge variant="outline">
            <Clock className="h-3 w-3 mr-1" />
            {module.duration} min
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {module.content && (
          <div className="prose max-w-none">
            <div dangerouslySetInnerHTML={{ __html: module.content }} />
          </div>
        )}
      </CardContent>
    </Card>
  );
};
