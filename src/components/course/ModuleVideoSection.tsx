import { Play } from 'lucide-react';
import { VideoEmbed } from '@/components/media/VideoEmbed';

interface ModuleVideoSectionProps {
  videoUrl: string;
}

/** Vídeo de un módulo de curso, con su cabecera. El reproductor es VideoEmbed. */
export const ModuleVideoSection = ({ videoUrl }: ModuleVideoSectionProps) => {
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3 mb-4">
        <div className="p-2 bg-brand-soft rounded-lg">
          <Play className="h-5 w-5 text-brand-dark" />
        </div>
        <h4 className="text-lg font-semibold text-foreground">
          Vídeo del módulo
        </h4>
      </div>
      <VideoEmbed url={videoUrl} title="Ver el vídeo del módulo" />
    </div>
  );
};
