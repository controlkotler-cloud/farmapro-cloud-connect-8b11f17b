import { useEffect } from 'react';
import { Lock } from 'lucide-react';
import { cn } from '@/lib/utils';
import { REBOTICA_DRAWER_COUNT, REBOTICA_DRAWER_LABELS } from '@/lib/rebotica';

export type ReboticaSkin = 'cajonera' | 'eonbox';

interface CajoneraProps {
  /**
   * Skin visual. La cajonera CLÁSICA de botica es la de por defecto para
   * cualquier campaña. `eonbox` es la piel del partner Apotheka (columna
   * `rebotica_campaigns.skin`); referencia visual completa en
   * `dossier-partner-rebotica/demo-eonbox-rebotica.html`. TODO: implementar
   * cuando haya campaña real con partner_id de Apotheka; de momento cae
   * siempre en la clásica para no construir una skin que nadie usa aún.
   */
  skin?: ReboticaSkin;
  selected: number | null;
  onSelect: (drawer: number) => void;
  /** Deshabilita la selección (p. ej. mientras se procesa la apertura). */
  disabled?: boolean;
}

/**
 * Cajón que aparece entreabierto (con brillo dentro) mientras no hay
 * selección: el gancho del mockup validado 13-07 («El cajón S - T está
 * entreabierto...»). Al elegir cualquier cajón, el gancho desaparece.
 */
const HINT_DRAWER = 7;

export function Cajonera({ skin = 'cajonera', selected, onSelect, disabled }: CajoneraProps) {
  useEffect(() => {
    if (skin === 'eonbox') {
      console.warn(
        '[Rebotica] skin "eonbox" aún no está implementada en la UI; se muestra la cajonera clásica. Ver TODO en Cajonera.tsx.',
      );
    }
  }, [skin]);

  const drawers = Array.from({ length: REBOTICA_DRAWER_COUNT }, (_, i) => i + 1);
  const hintActive = selected === null;

  return (
    <div className="relative mx-auto w-full max-w-md" role="group" aria-label="Cajonera de la Rebotica: elige un cajón">
      {/* Nota de escena (el gancho del mockup; cambia al elegir) */}
      <div
        aria-hidden
        className="absolute -top-4 right-0 z-10 rotate-3 rounded-xl rounded-bl-sm bg-[#0B0F0B] px-3.5 py-2 text-xs font-bold text-white shadow-[0_8px_20px_rgba(0,0,0,.25)]"
      >
        {selected ? (
          <>
            El cajón <span className="text-[#ffd968]">{REBOTICA_DRAWER_LABELS[selected - 1]}</span> es el tuyo
          </>
        ) : (
          <>
            El cajón {REBOTICA_DRAWER_LABELS[HINT_DRAWER - 1]} está <span className="text-[#ffd968]">entreabierto...</span>
          </>
        )}
      </div>

      <div className="[filter:drop-shadow(0_30px_40px_rgba(66,41,15,.35))]">
        <div
          className="rounded-[18px] border-[6px] border-[#42290f] p-4"
          style={{ background: 'linear-gradient(160deg, #8a5a2b, #6b4423 60%, #5b3a1c)' }}
        >
          <div className="pb-3 pt-1 text-center font-serif text-sm italic uppercase tracking-[0.22em] text-[#f3e2c3]">
            · La Rebotica ·
          </div>

          <div className="grid grid-cols-3 gap-2.5">
            {drawers.map((n) => {
              const isSelected = selected === n;
              const isOpen = isSelected || (hintActive && n === HINT_DRAWER);
              return (
                <button
                  key={n}
                  type="button"
                  disabled={disabled}
                  onClick={() => onSelect(n)}
                  aria-pressed={isSelected}
                  aria-label={`Cajón ${REBOTICA_DRAWER_LABELS[n - 1]}`}
                  className="group relative aspect-[3/2] rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#A3D338] focus-visible:ring-offset-2 focus-visible:ring-offset-[#6b4423] disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {/* Brillo del premio asomando por la rendija */}
                  {isOpen && (
                    <span
                      aria-hidden
                      className="pointer-events-none absolute inset-[8%_12%] animate-pulse rounded-[10px]"
                      style={{
                        background:
                          'radial-gradient(ellipse at center, #ffd968 0%, rgba(255,217,104,.45) 45%, transparent 75%)',
                      }}
                    />
                  )}

                  {/* Frente del cajón */}
                  <span
                    className={cn(
                      'absolute inset-0 flex flex-col items-center justify-center gap-1.5 rounded-lg border-2 border-[#4e3315] transition-all duration-300',
                      isOpen
                        ? '[transform:translateY(12%)_rotateX(14deg)] shadow-[inset_0_2px_0_rgba(255,255,255,.18),0_22px_34px_rgba(0,0,0,.4)]'
                        : 'shadow-[inset_0_2px_0_rgba(255,255,255,.14),inset_0_-8px_14px_rgba(0,0,0,.28)] group-hover:translate-y-1.5 group-hover:scale-[1.03] group-hover:shadow-[inset_0_2px_0_rgba(255,255,255,.18),inset_0_-8px_14px_rgba(0,0,0,.28),0_14px_26px_rgba(0,0,0,.35)]',
                    )}
                    style={{ background: 'linear-gradient(145deg, #9c6a33, #7a4f27 55%, #68411f)' }}
                  >
                    {/* Tirador de latón */}
                    <span
                      aria-hidden
                      className="h-[22px] w-[22px] rounded-full shadow-[0_2px_4px_rgba(0,0,0,.45),inset_0_1px_1px_rgba(255,255,255,.5)]"
                      style={{
                        background: 'radial-gradient(circle at 35% 30%, #f4dd9a, #c9a227 55%, #8a6d16)',
                      }}
                    />
                    {/* Rótulo con las siglas de botica */}
                    <span
                      className={cn(
                        'rounded border px-2 py-px font-serif text-[10.5px] uppercase tracking-[0.12em]',
                        isSelected
                          ? 'border-[#ffd968] bg-[#ffd968]/20 text-[#ffedb0]'
                          : 'border-[#f7ecd4]/35 bg-black/20 text-[#f7ecd4]',
                      )}
                    >
                      {REBOTICA_DRAWER_LABELS[n - 1]}
                    </span>
                  </span>
                </button>
              );
            })}
          </div>

          {/* Patas del mueble */}
          <div aria-hidden className="mt-3 flex justify-between px-6">
            <i className="h-6 w-[22px] rounded-b-md bg-gradient-to-b from-[#42290f] to-[#2e1c0a]" />
            <i className="h-6 w-[22px] rounded-b-md bg-gradient-to-b from-[#42290f] to-[#2e1c0a]" />
          </div>
        </div>
      </div>

      <p className="mt-4 flex items-center justify-center gap-1.5 text-center text-xs text-[#5c6660]">
        <Lock className="h-3 w-3 shrink-0" />
        Todos llevan premio. Elegir cajón no cambia lo que te toca.
      </p>
    </div>
  );
}
