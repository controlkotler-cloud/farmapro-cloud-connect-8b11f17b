import { useEffect, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowLeft, Check, Gift, Loader2, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { trackBeginCheckout } from '@/lib/analytics';

// ---------------------------------------------------------------------------
// Oferta "un mes más de Plus a 0 €" (F11). Va a las cuentas cuya prueba acabó
// sin pagar: dejan la tarjeta en Stripe, tienen 30 días de Plus y después pasan
// a 19,90 €/mes con precio de fundador.
//
// Página propia y no /precios por lo mismo que /activar: aquí solo hay una cosa
// que hacer. La lista de quién puede vive en `portal_ofertas` (RLS cerrado), así
// que la RPC `mi_oferta_mes_plus` (security definer) dice en qué estado está la
// cuenta. La que manda es `create-checkout`: vuelve a comprobar la elegibilidad
// y es la que pone los 30 días de prueba. Esta página solo pinta.
// ---------------------------------------------------------------------------

type Oferta = {
  estado: 'sin_sesion' | 'suscrito' | 'usada' | 'sin_oferta' | 'caducada' | 'en_prueba' | 'elegible';
  fin_prueba?: string;
  valida_hasta?: string;
};

const MESES = [
  'enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio',
  'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre',
];

// `valida_hasta` es una fecha (AAAA-MM-DD) y `fin_prueba` un timestamptz: se
// leen distinto para que la fecha no se corra un día por la zona horaria.
const formatoFecha = (valor?: string) => {
  if (!valor) return '';
  if (/^\d{4}-\d{2}-\d{2}$/.test(valor)) {
    const [, m, d] = valor.split('-');
    return `${Number(d)} de ${MESES[Number(m) - 1]}`;
  }
  const f = new Date(valor);
  const partes = new Intl.DateTimeFormat('es-ES', {
    timeZone: 'Europe/Madrid', day: 'numeric', month: 'numeric',
  }).formatToParts(f);
  const d = partes.find((p) => p.type === 'day')?.value;
  const m = partes.find((p) => p.type === 'month')?.value;
  return d && m ? `${Number(d)} de ${MESES[Number(m) - 1]}` : '';
};

const INCLUYE = [
  'Cursos y recursos sin límite',
  'IAFarma: texto ilimitado y 12 imágenes al mes',
  'Comunidad completa, con retos y ranking',
  'Eventos exclusivos farmapro',
];

const Continuar = () => {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const cancelado = params.get('checkout') === 'cancelled';
  // Con `modo` puesto el login se abre en «entrar» y no en registro: estas
  // cuentas ya existen.
  const irALogin = () => navigate('/login?modo=login&next=/continuar');
  const { user, loading: authLoading } = useAuth();
  const { toast } = useToast();
  const [oferta, setOferta] = useState<Oferta | null>(null);
  const [cargando, setCargando] = useState(true);
  const [enviando, setEnviando] = useState(false);
  const [fallo, setFallo] = useState(false);
  const [motivo, setMotivo] = useState('');
  const [intento, setIntento] = useState(0);
  // Mismo seguro que en /activar: si `getSession()` no resuelve, a los 6
  // segundos seguimos con lo que haya en vez de dejar un spinner eterno.
  const [esperaAuth, setEsperaAuth] = useState(true);

  useEffect(() => {
    document.title = 'Un mes más de Plus · portal farmapro';
  }, []);

  useEffect(() => {
    if (!authLoading) {
      setEsperaAuth(false);
      return;
    }
    const t = setTimeout(() => setEsperaAuth(false), 6000);
    return () => clearTimeout(t);
  }, [authLoading]);

  const esperando = authLoading && esperaAuth;

  useEffect(() => {
    if (esperando) return;
    if (!user) {
      setCargando(false);
      return;
    }
    let vivo = true;
    setFallo(false);
    setMotivo('');
    (async () => {
      try {
        // `mi_oferta_mes_plus` no está en los types generados. El `bind` hace
        // falta: `supabase.rpc` usa `this` por dentro (ver Activar.tsx).
        const rpc = supabase.rpc.bind(supabase) as unknown as (
          fn: string,
        ) => Promise<{ data: Oferta | null; error: unknown }>;
        const { data, error } = await Promise.race([
          rpc('mi_oferta_mes_plus'),
          new Promise<never>((_, rechaza) =>
            setTimeout(() => rechaza(new Error('mi_oferta_mes_plus: sin respuesta')), 10000),
          ),
        ]);
        if (!vivo) return;
        if (error) throw error;
        setOferta(data ?? { estado: 'sin_oferta' });
      } catch (e) {
        console.error('[continuar] no se ha podido comprobar la oferta', e);
        if (!vivo) return;
        const err = e as { code?: string; message?: string; status?: number };
        setMotivo(
          [err?.code, err?.status, err?.message ?? String(e)]
            .filter(Boolean)
            .join(' · ')
            .slice(0, 200),
        );
        setFallo(true);
      } finally {
        if (vivo) setCargando(false);
      }
    })();
    return () => {
      vivo = false;
    };
  }, [user, esperando, intento]);

  const activar = async () => {
    setEnviando(true);
    const { data, error } = await supabase.functions.invoke('create-checkout', {
      body: { plan: 'plus', cycle: 'monthly', oferta: 'mes-plus-tarjeta' },
    });
    setEnviando(false);

    if (error || !data?.url) {
      // 403 = create-checkout no la ve elegible (ya usada, fuera de plazo...).
      // Volvemos a preguntar a la RPC para enseñar el estado real.
      const status = (error as { context?: { status?: number } } | null)?.context?.status;
      if (status === 403) {
        setCargando(true);
        setIntento((n) => n + 1);
        return;
      }
      toast({
        title: 'No se ha podido abrir la activación',
        description:
          'Inténtalo de nuevo en unos segundos. Si sigue fallando, responde al correo de Alejandro y lo miramos.',
        variant: 'destructive',
      });
      return;
    }
    trackBeginCheckout({ plan: 'plus', cycle: 'monthly', founder: data.founder === true, trial: true });
    window.location.href = data.url;
  };

  const salirYEntrar = async () => {
    await supabase.auth.signOut();
    irALogin();
  };

  const Icono = ({ aviso }: { aviso?: boolean }) =>
    aviso ? (
      <div className="flex h-11 w-11 items-center justify-center rounded-full bg-amber-100">
        <AlertCircle className="h-5 w-5 text-amber-700" />
      </div>
    ) : (
      <div className="flex h-11 w-11 items-center justify-center rounded-full bg-brand-soft">
        <Gift className="h-5 w-5 text-brand" />
      </div>
    );

  const cuerpo = () => {
    if (cargando || esperando) {
      return (
        <div className="flex items-center gap-3 text-muted-foreground">
          <Loader2 className="h-5 w-5 animate-spin" />
          Un momento, estamos comprobando tu cuenta.
        </div>
      );
    }

    if (fallo) {
      return (
        <>
          <Icono aviso />
          <h1 className="mt-5 text-2xl font-extrabold tracking-tight">
            No hemos podido comprobar tu cuenta
          </h1>
          <p className="mt-4 text-muted-foreground">
            Puede ser un corte de conexión, o que tu sesión haya caducado. Prueba otra vez y, si
            sigue sin cargar, sal y vuelve a entrar con tu correo.
          </p>
          {motivo ? (
            <p className="mt-3 break-words font-mono text-xs text-muted-foreground/70">
              Detalle: {motivo}
            </p>
          ) : null}
          <div className="mt-7 flex flex-col gap-3 sm:flex-row">
            <Button
              size="lg"
              onClick={() => {
                setCargando(true);
                setIntento((n) => n + 1);
              }}
            >
              Probar otra vez
            </Button>
            <Button size="lg" variant="outline" onClick={salirYEntrar}>
              Salir y entrar de nuevo
            </Button>
          </div>
        </>
      );
    }

    if (!user || oferta?.estado === 'sin_sesion') {
      return (
        <>
          <Icono />
          <h1 className="mt-5 text-2xl font-extrabold tracking-tight">Un mes más de Plus, gratis</h1>
          <p className="mt-4 text-muted-foreground">
            Y tu precio de fundador guardado. Entra con tu cuenta del portal, la de siempre, y lo
            activas en un momento.
          </p>
          <Button size="lg" className="mt-7 w-full sm:w-auto" onClick={irALogin}>
            Entrar con mi cuenta
          </Button>
        </>
      );
    }

    if (oferta?.estado === 'suscrito') {
      return (
        <>
          <div className="flex h-11 w-11 items-center justify-center rounded-full bg-brand-soft">
            <Check className="h-5 w-5 text-brand" />
          </div>
          <h1 className="mt-5 text-2xl font-extrabold tracking-tight">Ya eres Plus</h1>
          <p className="mt-4 text-muted-foreground">
            Tu suscripción está en marcha. No hay nada más que hacer aquí.
          </p>
          <Button size="lg" className="mt-7 w-full sm:w-auto" asChild>
            <Link to="/dashboard">Entrar en el portal</Link>
          </Button>
        </>
      );
    }

    if (oferta?.estado === 'en_prueba') {
      return (
        <>
          <Icono />
          <h1 className="mt-5 text-2xl font-extrabold tracking-tight">Aún estás en tu prueba</h1>
          <p className="mt-4 text-muted-foreground">
            Lo tienes todo abierto hasta el {formatoFecha(oferta.fin_prueba)}. Aprovéchalo: no hace
            falta que hagas nada más por ahora.
          </p>
          <Button size="lg" className="mt-7 w-full sm:w-auto" asChild>
            <Link to="/dashboard">Entrar en el portal</Link>
          </Button>
        </>
      );
    }

    if (oferta?.estado === 'elegible') {
      return (
        <>
          <Icono />
          <h1 className="mt-5 text-2xl font-extrabold tracking-tight">Un mes más de Plus, gratis</h1>
          <p className="mt-4 text-muted-foreground">
            Y tu precio de fundador guardado:{' '}
            <strong className="text-foreground">19,90 €/mes en lugar de 39 €</strong>, mientras
            mantengas la suscripción.
          </p>

          <div className="mt-7 rounded-lg border bg-white p-5">
            <ul className="space-y-2.5 text-sm text-muted-foreground">
              {INCLUYE.map((linea) => (
                <li key={linea} className="flex gap-2.5">
                  <Check className="mt-0.5 h-4 w-4 shrink-0 text-brand" />
                  <span>{linea}</span>
                </li>
              ))}
            </ul>
          </div>

          <p className="mt-5 text-sm font-semibold text-foreground">
            Solo para las 100 primeras suscripciones. Cuando se cubran, no vuelve.
          </p>

          {cancelado ? (
            <p className="mt-4 text-sm text-muted-foreground">
              No se ha activado nada. Cuando quieras, vuelve a pulsar el botón.
            </p>
          ) : null}

          <Button size="lg" className="mt-6 w-full sm:w-auto" onClick={activar} disabled={enviando}>
            {enviando ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Abriendo...
              </>
            ) : (
              'Activar mi mes gratis'
            )}
          </Button>
          <p className="mt-3 text-sm text-muted-foreground">
            Hoy no pagas nada. Cancelas cuando quieras desde tu perfil.
          </p>
          {oferta.valida_hasta ? (
            <p className="mt-1 text-xs text-muted-foreground/80">
              Propuesta abierta hasta el {formatoFecha(oferta.valida_hasta)}.
            </p>
          ) : null}
        </>
      );
    }

    if (oferta?.estado === 'sin_oferta') {
      return (
        <>
          <Icono aviso />
          <h1 className="mt-5 text-2xl font-extrabold tracking-tight">
            Esta propuesta no está a nombre de esta cuenta
          </h1>
          <p className="mt-4 text-muted-foreground">
            Has entrado como <strong className="text-foreground">{user.email}</strong>. Si te
            escribimos a otro correo, sal y entra con ese.
          </p>
          <div className="mt-7 flex flex-col gap-3 sm:flex-row">
            <Button size="lg" variant="outline" onClick={salirYEntrar}>
              Entrar con otro correo
            </Button>
            <Button size="lg" variant="ghost" asChild>
              <Link to="/precios">Ver los planes</Link>
            </Button>
          </div>
        </>
      );
    }

    // usada o caducada
    return (
      <>
        <Icono aviso />
        <h1 className="mt-5 text-2xl font-extrabold tracking-tight">
          {oferta?.estado === 'caducada'
            ? 'Esta propuesta ya ha terminado'
            : 'Esta propuesta ya se ha usado en tu cuenta'}
        </h1>
        <p className="mt-4 text-muted-foreground">
          Si quieres seguir con el portal, tienes los planes aquí.
        </p>
        <Button size="lg" className="mt-7 w-full sm:w-auto" asChild>
          <Link to="/precios">Ver los planes</Link>
        </Button>
      </>
    );
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
        {cuerpo()}
      </div>
    </div>
  );
};

export default Continuar;
