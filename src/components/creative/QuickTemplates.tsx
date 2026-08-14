import { ContentType } from '@/hooks/useCreativeChat';
import { getSeasonal } from './seasonal';

// Ideas rápidas = temas del mes (calendario estacional) + clásicos evergreen.
// Antes eran listas fijas de verano ("Protección solar primavera") que en
// otoño seguían proponiendo cremas solares.
const S = getSeasonal();

const TEMPLATES: Record<ContentType, string[]> = {
  'instagram-post': [
    S.temas[0],
    S.temas[1],
    'Consejo farmacéutico del día',
    'Presentación del equipo',
  ],
  'reel-script': [
    '¿Sabías que...? (dato curioso)',
    'Mito vs Realidad',
    'Un día en la farmacia',
    'Respondo vuestra pregunta',
  ],
  carousel: [
    S.temas[2],
    'Rutina facial en 5 pasos',
    'Top 5 productos del mes',
    'Diferencias entre productos',
  ],
  'google-business': [
    'Horario de guardias actualizado',
    'Nuevo servicio disponible',
    'Oferta de la semana',
  ],
  blog: [
    S.temas[0],
    'Cómo elegir tu crema hidratante',
    'Servicios de tu farmacia que no conocías',
  ],
  promotion: [
    S.temas[3],
    'Ofertas dermocosmética',
    'Consulta gratuita nutrición',
  ],
  whatsapp: [
    'Recordatorio medicación',
    'Nuevo servicio disponible',
    'Promoción semanal',
  ],
  'responder-resena': [],
  imagen: [],
};

interface QuickTemplatesProps {
  contentType: ContentType;
  onSelect: (template: string) => void;
}

export const QuickTemplates = ({ contentType, onSelect }: QuickTemplatesProps) => {
  const templates = TEMPLATES[contentType] || [];
  if (!templates.length) return null;

  return (
    <div className="space-y-2">
      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Ideas rápidas</p>
      <div className="flex flex-wrap gap-2">
        {templates.map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => onSelect(t)}
            className="text-xs px-3 py-1.5 rounded-full bg-ciruela-soft text-ciruela ring-1 ring-ciruela/30 hover:bg-ciruela-soft/70 transition-colors active:scale-95"
          >
            {t}
          </button>
        ))}
      </div>
    </div>
  );
};
