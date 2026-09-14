import { useEffect, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowLeft, Check, Gift, Loader2, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';

// ---------------------------------------------------------------------------
// Activación de una concesión (portal_grants). Es la página a la que apunta el
// correo que Alejandro manda cliente a cliente cuando regalamos meses de plan.
//
// Por qué existe en vez de mandarles a /precios: /precios es una página de
// venta, con tres planes, el contador de plazas de fundador y los packs. A
// quien le estamos REGALANDO el plan eso le parece que le queremos vender algo
// y no entiende qué tiene que pulsar. Aquí solo hay una cosa que hacer.
//
// El trial lo aplica `create-checkout` cuando encuentra el grant por el correo
// del usuario, así que esta página no decide nada: solo comprueba antes (RPC
// `mi_concesion`, security definer porque portal_grants tiene el RLS cerrado)
// para avisar si se han registrado con OTRA dirección. Ese es el fallo que más
// caro sale: sin grant, el checkout cobra el precio normal.
// ---------------------------------------------------------------------------

type Concesion = {
  ok: boolean;
  lote?: string;
  plan?: string;
  hasta?: string;
  activada?: boolean;
};

const NOMBRE_PLAN: Record<string, string> = {
  equipo: 'Equipo',
  plus: 'Plus',
};

const formatoFecha = (iso?: string) => {
  if (!iso) return '';
  const [a, m, d] = iso.split('-');
  const meses = [
    'enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio',
    'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre',
  ];
  return `${Number(d)} de ${meses[Number(m) - 1]} de ${a}`;
};

const Activar = () => {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  // El correo va en el enlace (?e=...) para que el registro salga con la
  // dirección correcta puesta: registrarse con otra es el único fallo que
  // deja la cortesía sin aplicar.
  const emailInvitado = params.get('e')?.includes('@') ? params.get('e')! : null;
  const irALogin = (registro: boolean) => {
    const q = new URLSearchParams();
    if (registro) q.set('modo', 'registro');
    if (emailInvitado) q.set('e', emailInvitado);
    q.set('next', '/activar');
    navigate(`/login?${q.toString()}`);
  };
  const { user, loading: authLoading } = useAuth();
  const { toast } = useToast();
  const [concesion, setConcesion] = useState<Concesion | null>(null);
  const [cargando, setCargando] = useState(true);
  const [enviando, setEnviando] = useState(false);

  useEffect(() => {
    document.title = 'Activar tu plan · portal farmapro';
  }, []);

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      setCargando(false);
      return;
    }
    let vivo = true;
    (async () => {
      // `mi_concesion` es nueva y no está en los types generados de Supabase.
      const rpc = supabase.rpc as unknown as (
        fn: string,
        args?: Record<string, unknown>,
      ) => Promise<{ data: Concesion | null; error: unknown }>;
      const { data } = await rpc('mi_concesion');
      if (!vivo) return;
      setConcesion(data ?? { ok: false });
      setCargando(false);
    })();
    return () => {
      vivo = false;
    };
  }, [user, authLoading]);

  const activar = async () => {
    setEnviando(true);
    const { data, error } = await supabase.functions.invoke('create-checkout', {
      body: { plan: concesion?.plan ?? 'equipo', cycle: 'monthly' },
    });
    setEnviando(false);

    if (error || !data?.url) {
      toast({
        title: 'No se ha podido abrir la activación',
        description:
          'Inténtalo de nuevo en unos segundos. Si sigue fallando, responde al correo de Alejandro y lo miramos.',
        variant: 'destructive',
      });
      return;
    }
    window.location.href = data.url;
  };

  const plan = NOMBRE_PLAN[concesion?.plan ?? 'equipo'] ?? 'Equipo';

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
        {cargando || authLoading ? (
          <div className="flex items-center gap-3 text-muted-foreground">
            <Loader2 className="h-5 w-5 animate-spin" />
            Un momento, estamos comprobando tu cortesía.
          </div>
        ) : !user ? (
          <>
            <div className="flex h-11 w-11 items-center justify-center rounded-full bg-brand-soft">
              <Gift className="h-5 w-5 text-brand" />
            </div>
            <h1 className="mt-5 text-2xl font-extrabold tracking-tight">
              Tu farmacia tiene el portal abierto
            </h1>
            <p className="mt-4 text-muted-foreground">
              Es cortesía de Mkpro. Para activarlo necesitas una cuenta en el portal, y tiene que
              crearse <strong className="text-foreground">con el mismo correo al que te hemos escrito</strong>:
              es el que tenemos asociado a la cortesía, y con otro distinto no se aplica.
            </p>
            <Button
              size="lg"
              className="mt-7 w-full sm:w-auto"
              onClick={() => irALogin(true)}
            >
              Crear la cuenta de la farmacia
            </Button>
            <p className="mt-4 text-sm text-muted-foreground">
              ¿Ya tienes cuenta?{' '}
              <button
                type="button"
                onClick={() => irALogin(false)}
                className="font-semibold text-brand hover:underline"
              >
                Entra con tu correo
              </button>
            </p>
          </>
        ) : concesion?.activada ? (
          <>
            <div className="flex h-11 w-11 items-center justify-center rounded-full bg-brand-soft">
              <Check className="h-5 w-5 text-brand" />
            </div>
            <h1 className="mt-5 text-2xl font-extrabold tracking-tight">Ya lo tienes activado</h1>
            <p className="mt-4 text-muted-foreground">
              Tu plan {plan} está en marcha. No hay nada más que hacer aquí.
            </p>
            <Button size="lg" className="mt-7 w-full sm:w-auto" asChild>
              <Link to="/dashboard">Entrar en el portal</Link>
            </Button>
          </>
        ) : concesion?.ok ? (
          <>
            <div className="flex h-11 w-11 items-center justify-center rounded-full bg-brand-soft">
              <Gift className="h-5 w-5 text-brand" />
            </div>
            <h1 className="mt-5 text-2xl font-extrabold tracking-tight">
              El plan {plan}, abierto hasta el {formatoFecha(concesion.hasta)}
            </h1>
            <p className="mt-4 text-muted-foreground">
              Es cortesía de Mkpro. Incluye los 36 cursos, los 69 recursos descargables, IAFarma, la
              Rebotica y el foro, y puedes dar de alta al personal de la farmacia, cada uno con su
              cuenta, no solo al titular.
            </p>

            <div className="mt-7 rounded-lg border bg-white p-5">
              <p className="text-sm font-semibold">Al pulsar el botón:</p>
              <ul className="mt-3 space-y-2.5 text-sm text-muted-foreground">
                <li className="flex gap-2.5">
                  <Check className="mt-0.5 h-4 w-4 shrink-0 text-brand" />
                  <span>
                    Te pedimos el CIF y una tarjeta, para que la cuenta quede a nombre de la
                    farmacia con sus datos fiscales.
                  </span>
                </li>
                <li className="flex gap-2.5">
                  <Check className="mt-0.5 h-4 w-4 shrink-0 text-brand" />
                  <span>
                    <strong className="text-foreground">Hoy no se cobra nada.</strong> Verás 0,00 €
                    y la fecha del primer cobro.
                  </span>
                </li>
                <li className="flex gap-2.5">
                  <Check className="mt-0.5 h-4 w-4 shrink-0 text-brand" />
                  <span>
                    Puedes cancelar desde el portal cuando quieras. Te avisaremos por correo antes
                    de que acabe el plazo.
                  </span>
                </li>
              </ul>
            </div>

            <Button size="lg" className="mt-7 w-full sm:w-auto" onClick={activar} disabled={enviando}>
              {enviando ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Abriendo...
                </>
              ) : (
                `Activar el plan ${plan}`
              )}
            </Button>
          </>
        ) : (
          <>
            <div className="flex h-11 w-11 items-center justify-center rounded-full bg-amber-100">
              <AlertCircle className="h-5 w-5 text-amber-700" />
            </div>
            <h1 className="mt-5 text-2xl font-extrabold tracking-tight">
              Este correo no es el de la cortesía
            </h1>
            <p className="mt-4 text-muted-foreground">
              Has entrado como <strong className="text-foreground">{user.email}</strong>, y esa
              dirección no es la que tenemos asociada. La cortesía va ligada al correo exacto al que
              te escribimos.
            </p>
            <p className="mt-3 text-muted-foreground">
              Cierra la sesión y vuelve a entrar con ese correo, o responde al correo de Alejandro
              y lo ajustamos nosotros en un minuto.
            </p>
            <Button
              size="lg"
              variant="outline"
              className="mt-7 w-full sm:w-auto"
              onClick={async () => {
                await supabase.auth.signOut();
                irALogin(false);
              }}
            >
              Salir y entrar con otro correo
            </Button>
          </>
        )}
      </div>
    </div>
  );
};

export default Activar;
