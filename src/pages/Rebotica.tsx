import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Sparkles, Gift, UserPlus, PackageOpen, ShieldCheck, ScrollText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { Cajonera } from '@/components/rebotica/Cajonera';
import { PLANS, LAUNCH, getLaunchStatus } from '@/lib/plans';
import { PlanCard } from '@/pages/Precios';
import {
  REBOTICA_NEXT_OPENING,
  REBOTICA_OPEN_REWARD_ENABLED,
  readReboticaContextFromUrl,
  storeReboticaContext,
  loadReboticaContext,
} from '@/lib/rebotica';

const FAQ_ITEMS = [
  {
    q: '¿Qué es la Rebotica?',
    a: 'En toda farmacia, la rebotica es donde pasan las cosas de verdad. La nuestra es el rincón del portal donde cada quincena se abre un cajón nuevo y siempre hay premio dentro. Aquí no se descuenta: se regala.',
  },
  {
    q: '¿Tengo que pagar algo para participar?',
    a: 'No. Elegir tu cajón es gratis y no necesitas tarjeta. Solo necesitas una cuenta gratuita en el portal para abrirlo: es el gesto que activa tu premio.',
  },
  {
    q: '¿Puedo elegir mi cajón sin registrarme?',
    a: 'Sí. Puedes elegir el cajón que quieras sin cuenta. Para abrirlo y quedarte con lo que te toque, te pedimos que crees tu cuenta gratuita: así protegemos que cada premio tenga dueño real.',
  },
  {
    q: '¿Cómo se decide qué premio me toca?',
    a: 'El sorteo se hace en nuestro servidor, con las probabilidades y el stock real de cada campaña. Elegir un cajón u otro no cambia lo que te puede tocar: es una forma de participar, no una jugada.',
  },
  {
    q: '¿Es un sorteo legal?',
    a: 'Sí, con bases publicadas y accesibles en todo momento. Puedes leerlas completas en la página de bases legales.',
  },
  {
    q: '¿Con qué frecuencia hay premios nuevos?',
    a: 'Cada quincena se abre una ronda nueva de la Rebotica, con su propio cajón y sus propios premios. La próxima apertura es el ' + REBOTICA_NEXT_OPENING.dateLabel + '.',
  },
];

export default function Rebotica() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user } = useAuth();
  const { toast } = useToast();

  const [selected, setSelected] = useState<number | null>(null);
  const [opening, setOpening] = useState(false);

  // Contexto que llega del email (?c=&cajon=&e=, patrón voto 1-clic) o de una
  // visita anterior guardada en local (por si vuelve tras registrarse).
  const ctx = useMemo(() => {
    const fromUrl = readReboticaContextFromUrl(searchParams.toString() ? `?${searchParams.toString()}` : '');
    const stored = loadReboticaContext();
    return { ...stored, ...fromUrl };
  }, [searchParams]);

  useEffect(() => {
    if (ctx.cajon) setSelected(ctx.cajon);
    if (ctx.cajon || ctx.campaign || ctx.email) storeReboticaContext(ctx);
    // Solo al montar / cuando cambian los parámetros de entrada.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ctx.cajon, ctx.campaign, ctx.email]);

  const handleSelect = (drawer: number) => {
    setSelected(drawer);
    storeReboticaContext({ cajon: drawer });
  };

  const handleOpen = () => {
    if (!selected) return;

    if (!user) {
      storeReboticaContext({ cajon: selected });
      const qs = new URLSearchParams();
      qs.set('modo', 'registro');
      qs.set('cajon', String(selected));
      if (ctx.email) qs.set('e', ctx.email);
      navigate(`/login?${qs.toString()}`);
      return;
    }

    if (!REBOTICA_OPEN_REWARD_ENABLED) {
      // TODO (S30): sustituir por la llamada real:
      // const { data, error } = await supabase.functions.invoke('open-reward', { body: { cajon: selected } });
      setOpening(true);
      window.setTimeout(() => {
        setOpening(false);
        toast({
          title: 'Tu cajón está reservado',
          description:
            'Estamos terminando de conectar los premios de la Rebotica. En cuanto esté listo, tu cajón se abrirá solo con lo que te toque.',
        });
      }, 900);
      return;
    }
  };

  const launch = getLaunchStatus();
  const openLabel = !user
    ? 'Crear cuenta gratis y abrir mi cajón'
    : opening
      ? 'Abriendo...'
      : 'Abrir mi cajón';

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#f7f8f5] to-background">
      {/* Cabecera mínima: logo + acceso, sin el chrome del dashboard (página pública) */}
      <header className="border-b bg-white/70 backdrop-blur">
        <div className="container mx-auto flex items-center justify-between px-4 py-3">
          <Link to="/" className="flex items-center gap-2">
            <img src="/lovable-uploads/logo_farmapro.svg" alt="farmapro" className="h-6" />
            <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Portal
            </span>
          </Link>
          <div className="flex items-center gap-3 text-sm">
            <Link to="/rebotica/bases-legales" className="text-muted-foreground hover:text-foreground">
              Bases legales
            </Link>
            {user ? (
              <Button asChild size="sm" variant="outline">
                <Link to="/dashboard">Ir al portal</Link>
              </Button>
            ) : (
              <Button asChild size="sm" variant="outline">
                <Link to="/login">Iniciar sesión</Link>
              </Button>
            )}
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="container mx-auto px-4 py-14 text-center">
        <Badge variant="secondary" className="mb-4 gap-1.5">
          <Sparkles className="h-3.5 w-3.5 text-primary" />
          farmapro · La Rebotica
        </Badge>
        <h1 className="mx-auto max-w-2xl text-4xl font-bold sm:text-5xl">Se abre la Rebotica</h1>
        <p className="mx-auto mt-4 max-w-xl text-lg text-muted-foreground">
          En toda farmacia, la rebotica es donde pasan las cosas de verdad. La nuestra abre cada
          quincena y siempre hay premio. Aquí no se descuenta: se regala.
        </p>
        <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
          <Button size="lg" onClick={() => document.getElementById('cajonera')?.scrollIntoView({ behavior: 'smooth' })}>
            Elige tu cajón
          </Button>
          <Button size="lg" variant="outline" asChild>
            <Link to="/rebotica/bases-legales">Ver las bases legales</Link>
          </Button>
        </div>
        <p className="mt-4 text-sm text-muted-foreground">
          Próximo cajón de la quincena: <strong className="text-foreground">{REBOTICA_NEXT_OPENING.dateLabel}</strong>
        </p>
      </section>

      {/* 3 pasos */}
      <section className="container mx-auto px-4 pb-4">
        <div className="mx-auto grid max-w-4xl gap-4 sm:grid-cols-3">
          {[
            {
              icon: PackageOpen,
              title: '1. Elige tu cajón',
              desc: 'Sin cuenta, en segundos. Cambia de opinión las veces que quieras.',
            },
            {
              icon: UserPlus,
              title: '2. Abre con tu cuenta',
              desc: 'Crea tu cuenta gratis en el portal: es el gesto que activa tu premio.',
            },
            {
              icon: Gift,
              title: '3. Premio seguro',
              desc: 'Cada cajón lleva algo dentro. Nunca aire, nunca "sigue participando".',
            },
          ].map(({ icon: Icon, title, desc }) => (
            <div key={title} className="rounded-xl border bg-card p-5 text-center shadow-sm">
              <Icon className="mx-auto mb-3 h-6 w-6 text-primary" />
              <h3 className="font-semibold">{title}</h3>
              <p className="mt-1 text-sm text-muted-foreground">{desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Cajonera */}
      <section id="cajonera" className="container mx-auto px-4 py-14">
        <div className="mx-auto max-w-md text-center">
          <h2 className="text-2xl font-bold">Elige tu cajón</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Todos los cajones llevan premio. Ninguno se enseña por fuera: eso es cosa de abrirlo.
          </p>
        </div>

        <div className="mt-6">
          <Cajonera selected={selected} onSelect={handleSelect} disabled={opening} />
        </div>

        <div className="mx-auto mt-5 flex max-w-md flex-col items-center gap-2">
          <Button size="lg" className="w-full" disabled={!selected || opening} onClick={handleOpen}>
            {selected ? openLabel : 'Elige un cajón para empezar'}
          </Button>
          {!user && selected && (
            <p className="text-center text-xs text-muted-foreground">
              No hace falta tarjeta. Solo tu email y una contraseña.
            </p>
          )}
        </div>
      </section>

      {/* Contador fundador (mismo patrón que /precios: solo altas de pago reales) */}
      {launch.active && (
        <section className="container mx-auto px-4 pb-14">
          <div className="mx-auto max-w-xl rounded-xl border bg-card p-5 text-center shadow-sm">
            <div className="flex items-center justify-center gap-2 text-sm font-semibold text-primary">
              <Sparkles className="h-4 w-4" />
              Precio de lanzamiento
            </div>
            <p className="mt-2 text-sm text-muted-foreground">
              {launch.showCounter ? (
                <>
                  <strong className="text-foreground">{launch.spotsTaken}</strong> de {LAUNCH.spots}{' '}
                  plazas fundador ya ocupadas. Las conservan para siempre.
                </>
              ) : (
                <>
                  Las primeras <strong className="text-foreground">{LAUNCH.spots} plazas</strong>{' '}
                  conservan el precio de lanzamiento para siempre.
                </>
              )}
            </p>
            <Button asChild variant="link" className="mt-1">
              <Link to="/precios">Ver los planes</Link>
            </Button>
          </div>
        </section>
      )}

      {/* Planes (reutilizando plans.ts / PlanCard de Precios.tsx, sin duplicar precios) */}
      <section className="border-t bg-muted/30 py-14">
        <div className="container mx-auto px-4">
          <div className="mx-auto max-w-xl text-center">
            <h2 className="text-2xl font-bold">Además de la Rebotica, todo el portal</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Cursos, comunidad, IAFarma y la Rebotica quincenal en un único sitio.
            </p>
          </div>
          <div className="mx-auto mt-8 grid max-w-6xl gap-8 md:grid-cols-3 items-stretch">
            {PLANS.map((plan) => (
              <PlanCard
                key={plan.id}
                plan={plan}
                billing="monthly"
                launchActive={launch.active}
                onReserve={() => navigate('/precios')}
              />
            ))}
          </div>
          <p className="mt-6 text-center text-sm text-muted-foreground">
            <Link to="/precios" className="text-primary hover:underline">
              Ver el detalle completo de precios, mensual y anual
            </Link>
          </p>
        </div>
      </section>

      {/* FAQ */}
      <section className="container mx-auto px-4 py-14">
        <div className="mx-auto max-w-2xl">
          <h2 className="text-center text-2xl font-bold">Preguntas frecuentes</h2>
          <Accordion type="single" collapsible className="mt-6">
            {FAQ_ITEMS.map((item) => (
              <AccordionItem key={item.q} value={item.q}>
                <AccordionTrigger className="text-left">{item.q}</AccordionTrigger>
                <AccordionContent className="text-muted-foreground">{item.a}</AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </section>

      {/* Footer mínimo */}
      <footer className="border-t bg-white py-8">
        <div className="container mx-auto flex flex-col items-center gap-2 px-4 text-center text-sm text-muted-foreground">
          <div className="flex items-center gap-1.5">
            <ShieldCheck className="h-4 w-4" />
            Deontología farmacéutica: la Rebotica regala formación y negocio, nunca nada sanitario.
          </div>
          <Link to="/rebotica/bases-legales" className="flex items-center gap-1.5 text-primary hover:underline">
            <ScrollText className="h-4 w-4" />
            Bases legales y protección de datos
          </Link>
        </div>
      </footer>
    </div>
  );
}
