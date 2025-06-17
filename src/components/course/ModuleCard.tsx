
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Clock, Play, FileText, Download } from 'lucide-react';
import type { CourseModule } from '@/types/course';

interface ModuleCardProps {
  module: CourseModule;
  index: number;
  isActive: boolean;
  onClick: () => void;
}

export const ModuleCard = ({ module, index, isActive, onClick }: ModuleCardProps) => {
  const hasContent = module.content || module.video_url || (module.downloadable_resources && module.downloadable_resources.length > 0);
  const resourceCount = module.downloadable_resources?.length || 0;

  return (
    <Card className={`cursor-pointer transition-all ${isActive ? 'ring-2 ring-blue-500 bg-blue-50' : 'hover:shadow-md'}`}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <CardTitle className="text-lg">
              Módulo {index + 1}: {module.title}
            </CardTitle>
            {module.content && (
              <CardDescription className="mt-2 line-clamp-2">
                {module.content.replace(/<[^>]*>/g, '').substring(0, 100)}...
              </CardDescription>
            )}
          </div>
          <Badge variant="outline" className="ml-2 flex-shrink-0">
            <Clock className="h-3 w-3 mr-1" />
            {module.duration}min
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        {/* Indicadores de contenido */}
        <div className="flex items-center space-x-3 mb-3 text-xs text-gray-600">
          {module.video_url && (
            <div className="flex items-center">
              <Play className="h-3 w-3 mr-1" />
              Video
            </div>
          )}
          {module.content && (
            <div className="flex items-center">
              <FileText className="h-3 w-3 mr-1" />
              Contenido
            </div>
          )}
          {resourceCount > 0 && (
            <div className="flex items-center">
              <Download className="h-3 w-3 mr-1" />
              {resourceCount} recursos
            </div>
          )}
        </div>

        <Button 
          onClick={onClick}
          variant={isActive ? "default" : "outline"}
          size="sm"
          className="w-full"
          disabled={!hasContent}
        >
          <Play className="h-4 w-4 mr-2" />
          {isActive ? 'Módulo Actual' : hasContent ? 'Ver Módulo' : 'Próximamente'}
        </Button>
      </CardContent>
    </Card>
  );
};
