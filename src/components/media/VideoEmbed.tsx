import { Play, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { resolveVideoEmbed } from '@/lib/videoEmbed';

interface VideoEmbedProps {
  /** URL del vídeo: YouTube, Vimeo, Google Drive o fichero mp4 directo. */
  url: string;
  /** Texto del title del iframe y del botón de respaldo. */
  title?: string;
  /** Clase extra para el contenedor (bordes, sombra, márgenes). */
  className?: string;
}

/**
 * Reproductor de vídeo del portal, sin cabecera ni texto propio.
 * Úsalo en cualquier página que necesite un vídeo; el caso de los módulos de
 * curso tiene su propia envoltura en ModuleVideoSection.
 */
export const VideoEmbed = ({ url, title = 'Vídeo', className = '' }: VideoEmbedProps) => {
  const embed = resolveVideoEmbed(url);
  const frame = `mx-auto w-full aspect-video overflow-hidden rounded-lg border border-brand/20 bg-black shadow-sm ${className}`;
  /**
   * Tope de altura: en móvil apaisado un 16:9 a ancho completo pide más alto que
   * la pantalla (812 de ancho → 457 de alto sobre 375 disponibles) y el vídeo se
   * sale del viewport. Limitando el ANCHO en función del alto de pantalla, el
   * bloque sigue siendo 16:9 y nunca pasa de 78svh.
   */
  const frameStyle = { maxWidth: 'calc(78svh * 16 / 9)' };

  if (embed.kind === 'iframe') {
    return (
      <div className={frame} style={frameStyle}>
        <iframe
          src={embed.src}
          title={title}
          className="h-full w-full"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; fullscreen"
          allowFullScreen
          loading="lazy"
          referrerPolicy="strict-origin-when-cross-origin"
        />
      </div>
    );
  }

  if (embed.kind === 'file') {
    return (
      <div className={frame} style={frameStyle}>
        <video
          src={embed.src}
          controls
          playsInline
          preload="metadata"
          controlsList="nodownload"
          className="h-full w-full"
        />
      </div>
    );
  }

  return (
    <div className={`rounded-lg border border-brand/20 bg-brand-soft p-6 text-center ${className}`}>
      <Button asChild variant="default">
        <a href={embed.src} target="_blank" rel="noopener noreferrer">
          <Play className="mr-2 h-4 w-4" />
          {title}
          <ExternalLink className="ml-2 h-4 w-4" />
        </a>
      </Button>
    </div>
  );
};
