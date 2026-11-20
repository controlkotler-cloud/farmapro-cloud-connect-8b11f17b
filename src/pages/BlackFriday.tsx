import { useCallback, useEffect, useRef, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { AlertCircle, ArrowLeft, Check, Loader2, Lock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { trackBeginCheckout, trackPurchaseReturn } from '@/lib/analytics';

// ---------------------------------------------------------------------------
// Black Friday 2026 (decisión de Francesc del 17-11-2026): Plus anual a 180 €
// el primer año. No gasta plaza de fundador y renueva al anual normal (390 €).
// Solo altas nuevas, del 18-11 al 01-12 a las 23:59 (Madrid), ambos incluidos.
//
// La que manda es `create-checkout` (oferta 'black-friday'): comprueba la
// ventana, rechaza a quien ya paga y pone el cupón. Esta página solo pinta y
// adelanta los mismos mensajes para no mandar a nadie a un error.
//
// Urgencia (18-11-2026, «tienes que generar FOMO, última hora»): la cuenta
// atrás es real, contra el cierre de la oferta. No hay plazas inventadas ni
// relojes que se reinician.
//
// Embudo (20-11-2026, «que el que llegue pague lo más rápido y directo
// posible»): sin cuenta previa. El botón abre Stripe al momento; la cuenta del
// portal nace con el correo que pone en el pago y, al volver
// (?checkout=success&session_id=...), `create-checkout` (accion
// 'acceso-compra') le devuelve un enlace de acceso y entra sin contraseña.
// Si ese correo ya tenía cuenta, el Plus se activa en ella y entra con su
// contraseña. Quien ya tiene sesión paga igual que antes.
// ---------------------------------------------------------------------------

const DESDE = '2026-11-18';
const HASTA = '2026-12-01';
// 01-12 a las 23:59:59 en Madrid (en diciembre, UTC+1).
const FIN_MS = Date.parse('2026-12-01T23:59:59+01:00');
const PRECIO = 180;

const INCLUYE = [
  'Todos los cursos y recursos del portal, sin límite',
  'IAFarma ilimitado para tus textos y 12 imágenes al mes',
  'La comunidad completa, con un reto cada semana y ranking',
  'Eventos exclusivos farmapro',
  'Todo lo que se publique durante el año, sin pagar más',
];

const PREGUNTAS = [
  {
    p: '¿Cuándo termina?',
    r: 'El martes 1 de diciembre a las 23:59. A partir de ese minuto, el Plus anual vuelve a costar 390\u00a0€.',
  },
  {
    p: '¿Qué pasa dentro de un año?',
    r: 'Se renueva a 390\u00a0€/año. Puedes cancelar la renovación cuando quieras desde tu perfil.',
  },
  {
    p: 'Ya tengo cuenta gratis en el portal, ¿me vale?',
    r: 'Sí. La oferta es para quien todavía no paga ninguna suscripción. Paga con el mismo correo de tu cuenta y el Plus se activa en ella.',
  },
];

// Fecha de Madrid como 'AAAA-MM-DD' montada pieza a pieza. No se usa .format()
// de 'en-CA': algunos navegadores (WebView de Instagram/Facebook en ciertos
// iOS) la devuelven como '11/20/2026', y comparada con '2026-11-18' daba
// 'antes' y mandaba a /precios a quien venía del anuncio (20-11-2026).
const hoyMadrid = (): string | null => {
  try {
    const partes = new Intl.DateTimeFormat('en-GB', {
      timeZone: 'Europe/Madrid', year: 'numeric', month: '2-digit', day: '2-digit',
    }).formatToParts(new Date());
    const v = (t: string) => partes.find((p) => p.type === t)?.value ?? '';
    const iso = `${v('year')}-${v('month').padStart(2, '0')}-${v('day').padStart(2, '0')}`;
    return /^\d{4}-\d{2}-\d{2}$/.test(iso) ? iso : null;
  } catch {
    return null;
  }
};

type Estado = 'antes' | 'abierta' | 'terminada';

// Las horas límite van en milisegundos absolutos, que no dependen del
// navegador. La fecha de Madrid solo afina; si no se puede leer, manda el
// reloj y, ante la duda, la página vende (el servidor vuelve a comprobarlo).
const INICIO_MS = Date.parse(`${DESDE}T00:00:00+01:00`);

const estadoVentana = (): Estado => {
  const ahora = Date.now();
  if (ahora > FIN_MS) return 'terminada';
  const hoy = hoyMadrid();
  if (hoy) {
    if (hoy < DESDE) return 'antes';
    if (hoy > HASTA) return 'terminada';
    return 'abierta';
  }
  return ahora < INICIO_MS ? 'antes' : 'abierta';
};

const useRestante = () => {
  const [ms, setMs] = useState(() => Math.max(0, FIN_MS - Date.now()));
  useEffect(() => {
    const id = window.setInterval(() => setMs(Math.max(0, FIN_MS - Date.now())), 1000);
    return () => window.clearInterval(id);
  }, []);
  const s = Math.floor(ms / 1000);
  return {
    ms,
    dias: Math.floor(s / 86400),
    horas: Math.floor((s % 86400) / 3600),
    min: Math.floor((s % 3600) / 60),
    seg: s % 60,
  };
};

const dos = (n: number) => String(n).padStart(2, '0');

const Casilla = ({ n, etiqueta }: { n: string; etiqueta: string }) => (
  <div className="flex-1 rounded-xl border border-white/15 bg-white/[0.06] px-1 py-3">
    <p className="text-4xl font-black tabular-nums leading-none text-white sm:text-5xl">{n}</p>
    <p className="mt-1.5 text-[10px] font-bold uppercase tracking-[0.2em] text-neutral-400">{etiqueta}</p>
  </div>
);


const BlackFriday = () => {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const cancelado = params.get('checkout') === 'cancelled';
  const pagado = params.get('checkout') === 'success';
  const sessionId = params.get('session_id');
  const comprarAlVolver = params.get('comprar') === '1';
  const { user } = useAuth();
  const { toast } = useToast();
  const [ventana, setVentana] = useState<Estado>(estadoVentana);
  const [enviando, setEnviando] = useState(false);
  const [yaSuscrito, setYaSuscrito] = useState(false);
  const autoLanzado = useRef(false);
  const accesoPedido = useRef(false);
  const [acceso, setAcceso] = useState<'entrando' | 'ya_tenia' | 'revisa_correo' | null>(
    pagado ? 'entrando' : null,
  );
  const [correoCompra, setCorreoCompra] = useState<string | null>(null);
  const r = useRestante();

  const ultimoDia = hoyMadrid() === HASTA;
  const ultimas48 = r.ms <= 48 * 3600 * 1000;

  useEffect(() => {
    document.title = 'Black Friday: un año de Plus por 180 € (antes 390 €) · portal farmapro';
  }, []);

  // Al llegar a cero, la página cierra la oferta sin recargar.
  useEffect(() => {
    if (r.ms === 0 && ventana === 'abierta') setVentana('terminada');
  }, [r.ms, ventana]);

  const contratar = useCallback(async () => {
    // Sin sesión se paga directamente: la cuenta se crea con el correo del
    // pago. Si en realidad hay sesión, la función la detecta y la usa.
    setEnviando(true);
    const { data, error } = await supabase.functions.invoke('create-checkout', {
      body: { plan: 'plus', cycle: 'yearly', oferta: 'black-friday', ...(user ? {} : { invitado: true }) },
    });

    if (error || !data?.url) {
      setEnviando(false);
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
  }, [user, toast]);

  // Vuelta del registro o del login con ?comprar=1: se abre el pago una vez.
  useEffect(() => {
    if (!comprarAlVolver || !user || autoLanzado.current || ventana !== 'abierta' || cancelado) return;
    autoLanzado.current = true;
    void contratar();
  }, [comprarAlVolver, user, ventana, cancelado, contratar]);

  // Vuelta de Stripe con el pago hecho: se mide la compra y, si la cuenta
  // nació de este pago, se entra al portal sin contraseña.
  useEffect(() => {
    if (!pagado || !sessionId || accesoPedido.current) return;
    accesoPedido.current = true;
    trackPurchaseReturn(sessionId);
    if (user) {
      navigate('/perfil?bienvenida=black-friday', { replace: true });
      return;
    }
    void (async () => {
      // El pago puede tardar unos segundos en constar como completado.
      for (let intento = 0; intento < 4; intento++) {
        const { data, error } = await supabase.functions.invoke('create-checkout', {
          body: { accion: 'acceso-compra', session_id: sessionId },
        });
        if (!error && data?.action_link) {
          window.location.href = data.action_link;
          return;
        }
        if (!error && data?.ya_tenia_cuenta) {
          setCorreoCompra(data.email ?? null);
          setAcceso('ya_tenia');
          return;
        }
        await new Promise((res) => window.setTimeout(res, 2000));
      }
      setAcceso('revisa_correo');
    })();
  }, [pagado, sessionId, user, navigate]);

  const botonComprar = () => (
    <Button
      size="lg"
      onClick={contratar}
      disabled={enviando}
      className={`h-16 w-full rounded-full bg-[#A6E04A] px-8 text-lg font-black uppercase tracking-wide text-[#0B0B0B] shadow-[0_0_40px_rgba(166,224,74,0.35)] hover:bg-[#B8EA6A]`}
    >
      {enviando ? (
        <>
          <Loader2 className="mr-2 h-5 w-5 animate-spin" />
          Abriendo el pago...
        </>
      ) : (
        'Lo quiero por 180 €'
      )}
    </Button>
  );

  const aviso = (titulo: string, texto: string) => (
    <div className="text-center">
      <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-full bg-white/10">
        <AlertCircle className="h-5 w-5 text-[#A6E04A]" />
      </div>
      <h1 className="mt-5 text-2xl font-extrabold tracking-tight text-white">{titulo}</h1>
      <p className="mt-4 text-neutral-400">{texto}</p>
      <Button
        size="lg"
        className="mt-7 h-14 w-full rounded-full bg-[#A6E04A] px-8 text-base font-black uppercase tracking-wide text-[#0B0B0B] hover:bg-[#B8EA6A] sm:w-auto"
        asChild
      >
        <Link to="/precios">Ver los planes</Link>
      </Button>
    </div>
  );

  const etiquetaUrgencia = ultimoDia
    ? 'Hoy es el último día · termina a las 23:59'
    : ultimas48
      ? 'Últimas 48 horas · después vuelve a 390 €'
      : 'El precio vuelve a 390 € en';

  const abierta = ventana === 'abierta' && !yaSuscrito && !acceso;

  const cuerpo = () => {
    if (acceso) {
      const entrando = acceso === 'entrando';
      return (
        <div className="text-center">
          <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-full bg-[#A6E04A]/15">
            {entrando ? (
              <Loader2 className="h-5 w-5 animate-spin text-[#A6E04A]" />
            ) : (
              <Check className="h-5 w-5 text-[#A6E04A]" />
            )}
          </div>
          <h1 className="mt-5 text-2xl font-extrabold tracking-tight text-white">
            {entrando ? 'Pago hecho. Entrando en el portal...' : 'Pago hecho: ya tienes tu año de Plus'}
          </h1>
          {acceso === 'ya_tenia' && (
            <p className="mt-4 text-neutral-400">
              El Plus se ha activado en tu cuenta{correoCompra ? ` (${correoCompra})` : ''}. Entra con tu
              contraseña de siempre.
            </p>
          )}
          {acceso === 'revisa_correo' && (
            <p className="mt-4 text-neutral-400">
              Tu cuenta es el correo que pusiste en el pago. Para entrar, pulsa «¿Olvidaste tu contraseña?»
              con ese correo y crea la tuya en un minuto.
            </p>
          )}
          {!entrando && (
            <Button
              size="lg"
              className="mt-7 h-14 w-full rounded-full bg-[#A6E04A] px-8 text-base font-black uppercase tracking-wide text-[#0B0B0B] hover:bg-[#B8EA6A] sm:w-auto"
              asChild
            >
              <Link to="/login?next=/perfil">Entrar en el portal</Link>
            </Button>
          )}
        </div>
      );
    }

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
          <Button
            size="lg"
            className="mt-7 h-14 w-full rounded-full bg-[#A6E04A] px-8 text-base font-black uppercase tracking-wide text-[#0B0B0B] hover:bg-[#B8EA6A] sm:w-auto"
            asChild
          >
            <Link to="/dashboard">Entrar en el portal</Link>
          </Button>
        </div>
      );
    }

    if (ventana === 'antes') {
      return (
        aviso(
          'El Black Friday empieza el 18 de noviembre',
          'Un año completo de Plus por 180 €, del 18 de noviembre al 1 de diciembre. Vuelve ese día.',
        )
      );
    }

    if (ventana === 'terminada') {
      return (
        aviso(
          'El Black Friday ha terminado',
          'La oferta estuvo abierta del 18 de noviembre al 1 de diciembre a las 23:59.',
        )
      );
    }

    return (
      <div className="text-center">
        <p className="text-xs font-extrabold uppercase tracking-[0.25em] text-[#A6E04A] sm:text-sm">
          Portal <em className="italic">farmapro</em> · Plus anual
        </p>
        <h1 className="mt-3 text-6xl font-black uppercase leading-[0.9] tracking-tight text-white sm:text-8xl">
          Black
          <br />
          Friday
        </h1>

        <div className="mt-9 flex items-center justify-center gap-3">
          <s className="whitespace-nowrap text-3xl font-bold text-neutral-500 decoration-[#FF4D4D] decoration-[3px]">
            390&nbsp;€
          </s>
          <span className="whitespace-nowrap rounded-full bg-[#FF4D4D] px-3 py-1.5 text-base font-black leading-none text-white">
            −54&nbsp;%
          </span>
        </div>
        <p className="mt-2 whitespace-nowrap text-[7rem] font-black leading-none tracking-tighter text-[#A6E04A] sm:text-[9rem]">
          180&nbsp;€
        </p>
        <p className="mt-3 text-xl font-extrabold text-white">Un año entero de Plus</p>
        <p className="mt-1 text-neutral-300">
          Son 15&nbsp;€ al mes. Te ahorras <strong className="text-white">210&nbsp;€</strong>.
        </p>

        {/* Cuenta atrás real hasta el cierre de la oferta */}
        <div
          className={`mt-9 rounded-2xl border p-4 sm:p-5 ${
            ultimas48 ? 'border-[#FF4D4D]/60 bg-[#FF4D4D]/10' : 'border-white/10 bg-white/[0.03]'
          }`}
        >
          <p
            className={`text-xs font-extrabold uppercase tracking-[0.2em] sm:text-sm ${
              ultimas48 ? 'animate-pulse text-[#FF6B6B]' : 'text-neutral-300'
            }`}
          >
            {etiquetaUrgencia}
          </p>
          <div className="mt-3 flex gap-2 sm:gap-3">
            <Casilla n={String(r.dias)} etiqueta={r.dias === 1 ? 'día' : 'días'} />
            <Casilla n={dos(r.horas)} etiqueta="horas" />
            <Casilla n={dos(r.min)} etiqueta="min" />
            <Casilla n={dos(r.seg)} etiqueta="seg" />
          </div>
        </div>

        {cancelado ? (
          <p className="mt-6 text-sm text-neutral-300">
            No se ha cobrado nada. El precio de 180&nbsp;€ sigue aquí hasta que el reloj llegue a cero.
          </p>
        ) : null}

        <div className="mt-7">
          {botonComprar()}
        </div>
        <p className="mt-3 flex items-center justify-center gap-1.5 text-xs text-neutral-400">
          <Lock className="h-3.5 w-3.5" />
          {user
            ? 'Pago seguro con Stripe · IVA incluido'
            : 'Pagas con Stripe en un minuto y entras al momento · IVA incluido'}
        </p>

        <div className="mt-12 rounded-2xl border border-white/10 bg-white/5 p-6 text-left">
          <p className="text-sm font-extrabold uppercase tracking-wide text-white">Lo que entra en tus 180&nbsp;€</p>
          <ul className="mt-4 space-y-3 text-neutral-200">
            {INCLUYE.map((linea) => (
              <li key={linea} className="flex gap-3">
                <Check className="mt-0.5 h-5 w-5 shrink-0 text-[#A6E04A]" />
                <span>{linea}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="mt-6 grid grid-cols-2 gap-3 text-left">
          <div className="rounded-2xl border border-white/10 p-4">
            <p className="text-xs font-bold uppercase tracking-wide text-neutral-500">Precio normal</p>
            <p className="mt-1 text-2xl font-black text-neutral-500 line-through decoration-[#FF4D4D]">390&nbsp;€/año</p>
          </div>
          <div className="rounded-2xl border border-[#A6E04A]/50 bg-[#A6E04A]/10 p-4">
            <p className="text-xs font-bold uppercase tracking-wide text-[#A6E04A]">Hasta el 1 de diciembre</p>
            <p className="mt-1 text-2xl font-black text-white">180&nbsp;€/año</p>
          </div>
        </div>

        <div className="mt-12 space-y-5 text-left">
          {PREGUNTAS.map(({ p, r: resp }) => (
            <div key={p}>
              <p className="font-bold text-white">{p}</p>
              <p className="mt-1 text-neutral-400">{resp}</p>
            </div>
          ))}
        </div>

        <div className="mt-12">
          {botonComprar()}
          <p className="mt-3 text-sm font-semibold text-neutral-300">
            Cuando el reloj llegue a cero, vuelve a costar 390&nbsp;€.
          </p>
        </div>
        <p className="mt-6 text-xs text-neutral-500">
          Para suscripciones nuevas. Pago único hoy; dentro de un año se renueva a 390&nbsp;€/año salvo que lo
          canceles antes desde tu perfil.
        </p>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-[#0B0B0B]">
      {abierta && (
        <div className="sticky top-0 z-30 bg-[#A6E04A] px-4 py-2 text-center text-xs font-black uppercase tracking-wide text-[#0B0B0B] sm:text-sm">
          Black Friday −54&nbsp;% · termina en{' '}
          <span className="tabular-nums">
            {r.dias > 0 ? `${r.dias} ${r.dias === 1 ? 'día' : 'días'} · ` : ''}
            {dos(r.horas)}:{dos(r.min)}:{dos(r.seg)}
          </span>
        </div>
      )}
      <header className="border-b border-white/10">
        <div className="container mx-auto flex items-center justify-between px-4 py-3">
          <Link to="/" className="flex items-center gap-1.5 text-sm text-neutral-400 hover:text-white">
            <ArrowLeft className="h-4 w-4" />
            Volver al inicio
          </Link>
          <img src="/logo-farmapro.svg" alt="farmapro" className="h-6 brightness-0 invert" />
        </div>
      </header>

      <div className={`container mx-auto max-w-xl px-4 py-12 sm:py-16 ${abierta ? 'pb-32 sm:pb-16' : ''}`}>
        {cuerpo()}
      </div>

      {/* Botón fijo en móvil: la compra siempre a un toque */}
      {abierta && (
        <div className="fixed inset-x-0 bottom-0 z-30 border-t border-white/10 bg-[#0B0B0B]/95 px-4 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-3 backdrop-blur sm:hidden">
          <div className="flex items-center gap-3">
            <div className="shrink-0 leading-tight">
              <p className="text-xs text-neutral-500 line-through">390&nbsp;€</p>
              <p className="text-xl font-black text-[#A6E04A]">180&nbsp;€</p>
            </div>
            <Button
              onClick={contratar}
              disabled={enviando}
              className="h-12 flex-1 rounded-full bg-[#A6E04A] text-sm font-black uppercase tracking-wide text-[#0B0B0B] hover:bg-[#B8EA6A]"
            >
              {enviando ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Lo quiero'}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default BlackFriday;
