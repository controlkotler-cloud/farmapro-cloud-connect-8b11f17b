import { Link } from 'react-router-dom';
import { Flame } from 'lucide-react';
import { getLevelInfo } from '@/services/pointsService';
import type { HighlightCourse } from '@/hooks/useDashboardHighlights';

interface DashboardHeroProps {
  fullName: string | null;
  streak: number;
  totalPoints: number;
  course: HighlightCourse | null;
}

const greetingByHour = () => {
  const h = new Date().getHours();
  if (h < 7) return 'Buenas noches';
  if (h < 14) return 'Buenos días';
  if (h < 21) return 'Buenas tardes';
  return 'Buenas noches';
};

// La firma farmapro: una intención del día en Fraunces itálica.
// Rotación determinista por día del año (sin estado, sin sorpresas).
const FOCUS_PHRASES = [
  'cuidar el mostrador.',
  'darle vida al escaparate.',
  'ese consejo que marca la diferencia.',
  'mimar a tu equipo.',
  'la categoría que se te resiste.',
  'convertir la espera en confianza.',
  'la rebotica de tu farmacia.',
];

const dayOfYear = () => {
  const now = new Date();
  const start = new Date(now.getFullYear(), 0, 0);
  return Math.floor((now.getTime() - start.getTime()) / 86400000);
};

export const DashboardHero = ({ fullName, streak, totalPoints, course }: DashboardHeroProps) => {
  const firstName = (fullName || 'colega').split(' ')[0];
  const phrase = FOCUS_PHRASES[dayOfYear() % FOCUS_PHRASES.length];
  const level = getLevelInfo(totalPoints);
  const continueTarget = course ? `/curso/${course.slug}` : '/formacion';

  return (
    <div className="flex flex-wrap items-end justify-between gap-x-6 gap-y-4">
      <div className="min-w-0">
        <h1 className="text-2xl font-extrabold tracking-tight text-foreground sm:text-3xl [text-wrap:balance]">
          {greetingByHour()}, {firstName}. Hoy toca <em className="italic-display">{phrase}</em>
        </h1>
        <p className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-muted-foreground">
          <span>
            {level.icon} {level.name} · {totalPoints} puntos
          </span>
          {streak >= 2 && (
            <span className="inline-flex items-center gap-1 rounded-full bg-miel-soft px-2.5 py-0.5 text-xs font-bold text-foreground">
              <Flame className="h-3.5 w-3.5 text-miel" />
              {streak} días seguidos
            </span>
          )}
        </p>
      </div>
      <Link
        to={continueTarget}
        className="inline-flex items-center gap-2 rounded-full bg-brand-dark px-5 py-2.5 text-sm font-bold text-white shadow-soft transition-all hover:-translate-y-0.5 hover:shadow-lift"
      >
        {course?.progress != null ? 'Continuar donde lo dejé' : 'Explorar la formación'} →
      </Link>
    </div>
  );
};
