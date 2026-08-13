import {
  TrendingUp,
  Megaphone,
  Briefcase,
  Users,
  HeartHandshake,
  Sparkles,
  Wallet,
  Smartphone,
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
import { getCategoryColor } from './categoryColors';

export interface ResourceStyle {
  label: string;
  bg: string; // fondo -soft del token de marca
  text: string; // texto en el tono DEFAULT del mismo token
  accent: string; // fondo sólido del token (filo superior de la tarjeta)
  Icon: LucideIcon;
}

// Las 9 categorías reales del enum resource_category en Postgres (verificado en BD).
export const RESOURCE_CATEGORIES = [
  'ventas',
  'marketing',
  'gestion',
  'liderazgo',
  'atencion',
  'finanzas',
  'digital',
  'impulso',
  'otros',
] as const;

// El color ya NO se decide aquí: sale de la tabla única de materias
// (src/lib/categoryColors.ts), de modo que "Ventas" o "Gestión" tienen el mismo
// tono en Recursos que en Formación. Ahí también se documenta la reutilización
// deliberada de tono entre materias hermanas (digital~marketing, impulso~liderazgo,
// finanzas con el verde oscuro de marca). 'otros' queda neutro (muted).
const META: Record<string, { label: string; Icon: LucideIcon }> = {
  ventas: { label: 'Ventas', Icon: TrendingUp },
  marketing: { label: 'Marketing', Icon: Megaphone },
  gestion: { label: 'Gestión', Icon: Briefcase },
  liderazgo: { label: 'Liderazgo', Icon: Users },
  atencion: { label: 'Atención', Icon: HeartHandshake },
  finanzas: { label: 'Finanzas', Icon: Wallet },
  digital: { label: 'Digital', Icon: Smartphone },
  impulso: { label: 'Impulso', Icon: Sparkles },
  otros: { label: 'Recursos', Icon: FileText },
};

export const getResourceStyle = (category?: string | null): ResourceStyle => {
  const key = (category && META[category]) ? category : 'otros';
  const meta = META[key];
  const color = getCategoryColor(key);
  return {
    label: meta.label,
    bg: color.soft,
    text: color.text,
    accent: key === 'otros' ? 'bg-muted-foreground/40' : color.solid,
    Icon: meta.Icon,
  };
};

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
