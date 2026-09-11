import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { ArrowLeft, Check, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';

// ---------------------------------------------------------------------------
// Baja del resumen de los lunes. Pública a propósito: el enlace se pulsa desde
// el correo, muchas veces sin sesión abierta en el navegador.
//
// La baja es SOLO del digest semanal, no de los avisos de cuenta: escribe
// `user_notification_settings.email_weekly_digest = false` a través de la RPC
// `unsubscribe_weekly_digest`, que identifica la dirección por el mismo token
// de 64 hex que ya exige la API de Lovable en cada envío. No se toca
// `suppressed_emails`: eso cortaría también la bienvenida, el fin de prueba y
// los avisos de pago, y el pie del correo promete justo lo contrario.
//
// La baja se ejecuta con un clic explícito, nunca al cargar la página: los
// prefetchers de Gmail y los antivirus de correo abren los enlaces solos y
// darían de baja a quien no ha pulsado nada.
// ---------------------------------------------------------------------------

type Estado = 'listo' | 'enviando' | 'hecho' | 'error';

const Baja = () => {
  const [params] = useSearchParams();
  const token = params.get('t') ?? '';
  const [estado, setEstado] = useState<Estado>('listo');
  const [motivo, setMotivo] = useState<string>('');

  useEffect(() => {
    document.title = 'Resumen de los lunes · portal farmapro';
  }, []);

  const darDeBaja = async () => {
    setEstado('enviando');
    // `unsubscribe_weekly_digest` es nueva y todavía no está en los types
    // generados de Supabase; de ahí el doble cast.
    const rpc = supabase.rpc as unknown as (
      fn: string,
      args: Record<string, unknown>,
    ) => Promise<{ data: { ok?: boolean; reason?: string } | null; error: unknown }>;
    const { data, error } = await rpc('unsubscribe_weekly_digest', { p_token: token });

    if (error || !data?.ok) {
      setMotivo(
        data?.reason === 'sin_cuenta'
          ? 'Esa dirección ya no tiene cuenta en el portal, así que tampoco recibirá el resumen.'
          : 'Ese enlace no vale. Puede que sea de un correo antiguo.',
      );
      setEstado('error');
      return;
    }
    setEstado('hecho');
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-white/70 backdrop-blur">
        <div className="container mx-auto flex items-center justify-between px-4 py-3">
          <Link to="/" className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
            <ArrowLeft className="h-4 w-4" />
            Volver al inicio
          </Link>
          <img src="/logo-farmapro.svg" alt="farmapro" className="h-6" />
        </div>
      </header>

      <div className="container mx-auto max-w-xl px-4 py-16">
        {estado === 'hecho' ? (
          <>
            <div className="flex h-11 w-11 items-center justify-center rounded-full bg-brand-soft">
              <Check className="h-5 w-5 text-brand" />
            </div>
            <h1 className="mt-5 text-2xl font-extrabold tracking-tight">Hecho, no te mandamos más el resumen</h1>
            <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
              Dejas de recibir el correo de los lunes. Los avisos de tu cuenta (la bienvenida, el
              fin de la prueba, los pagos) siguen llegando, porque esos no son publicidad.
            </p>
            <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
              Si algún día lo quieres de vuelta, lo activas en Perfil, dentro del portal.
            </p>
            <Button asChild className="mt-8">
              <Link to="/dashboard">Entrar en el portal</Link>
            </Button>
          </>
        ) : estado === 'error' || !token ? (
          <>
            <div className="flex h-11 w-11 items-center justify-center rounded-full bg-muted">
              <X className="h-5 w-5 text-muted-foreground" />
            </div>
            <h1 className="mt-5 text-2xl font-extrabold tracking-tight">No hemos podido darte de baja</h1>
            <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
              {motivo || 'Falta el enlace completo. Ábrelo desde el correo, sin recortar la dirección.'}
            </p>
            <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
              Si prefieres que lo hagamos nosotros, escríbenos a{' '}
              <a className="font-medium text-foreground underline underline-offset-2" href="mailto:somos@farmapro.es">
                somos@farmapro.es
              </a>{' '}
              y lo quitamos a mano.
            </p>
          </>
        ) : (
          <>
            <h1 className="text-2xl font-extrabold tracking-tight">¿Dejamos de mandarte el resumen de los lunes?</h1>
            <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
              Es el correo semanal con lo que ha entrado en el portal y lo que tienes a medias.
              Si lo das de baja, seguirás recibiendo los avisos de tu cuenta: la bienvenida, el
              fin de la prueba y todo lo relacionado con los pagos.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Button onClick={darDeBaja} disabled={estado === 'enviando'}>
                {estado === 'enviando' ? 'Un momento...' : 'Sí, dame de baja'}
              </Button>
              <Button variant="outline" asChild>
                <Link to="/dashboard">No, me lo quedo</Link>
              </Button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default Baja;
