import {
  TrendingUp,
  Megaphone,
  Briefcase,
  Users,
  Headset,
  Monitor,
  Sparkles,
  type LucideIcon,
} from 'lucide-react';
import { getCategoryColor } from './categoryColors';

export interface CourseCover {
  bg: string; // color plano de fondo (token sólido de la materia)
  onSolid: string; // color de texto/icono legible encima de `bg`
  label: string;
  Icon: LucideIcon;
}

// Portada por categoría: color + icono + etiqueta, para que cada curso se
// distinga de un vistazo aunque no tenga foto. Si el curso tiene thumbnail_url
// / featured_image_url, esa imagen tiene prioridad sobre esta portada.
// El color sale de la tabla única de materias (src/lib/categoryColors.ts).
const META: Record<string, { label: string; Icon: LucideIcon }> = {
  ventas: { label: 'Ventas', Icon: TrendingUp },
  marketing: { label: 'Marketing', Icon: Megaphone },
  gestion: { label: 'Gestión', Icon: Briefcase },
  liderazgo: { label: 'Liderazgo', Icon: Users },
  atencion_cliente: { label: 'Atención al cliente', Icon: Headset },
  tecnologia: { label: 'Tecnología', Icon: Monitor },
  otros: { label: 'Formación', Icon: Sparkles },
};

export const getCourseCover = (category?: string | null): CourseCover => {
  const key = (category && META[category]) ? category : 'otros';
  const meta = META[key];
  const color = getCategoryColor(key);
  return { bg: color.solid, onSolid: color.onSolid, label: meta.label, Icon: meta.Icon };
};
