import {
  TrendingUp,
  Megaphone,
  Briefcase,
  Users,
  HeartHandshake,
  Sparkles,
  type LucideIcon,
} from 'lucide-react';

export interface CourseCover {
  gradient: string; // clases tailwind para bg-gradient-to-br
  label: string;
  Icon: LucideIcon;
}

// Portada por categoría: color + icono + etiqueta, para que cada curso se
// distinga de un vistazo aunque no tenga foto. Si el curso tiene thumbnail_url
// / featured_image_url, esa imagen tiene prioridad sobre esta portada.
const COVERS: Record<string, CourseCover> = {
  ventas: { gradient: 'from-fuchsia-500 to-purple-600', label: 'Ventas', Icon: TrendingUp },
  marketing: { gradient: 'from-sky-500 to-blue-600', label: 'Marketing', Icon: Megaphone },
  gestion: { gradient: 'from-indigo-500 to-violet-600', label: 'Gestión', Icon: Briefcase },
  liderazgo: { gradient: 'from-amber-500 to-orange-600', label: 'Liderazgo', Icon: Users },
  atencion: { gradient: 'from-rose-500 to-pink-600', label: 'Atención', Icon: HeartHandshake },
  otros: { gradient: 'from-slate-500 to-slate-700', label: 'Formación', Icon: Sparkles },
};

export const getCourseCover = (category?: string | null): CourseCover =>
  (category && COVERS[category]) || COVERS.otros;
