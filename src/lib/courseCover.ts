import {
  TrendingUp,
  Megaphone,
  Briefcase,
  Users,
  HeartHandshake,
  Headset,
  Monitor,
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
// Color plano (sin gradiente) tomado de la paleta de marca; la paleta "botica"
// (miel/terracota/salvia/ciruela) está reservada para diferenciar categorías.
const COVERS: Record<string, CourseCover> = {
  ventas: { gradient: 'bg-brand', label: 'Ventas', Icon: TrendingUp },
  marketing: { gradient: 'bg-terracota', label: 'Marketing', Icon: Megaphone },
  gestion: { gradient: 'bg-ciruela', label: 'Gestión', Icon: Briefcase },
  liderazgo: { gradient: 'bg-miel', label: 'Liderazgo', Icon: Users },
  atencion: { gradient: 'bg-salvia', label: 'Atención', Icon: HeartHandshake },
  atencion_cliente: { gradient: 'bg-brand-dark', label: 'Atención al cliente', Icon: Headset },
  tecnologia: { gradient: 'bg-terracota', label: 'Tecnología', Icon: Monitor },
  otros: { gradient: 'bg-brand-dark', label: 'Formación', Icon: Sparkles },
};

export const getCourseCover = (category?: string | null): CourseCover =>
  (category && COVERS[category]) || COVERS.otros;
