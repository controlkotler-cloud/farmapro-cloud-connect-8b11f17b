import {
  TrendingUp,
  Megaphone,
  Briefcase,
  Users,
  HeartHandshake,
  Sparkles,
  FileText,
  FileSpreadsheet,
  Image,
  Video,
  Link as LinkIcon,
  LayoutTemplate,
  ListChecks,
  Calculator,
  BookOpen,
  ClipboardList,
  Wrench,
  BookMarked,
  type LucideIcon,
} from 'lucide-react';

export interface ResourceStyle {
  label: string;
  bg: string; // fondo -soft del token de marca
  text: string; // texto en el tono DEFAULT del mismo token
  Icon: LucideIcon;
}

// Categorías reales del enum resource_category (+ 'impulso' que añadimos).
export const RESOURCE_CATEGORIES = [
  'ventas',
  'marketing',
  'gestion',
  'liderazgo',
  'atencion',
  'impulso',
  'otros',
] as const;

// Paleta reducida a los tokens de marca (miel/terracota/salvia/ciruela + brand).
// Con 6 categorías reales + 'otros' y solo 5 tokens disponibles, 'impulso' reutiliza
// terracota (ya usado por 'ventas'): ambas categorías rara vez coinciden en el mismo
// filtro visible, así que el choque es mínimo. 'otros' queda neutro (muted), sin acento.
const STYLES: Record<string, ResourceStyle> = {
  ventas: { label: 'Ventas', bg: 'bg-terracota-soft', text: 'text-terracota', Icon: TrendingUp },
  marketing: { label: 'Marketing', bg: 'bg-miel-soft', text: 'text-miel', Icon: Megaphone },
  gestion: { label: 'Gestión', bg: 'bg-salvia-soft', text: 'text-salvia', Icon: Briefcase },
  liderazgo: { label: 'Liderazgo', bg: 'bg-ciruela-soft', text: 'text-ciruela', Icon: Users },
  atencion: { label: 'Atención', bg: 'bg-brand-soft', text: 'text-brand-dark', Icon: HeartHandshake },
  impulso: { label: 'Impulso', bg: 'bg-terracota-soft', text: 'text-terracota', Icon: Sparkles },
  otros: { label: 'Recursos', bg: 'bg-muted', text: 'text-muted-foreground', Icon: FileText },
};

export const getResourceStyle = (category?: string | null): ResourceStyle =>
  (category && STYLES[category]) || STYLES.otros;

// Icono según el formato/extensión del archivo.
export const getFormatIcon = (format?: string | null): LucideIcon => {
  switch ((format || '').toLowerCase()) {
    case 'xls':
    case 'xlsx':
      return FileSpreadsheet;
    case 'video':
      return Video;
    case 'url':
      return LinkIcon;
    case 'infografia':
    case 'png':
    case 'jpg':
      return Image;
    default:
      return FileText; // pdf, docs, etc.
  }
};

export interface ResourceTypeStyle {
  label: string;
  Icon: LucideIcon;
}

// Tipos reales del enum resource_type. El "tipo" es el QUÉ ES (plantilla,
// checklist, calculadora…); el "formato" es CÓMO viene (pdf, xls, url…).
export const RESOURCE_TYPES = [
  'pdf',
  'video',
  'infografia',
  'plantilla',
  'guia',
  'protocolo',
  'calculadora',
  'checklist',
  'manual',
  'herramienta',
  'otro',
] as const;

const TYPE_STYLES: Record<string, ResourceTypeStyle> = {
  pdf: { label: 'PDF', Icon: FileText },
  video: { label: 'Vídeo', Icon: Video },
  infografia: { label: 'Infografía', Icon: Image },
  plantilla: { label: 'Plantilla', Icon: LayoutTemplate },
  guia: { label: 'Guía', Icon: BookOpen },
  protocolo: { label: 'Protocolo', Icon: ClipboardList },
  calculadora: { label: 'Calculadora', Icon: Calculator },
  checklist: { label: 'Checklist', Icon: ListChecks },
  manual: { label: 'Manual', Icon: BookMarked },
  herramienta: { label: 'Herramienta', Icon: Wrench },
  otro: { label: 'Recurso', Icon: FileText },
};

export const getResourceTypeStyle = (type?: string | null): ResourceTypeStyle =>
  (type && TYPE_STYLES[type]) || TYPE_STYLES.otro;

export const getResourceTypeLabel = (type?: string | null): string =>
  getResourceTypeStyle(type).label;
