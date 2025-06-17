
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Clock, Download, Play } from 'lucide-react';
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
          <div className="aspect-video bg-gray-100 rounded-lg flex items-center justify-center">
            <div className="text-center">
              <Play className="h-12 w-12 mx-auto mb-2 text-gray-400" />
              <p className="text-gray-600">Video del módulo disponible</p>
            </div>
          </div>
        )}

        {/* Contenido del módulo */}
        {module.content && (
          <div className="prose max-w-none">
            <div dangerouslySetInnerHTML={{ __html: module.content }} />
          </div>
        )}

        {/* Recursos descargables si están disponibles */}
        {module.downloadable_resources && module.downloadable_resources.length > 0 && (
          <div className="border-t pt-6">
            <h4 className="text-lg font-semibold mb-4">Recursos Descargables</h4>
            <div className="space-y-3">
              {module.downloadable_resources.map((resource, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <Download className="h-5 w-5 text-blue-600" />
                    <div>
                      <p className="font-medium">{resource.title}</p>
                      <p className="text-sm text-gray-600">{resource.type}</p>
                    </div>
                  </div>
                  <a 
                    href={resource.url} 
                    download
                    className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                  >
                    Descargar
                  </a>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
