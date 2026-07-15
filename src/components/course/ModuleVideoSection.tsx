
import { Button } from '@/components/ui/button';
import { Play, ExternalLink } from 'lucide-react';

interface ModuleVideoSectionProps {
  videoUrl: string;
}

export const ModuleVideoSection = ({ videoUrl }: ModuleVideoSectionProps) => {
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3 mb-4">
        <div className="p-2 bg-brand-soft rounded-lg">
          <Play className="h-5 w-5 text-brand-dark" />
        </div>
        <h4 className="text-lg font-semibold text-foreground">
          🎬 Video del módulo
        </h4>
      </div>
      <div className="bg-brand-soft rounded-xl p-6 border border-brand/20">
        <div className="aspect-video bg-white rounded-lg border-2 border-dashed border-brand/30 flex items-center justify-center shadow-sm">
          <div className="text-center">
            <div className="p-4 bg-brand-soft rounded-full mx-auto mb-4 w-fit">
              <Play className="h-8 w-8 text-brand-dark" />
            </div>
            <p className="text-foreground mb-4 font-medium">📹 Contenido audiovisual disponible</p>
            <p className="text-sm text-muted-foreground mb-4">Accede al video explicativo de este módulo</p>
            <Button asChild variant="default" className="bg-primary hover:bg-primary/90">
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
