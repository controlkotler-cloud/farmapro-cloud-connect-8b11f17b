
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Clock, Download, Play, ExternalLink } from 'lucide-react';
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
        {/* Video del módulo si está disponible */}
        {module.video_url && (
          <div className="space-y-3">
            <h4 className="text-lg font-semibold flex items-center">
              <Play className="h-5 w-5 mr-2 text-blue-600" />
              Video del módulo
            </h4>
            <div className="aspect-video bg-gray-100 rounded-lg border-2 border-dashed border-gray-300 flex items-center justify-center">
              <div className="text-center">
                <Play className="h-12 w-12 mx-auto mb-2 text-blue-500" />
                <p className="text-gray-600 mb-3">Video disponible</p>
                <Button asChild variant="default">
                  <a href={module.video_url} target="_blank" rel="noopener noreferrer">
                    <ExternalLink className="h-4 w-4 mr-2" />
                    Ver Video
                  </a>
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Contenido del módulo */}
        {module.content && (
          <div className="space-y-3">
            <h4 className="text-lg font-semibold">Contenido del módulo</h4>
            <div 
              className="prose max-w-none text-gray-700 leading-relaxed"
              dangerouslySetInnerHTML={{ __html: module.content }}
            />
          </div>
        )}

        {/* Recursos descargables si están disponibles */}
        {module.downloadable_resources && module.downloadable_resources.length > 0 && (
          <div className="border-t pt-6">
            <h4 className="text-lg font-semibold mb-4 flex items-center">
              <Download className="h-5 w-5 mr-2 text-green-600" />
              Recursos Descargables
            </h4>
            <div className="grid gap-3">
              {module.downloadable_resources.map((resource, index) => (
                <div key={index} className="flex items-center justify-between p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-200">
                  <div className="flex items-center space-x-3">
                    <div className="flex-shrink-0">
                      <Download className="h-5 w-5 text-blue-600" />
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">{resource.title}</p>
                      <p className="text-sm text-gray-600">Formato: {resource.type}</p>
                    </div>
                  </div>
                  <Button asChild variant="outline" size="sm">
                    <a 
                      href={resource.url} 
                      download
                      className="flex items-center"
                    >
                      <Download className="h-4 w-4 mr-2" />
                      Descargar
                    </a>
                  </Button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Mensaje cuando no hay contenido adicional */}
        {!module.content && !module.video_url && (!module.downloadable_resources || module.downloadable_resources.length === 0) && (
          <div className="text-center py-8 text-gray-500">
            <p>El contenido de este módulo estará disponible próximamente.</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
