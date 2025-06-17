
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Clock, Play, FileText, Download, CheckCircle, Lock } from 'lucide-react';
import type { CourseModule } from '@/types/course';

interface ModuleCardProps {
  module: CourseModule;
  index: number;
  isActive: boolean;
  isCompleted: boolean;
  onClick: () => void;
}

export const ModuleCard = ({ module, index, isActive, isCompleted, onClick }: ModuleCardProps) => {
  const hasContent = module.content || module.video_url || (module.downloadable_resources && module.downloadable_resources.length > 0);
  const resourceCount = module.downloadable_resources?.length || 0;

  return (
    <Card className={`cursor-pointer transition-all ${
      isActive 
        ? 'ring-2 ring-blue-500 bg-blue-50 shadow-md' 
        : isCompleted 
          ? 'bg-green-50 border-green-200 hover:shadow-md' 
          : 'hover:shadow-md'
    }`}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <CardTitle className="text-base flex items-center gap-2">
              <span className={`flex-shrink-0 w-6 h-6 rounded-full text-xs font-bold flex items-center justify-center ${
                isCompleted 
                  ? 'bg-green-500 text-white' 
                  : isActive 
                    ? 'bg-blue-500 text-white'
                    : 'bg-gray-200 text-gray-600'
              }`}>
                {isCompleted ? <CheckCircle className="h-3 w-3" /> : index + 1}
              </span>
              {module.title}
            </CardTitle>
            {/* Resumen más corto */}
            {module.content && (
              <CardDescription className="mt-2 line-clamp-1 text-sm">
                {module.content.replace(/<[^>]*>/g, '').substring(0, 60)}...
              </CardDescription>
            )}
          </div>
          <div className="ml-2 flex flex-col items-end gap-1">
            <Badge variant="outline" className="text-xs">
              <Clock className="h-3 w-3 mr-1" />
              {module.duration}min
            </Badge>
            {isCompleted && (
              <Badge className="bg-green-500 text-xs">
                ✅ Hecho
              </Badge>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        {/* Indicadores de contenido más compactos */}
        <div className="flex items-center space-x-2 mb-3 text-xs text-gray-600">
          {module.video_url && (
            <div className="flex items-center bg-red-100 text-red-600 px-2 py-1 rounded-full">
              <Play className="h-3 w-3 mr-1" />
              Video
            </div>
          )}
          {module.content && (
            <div className="flex items-center bg-blue-100 text-blue-600 px-2 py-1 rounded-full">
              <FileText className="h-3 w-3 mr-1" />
              Contenido
            </div>
          )}
          {resourceCount > 0 && (
            <div className="flex items-center bg-green-100 text-green-600 px-2 py-1 rounded-full">
              <Download className="h-3 w-3 mr-1" />
              {resourceCount}
            </div>
          )}
        </div>

        <Button 
          onClick={onClick}
          variant={isActive ? "default" : isCompleted ? "secondary" : "outline"}
          size="sm"
          className="w-full"
          disabled={!hasContent}
        >
          {!hasContent ? (
            <>
              <Lock className="h-4 w-4 mr-2" />
              Próximamente
            </>
          ) : isCompleted ? (
            <>
              <CheckCircle className="h-4 w-4 mr-2" />
              ✅ Completado
            </>
          ) : isActive ? (
            <>
              <Play className="h-4 w-4 mr-2" />
              📖 Módulo Actual
            </>
          ) : (
            <>
              <Play className="h-4 w-4 mr-2" />
              🎯 Ver Módulo
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  );
};
