import { useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { LoginForm } from '@/components/auth/LoginForm';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, CheckCircle2, XCircle, Users } from 'lucide-react';
import { toast } from 'sonner';
import { extractFunctionErrorMessage } from '@/lib/functionsError';

// Roles de pago propios (no 'equipo': eso es justo lo que se le va a conceder al aceptar).
const OWN_PAID_ROLES = ['plus', 'premium', 'profesional'];

export default function Invitation() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const { user, profile, loading: authLoading, signOut } = useAuth();
  const token = params.get('token');
  const [state, setState] = useState<'idle' | 'accepting' | 'ok' | 'error'>('idle');
  const [message, setMessage] = useState<string>('');

  const handleAccept = async () => {
    if (!token) return;
    setState('accepting');
    const { error } = await supabase.functions.invoke('manage-team', {
      body: { action: 'accept_invitation', invitationToken: token },
    });
    if (error) {
      // La causa más habitual no es la caducidad: es estar dentro con OTRA cuenta
      // (p. ej. el titular abre el enlace en el mismo navegador). manage-team
      // valida que el email de la sesión sea el invitado, así que se dice.
      const detail = await extractFunctionErrorMessage(error);
      setState('error');
      const who = user?.email ?? 'otra cuenta';
      setMessage(
        `No se ha podido aceptar la invitación. Lo más probable es que hayas abierto el enlace ` +
          `con otra cuenta: ahora estás dentro como ${who}, y esta invitación solo la puede aceptar ` +
          `la cuenta con el email al que se envió. Sal, entra con ese email y vuelve a abrir el enlace ` +
          `del correo. Si ya es esa cuenta, puede que la invitación haya caducado (dura 14 días) o que ` +
          `ya se hubiera aceptado antes: pide al titular que te la envíe de nuevo.` +
          (detail ? ` (Motivo técnico: ${detail})` : ''),
      );
    } else {
      setState('ok');
      setMessage('¡Te has unido al equipo!');
      toast.success('Invitación aceptada');
      setTimeout(() => navigate('/dashboard'), 1500);
    }
  };

  if (!token) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <Card className="p-8 max-w-md text-center space-y-3">
          <XCircle className="w-10 h-10 mx-auto text-destructive" />
          <h1 className="text-lg font-extrabold tracking-tight text-foreground">Invitación no válida</h1>
          <p>Token de invitación no válido.</p>
        </Card>
      </div>
    );
  }

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <Card className="p-8 max-w-md text-center space-y-3">
          <Loader2 className="w-10 h-10 mx-auto animate-spin text-primary" />
          <p>Cargando…</p>
        </Card>
      </div>
    );
  }

  if (!user) {
    return (
      <div>
        <div className="max-w-md mx-auto mt-8 mb-4 px-6 text-center text-sm text-muted-foreground">
          Inicia sesión o crea una cuenta con el email al que se envió la invitación para aceptarla.
        </div>
        <LoginForm />
      </div>
    );
  }

  const hasOwnPaidPlan =
    !!profile?.subscription_role && OWN_PAID_ROLES.includes(profile.subscription_role);

  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <Card className="p-8 max-w-md text-center space-y-4">
        {state === 'idle' ? (
          <>
            <Users className="w-10 h-10 mx-auto text-brand-dark" />
            <h1 className="text-xl font-extrabold tracking-tight text-foreground">Invitación de equipo</h1>
            <p className="text-left text-sm text-muted-foreground">
              Al unirte a este equipo, su titular verá tu progreso formativo (cursos y evaluaciones) y
              tu última actividad en el portal. Tu actividad en la comunidad, IAFarma y la Rebotica es
              privada.
            </p>
            {hasOwnPaidPlan && (
              <p className="rounded-lg bg-miel-soft p-3 text-left text-sm text-foreground">
                Tu plaza de equipo ya incluye todo: puedes cancelar tu plan individual desde
                Facturación.
              </p>
            )}
            <Button onClick={handleAccept} className="w-full rounded-full">
              Unirme al equipo
            </Button>
            <p className="text-xs text-muted-foreground">
              Estás dentro como <strong className="text-foreground">{user.email}</strong>. Si la
              invitación llegó a otro email, entra con esa cuenta.
            </p>
            <Button variant="ghost" size="sm" className="rounded-full" onClick={() => void signOut()}>
              Salir y entrar con otra cuenta
            </Button>
          </>
        ) : state === 'accepting' ? (
          <>
            <Loader2 className="w-10 h-10 mx-auto animate-spin text-primary" />
            <p>Uniéndote al equipo…</p>
          </>
        ) : state === 'ok' ? (
          <>
            <CheckCircle2 className="w-10 h-10 mx-auto text-primary" />
            <p>{message}</p>
          </>
        ) : (
          <>
            <XCircle className="w-10 h-10 mx-auto text-destructive" />
            <h2 className="text-lg font-extrabold tracking-tight text-foreground">
              No se ha podido aceptar
            </h2>
            <p className="text-sm text-left text-muted-foreground">{message}</p>
            <Button variant="outline" size="sm" className="rounded-full" onClick={() => void signOut()}>
              Salir y entrar con otra cuenta
            </Button>
          </>
        )}
      </Card>
    </div>
  );
}
