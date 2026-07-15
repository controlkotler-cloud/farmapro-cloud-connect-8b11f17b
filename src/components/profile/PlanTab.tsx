
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, Star, ExternalLink, ShieldCheck } from 'lucide-react';
import { Link } from 'react-router-dom';
import { PLANS, FREE_LIMITS, ROLE_LABELS, getAccessState, getLaunchStatus } from '@/lib/plans';
import { useTeamManagement } from '@/hooks/useTeamManagement';

interface PlanTabProps {
  profile: any;
  isAdmin: boolean;
}

/**
 * Pestaña "Plan" del Perfil. Fuente única: src/lib/plans.ts + getAccessState.
 * El checkout del modelo antiguo (SubscriptionPlans/TeamPlanCard/planConfig)
 * se retiró: la contratación vive en /precios y se conecta con Stripe.
 */
export const PlanTab = ({ profile, isAdmin }: PlanTabProps) => {
  const role: string | null = isAdmin ? 'admin' : (profile?.subscription_role ?? null);
  const access = isAdmin ? 'paid' : getAccessState(role, profile?.created_at ?? null);
  const launch = getLaunchStatus();
  const { isTeamOwner, isTeamMember, memberTeamName } = useTeamManagement();
  // Miembro de un equipo (no titular): la plaza la gestiona el titular, no hay CTA de precios.
  // isTeamMember (señal viva) en vez de comparar el rol cacheado del profile.
  const isTeamMemberPlaza = isTeamMember && !isTeamOwner;

  const planName = ROLE_LABELS[role ?? 'freemium'] ?? 'Gratis';

  // Días restantes de la prueba gratis (solo informativo).
  const trialDaysLeft = (() => {
    if (access !== 'free_trial' || !profile?.created_at) return null;
    const used = (Date.now() - new Date(profile.created_at).getTime()) / 86_400_000;
    return Math.max(0, Math.ceil(FREE_LIMITS.trialDays - used));
  })();

  const freePlan = PLANS.find((p) => p.id === 'gratis');
  const isPaid = access === 'paid';

  return (
    <div className="space-y-6">
      {/* Plan actual */}
      <Card>
        <CardHeader>
          <CardTitle>Tu plan actual</CardTitle>
          <CardDescription>Detalles de tu suscripción y beneficios incluidos</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-lg border-2 bg-muted/40 p-6">
            <div className="mb-4 flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary">
                <ShieldCheck className="h-6 w-6 text-primary-foreground" />
              </div>
              <div>
                <h3 className="text-2xl font-bold">Plan {planName}</h3>
                <div className="mt-1 flex items-center gap-2">
                  {isAdmin && <Badge variant="destructive">Sin caducidad</Badge>}
                  {!isAdmin && isPaid && <Badge>Activo</Badge>}
                  {access === 'free_trial' && (
                    <Badge variant="secondary">
                      Prueba gratis{trialDaysLeft !== null ? ` · ${trialDaysLeft} días restantes` : ''}
                    </Badge>
                  )}
                  {access === 'free_locked' && <Badge variant="destructive">Prueba finalizada</Badge>}
                </div>
              </div>
            </div>

            {!isPaid && freePlan && (
              <ul className="space-y-2">
                {freePlan.features.map((feature) => (
                  <li key={feature} className="flex items-center text-sm text-muted-foreground">
                    <CheckCircle className="mr-3 h-4 w-4 flex-shrink-0 text-primary" />
                    {feature}
                  </li>
                ))}
              </ul>
            )}

            {isAdmin && (
              <p className="text-sm text-muted-foreground">
                Cuenta de administrador: acceso completo y permanente a todo el portal.
              </p>
            )}
            {!isAdmin && isTeamMemberPlaza && (
              <p className="text-sm text-muted-foreground">
                Plan Equipo · plaza de {memberTeamName ?? 'tu farmacia'}. La gestiona tu titular.
              </p>
            )}
            {!isAdmin && isPaid && !isTeamMemberPlaza && (
              <p className="text-sm text-muted-foreground">
                Acceso completo: cursos y recursos sin límite, comunidad, retos e IAFarma.
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* CTA a Precios (la contratación vive allí) */}
      {!isAdmin && !isPaid && (
        <Card className="border-primary/30 bg-primary/5">
          <CardContent className="p-6">
            <div className="flex flex-col items-start gap-4 sm:flex-row sm:items-center">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary">
                <Star className="h-6 w-6 text-primary-foreground" />
              </div>
              <div className="flex-1">
                <h3 className="mb-1 text-lg font-semibold">
                  {access === 'free_locked'
                    ? 'Recupera tu acceso con el plan Plus'
                    : '¿Listo para dar el siguiente paso?'}
                </h3>
                <p className="text-sm text-muted-foreground">
                  {launch.active
                    ? 'Precio de lanzamiento para las 100 primeras plazas, para siempre. Sin permanencia: cancela cuando quieras.'
                    : 'Todo el contenido, la comunidad e IAFarma por una cuota mensual. Sin permanencia.'}
                </p>
              </div>
              <Button asChild>
                <Link to="/precios" className="flex items-center gap-2">
                  Ver planes
                  <ExternalLink className="h-4 w-4" />
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
