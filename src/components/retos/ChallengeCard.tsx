import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Trophy, CheckCircle, Gift, MessageSquare, Users, BookOpen, ClipboardCheck, ArrowRight } from 'lucide-react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';

interface Challenge {
  id: string;
  name: string;
  description: string;
  type: string;
  points_reward: number;
  target_count: number;
  is_active: boolean;
  created_at: string;
  familia?: string | null;
  nivel?: number | null;
}

interface ChallengeCardProps {
  challenge: Challenge;
  progress: any;
  index: number;
  /** Cuántos peldaños tiene la familia. Solo para el "Nivel 2 de 4". */
  totalNiveles?: number;
}

const getChallengeIcon = (type: string) => {
  switch (type) {
    case 'course_completed':
    case 'course_started':
      return <BookOpen className="h-6 w-6" />;
    case 'forum_post':
    case 'forum_reply':
      return <MessageSquare className="h-6 w-6" />;
    case 'quiz_completed':
      return <ClipboardCheck className="h-6 w-6" />;
    case 'resource_downloaded':
      return <Gift className="h-6 w-6" />;
    case 'community_engagement':
      return <Users className="h-6 w-6" />;
    default:
      return <Trophy className="h-6 w-6" />;
  }
};

const getChallengeTypeLabel = (type: string) => {
  switch (type) {
    case 'course_completed':
    case 'course_started':
      return 'Formación';
    case 'forum_post':
    case 'forum_reply':
      return 'Comunidad';
    case 'quiz_completed':
      return 'Formación';
    case 'resource_downloaded':
      return 'Recursos';
    case 'community_engagement':
      return 'Participación';
    default:
      return 'General';
  }
};

const getUnit = (type: string, count: number) => {
  switch (type) {
    case 'forum_reply':
      return count === 1 ? 'respuesta' : 'respuestas';
    case 'forum_post':
      return count === 1 ? 'hilo' : 'hilos';
    case 'course_completed':
    case 'course_started':
      return count === 1 ? 'curso' : 'cursos';
    case 'resource_downloaded':
      return count === 1 ? 'recurso' : 'recursos';
    case 'quiz_completed':
      return count === 1 ? 'evaluación' : 'evaluaciones';
    default:
      return count === 1 ? 'acción' : 'acciones';
  }
};

const getStartHelp = (type: string): { text: string; linkLabel: string; to: string } => {
  switch (type) {
    case 'forum_reply':
      return {
        text: 'Entra en el foro y contesta a compañeros: resuelve una duda, cuenta cómo lo hacéis en tu farmacia o comenta una experiencia. Cuenta cada respuesta publicada.',
        linkLabel: 'Ir al foro',
        to: '/comunidad',
      };
    case 'forum_post':
      return {
        text: 'Abre un hilo nuevo en el foro con una duda, un caso de tu mostrador o una idea que te haya funcionado.',
        linkLabel: 'Ir al foro',
        to: '/comunidad',
      };
    case 'course_completed':
      return {
        text: 'Elige un curso en Formación y complétalo entero, con todos sus módulos.',
        linkLabel: 'Ver cursos',
        to: '/formacion',
      };
    case 'course_started':
      return {
        text: 'Entra en Formación y abre los cursos que te interesen. Cuenta con empezarlos: no hace falta terminarlos para este reto.',
        linkLabel: 'Ver cursos',
        to: '/formacion',
      };
    case 'quiz_completed':
      return {
        text: 'Al final de cada curso hay una evaluación. Hazla y comprueba qué te ha quedado; cuenta cada evaluación completada.',
        linkLabel: 'Ver cursos',
        to: '/formacion',
      };
    case 'resource_downloaded':
      return {
        text: 'Descarga las plantillas, guías y checklists de la sección Recursos y aplícalas en tu farmacia.',
        linkLabel: 'Ver recursos',
        to: '/recursos',
      };
    default:
      return {
        text: 'Participa en la actividad del portal para avanzar en este reto: formación, recursos y comunidad suman.',
        linkLabel: 'Ir al inicio',
        to: '/dashboard',
      };
  }
};

export const ChallengeCard = ({ challenge, progress, index, totalNiveles }: ChallengeCardProps) => {
  const navigate = useNavigate();
  const completed = progress?.completed_at !== null && progress?.completed_at !== undefined;
  const currentCount = progress?.current_count || 0;
  const progressPercentage = Math.min((currentCount / challenge.target_count) * 100, 100);
  const notStarted = currentCount === 0 && !completed;
  const remaining = Math.max(challenge.target_count - currentCount, 0);
  const help = getStartHelp(challenge.type);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: index * 0.1 }}
    >
      <Card className={`relative h-full transition-all ${completed ? 'border-success bg-success/10' : 'shadow-soft hover:shadow-lift'}`}>
        {completed && (
          <div className="absolute top-3 right-3">
            <CheckCircle className="h-6 w-6 text-success" />
          </div>
        )}
        <CardContent className="p-5 space-y-4">
          <div className="flex items-start gap-3">
            <div className={`rounded-lg p-2 ${completed ? 'bg-success/10 text-success' : 'bg-miel-soft text-miel'}`}>
              {getChallengeIcon(challenge.type)}
            </div>
            <div className="min-w-0">
              <p className="flex flex-wrap items-center gap-x-2 text-[11px] font-extrabold uppercase tracking-[0.14em] text-miel">
                {getChallengeTypeLabel(challenge.type)}
                {challenge.nivel && totalNiveles ? (
                  <span className="rounded-full bg-miel-soft px-2 py-0.5 text-[10px] text-miel">
                    Nivel {challenge.nivel} de {totalNiveles}
                  </span>
                ) : null}
              </p>
              <h3 className="text-[19px] font-extrabold tracking-tight text-foreground leading-snug">
                {challenge.name}
              </h3>
            </div>
          </div>

          <div className="rounded-[0.625rem] bg-brand-soft px-4 py-3">
            <p className="text-sm font-bold text-foreground">{challenge.description}</p>
          </div>

          {notStarted && (
            <p className="text-sm text-muted-foreground">{help.text}</p>
          )}

          <div>
            <p className="leading-none">
              <span className="text-[26px] font-extrabold text-foreground">{currentCount}</span>
              <span className="ml-2 text-sm text-muted-foreground">
                de {challenge.target_count} {getUnit(challenge.type, challenge.target_count)}
              </span>
            </p>
            <div className="mt-3 h-[11px] overflow-hidden rounded-full border border-border bg-secondary">
              <div
                className="h-full rounded-full bg-brand transition-all"
                style={{ width: `${Math.max(progressPercentage, 4)}%` }}
              />
            </div>
          </div>

          <div className="flex items-center justify-between gap-3 border-t border-border pt-3">
            {completed ? (
              <span className="text-sm font-semibold text-success">Reto completado</span>
            ) : notStarted ? (
              <Button
                variant="link"
                className="h-auto p-0 text-sm font-semibold text-brand-dark"
                onClick={() => navigate(help.to)}
              >
                {help.linkLabel}
                <ArrowRight className="ml-1 h-4 w-4" />
              </Button>
            ) : (
              <span className="text-sm text-muted-foreground">
                {progressPercentage >= 75 ? (
                  <>
                    Ya casi: te quedan{' '}
                    <span className="font-extrabold text-brand-dark">{remaining}</span>
                  </>
                ) : progressPercentage >= 50 ? (
                  'Más de la mitad hecho'
                ) : progressPercentage >= 25 ? (
                  'Ya llevas más de un cuarto'
                ) : (
                  'Vas por buen camino'
                )}
              </span>
            )}
            <span className="flex items-center gap-2 text-sm text-muted-foreground">
              <span className="h-2 w-2 rounded-full bg-miel" />
              Ganas {challenge.points_reward} puntos
            </span>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};
