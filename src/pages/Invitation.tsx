import { useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { LoginForm } from '@/components/auth/LoginForm';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, CheckCircle2, XCircle, Users } from 'lucide-react';
import { toast } from 'sonner';

// Roles de pago propios (no 'equipo': eso es justo lo que se le va a conceder al aceptar).
const OWN_PAID_ROLES = ['plus', 'premium', 'profesional'];

export default function Invitation() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const { user, profile, loading: authLoading } = useAuth();
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
      setState('error');
      setMessage('No se pudo aceptar la invitación. Puede haber expirado o no ser válida.');
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
            <p>{message}</p>
          </>
        )}
      </Card>
    </div>
  );
}
