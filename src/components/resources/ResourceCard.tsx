import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Download, Lock } from 'lucide-react';
import { getResourceStyle, getFormatIcon, getResourceTypeStyle } from '@/lib/resourceCategory';

interface Resource {
  id: string;
  title: string;
  description: string;
  category: string;
  type: string;
  file_url: string;
  format: string;
  is_premium: boolean;
  created_at: string;
}

interface ResourceCardProps {
  resource: Resource;
  index: number;
  onDownload: (resource: Resource) => void;
}

// Tarjeta de recurso: eyebrow de categoría (acento propio del token), candado
// premium como chip de marca (nunca gris triste) y la primera de cada grid
// (index 0) destacada con el lavado salvia del canon.
export const ResourceCard = ({ resource, index, onDownload }: ResourceCardProps) => {
  const style = getResourceStyle(resource.category);
  const typeStyle = getResourceTypeStyle(resource.type);
  const FormatIcon = getFormatIcon(resource.format);
  const featured = index === 0;

  return (
    <Card
      className={`flex h-full flex-col shadow-soft transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lift ${
        featured ? 'bg-gradient-to-br from-salvia-soft to-card' : ''
      }`}
    >
      <CardContent className="flex h-full flex-col p-6">
        <div className="mb-3 flex items-center justify-between gap-2">
          <span
            className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[10.5px] font-extrabold uppercase tracking-[0.12em] ${style.bg} ${style.text}`}
          >
            {style.label}
          </span>
          {resource.is_premium ? (
            <span className="inline-flex items-center gap-1 rounded-full bg-ciruela-soft px-2.5 py-0.5 text-[10.5px] font-extrabold uppercase tracking-[0.12em] text-ciruela">
              <Lock className="h-3 w-3" />
              Premium
            </span>
          ) : (
            <span className="inline-flex items-center rounded-full bg-muted px-2.5 py-0.5 text-[10.5px] font-extrabold uppercase tracking-[0.12em] text-muted-foreground">
              Gratis
            </span>
          )}
        </div>

        <h2 className="text-base font-extrabold tracking-tight text-foreground [text-wrap:balance] line-clamp-2">
          {resource.title}
        </h2>
        <p className="mt-1.5 line-clamp-3 text-sm text-muted-foreground">{resource.description}</p>

        <div className="mt-4 flex flex-1 items-end justify-between gap-3">
          <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-muted-foreground">
            <typeStyle.Icon className="h-3.5 w-3.5" />
            {typeStyle.label}
            <span aria-hidden="true">·</span>
            <FormatIcon className="h-3.5 w-3.5" />
            {(resource.format || 'pdf').toUpperCase()}
          </span>
          <Button
            onClick={() => onDownload(resource)}
            className="flex-none gap-2 rounded-full bg-brand-dark px-4 text-sm font-bold text-white shadow-soft transition-all hover:-translate-y-0.5 hover:bg-brand-dark hover:shadow-lift"
          >
            <Download className="h-4 w-4" />
            Descargar
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};
