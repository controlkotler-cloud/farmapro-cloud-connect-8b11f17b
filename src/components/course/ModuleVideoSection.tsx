
import { Button } from '@/components/ui/button';
import { Play, ExternalLink } from 'lucide-react';

interface ModuleVideoSectionProps {
  videoUrl: string;
}

type Embed =
  | { kind: 'iframe'; src: string }
  | { kind: 'file'; src: string }
  | { kind: 'link'; src: string };

/**
 * Convierte la URL guardada en `module.video_url` en algo reproducible dentro
 * del portal. Soporta YouTube, Vimeo, Google Drive (archivo compartido "con
 * enlace") y ficheros mp4/webm directos. Cualquier otra cosa se abre fuera.
 */
export const resolveVideoEmbed = (raw: string): Embed => {
  const url = raw.trim();
  let u: URL;
  try {
    u = new URL(url);
  } catch {
    return { kind: 'link', src: url };
  }
  const host = u.hostname.replace(/^www\./, '');

  // YouTube: watch?v=ID · youtu.be/ID · /embed/ID · /shorts/ID
  if (host === 'youtube.com' || host === 'youtu.be' || host === 'youtube-nocookie.com') {
    let id = '';
    if (host === 'youtu.be') id = u.pathname.slice(1).split('/')[0];
    else if (u.searchParams.get('v')) id = u.searchParams.get('v') ?? '';
    else {
      const m = u.pathname.match(/\/(embed|shorts|live)\/([A-Za-z0-9_-]{6,})/);
      if (m) id = m[2];
    }
    if (id) return { kind: 'iframe', src: `https://www.youtube-nocookie.com/embed/${id}?rel=0&modestbranding=1` };
  }

  // Vimeo: vimeo.com/ID · vimeo.com/ID/HASH (enlace privado) · player.vimeo.com/video/ID
  if (host === 'vimeo.com' || host === 'player.vimeo.com') {
    const m = u.pathname.match(/\/(?:video\/)?(\d+)(?:\/([a-f0-9]+))?/);
    if (m) {
      const hash = m[2] ? `?h=${m[2]}` : '';
      return { kind: 'iframe', src: `https://player.vimeo.com/video/${m[1]}${hash}` };
    }
  }

  // Google Drive: drive.google.com/file/d/ID/view → /preview
  if (host === 'drive.google.com') {
    const m = u.pathname.match(/\/file\/d\/([^/]+)/);
    const id = m?.[1] ?? u.searchParams.get('id');
    if (id) return { kind: 'iframe', src: `https://drive.google.com/file/d/${id}/preview` };
  }

  // Fichero directo (Supabase Storage, CDN…)
  if (/\.(mp4|webm|m4v|mov)(\?|$)/i.test(u.pathname + u.search)) {
    return { kind: 'file', src: url };
  }

  return { kind: 'link', src: url };
};

export const ModuleVideoSection = ({ videoUrl }: ModuleVideoSectionProps) => {
  const embed = resolveVideoEmbed(videoUrl);

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

      {embed.kind === 'iframe' && (
        <div className="aspect-video overflow-hidden rounded-lg border border-brand/20 bg-black shadow-sm">
          <iframe
            src={embed.src}
            title="Vídeo del módulo"
            className="h-full w-full"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; fullscreen"
            allowFullScreen
            loading="lazy"
            referrerPolicy="strict-origin-when-cross-origin"
          />
        </div>
      )}

      {embed.kind === 'file' && (
        <div className="aspect-video overflow-hidden rounded-lg border border-brand/20 bg-black shadow-sm">
          <video
            src={embed.src}
            controls
            playsInline
            preload="metadata"
            controlsList="nodownload"
            className="h-full w-full"
          />
        </div>
      )}

      {embed.kind === 'link' && (
        <div className="bg-brand-soft rounded-lg p-6 border border-brand/20">
          <div className="aspect-video bg-white rounded-lg border-2 border-dashed border-brand/30 flex items-center justify-center shadow-sm">
            <div className="text-center">
              <div className="p-4 bg-brand-soft rounded-full mx-auto mb-4 w-fit">
                <Play className="h-8 w-8 text-brand-dark" />
              </div>
              <p className="text-foreground mb-4 font-medium">Contenido audiovisual disponible</p>
              <p className="text-sm text-muted-foreground mb-4">Accede al vídeo explicativo de este módulo</p>
              <Button asChild variant="default" className="bg-primary hover:bg-primary/90">
                <a href={embed.src} target="_blank" rel="noopener noreferrer">
                  <ExternalLink className="h-4 w-4 mr-2" />
                  Ver vídeo
                </a>
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
