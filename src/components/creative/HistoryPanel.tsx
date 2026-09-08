import { useState } from 'react';
import { ChevronDown, Copy, History, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { CONTENT_TYPES } from '@/hooks/useCreativeChat';
import type { HistoryImage, HistoryText } from '@/hooks/useIAFarmaHistory';

interface HistoryPanelProps {
  texts: HistoryText[];
  images: HistoryImage[];
  onDeleteText: (id: string) => void;
}

const labelFor = (type: string) => CONTENT_TYPES.find((t) => t.id === type)?.label ?? type;

const formatDate = (iso: string) =>
  new Date(iso).toLocaleString('es-ES', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });

/**
 * Lo último generado en IAFarma, para que al volver no se pierda nada
 * (petición de Francesc 08-09-2026). Volumen contenido: 2 textos al mes en
 * Gratis y una docena de imágenes en Plus; se muestran 12 textos y 8
 * imágenes, la BD poda a 50 por usuario.
 */
export const HistoryPanel = ({ texts, images, onDeleteText }: HistoryPanelProps) => {
  const [open, setOpen] = useState(true);
  const [expanded, setExpanded] = useState<string | null>(null);
  const { toast } = useToast();

  if (texts.length === 0 && images.length === 0) return null;

  const copy = async (content: string) => {
    await navigator.clipboard.writeText(content);
    toast({ title: 'Copiado', description: 'El texto está en el portapapeles.' });
  };

  return (
    <section className="rounded-lg ring-1 ring-border bg-card" aria-labelledby="iafarma-historial">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        className="w-full flex items-center justify-between px-5 py-4 text-left"
      >
        <span className="flex items-center gap-2">
          <History className="h-5 w-5 text-ciruela" />
          <span id="iafarma-historial" className="font-semibold text-foreground">Lo último que has generado</span>
          <span className="text-sm text-muted-foreground tabular-nums">
            ({texts.length} {texts.length === 1 ? 'texto' : 'textos'}{images.length > 0 ? `, ${images.length} ${images.length === 1 ? 'imagen' : 'imágenes'}` : ''})
          </span>
        </span>
        <ChevronDown className={`h-5 w-5 text-muted-foreground transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <div className="px-5 pb-5 space-y-5">
          {texts.length > 0 && (
            <ul className="divide-y divide-border">
              {texts.map((t) => {
                const isOpen = expanded === t.id;
                return (
                  <li key={t.id} className="py-3">
                    <div className="flex items-start gap-3">
                      <button
                        type="button"
                        onClick={() => setExpanded(isOpen ? null : t.id)}
                        aria-expanded={isOpen}
                        className="flex-1 text-left min-w-0"
                      >
                        <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
                          <span className="rounded-full bg-ciruela-soft px-2 py-0.5 font-semibold text-ciruela">{labelFor(t.contentType)}</span>
                          <span className="tabular-nums">{formatDate(t.createdAt)}</span>
                        </div>
                        <p className={`text-sm text-foreground ${isOpen ? 'whitespace-pre-wrap' : 'line-clamp-2'}`}>{t.output}</p>
                      </button>
                      <div className="flex shrink-0 gap-1">
                        <Button variant="ghost" size="icon" aria-label="Copiar texto" onClick={() => copy(t.output)}>
                          <Copy className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" aria-label="Borrar del historial" className="text-muted-foreground hover:text-destructive" onClick={() => onDeleteText(t.id)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}

          {images.length > 0 && (
            <div>
              <p className="text-sm font-medium text-foreground mb-2">Imágenes</p>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {images.map((img) => (
                  <figure key={img.id} className="rounded-md overflow-hidden ring-1 ring-border bg-secondary">
                    {img.url ? (
                      <a href={img.url} target="_blank" rel="noopener noreferrer" aria-label="Abrir imagen">
                        <img src={img.url} alt={img.prompt ?? 'Imagen generada con IAFarma'} className="aspect-square w-full object-cover" loading="lazy" />
                      </a>
                    ) : (
                      <div className="aspect-square w-full flex items-center justify-center text-xs text-muted-foreground p-2">No disponible</div>
                    )}
                    <figcaption className="px-2 py-1 text-[11px] text-muted-foreground tabular-nums">{formatDate(img.createdAt)}</figcaption>
                  </figure>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </section>
  );
};
