import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Clock, 
  Download, 
  Play, 
  ExternalLink, 
  ChevronLeft, 
  ChevronRight, 
  CheckCircle,
  BookOpen,
  Target,
  Users,
  Lightbulb,
  Star,
  Award
} from 'lucide-react';
import type { CourseModule } from '@/types/course';

interface ModuleContentProps {
  module: CourseModule;
  moduleIndex: number;
  totalModules: number;
  isCompleted: boolean;
  onPrevious: () => void;
  onNext: () => void;
  onComplete: () => void;
  canGoNext: boolean;
  canGoPrevious: boolean;
}

export const ModuleContent = ({ 
  module, 
  moduleIndex, 
  totalModules,
  isCompleted,
  onPrevious,
  onNext,
  onComplete,
  canGoNext,
  canGoPrevious
}: ModuleContentProps) => {
  const getModuleIcon = (index: number) => {
    const icons = [BookOpen, Target, Users, Lightbulb, Star, Award];
    const IconComponent = icons[index % icons.length];
    return <IconComponent className="h-6 w-6" />;
  };

  return (
    <Card className="h-full">
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

      <CardContent className="p-0 h-full">
        <ScrollArea className="h-[60vh] p-6">
          <div className="space-y-8">
            {/* Video del módulo si está disponible */}
            {module.video_url && (
              <div className="space-y-4">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 bg-red-100 rounded-lg">
                    <Play className="h-5 w-5 text-red-600" />
                  </div>
                  <h4 className="text-lg font-semibold text-gray-800">
                    🎬 Video del módulo
                  </h4>
                </div>
                <div className="bg-gradient-to-br from-red-50 to-pink-50 rounded-xl p-6 border border-red-200">
                  <div className="aspect-video bg-white rounded-lg border-2 border-dashed border-red-300 flex items-center justify-center shadow-sm">
                    <div className="text-center">
                      <div className="p-4 bg-red-100 rounded-full mx-auto mb-4 w-fit">
                        <Play className="h-8 w-8 text-red-600" />
                      </div>
                      <p className="text-gray-700 mb-4 font-medium">📹 Contenido audiovisual disponible</p>
                      <p className="text-sm text-gray-600 mb-4">Accede al video explicativo de este módulo</p>
                      <Button asChild variant="default" className="bg-red-600 hover:bg-red-700">
                        <a href={module.video_url} target="_blank" rel="noopener noreferrer">
                          <ExternalLink className="h-4 w-4 mr-2" />
                          ▶️ Ver Video
                        </a>
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Contenido del módulo */}
            {module.content && (
              <div className="space-y-4">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <BookOpen className="h-5 w-5 text-blue-600" />
                  </div>
                  <h4 className="text-lg font-semibold text-gray-800">
                    📚 Contenido del módulo
                  </h4>
                </div>
                <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-6 border border-blue-200">
                  <div 
                    className="prose max-w-none text-gray-700 leading-relaxed"
                    dangerouslySetInnerHTML={{ __html: module.content }}
                    style={{
                      fontSize: '16px',
                      lineHeight: '1.7'
                    }}
                  />
                </div>
              </div>
            )}

            {/* Recursos descargables */}
            {module.downloadable_resources && module.downloadable_resources.length > 0 && (
              <div className="space-y-4">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 bg-green-100 rounded-lg">
                    <Download className="h-5 w-5 text-green-600" />
                  </div>
                  <h4 className="text-lg font-semibold text-gray-800">
                    📥 Recursos Descargables
                  </h4>
                </div>
                <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl p-6 border border-green-200">
                  <div className="grid gap-4">
                    {module.downloadable_resources.map((resource, index) => (
                      <div key={index} className="bg-white rounded-lg p-4 border border-green-200 shadow-sm hover:shadow-md transition-shadow">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-4">
                            <div className="flex-shrink-0 p-2 bg-green-100 rounded-lg">
                              <Download className="h-5 w-5 text-green-600" />
                            </div>
                            <div>
                              <p className="font-medium text-gray-900 flex items-center gap-2">
                                📄 {resource.title}
                              </p>
                              <div className="flex items-center gap-2 mt-1">
                                <span className="text-sm text-gray-600">Formato:</span>
                                <Badge variant="outline" className="text-xs">
                                  {resource.type}
                                </Badge>
                              </div>
                            </div>
                          </div>
                          <Button asChild variant="outline" size="sm" className="shrink-0">
                            <a 
                              href={resource.url} 
                              download
                              className="flex items-center gap-2"
                            >
                              <Download className="h-4 w-4" />
                              Descargar
                            </a>
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Mensaje cuando no hay contenido adicional */}
            {!module.content && !module.video_url && (!module.downloadable_resources || module.downloadable_resources.length === 0) && (
              <div className="text-center py-12 bg-gray-50 rounded-xl border-2 border-dashed border-gray-300">
                <div className="p-4 bg-gray-100 rounded-full mx-auto mb-4 w-fit">
                  <Clock className="h-8 w-8 text-gray-500" />
                </div>
                <p className="text-gray-500 text-lg">⏳ El contenido de este módulo estará disponible próximamente.</p>
                <p className="text-gray-400 text-sm mt-2">Mantente atento a las actualizaciones</p>
              </div>
            )}
          </div>
        </ScrollArea>

        {/* Navegación y completar módulo */}
        <div className="border-t bg-gray-50 p-6">
          <div className="flex justify-between items-center">
            <Button 
              onClick={onPrevious}
              variant="outline"
              disabled={!canGoPrevious}
              className="flex items-center gap-2"
            >
              <ChevronLeft className="h-4 w-4" />
              Anterior
            </Button>

            <div className="flex items-center gap-3">
              {!isCompleted && (
                <Button 
                  onClick={onComplete}
                  className="bg-green-600 hover:bg-green-700 flex items-center gap-2"
                >
                  <CheckCircle className="h-4 w-4" />
                  Completar módulo
                </Button>
              )}
              {isCompleted && (
                <div className="flex items-center gap-2 text-green-600 font-medium">
                  <CheckCircle className="h-4 w-4" />
                  Módulo completado
                </div>
              )}
            </div>

            <Button 
              onClick={onNext}
              variant="outline"
              disabled={!canGoNext}
              className="flex items-center gap-2"
            >
              Siguiente
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
