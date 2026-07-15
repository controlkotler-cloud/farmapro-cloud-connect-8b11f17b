import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { motion, type MotionProps } from 'framer-motion';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { Cajonera } from '@/components/rebotica/Cajonera';
import {
  REBOTICA_NEXT_OPENING,
  REBOTICA_OPENING_TIME_LABEL,
  REBOTICA_OPEN_REWARD_ENABLED,
  REBOTICA_CURRENT_PARTNER,
  getNextOpeningDate,
  readReboticaContextFromUrl,
  storeReboticaContext,
  loadReboticaContext,
} from '@/lib/rebotica';

// ---------------------------------------------------------------------------
// Estética: portada de `docs/landing-rebotica-propuesta.html` (mockup validado
// 13-07, v3) traducida a canon DESIGN.md — Manrope (sans del portal) +
// Fraunces (font-serif), acento lime de la submarca Rebotica #A3D338/#7BB121,
// papel #FBFBF7, tinta #0B0F0B. CTAs pill; sobre lime SIEMPRE texto tinta.
// Sin planes ni precios (decisión 13-07: la landing es gratis-first).
// ---------------------------------------------------------------------------

const reveal: MotionProps = {
  initial: { opacity: 0, y: 24 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, amount: 0.12 },
  transition: { duration: 0.6, ease: 'easeOut' },
};

const BTN_PRIMARY =
  'inline-block rounded-full bg-[#0B0F0B] px-6 py-3 text-[15px] font-bold text-white shadow-[0_6px_24px_rgba(11,15,11,.18)] transition hover:-translate-y-0.5 hover:shadow-[0_10px_30px_rgba(11,15,11,.24)] active:scale-[.97]';
const BTN_LIME =
  'inline-block rounded-full bg-[#A3D338] px-8 py-4 text-[17px] font-bold text-[#0B0F0B] shadow-[0_8px_28px_rgba(123,177,33,.35)] transition hover:-translate-y-0.5 hover:shadow-[0_14px_36px_rgba(123,177,33,.45)] active:scale-[.97]';

const STEPS = [
  {
    n: '1',
    tag: 'sin cuenta',
    title: 'Elige tu cajón',
    desc: 'Nueve cajones con rótulo de botica. Escoge el tuyo por instinto, por rótulo o por corazonada: todos tienen algo dentro.',
  },
  {
    n: '2',
    tag: 'registro gratis',
    title: 'Ábrelo',
    desc: 'Crea tu cuenta gratuita del portal y ábrelo. Premio seguro: formación, plantillas o alguna de las sorpresas grandes.',
  },
  {
    n: '3',
    tag: 'tuyo',
    title: 'Canjea y repite',
    desc: 'Lo canjeas cuando quieras y vuelves el siguiente jueves de quincena. Los usuarios Plus abren además el cajón de aniversario.',
  },
];

const PRIZES = [
  {
    rar: 'siempre',
    tone: 'lime' as const,
    ico: 'M',
    title: 'Masterclass exclusivas',
    desc: 'Sesiones que no están en el catálogo: solo salen del cajón.',
  },
  {
    rar: 'siempre',
    tone: 'lime' as const,
    ico: 'P',
    title: 'Plantillas «solo cajón»',
    desc: 'Herramientas de gestión y mostrador que no se pueden descargar en ningún otro sitio del portal.',
  },
  {
    rar: 'a veces',
    tone: 'amber' as const,
    ico: '+',
    title: 'Meses de Plus gratis',
    desc: 'Temporadas del plan Plus del portal desbloqueadas en tu cuenta, sin pasar por caja.',
  },
  {
    rar: 'a veces',
    tone: 'amber' as const,
    ico: 'C',
    title: 'Un curso premium para ti',
    desc: 'Un curso premium del catálogo, desbloqueado para siempre en tu cuenta.',
  },
  {
    rar: 'a veces',
    tone: 'amber' as const,
    ico: 'X',
    title: 'Multiplicadores y extras',
    desc: 'Puntos dobles, insignias raras y ventajas dentro del portal para tu perfil profesional.',
  },
  {
    rar: 'sorteo mensual',
    tone: 'amber' as const,
    ico: 'B',
    title: 'El Baúl',
    desc: 'Un baúl de verdad, lleno de regalos, camino de la puerta de una farmacia. Cada cajón que abres ese mes es una participación: lo sorteamos una vez al mes.',
  },
];

const FAQ_ITEMS = [
  {
    q: '¿Cuánto cuesta participar?',
    a: 'Nada. Eliges tu cajón sin cuenta y lo abres con tu registro gratuito del portal. Los usuarios Plus tienen ventajas (como el cajón de aniversario), pero el cajón de la quincena es para todos.',
  },
  {
    q: '¿Seguro que siempre hay premio?',
    a: 'Siempre. El valor varía (de una plantilla exclusiva al Gordo de la temporada), pero un cajón vacío no existe en esta casa.',
  },
  {
    q: '¿Qué hacéis con mis datos?',
    a: 'Tu cuenta es del portal farmapro y ahí se queda. Nunca cedemos la base y nunca recibirás correos comerciales de terceros por participar. Las bases legales completas están en el pie de esta página.',
  },
  {
    q: '¿Cada cuánto hay cajón nuevo?',
    a: 'Cada dos semanas, el jueves a las 08:00, con el email de farmapro. Una quincena, un cajón, un premio.',
  },
];

function useOpeningCountdown(): string | null {
  const [label, setLabel] = useState<string | null>(null);

  useEffect(() => {
    const target = getNextOpeningDate().getTime();
    const tick = () => {
      const ms = target - Date.now();
      if (ms <= 0) {
        setLabel(null);
        return;
      }
      const dd = Math.floor(ms / 86_400_000);
      const hh = String(Math.floor(ms / 3_600_000) % 24).padStart(2, '0');
      const mm = String(Math.floor(ms / 60_000) % 60).padStart(2, '0');
      const ss = String(Math.floor(ms / 1_000) % 60).padStart(2, '0');
      setLabel(`${dd}d ${hh}:${mm}:${ss}`);
    };
    tick();
    const id = window.setInterval(tick, 1_000);
    return () => window.clearInterval(id);
  }, []);

  return label;
}

function scrollToId(id: string) {
  document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
}

export default function Rebotica() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user } = useAuth();
  const { toast } = useToast();

  const [selected, setSelected] = useState<number | null>(null);
  const [opening, setOpening] = useState(false);

  const countdown = useOpeningCountdown();
  const partner = REBOTICA_CURRENT_PARTNER;

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
    if (!selected) {
      scrollToId('cajonera');
      return;
    }

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

  const openLabel = !user
    ? 'Crear cuenta gratis y abrir mi cajón'
    : opening
      ? 'Abriendo...'
      : 'Abrir mi cajón';

  const partnerSlot = partner && (
    <a
      href={partner.url}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex items-center gap-2 rounded-[10px] border border-[#e7e9e4] bg-white px-3.5 py-1.5 shadow-[0_4px_14px_rgba(11,15,11,.08)]"
    >
      <img src={partner.logoUrl} alt={partner.name} className="h-5" />
    </a>
  );

  return (
    <div className="min-h-screen bg-[#FBFBF7] font-sans text-[#0B0F0B]">
      {/* NAV sticky con blur */}
      <nav className="sticky top-0 z-50 border-b border-[#e7e9e4] bg-[#FBFBF7]/85 backdrop-blur-md">
        <div className="mx-auto flex max-w-[1120px] items-center justify-between px-6 py-3">
          <Link to="/" className="flex items-center gap-2.5">
            <img src="/logo-farmapro.svg" alt="farmapro" className="h-6" />
            <span className="border-l border-[#e7e9e4] pl-2.5 text-[11px] font-bold uppercase tracking-[0.14em] text-[#5c6660]">
              La Rebotica
            </span>
          </Link>
          <div className="flex items-center gap-4">
            {user ? (
              <Link to="/dashboard" className="text-sm font-semibold text-[#5c6660] transition hover:text-[#0B0F0B]">
                Ir al portal
              </Link>
            ) : (
              <Link to="/login" className="text-sm font-semibold text-[#5c6660] transition hover:text-[#0B0F0B]">
                Iniciar sesión
              </Link>
            )}
            <button type="button" onClick={() => scrollToId('cajonera')} className={`${BTN_PRIMARY} hidden sm:inline-block`}>
              Elegir mi cajón gratis
            </button>
          </div>
        </div>
      </nav>

      {/* HERO */}
      <header className="relative pb-10 pt-16">
        <div className="mx-auto grid max-w-[1120px] items-center gap-12 px-6 lg:grid-cols-[1.05fr_.95fr]">
          <div>
            <span className="mb-4 inline-flex items-center gap-2 rounded-full bg-[#EAF5D0] px-3.5 py-1.5 text-[13px] font-bold uppercase tracking-[0.08em] text-[#3c5a10]">
              <span className="h-2 w-2 animate-pulse rounded-full bg-[#7BB121]" aria-hidden />
              Premio seguro · cada quincena
            </span>
            <h1 className="font-serif text-[clamp(40px,5.2vw,64px)] font-semibold leading-[1.04] tracking-[-0.01em]">
              Cada quincena, un cajón.
              <br />
              Dentro, <em className="italic text-[#7BB121]">siempre</em> hay premio.
            </h1>
            <p className="mt-5 max-w-[34em] text-[19px] leading-relaxed text-[#5c6660]">
              La Rebotica es el programa de recompensas de farmapro para la gente de la farmacia: eliges tu cajón,
              lo abres y te llevas formación, herramientas o regalos de verdad. Nunca descuentos. Nunca humo.
            </p>
            <div className="mt-7 flex flex-wrap items-center gap-3.5">
              <button type="button" onClick={() => scrollToId('cajonera')} className={BTN_LIME}>
                Elegir mi cajón gratis
              </button>
              <button
                type="button"
                onClick={() => scrollToId('como')}
                className="px-2 py-4 text-[16px] font-semibold text-[#0B0F0B] underline underline-offset-4"
              >
                Ver cómo funciona
              </button>
            </div>
            <p className="mt-3.5 text-[13.5px] text-[#5c6660]">
              Sin tarjeta. Sin letra pequeña. Eliges sin cuenta; para abrirlo, te registras gratis.
            </p>
            <div className="mt-6 flex flex-wrap gap-2.5">
              <span className="rounded-full border border-[#e7e9e4] bg-white px-3.5 py-2 text-[13px] font-semibold text-[#333d33]">
                <b className="text-[#7BB121]">7.500+</b> profesionales de farmacia
              </span>
              <span className="rounded-full border border-[#e7e9e4] bg-white px-3.5 py-2 text-[13px] font-semibold text-[#333d33]">
                <b className="text-[#7BB121]">1 de cada 6</b> farmacias de España*
              </span>
              <span className="rounded-full border border-[#e7e9e4] bg-white px-3.5 py-2 text-[13px] font-semibold text-[#333d33]">
                <b className="text-[#7BB121]">100%</b> de cajones con premio
              </span>
            </div>
            <p className="mt-2 text-[11px] text-[#8d998b]">*Estimación sectorial sobre el censo CGCOF 2025.</p>
          </div>

          {/* Cajonera interactiva */}
          <motion.div id="cajonera" className="scroll-mt-24" {...reveal}>
            <Cajonera selected={selected} onSelect={handleSelect} disabled={opening} />

            <div className="mx-auto mt-5 flex w-full max-w-md flex-col items-center gap-2">
              <button
                type="button"
                onClick={handleOpen}
                disabled={opening}
                className={
                  selected
                    ? `${BTN_LIME} w-full text-center text-[16px] disabled:cursor-not-allowed disabled:opacity-70`
                    : 'w-full cursor-pointer rounded-full bg-[#0B0F0B]/[.06] px-8 py-4 text-center text-[15px] font-bold text-[#5c6660] transition hover:bg-[#0B0F0B]/10'
                }
              >
                {selected ? openLabel : 'Elige un cajón para empezar'}
              </button>
              {!user && selected && (
                <p className="text-center text-xs text-[#5c6660]">No hace falta tarjeta. Solo tu email y una contraseña.</p>
              )}
              {partner && (
                <div className="mt-2 flex items-center justify-center gap-2.5 text-[11.5px] uppercase tracking-[0.1em] text-[#5c6660]">
                  El cajón de esta quincena lo presenta {partnerSlot}
                </div>
              )}
            </div>
          </motion.div>
        </div>
      </header>

      {/* STRIP de cuenta atrás */}
      <div className="bg-[#0B0F0B] py-3.5 text-white">
        <div className="mx-auto flex max-w-[1120px] flex-wrap items-center justify-center gap-x-5 gap-y-2 px-6 text-[15px]">
          <span>
            Próximo cajón:{' '}
            <b className="text-[#A3D338]">
              {countdown
                ? `${REBOTICA_NEXT_OPENING.dateLabel} · ${REBOTICA_OPENING_TIME_LABEL}`
                : `jueves de quincena · ${REBOTICA_OPENING_TIME_LABEL}`}
            </b>
          </span>
          {countdown && (
            <span className="rounded-lg border border-white/15 bg-white/[.08] px-3 py-1 font-bold tracking-[0.06em] [font-variant-numeric:tabular-nums]">
              {countdown}
            </span>
          )}
          {partner && (
            <span className="flex items-center gap-2.5 text-[13px] text-[#c9d1c9]">
              El cajón de esta quincena lo presenta {partnerSlot}
            </span>
          )}
        </div>
      </div>

      {/* CÓMO FUNCIONA */}
      <section id="como" className="scroll-mt-16 py-[76px]">
        <div className="mx-auto max-w-[1120px] px-6">
          <motion.div className="mx-auto mb-11 max-w-[640px] text-center" {...reveal}>
            <div className="text-[13px] font-bold uppercase tracking-[0.16em] text-[#7BB121]">Cómo funciona</div>
            <h2 className="mt-2.5 font-serif text-[clamp(28px,3.6vw,40px)] font-semibold leading-[1.15]">
              Tres gestos. Como en la rebotica de siempre.
            </h2>
            <p className="mt-3 text-[16.5px] text-[#5c6660]">
              La trastienda de la farmacia es donde pasan las cosas buenas. Aquí también.
            </p>
          </motion.div>
          <div className="grid gap-4 sm:grid-cols-3">
            {STEPS.map((step) => (
              <motion.div
                key={step.n}
                {...reveal}
                className="relative rounded-[18px] border border-[#e7e9e4] bg-white p-7 transition hover:-translate-y-1 hover:shadow-[0_16px_34px_rgba(11,15,11,.08)]"
              >
                <span className="absolute right-5 top-5 rounded-full bg-[#EAF5D0] px-2.5 py-1 text-[11px] font-bold tracking-[0.06em] text-[#3c5a10]">
                  {step.tag}
                </span>
                <div className="font-serif text-[44px] font-semibold leading-none text-[#A3D338]">{step.n}</div>
                <h3 className="mb-2 mt-3 font-serif text-[19px] font-semibold">{step.title}</h3>
                <p className="text-[14.5px] text-[#5c6660]">{step.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* PREMIOS */}
      <section className="pb-[76px]">
        <div className="mx-auto max-w-[1120px] px-6">
          <motion.div className="mx-auto mb-11 max-w-[640px] text-center" {...reveal}>
            <div className="text-[13px] font-bold uppercase tracking-[0.16em] text-[#7BB121]">Lo que puede tocarte</div>
            <h2 className="mt-2.5 font-serif text-[clamp(28px,3.6vw,40px)] font-semibold leading-[1.15]">
              De la masterclass al Gordo de la temporada
            </h2>
            <p className="mt-3 text-[16.5px] text-[#5c6660]">
              Todo son regalos completos. Un descuento no es un premio, y aquí lo sabemos.
            </p>
          </motion.div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {PRIZES.map((prize) => (
              <motion.div
                key={prize.title}
                {...reveal}
                className="relative overflow-hidden rounded-[18px] border border-[#e7e9e4] bg-white p-6 transition hover:-translate-y-1 hover:shadow-[0_16px_34px_rgba(11,15,11,.09)]"
              >
                <span
                  className={
                    prize.tone === 'lime'
                      ? 'absolute right-4 top-4 rounded-full bg-[#EAF5D0] px-2.5 py-1 text-[11px] font-bold tracking-[0.06em] text-[#3c5a10]'
                      : 'absolute right-4 top-4 rounded-full bg-[#fdf3d7] px-2.5 py-1 text-[11px] font-bold tracking-[0.06em] text-[#8a6d16]'
                  }
                >
                  {prize.rar}
                </span>
                <div className="font-serif text-[30px] italic text-[#7BB121]">{prize.ico}</div>
                <h3 className="mb-1.5 mt-2.5 font-serif text-lg font-semibold">{prize.title}</h3>
                <p className="text-sm text-[#5c6660]">{prize.desc}</p>
              </motion.div>
            ))}

            {/* EL GORDO */}
            <motion.div
              {...reveal}
              className="grid items-center gap-6 overflow-hidden rounded-[18px] border border-[#2d3a28] p-6 text-white sm:col-span-2 lg:col-span-3 lg:grid-cols-[auto_1fr_auto]"
              style={{ background: 'linear-gradient(120deg, #101510, #1c241a 60%, #24301f)' }}
            >
              <div className="font-serif text-[52px] italic leading-none text-[#ffd968]">G</div>
              <div>
                <h3 className="font-serif text-2xl font-semibold text-[#ffd968]">EL GORDO de la Rebotica</h3>
                <p className="mt-1 max-w-[52em] text-[#b9c4b6]">
                  Una vez por temporada, entre todas las aperturas del trimestre, sorteamos una Auditoría Farmacia
                  Silenciosa completa: visita, informe y plan de acción.
                </p>
              </div>
              <span className="justify-self-start rounded-full bg-[#0B0F0B] px-3.5 py-1.5 text-[11px] font-bold tracking-[0.06em] text-[#ffd968] lg:justify-self-auto">
                valorada en 360 €+
              </span>
            </motion.div>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="pb-[76px]">
        <div className="mx-auto max-w-[1120px] px-6">
          <motion.div className="mx-auto max-w-[760px]" {...reveal}>
            {FAQ_ITEMS.map((item) => (
              <details
                key={item.q}
                className="group mb-2.5 rounded-[14px] border border-[#e7e9e4] bg-white px-5 py-4"
              >
                <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-[15.5px] font-bold [&::-webkit-details-marker]:hidden">
                  {item.q}
                  <span
                    aria-hidden
                    className="font-serif text-[22px] leading-none text-[#7BB121] transition-transform group-open:rotate-45"
                  >
                    +
                  </span>
                </summary>
                <p className="mt-2.5 text-[14.5px] text-[#5c6660]">{item.a}</p>
              </details>
            ))}
          </motion.div>
        </div>
      </section>

      {/* CTA FINAL */}
      <section className="pb-[56px]">
        <div className="mx-auto max-w-[1120px] px-6">
          <motion.div
            {...reveal}
            className="relative overflow-hidden rounded-[26px] bg-[#0B0F0B] px-8 py-16 text-center text-white"
          >
            <span
              aria-hidden
              className="absolute -right-[120px] -top-[160px] h-[420px] w-[420px] rounded-full"
              style={{ background: 'radial-gradient(circle, rgba(163,211,56,.22), transparent 70%)' }}
            />
            <h2 className="relative font-serif text-[clamp(30px,4vw,44px)] font-semibold leading-[1.12]">
              El siguiente cajón ya tiene <em className="italic text-[#A3D338]">tu nombre</em> en el rótulo.
            </h2>
            <p className="relative mt-3.5 text-[17px] text-[#b9c4b6]">
              Únete gratis a la comunidad farmapro: más de 7.500 profesionales de la farmacia.
            </p>
            <button type="button" onClick={() => scrollToId('cajonera')} className={`${BTN_LIME} relative mt-7`}>
              Elegir mi cajón gratis
            </button>
            <p className="relative mt-3.5 text-[13px] text-[#8d998b]">
              Registro gratuito · premio seguro · bases legales a un clic
            </p>
          </motion.div>
        </div>
      </section>

      {/* PARTNER DE LA QUINCENA */}
      <section className="pb-[64px]">
        <div className="mx-auto max-w-[720px] px-6 text-center">
          <div className="text-[12px] font-bold uppercase tracking-[0.16em] text-[#7BB121]">Partner de la quincena</div>
          {partner && (
            <div className="mx-auto mt-5 inline-block rounded-[18px] border border-[#e7e9e4] bg-white px-10 py-6 shadow-[0_14px_34px_rgba(11,15,11,.07)]">
              <div className="mb-3 text-[12px] uppercase tracking-[0.1em] text-[#5c6660]">
                El cajón de esta quincena lo presenta
              </div>
              <a href={partner.url} target="_blank" rel="noopener noreferrer" className="inline-block">
                <img src={partner.logoUrl} alt={partner.name} className="mx-auto h-12" />
              </a>
            </div>
          )}
          <p className="mt-6 text-[14.5px] text-[#5c6660]">
            <b className="text-[#0B0F0B]">¿Tienes una marca del sector?</b> Cada quincena, un solo partner presenta el
            cajón ante miles de profesionales de farmacia. Sin subastas, sin banners, sin ruido: tu logo y el enlace a
            tu web. Escríbenos:{' '}
            <a href="mailto:somos@farmapro.es" className="font-bold text-[#0B0F0B] underline underline-offset-4">
              somos@farmapro.es
            </a>
          </p>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="border-t border-[#e7e9e4] py-9 text-[13px] text-[#5c6660]">
        <div className="mx-auto flex max-w-[1120px] flex-wrap justify-between gap-4 px-6">
          <span>© 2026 farmapro · La Rebotica</span>
          <span>
            <Link to="/rebotica/bases-legales" className="underline underline-offset-4 hover:text-[#0B0F0B]">
              Bases legales y protección de datos
            </Link>
            {' · '}
            <Link to="/" className="hover:text-[#0B0F0B]">
              portal.farmapro.es
            </Link>
          </span>
        </div>
      </footer>
    </div>
  );
}
