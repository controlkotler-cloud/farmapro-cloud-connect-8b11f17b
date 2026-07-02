import { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { LoginForm } from '@/components/auth/LoginForm';
import { Card } from '@/components/ui/card';
import { Loader2, CheckCircle2, XCircle } from 'lucide-react';
import { toast } from 'sonner';

export default function Invitation() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const token = params.get('token');
  const [state, setState] = useState<'idle' | 'accepting' | 'ok' | 'error'>('idle');
  const [message, setMessage] = useState<string>('');

  useEffect(() => {
    if (authLoading) return;
    if (!token) {
      setState('error');
      setMessage('Token de invitación no válido.');
      return;
    }
    if (!user) return; // Muestra login más abajo.
    if (state !== 'idle') return;
    setState('accepting');
    supabase.functions
      .invoke('manage-team', { body: { action: 'accept_invitation', invitationToken: token } })
      .then(({ error }) => {
        if (error) {
          setState('error');
          setMessage('No se pudo aceptar la invitación. Puede haber expirado o no ser válida.');
        } else {
          setState('ok');
          setMessage('¡Te has unido al equipo!');
          toast.success('Invitación aceptada');
          setTimeout(() => navigate('/dashboard'), 1500);
        }
      });
  }, [authLoading, user, token, state, navigate]);

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

  if (!authLoading && !user) {
    return (
      <div>
        <div className="max-w-md mx-auto mt-8 mb-4 px-6 text-center text-sm text-muted-foreground">
          Inicia sesión o crea una cuenta con el email al que se envió la invitación para aceptarla.
        </div>
        <LoginForm />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <Card className="p-8 max-w-md text-center space-y-3">
        {state === 'accepting' || state === 'idle' ? (
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
