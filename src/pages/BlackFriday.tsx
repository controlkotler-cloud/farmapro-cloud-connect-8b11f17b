import { useEffect, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { AlertCircle, ArrowLeft, Check, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { trackBeginCheckout } from '@/lib/analytics';

// ---------------------------------------------------------------------------
// Black Friday 2026 (decisión de Francesc del 17-11-2026): Plus anual a 180 €
// el primer año. No gasta plaza de fundador y renueva al anual normal (390 €).
// Solo altas nuevas, del 18-11 al 01-12 (Madrid; adelantado del 24-11 el 17-11-2026 para los anuncios de Meta), ambos incluidos.
//
// La que manda es `create-checkout` (oferta 'black-friday'): comprueba la
// ventana, rechaza a quien ya paga y pone el cupón. Esta página solo pinta y
// adelanta los mismos mensajes para no mandar a nadie a un error.
// ---------------------------------------------------------------------------

const DESDE = '2026-11-18';
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

  // Estilo Black Friday: fondo negro y verde lima de farmapro encendido.
  const botonLima =
    'h-14 w-full rounded-full bg-[#A6E04A] px-8 text-base font-black uppercase tracking-wide text-[#0B0B0B] hover:bg-[#B8EA6A] sm:w-auto';

  const Aviso = ({ titulo, texto }: { titulo: string; texto: string }) => (
    <div className="text-center">
      <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-full bg-white/10">
        <AlertCircle className="h-5 w-5 text-[#A6E04A]" />
      </div>
      <h1 className="mt-5 text-2xl font-extrabold tracking-tight text-white">{titulo}</h1>
      <p className="mt-4 text-neutral-400">{texto}</p>
      <Button size="lg" className={`mt-7 ${botonLima}`} asChild>
        <Link to="/precios">Ver los planes</Link>
      </Button>
    </div>
  );

  const cuerpo = () => {
    if (yaSuscrito) {
      return (
        <div className="text-center">
          <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-full bg-white/10">
            <Check className="h-5 w-5 text-[#A6E04A]" />
          </div>
          <h1 className="mt-5 text-2xl font-extrabold tracking-tight text-white">Ya tienes una suscripción</h1>
          <p className="mt-4 text-neutral-400">
            Esta oferta es para quien se suscribe por primera vez. Tu plan sigue igual.
          </p>
          <Button size="lg" className={`mt-7 ${botonLima}`} asChild>
            <Link to="/dashboard">Entrar en el portal</Link>
          </Button>
        </div>
      );
    }

    if (ventana === 'antes') {
      return (
        <Aviso
          titulo="El Black Friday empieza el 18 de noviembre"
          texto="Un año completo de Plus por 180 €, del 18 de noviembre al 1 de diciembre. Vuelve ese día."
        />
      );
    }

    if (ventana === 'terminada') {
      return (
        <Aviso
          titulo="El Black Friday ha terminado"
          texto="La oferta estuvo abierta del 18 de noviembre al 1 de diciembre."
        />
      );
    }

    return (
      <div className="text-center">
        <p className="text-xs font-extrabold uppercase tracking-[0.25em] text-[#A6E04A] sm:text-sm">
          Portal <em className="italic">farmapro</em> · Plus anual
        </p>
        <h1 className="mt-3 text-5xl font-black uppercase tracking-tight text-white sm:text-7xl">
          Black Friday
        </h1>

        <div className="mt-8 flex items-center justify-center gap-3">
          <s className="whitespace-nowrap text-3xl font-bold text-neutral-500 decoration-2">390&nbsp;€</s>
          <span className="whitespace-nowrap rounded-full bg-[#A6E04A] px-3 py-1.5 text-base font-black leading-none text-[#0B0B0B]">
            −54&nbsp;%
          </span>
        </div>
        <p className="mt-2 whitespace-nowrap text-8xl font-black leading-none tracking-tight text-[#A6E04A] sm:text-9xl">
          180&nbsp;€
        </p>
        <p className="mt-4 text-lg font-bold text-white">Un año completo de Plus</p>
        <p className="mt-1 text-neutral-400">
          Sale a 15&nbsp;€ al mes. Te ahorras 210&nbsp;€.
        </p>

        {cancelado ? (
          <p className="mt-6 text-sm text-neutral-300">
            No se ha cobrado nada. Cuando quieras, vuelve a pulsar el botón.
          </p>
        ) : null}

        <Button size="lg" className={`mt-8 ${botonLima}`} onClick={contratar} disabled={enviando}>
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
        <p className="mt-4 text-sm font-semibold tracking-wide text-neutral-300">
          Solo hasta el martes 1 de diciembre
        </p>

        <div className="mt-10 rounded-2xl border border-white/10 bg-white/5 p-6 text-left">
          <p className="text-sm font-extrabold uppercase tracking-wide text-white">Qué tienes con Plus</p>
          <ul className="mt-4 space-y-3 text-neutral-300">
            {INCLUYE.map((linea) => (
              <li key={linea} className="flex gap-3">
                <Check className="mt-0.5 h-5 w-5 shrink-0 text-[#A6E04A]" />
                <span>{linea}</span>
              </li>
            ))}
          </ul>
        </div>

        <p className="mt-6 text-sm text-neutral-400">
          Pago único hoy. Dentro de un año se renueva a{' '}
          <span className="whitespace-nowrap">390&nbsp;€/año</span> y puedes cancelarlo antes desde tu
          perfil.
        </p>
        <p className="mt-1 text-xs text-neutral-500">Para suscripciones nuevas. IVA incluido.</p>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-[#0B0B0B]">
      <header className="border-b border-white/10">
        <div className="container mx-auto flex items-center justify-between px-4 py-3">
          <Link to="/" className="flex items-center gap-1.5 text-sm text-neutral-400 hover:text-white">
            <ArrowLeft className="h-4 w-4" />
            Volver al inicio
          </Link>
          <img src="/logo-farmapro.svg" alt="farmapro" className="h-6 brightness-0 invert" />
        </div>
      </header>

      <div className="container mx-auto max-w-xl px-4 py-14 sm:py-20">
        {cuerpo()}
      </div>
    </div>
  );
};

export default BlackFriday;
