
import { Button } from '@/components/ui/button';
import { Play, ExternalLink } from 'lucide-react';

interface ModuleVideoSectionProps {
  videoUrl: string;
}

export const ModuleVideoSection = ({ videoUrl }: ModuleVideoSectionProps) => {
  return (
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
              <a href={videoUrl} target="_blank" rel="noopener noreferrer">
                <ExternalLink className="h-4 w-4 mr-2" />
                ▶️ Ver Video
              </a>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};
