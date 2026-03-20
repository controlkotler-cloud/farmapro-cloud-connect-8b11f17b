import { ContentType } from '@/hooks/useCreativeChat';

const TEMPLATES: Record<ContentType, string[]> = {
  'instagram-post': [
    'Protección solar primavera',
    'Nuevo producto en la farmacia',
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
    'Rutina facial en 5 pasos',
    'Top 5 productos del mes',
    'Guía de protección solar',
    'Diferencias entre productos',
  ],
  'google-business': [
    'Horario de guardias actualizado',
    'Nuevo servicio disponible',
    'Oferta de la semana',
  ],
  blog: [
    'Guía de protección solar 2026',
    'Cómo elegir tu crema hidratante',
    'Servicios de tu farmacia que no conocías',
  ],
  promotion: [
    'Campaña protección solar',
    'Ofertas dermocosméticos',
    'Consulta gratuita nutrición',
  ],
  whatsapp: [
    'Recordatorio medicación',
    'Nuevo servicio disponible',
    'Promoción semanal',
  ],
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
      <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Ideas rápidas</p>
      <div className="flex flex-wrap gap-2">
        {templates.map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => onSelect(t)}
            className="text-xs px-3 py-1.5 rounded-full bg-green-50 text-green-700 ring-1 ring-green-200 hover:bg-green-100 transition-colors active:scale-95"
          >
            {t}
          </button>
        ))}
      </div>
    </div>
  );
};
