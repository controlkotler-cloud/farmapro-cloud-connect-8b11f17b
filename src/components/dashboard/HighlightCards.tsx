import { Link } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import type {
  HighlightChallenge,
  HighlightCourse,
  HighlightEvent,
  HighlightResource,
  HighlightThread,
} from '@/hooks/useDashboardHighlights';

/**
 * Tarjetas del dashboard según el canon: una tarjeta = un acento de la
 * paleta botica (formación→brand, retos→miel, eventos/foro→terracota,
 * recursos→salvia), eyebrow tipo píldora y CTA como link de texto.
 */

const Eyebrow = ({ className, children }: { className: string; children: React.ReactNode }) => (
  <span
    className={`mb-3 inline-flex rounded-full px-2.5 py-0.5 text-[10.5px] font-extrabold uppercase tracking-[0.12em] ${className}`}
  >
    {children}
  </span>
);

export const FormacionCard = ({ course }: { course: HighlightCourse | null }) => (
  <Card className="bg-gradient-to-br from-brand-soft to-card">
    <CardContent className="p-6">
      <Eyebrow className="bg-brand text-foreground">Formación</Eyebrow>
      <h2 className="text-base font-extrabold tracking-tight text-foreground [text-wrap:balance]">
        {course ? course.title : 'Tu primer curso te espera'}
      </h2>
      {course?.progress != null ? (
        <>
          <div className="mt-4 h-2 overflow-hidden rounded-full border border-border bg-secondary">
            <div
              className="h-full rounded-full bg-brand"
              style={{ width: `${Math.max(course.progress, 4)}%` }}
            />
          </div>
          <div className="mt-3 flex items-center justify-between">
            <Link to={`/curso/${course.slug}`} className="text-sm font-bold text-brand-dark hover:underline">
              Continuar el curso →
            </Link>
            <span className="text-xs text-muted-foreground">{course.progress} %</span>
          </div>
        </>
      ) : (
        <div className="mt-4">
          <Link
            to={course ? `/curso/${course.slug}` : '/formacion'}
            className="text-sm font-bold text-brand-dark hover:underline"
          >
            {course ? 'Empezar este curso →' : 'Ver la formación →'}
          </Link>
        </div>
      )}
    </CardContent>
  </Card>
);

export const RetoCard = ({ challenge }: { challenge: HighlightChallenge | null }) => {
  const pct = challenge
    ? Math.min(100, Math.round((challenge.currentCount / Math.max(challenge.targetCount, 1)) * 100))
    : 0;
  return (
    <Card>
      <CardContent className="p-6">
        <Eyebrow className="bg-miel-soft text-foreground">Retos</Eyebrow>
        <h2 className="text-base font-extrabold tracking-tight text-foreground [text-wrap:balance]">
          {challenge ? challenge.name : 'Los retos vuelven en breve'}
        </h2>
        {challenge ? (
          <>
            <div className="mt-4 h-2 overflow-hidden rounded-full border border-border bg-secondary">
              <div
                className="h-full rounded-full bg-gradient-to-r from-miel to-brand"
                style={{ width: `${Math.max(pct, 4)}%` }}
              />
            </div>
            <div className="mt-3 flex items-center justify-between">
              <Link to="/retos" className="text-sm font-bold text-foreground hover:underline">
                Seguir con el reto →
              </Link>
              <span className="text-xs text-muted-foreground">
                {challenge.currentCount}/{challenge.targetCount} · +{challenge.pointsReward} pts
              </span>
            </div>
          </>
        ) : (
          <p className="mt-2 text-sm text-muted-foreground">
            Mientras tanto, suma puntos completando cursos y participando en el foro.
          </p>
        )}
      </CardContent>
    </Card>
  );
};

const eventDateLabel = (iso: string) =>
  new Intl.DateTimeFormat('es-ES', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(iso));

export const EventoCard = ({ event }: { event: HighlightEvent | null }) => (
  <Card className="bg-gradient-to-br from-terracota-soft to-card">
    <CardContent className="p-6">
      <Eyebrow className="bg-terracota-soft text-terracota">Próximo evento</Eyebrow>
      <h2 className="text-base font-extrabold tracking-tight text-foreground [text-wrap:balance]">
        {event ? event.title : 'Pronto anunciaremos el siguiente'}
      </h2>
      {event ? (
        <>
          <p className="mt-1.5 text-sm text-muted-foreground">
            {eventDateLabel(event.startDate)} · {event.isOnline ? 'online' : event.location || 'presencial'}
          </p>
          <div className="mt-4">
            <Link to="/eventos" className="text-sm font-bold text-terracota hover:underline">
              Ver detalles →
            </Link>
          </div>
        </>
      ) : (
        <div className="mt-4">
          <Link to="/eventos" className="text-sm font-bold text-terracota hover:underline">
            Ver eventos pasados →
          </Link>
        </div>
      )}
    </CardContent>
  </Card>
);

const RowList = ({ children }: { children: React.ReactNode }) => (
  <div className="mt-1 divide-y divide-border">{children}</div>
);

export const ForoVivoCard = ({ threads }: { threads: HighlightThread[] }) => (
  <Card>
    <CardContent className="p-6">
      <Eyebrow className="bg-terracota-soft text-terracota">Foro · lo vivo</Eyebrow>
      {threads.length > 0 ? (
        <RowList>
          {threads.map((t) => (
            <div key={t.id} className="flex items-baseline gap-3 py-2.5 text-sm">
              <span className="min-w-0 flex-1 truncate font-semibold text-foreground">{t.title}</span>
              <span className="flex-none text-xs font-bold tabular-nums text-terracota">
                {t.repliesCount} resp.
              </span>
            </div>
          ))}
        </RowList>
      ) : (
        <p className="mt-2 text-sm text-muted-foreground">
          Estrena el foro: cuenta cómo va tu farmacia esta semana.
        </p>
      )}
      <div className="mt-3">
        <Link to="/comunidad" className="text-sm font-bold text-terracota hover:underline">
          Entrar al foro →
        </Link>
      </div>
    </CardContent>
  </Card>
);

export const RecursosNuevosCard = ({ resources }: { resources: HighlightResource[] }) => (
  <Card>
    <CardContent className="p-6">
      <Eyebrow className="bg-salvia-soft text-salvia">Recursos nuevos</Eyebrow>
      {resources.length > 0 ? (
        <RowList>
          {resources.map((r) => (
            <div key={r.id} className="flex items-baseline gap-3 py-2.5 text-sm">
              <span className="min-w-0 flex-1 truncate font-semibold text-foreground">{r.title}</span>
              {r.format && (
                <span className="flex-none text-xs font-bold uppercase text-salvia">{r.format}</span>
              )}
            </div>
          ))}
        </RowList>
      ) : (
        <p className="mt-2 text-sm text-muted-foreground">
          El vault se está llenando: plantillas y guías listas para el mostrador.
        </p>
      )}
      <div className="mt-3">
        <Link to="/recursos" className="text-sm font-bold text-salvia hover:underline">
          Todo el vault →
        </Link>
      </div>
    </CardContent>
  </Card>
);
