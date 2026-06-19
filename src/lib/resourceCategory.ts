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
  gradient: string; // clases para bg-gradient-to-r
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

const STYLES: Record<string, ResourceStyle> = {
  ventas: { label: 'Ventas', gradient: 'from-fuchsia-500 to-purple-600', Icon: TrendingUp },
  marketing: { label: 'Marketing', gradient: 'from-sky-500 to-blue-600', Icon: Megaphone },
  gestion: { label: 'Gestión', gradient: 'from-indigo-500 to-violet-600', Icon: Briefcase },
  liderazgo: { label: 'Liderazgo', gradient: 'from-amber-500 to-orange-600', Icon: Users },
  atencion: { label: 'Atención', gradient: 'from-rose-500 to-pink-600', Icon: HeartHandshake },
  impulso: { label: 'Impulso', gradient: 'from-lime-500 to-neutral-900', Icon: Sparkles },
  otros: { label: 'Recursos', gradient: 'from-slate-500 to-slate-700', Icon: FileText },
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
