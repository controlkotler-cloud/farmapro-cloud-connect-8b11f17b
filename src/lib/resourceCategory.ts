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
  ventas: { label: 'Ventas', gradient: 'from-emerald-500 to-green-600', Icon: TrendingUp },
  marketing: { label: 'Marketing', gradient: 'from-sky-500 to-blue-600', Icon: Megaphone },
  gestion: { label: 'Gestión', gradient: 'from-indigo-500 to-violet-600', Icon: Briefcase },
  liderazgo: { label: 'Liderazgo', gradient: 'from-amber-500 to-orange-600', Icon: Users },
  atencion: { label: 'Atención', gradient: 'from-rose-500 to-pink-600', Icon: HeartHandshake },
  impulso: { label: 'Impulso', gradient: 'from-fuchsia-500 to-purple-600', Icon: Sparkles },
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
