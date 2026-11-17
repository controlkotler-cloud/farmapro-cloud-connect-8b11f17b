import { useEffect, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { AlertCircle, ArrowLeft, Check, Loader2, Tag } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { trackBeginCheckout } from '@/lib/analytics';

// ---------------------------------------------------------------------------
// Black Friday 2026 (decisión de Francesc del 17-11-2026): Plus anual a 180 €
// el primer año. No gasta plaza de fundador y renueva al anual normal (390 €).
// Solo altas nuevas, del 24-11 al 01-12 (Madrid), ambos incluidos.
//
// La que manda es `create-checkout` (oferta 'black-friday'): comprueba la
// ventana, rechaza a quien ya paga y pone el cupón. Esta página solo pinta y
// adelanta los mismos mensajes para no mandar a nadie a un error.
// ---------------------------------------------------------------------------

const DESDE = '2026-11-24';
const HASTA = '2026-12-01';
const PRECIO = 180;

const INCLUYE = [
  'Cursos y recursos sin límite',
  'IAFarma: texto ilimitado y 12 imágenes al mes',
  'Comunidad completa, con retos y ranking',
  'Eventos exclusivos farmapro',
];

const hoyMadrid = () =>
  new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Europe/Madrid', year: 'numeric', month: '2-digit', day: '2-digit',
  }).format(new Date());

type Estado = 'antes' | 'abierta' | 'terminada';

const estadoVentana = (): Estado => {
  const hoy = hoyMadrid();
  if (hoy < DESDE) return 'antes';
  if (hoy > HASTA) return 'terminada';
  return 'abierta';
};

const BlackFriday = () => {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const cancelado = params.get('checkout') === 'cancelled';
  const { user } = useAuth();
  const { toast } = useToast();
  const [ventana, setVentana] = useState<Estado>(estadoVentana);
  const [enviando, setEnviando] = useState(false);
  const [yaSuscrito, setYaSuscrito] = useState(false);

  useEffect(() => {
    document.title = 'Black Friday: un año de Plus por 180 € · portal farmapro';
  }, []);

  const contratar = async () => {
    // Sin sesión, al registro (es para altas nuevas); quien ya tiene cuenta
    // pasa a «entrar» desde el propio formulario.
    if (!user) {
      navigate('/login?next=/black-friday');
      return;
    }
    setEnviando(true);
    const { data, error } = await supabase.functions.invoke('create-checkout', {
      body: { plan: 'plus', cycle: 'yearly', oferta: 'black-friday' },
    });
    setEnviando(false);

    if (error || !data?.url) {
      const status = (error as { context?: { status?: number } } | null)?.context?.status;
      if (status === 409) {
        setYaSuscrito(true);
        return;
      }
      if (status === 403) {
        setVentana(estadoVentana() === 'antes' ? 'antes' : 'terminada');
        return;
      }
      toast({
        title: 'No se ha podido abrir el pago',
        description: 'Inténtalo de nuevo en unos segundos. Si sigue fallando, escribe a hola@mkpro.es.',
        variant: 'destructive',
      });
      return;
    }
    trackBeginCheckout({ plan: 'plus', cycle: 'yearly', founder: false, value: PRECIO });
    window.location.href = data.url;
  };

  const Aviso = ({ titulo, texto }: { titulo: string; texto: string }) => (
    <>
      <div className="flex h-11 w-11 items-center justify-center rounded-full bg-amber-100">
        <AlertCircle className="h-5 w-5 text-amber-700" />
      </div>
      <h1 className="mt-5 text-2xl font-extrabold tracking-tight">{titulo}</h1>
      <p className="mt-4 text-muted-foreground">{texto}</p>
      <Button size="lg" className="mt-7 w-full sm:w-auto" asChild>
        <Link to="/precios">Ver los planes</Link>
      </Button>
    </>
  );

  const cuerpo = () => {
    if (yaSuscrito) {
      return (
        <>
          <div className="flex h-11 w-11 items-center justify-center rounded-full bg-brand-soft">
            <Check className="h-5 w-5 text-brand" />
          </div>
          <h1 className="mt-5 text-2xl font-extrabold tracking-tight">Ya tienes una suscripción</h1>
          <p className="mt-4 text-muted-foreground">
            Esta oferta es para quien se suscribe por primera vez. Tu plan sigue igual.
          </p>
          <Button size="lg" className="mt-7 w-full sm:w-auto" asChild>
            <Link to="/dashboard">Entrar en el portal</Link>
          </Button>
        </>
      );
    }

    if (ventana === 'antes') {
      return (
        <Aviso
          titulo="El Black Friday empieza el 24 de noviembre"
          texto="Un año completo de Plus por 180 €, del 24 de noviembre al 1 de diciembre. Vuelve ese día."
        />
      );
    }

    if (ventana === 'terminada') {
      return (
        <Aviso
          titulo="El Black Friday ha terminado"
          texto="La oferta estuvo abierta del 24 de noviembre al 1 de diciembre."
        />
      );
    }

    return (
      <>
        <div className="flex h-11 w-11 items-center justify-center rounded-full bg-brand-soft">
          <Tag className="h-5 w-5 text-brand" />
        </div>
        <p className="mt-5 text-sm font-semibold uppercase tracking-wide text-brand">
          Black Friday · hasta el 1 de diciembre
        </p>
        <h1 className="mt-2 text-3xl font-extrabold tracking-tight">
          Un año completo de Plus por 180 €
        </h1>
        <p className="mt-4 text-muted-foreground">
          <strong className="text-foreground">15 € al mes</strong> por todo el portal durante doce
          meses. El precio normal del año es 390 €.
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

        {cancelado ? (
          <p className="mt-5 text-sm text-muted-foreground">
            No se ha cobrado nada. Cuando quieras, vuelve a pulsar el botón.
          </p>
        ) : null}

        <Button size="lg" className="mt-6 w-full sm:w-auto" onClick={contratar} disabled={enviando}>
          {enviando ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Abriendo el pago...
            </>
          ) : user ? (
            'Quiero mi año de Plus por 180 €'
          ) : (
            'Crear mi cuenta y pagar 180 €'
          )}
        </Button>
        <p className="mt-3 text-sm text-muted-foreground">
          Pago único hoy. Dentro de un año se renueva a 390 €/año y puedes cancelarlo antes desde
          tu perfil.
        </p>
        <p className="mt-1 text-xs text-muted-foreground/80">
          Para suscripciones nuevas. IVA incluido.
        </p>
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

export default BlackFriday;
