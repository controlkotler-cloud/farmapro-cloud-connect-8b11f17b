import {
  Award,
  CalendarCheck,
  Crown,
  Flame,
  Heart,
  Layers,
  Sparkles,
  Star,
  ThumbsUp,
  TrendingUp,
  Trophy,
  UserPlus,
  Users,
  type LucideIcon,
} from 'lucide-react';

export const BADGE_ICONS: Record<string, LucideIcon> = {
  Flame,
  Star,
  Sparkles,
  Layers,
  Crown,
  ThumbsUp,
  Heart,
  Users,
  UserPlus,
  CalendarCheck,
  TrendingUp,
  Trophy,
  Award,
};

export const MEDAL_COLORS: Record<
  string,
  { outer: string; inner: string; symbol: string }
> = {
  formacion: { outer: 'bg-brand-soft', inner: 'bg-brand', symbol: 'text-foreground' },
  constancia: { outer: 'bg-miel-soft', inner: 'bg-miel', symbol: 'text-foreground' },
  comunidad: { outer: 'bg-terracota-soft', inner: 'bg-terracota', symbol: 'text-white' },
  especial: { outer: 'bg-ciruela-soft', inner: 'bg-ciruela', symbol: 'text-white' },
};

export const BadgeMedal = ({
  icon,
  category,
  earned,
}: {
  icon: string;
  category: string;
  earned: boolean;
}) => {
  const Icon = BADGE_ICONS[icon] ?? Award;
  const colors = earned ? MEDAL_COLORS[category] ?? MEDAL_COLORS.formacion : null;

  return (
    <div
      className={`relative flex h-[72px] w-[72px] items-center justify-center rounded-full ${
        earned ? colors?.outer : 'bg-muted'
      }`}
    >
      <div
        className={`flex h-[54px] w-[54px] items-center justify-center rounded-full ${
          earned ? colors?.inner : 'bg-muted-foreground'
        }`}
      >
        <Icon
          size={24}
          strokeWidth={2}
          className={earned ? colors?.symbol : 'text-white'}
        />
      </div>
    </div>
  );
};
