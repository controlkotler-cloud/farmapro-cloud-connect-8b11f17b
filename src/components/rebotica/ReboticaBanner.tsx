import { Link } from 'react-router-dom';
import { REBOTICA_NEXT_OPENING } from '@/lib/rebotica';

/**
 * Banner del dashboard hacia La Rebotica. Estética botica clásica
 * (pergamino + cajón de madera, sobria, nunca casino) anclada al verde
 * canónico en el CTA. La fecha viene de REBOTICA_NEXT_OPENING (fuente de
 * verdad actual, plan maestro §4.2); solo anuncia la mecánica, no stock.
 */
export const ReboticaBanner = () => {
  const opened = new Date() >= new Date(`${REBOTICA_NEXT_OPENING.dateISO}T00:00:00`);

  return (
    <Link
      to="/rebotica"
      className="group grid grid-cols-1 sm:grid-cols-[auto_1fr_auto] items-center gap-5 sm:gap-7 rounded-2xl border border-[#e3ddd0] bg-gradient-to-br from-[#fbf8f2] to-[#efe7d8] px-6 py-5 shadow-soft transition-shadow hover:shadow-lift"
    >
      {/* Cajón de madera en CSS, rótulo romano como en la cajonera */}
      <div className="relative hidden h-16 w-[104px] flex-none rounded-lg bg-gradient-to-b from-[#8a6f4d] to-[#6e5639] shadow-[inset_0_1px_0_rgba(255,255,255,.25),0_10px_22px_-10px_rgba(40,30,10,.5)] sm:block">
        <span className="absolute inset-x-0 top-2 text-center font-serif italic tracking-[0.18em] text-[#f3e9d2] text-sm">
          · IX ·
        </span>
        <span className="absolute left-1/2 top-[58%] h-[7px] w-9 -translate-x-1/2 rounded-full bg-gradient-to-b from-[#d9c9a3] to-[#a98f5f]" />
      </div>

      <div className="min-w-0">
        <h2 className="text-lg font-extrabold tracking-tight text-[#5a4b32]">
          La Rebotica:{' '}
          <em className="font-serif font-normal italic text-brand-dark">
            {opened ? 'el cajón está en marcha.' : `el cajón abre el ${REBOTICA_NEXT_OPENING.dateLabel}.`}
          </em>
        </h2>
        <p className="mt-0.5 text-sm text-[#5a4b32]/75">
          Cada quincena, un cajón con premios de nuestros partners para quienes están al día.
        </p>
      </div>

      <span className="inline-flex w-fit items-center gap-2 rounded-full bg-brand-dark px-5 py-2.5 text-sm font-bold text-white shadow-soft transition-transform group-hover:-translate-y-0.5">
        {opened ? 'Entrar a la Rebotica' : 'Descubrir la Rebotica'} →
      </span>
    </Link>
  );
};
