import { useEffect, useState } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Crown, Mail, Store, CreditCard } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useTeamManagement } from '@/hooks/useTeamManagement';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { PLANS, getLaunchStatus } from '@/lib/plans';

export default function MiFarmacia() {
  const { profile } = useAuth();
  const {
    teamSubscription,
    teamMembers,
    loading,
    isTeamOwner,
    inviteMember,
    removeMember,
    getTeamStats,
  } = useTeamManagement();

  const [email, setEmail] = useState('');
  const [inviting, setInviting] = useState(false);
  const [resendingEmail, setResendingEmail] = useState<string | null>(null);
  const [removingEmail, setRemovingEmail] = useState<string | null>(null);
  const [progress, setProgress] = useState<any[]>([]);
  const [progressLoading, setProgressLoading] = useState(true);

  // get_team_progress() vive en la tanda SQL 4: puede no existir todavía en la BD real.
  // Si falla, se trata como "sin datos" en vez de romper la página.
  useEffect(() => {
    if (!isTeamOwner) {
      setProgressLoading(false);
      return;
    }
    let active = true;
    supabase.rpc('get_team_progress').then(({ data, error }) => {
      if (!active) return;
      if (error) {
        console.error('Error loading team progress:', error.message);
        setProgress([]);
      } else {
        setProgress(data ?? []);
      }
      setProgressLoading(false);
    });
    return () => {
      active = false;
    };
  }, [isTeamOwner]);

  if (loading) {
    return (
      <div className="p-4 md:p-6">
        <div className="mx-auto max-w-4xl animate-pulse space-y-6">
          <div className="h-10 w-64 rounded bg-muted" />
          <div className="h-48 rounded bg-muted" />
          <div className="h-48 rounded bg-muted" />
        </div>
      </div>
    );
  }

  if (!isTeamOwner || !teamSubscription) {
    return <Navigate to="/dashboard" replace />;
  }

  const stats = getTeamStats();
  const totalPeople = 1 + stats.activeMembers;
  const maxPeople = 1 + stats.totalSlots;
  const progressPct = maxPeople > 0 ? Math.min(100, Math.round((totalPeople / maxPeople) * 100)) : 0;
  const cupoLleno = stats.availableSlots <= 0;

  const activeMembers = teamMembers.filter((m) => m.status === 'active');
  const pendingMembers = teamMembers.filter((m) => m.status === 'pending');

  const equipoPlan = PLANS.find((p) => p.id === 'equipo');
  const launch = getLaunchStatus();
  const currentPrice = launch.active ? equipoPlan?.priceMonthlyLaunch : equipoPlan?.priceMonthly;

  const handleInvite = async () => {
    if (!email.trim() || !email.includes('@')) {
      toast.error('Introduce un email válido');
      return;
    }
    if (cupoLleno) return;
    setInviting(true);
    try {
      await inviteMember(email.trim(), teamSubscription.id);
      setEmail('');
    } catch {
      // el hook ya muestra el toast de error
    } finally {
      setInviting(false);
    }
  };

  // "Reenviar" = cancelar + reinvitar: token y caducidad frescos, sin tocar edge functions
  // (las filas 'inactive' no bloquean el índice único anti-duplicados).
  const handleResend = async (memberEmail: string) => {
    setResendingEmail(memberEmail);
    try {
      await removeMember(memberEmail, teamSubscription.id);
      await inviteMember(memberEmail, teamSubscription.id);
    } catch {
      // errores ya mostrados por el hook
    } finally {
      setResendingEmail(null);
    }
  };

  const handleRemove = async (memberEmail: string) => {
    setRemovingEmail(memberEmail);
    try {
      await removeMember(memberEmail, teamSubscription.id);
    } finally {
      setRemovingEmail(null);
    }
  };

  return (
    <div className="p-4 md:p-6">
      <div className="mx-auto max-w-4xl space-y-6">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-brand-soft">
            <Store className="h-6 w-6 text-brand-dark" />
          </div>
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-foreground">Mi farmacia</h1>
            {teamSubscription.team_name && (
              <p className="text-muted-foreground">{teamSubscription.team_name}</p>
            )}
          </div>
        </div>

        {/* Plazas */}
        <Card>
          <CardHeader>
            <CardTitle>Plazas</CardTitle>
            <CardDescription>
              {totalPeople} de {maxPeople} personas
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="h-2 w-full overflow-hidden rounded-full bg-secondary">
              <div
                className="h-full rounded-full bg-brand transition-all"
                style={{ width: `${progressPct}%` }}
              />
            </div>

            {cupoLleno ? (
              <p className="rounded-lg bg-miel-soft p-3 text-sm text-foreground">
                Has alcanzado el cupo de {maxPeople} personas. Retira una plaza para invitar a alguien
                nuevo.
              </p>
            ) : (
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleInvite();
                }}
                className="flex flex-col gap-2 sm:flex-row"
              >
                <Input
                  type="email"
                  placeholder="email@ejemplo.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={inviting}
                />
                <Button
                  type="submit"
                  disabled={inviting}
                  className="rounded-full bg-brand-dark hover:bg-brand-dark/90"
                >
                  {inviting ? 'Enviando…' : 'Invitar'}
                </Button>
              </form>
            )}

            <div className="space-y-2">
              {/* Titular */}
              <div className="flex items-center justify-between rounded-lg border p-3">
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-full bg-brand-soft">
                    <Crown className="h-4 w-4 text-brand-dark" />
                  </div>
                  <div>
                    <div className="text-sm font-medium">{profile?.full_name || profile?.email}</div>
                    <div className="text-xs text-muted-foreground">Titular</div>
                  </div>
                </div>
                <Badge className="bg-brand-soft text-brand-dark hover:bg-brand-soft">Titular</Badge>
              </div>

              {/* Activos */}
              {activeMembers.map((member) => (
                <div key={member.id} className="flex items-center justify-between rounded-lg border p-3">
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-full bg-brand-soft">
                      <Mail className="h-4 w-4 text-brand-dark" />
                    </div>
                    <div>
                      <div className="text-sm font-medium">{member.email}</div>
                      {member.joined_at && (
                        <div className="text-xs text-muted-foreground">
                          Se unió el {new Date(member.joined_at).toLocaleDateString('es-ES')}
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge className="bg-brand-soft text-brand-dark hover:bg-brand-soft">Activo</Badge>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="outline" size="sm" disabled={removingEmail === member.email}>
                          Retirar plaza
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>¿Retirar la plaza de {member.email}?</AlertDialogTitle>
                          <AlertDialogDescription>
                            Perderá el acceso al plan Equipo y volverá a Gratis. Su histórico se
                            conserva y la plaza queda libre al instante.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancelar</AlertDialogCancel>
                          <AlertDialogAction onClick={() => handleRemove(member.email)}>
                            Retirar plaza
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </div>
              ))}

              {/* Pendientes */}
              {pendingMembers.map((member) => (
                <div key={member.id} className="flex items-center justify-between rounded-lg border p-3">
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-full bg-miel-soft">
                      <Mail className="h-4 w-4 text-miel" />
                    </div>
                    <div>
                      <div className="text-sm font-medium">{member.email}</div>
                      <div className="text-xs text-muted-foreground">
                        {member.expires_at
                          ? `Caduca el ${new Date(member.expires_at).toLocaleDateString('es-ES')}`
                          : 'Invitación pendiente'}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge className="bg-miel-soft text-foreground hover:bg-miel-soft">Pendiente</Badge>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleResend(member.email)}
                      disabled={resendingEmail === member.email || removingEmail === member.email}
                    >
                      {resendingEmail === member.email ? 'Reenviando…' : 'Reenviar'}
                    </Button>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button
                          variant="outline"
                          size="sm"
                          disabled={removingEmail === member.email || resendingEmail === member.email}
                        >
                          Cancelar
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>¿Cancelar la invitación a {member.email}?</AlertDialogTitle>
                          <AlertDialogDescription>
                            La invitación dejará de ser válida y la plaza queda libre al instante.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Volver</AlertDialogCancel>
                          <AlertDialogAction onClick={() => handleRemove(member.email)}>
                            Cancelar invitación
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Progreso del equipo */}
        <Card>
          <CardHeader>
            <CardTitle>Progreso del equipo</CardTitle>
            <CardDescription>Cursos, evaluaciones y última actividad de cada persona</CardDescription>
          </CardHeader>
          <CardContent>
            {progressLoading ? (
              <div className="animate-pulse space-y-2">
                <div className="h-10 rounded bg-muted" />
                <div className="h-10 rounded bg-muted" />
              </div>
            ) : progress.length === 0 ? (
              <p className="italic-display py-8 text-center text-lg">
                Aún nadie ha empezado una formación
              </p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b text-left text-muted-foreground">
                      <th className="pb-2 pr-4 font-medium">Persona</th>
                      <th className="pb-2 pr-4 font-medium">Cursos</th>
                      <th className="pb-2 pr-4 font-medium">Evaluaciones</th>
                      <th className="pb-2 pr-4 font-medium">Nivel</th>
                      <th className="pb-2 font-medium">Última actividad</th>
                    </tr>
                  </thead>
                  <tbody>
                    {progress.map((row) => (
                      <tr key={row.member_user_id} className="border-b last:border-0">
                        <td className="py-3 pr-4">
                          <div className="font-medium">{row.nombre}</div>
                          <div className="text-xs text-muted-foreground">
                            {row.es_titular ? 'Titular' : row.puesto || '—'}
                          </div>
                        </td>
                        <td className="py-3 pr-4">
                          {row.cursos_completados} completados · {row.cursos_en_curso} en curso
                        </td>
                        <td className="py-3 pr-4">{row.evaluaciones_aprobadas} aprobadas</td>
                        <td className="py-3 pr-4">
                          Nivel {row.nivel} · {row.puntos} pts
                        </td>
                        <td className="py-3 text-muted-foreground">
                          {row.ultima_actividad
                            ? `hace ${Math.max(
                                0,
                                Math.floor(
                                  (Date.now() - new Date(row.ultima_actividad).getTime()) / 86_400_000,
                                ),
                              )} días`
                            : 'Sin actividad'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Tu plan */}
        <Card>
          <CardHeader>
            <CardTitle>Tu plan</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col items-start justify-between gap-4 rounded-lg border bg-muted/40 p-4 sm:flex-row sm:items-center">
              <div>
                <div className="font-semibold">Plan Equipo</div>
                <div className="text-sm text-muted-foreground">
                  {currentPrice !== undefined ? `${currentPrice} €/mes` : ''}
                  {launch.active ? ' · precio fundador' : ''}
                </div>
                <p className="mt-1 text-xs text-muted-foreground">
                  Se renueva automáticamente. Gestiona el método de pago desde Facturación.
                </p>
              </div>
              <Button asChild variant="outline" className="rounded-full">
                <Link to="/perfil" className="flex items-center gap-2">
                  <CreditCard className="h-4 w-4" />
                  Facturación
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
