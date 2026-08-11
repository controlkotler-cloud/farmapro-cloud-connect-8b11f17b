import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';

type OAuthNamespace = {
  getAuthorizationDetails: (id: string) => Promise<{ data: any; error: { message: string } | null }>;
  approveAuthorization: (id: string) => Promise<{ data: any; error: { message: string } | null }>;
  denyAuthorization: (id: string) => Promise<{ data: any; error: { message: string } | null }>;
};

const oauth = () => (supabase.auth as unknown as { oauth: OAuthNamespace }).oauth;

const OAuthConsent = () => {
  const [params] = useSearchParams();
  const authorizationId = params.get('authorization_id') ?? '';
  const [details, setDetails] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let active = true;
    (async () => {
      if (!authorizationId) {
        setError('Falta el parámetro authorization_id');
        return;
      }
      const { data: sess } = await supabase.auth.getSession();
      if (!sess.session) {
        const next = window.location.pathname + window.location.search;
        window.location.href = '/login?next=' + encodeURIComponent(next);
        return;
      }
      const { data, error: detailsError } = await oauth().getAuthorizationDetails(authorizationId);
      if (!active) return;
      if (detailsError) {
        setError(detailsError.message);
        return;
      }
      const immediate = data?.redirect_url ?? data?.redirect_to;
      if (immediate && !data?.client) {
        window.location.href = immediate;
        return;
      }
      setDetails(data);
    })();
    return () => {
      active = false;
    };
  }, [authorizationId]);

  const decide = async (approve: boolean) => {
    setBusy(true);
    const { data, error: decideError } = approve
      ? await oauth().approveAuthorization(authorizationId)
      : await oauth().denyAuthorization(authorizationId);
    if (decideError) {
      setBusy(false);
      setError(decideError.message);
      return;
    }
    const target = data?.redirect_url ?? data?.redirect_to;
    if (!target) {
      setBusy(false);
      setError('El servidor de autorización no ha devuelto una redirección.');
      return;
    }
    window.location.href = target;
  };

  const clientName = details?.client?.name ?? 'la aplicación';

  return (
    <main className="min-h-screen flex items-center justify-center bg-gradient-to-br from-brand-soft to-background p-4">
      <Card className="w-full max-w-md shadow-lift">
        <CardHeader>
          <h1 className="text-2xl font-bold tracking-tight">
            Conectar con <span className="italic-display">farmapro</span>
          </h1>
        </CardHeader>
        <CardContent className="space-y-4">
          {error ? (
            <p className="text-sm text-muted-foreground">
              No hemos podido cargar esta solicitud de autorización: {error}
            </p>
          ) : !details ? (
            <div className="space-y-3">
              <div className="h-4 w-3/4 rounded bg-muted animate-pulse" />
              <div className="h-4 w-1/2 rounded bg-muted animate-pulse" />
            </div>
          ) : (
            <>
              <p className="text-sm text-muted-foreground">
                {clientName} quiere acceder al portal farmapro en tu nombre: podrá consultar cursos,
                recursos, eventos, hilos de la comunidad y tu progreso, con tus mismos permisos.
              </p>
              <div className="flex gap-3 pt-2">
                <Button className="rounded-full" disabled={busy} onClick={() => decide(true)}>
                  {busy ? 'Procesando…' : 'Autorizar'}
                </Button>
                <Button
                  variant="outline"
                  className="rounded-full"
                  disabled={busy}
                  onClick={() => decide(false)}
                >
                  Cancelar
                </Button>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </main>
  );
};

export default OAuthConsent;
