import {
  Sparkles,
  Shuffle,
  TrendingUp,
  Percent,
  Calendar,
  MapPin,
  Heart,
  Instagram,
  Share2,
  Package,
  ShoppingCart,
  Clock,
  Wallet,
  SlidersHorizontal,
  BarChart3,
  LayoutGrid,
  FileText,
  HeartPulse,
  MessageCircle,
  Users,
  Award,
  UserCheck,
  Store,
  UserMinus,
  Eye,
  Smile,
  MessageSquare,
  Monitor,
  FileCheck,
  Compass,
  type LucideIcon,
} from 'lucide-react';
import { getCategoryColor } from '@/lib/categoryColors';
import { getCourseCover } from '@/lib/courseCover';

// Iconos disponibles para la portada dibujada de cada curso (columna cover_icon).
export const COVER_ICONS: Record<string, LucideIcon> = {
  Sparkles,
  Shuffle,
  TrendingUp,
  Percent,
  Calendar,
  MapPin,
  Heart,
  Instagram,
  Share2,
  Package,
  ShoppingCart,
  Clock,
  Wallet,
  SlidersHorizontal,
  BarChart3,
  LayoutGrid,
  FileText,
  HeartPulse,
  MessageCircle,
  Users,
  Award,
  UserCheck,
  Store,
  UserMinus,
  Eye,
  Smile,
  MessageSquare,
  Monitor,
  FileCheck,
  Compass,
};

interface CourseCoverProps {
  category?: string | null;
  concept?: string | null;
  iconName?: string | null;
  className?: string;
  size?: 'sm' | 'md';
}

// Portada por curso dibujada con CSS: fondo suave de la materia, icono gigante
// decorativo y el concepto en tinta (única regla legible en las seis materias).
export const CourseCover = ({ category, concept, iconName, className, size = 'md' }: CourseCoverProps) => {
  const color = getCategoryColor(category);
  const { label, Icon: FallbackIcon } = getCourseCover(category);
  const Icon = (iconName && COVER_ICONS[iconName]) || FallbackIcon;

  const isSm = size === 'sm';

  return (
    <div
      className={`relative flex h-28 items-center overflow-hidden ${isSm ? 'px-2.5' : 'px-3.5'} ${color.soft} ${className ?? ''}`}
    >
      <Icon
        className={`pointer-events-none absolute -right-6 -top-6 opacity-30 ${color.text} ${isSm ? 'h-[96px] w-[96px]' : 'h-[150px] w-[150px]'}`}
        strokeWidth={1.1}
        aria-hidden="true"
      />
      {concept && (
        <span className={`relative font-extrabold leading-none tracking-[-0.045em] text-foreground ${isSm ? 'text-[17px]' : 'text-[27px]'}`}>
          {concept}
        </span>
      )}
      <span
        className={`absolute font-extrabold uppercase tracking-[0.14em] opacity-80 ${color.text} ${isSm ? 'bottom-2 left-2.5 text-[8px]' : 'bottom-2.5 left-3.5 text-[9px]'}`}
      >
        {label}
      </span>
    </div>
  );
};
