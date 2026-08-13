import { Crown, Medal, Microscope, Pill, Sprout, Stethoscope, type LucideIcon } from 'lucide-react';
import { getLevelInfo } from '@/services/pointsService';

const LEVEL_ICONS: Record<string, LucideIcon> = {
  Sprout,
  Pill,
  Microscope,
  Stethoscope,
  Medal,
  Crown,
};

interface LevelIconProps {
  totalPoints: number;
  className?: string;
}

export const LevelIcon = ({ totalPoints, className }: LevelIconProps) => {
  const level = getLevelInfo(totalPoints);
  const Icon = LEVEL_ICONS[level.icon] ?? Sprout;
  return <Icon strokeWidth={2} className={className} aria-hidden />;
};
