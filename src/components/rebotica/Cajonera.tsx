import { useEffect } from 'react';
import { motion } from 'framer-motion';
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

export function Cajonera({ skin = 'cajonera', selected, onSelect, disabled }: CajoneraProps) {
  useEffect(() => {
    if (skin === 'eonbox') {
      console.warn(
        '[Rebotica] skin "eonbox" aún no está implementada en la UI; se muestra la cajonera clásica. Ver TODO en Cajonera.tsx.',
      );
    }
  }, [skin]);

  const drawers = Array.from({ length: REBOTICA_DRAWER_COUNT }, (_, i) => i + 1);

  return (
    <div
      className="relative mx-auto w-full max-w-md rounded-2xl border border-[#e3ddd0] p-4 shadow-[0_30px_60px_-30px_rgba(28,34,29,0.25)] sm:p-6"
      style={{
        background: 'linear-gradient(165deg, #fbf8f2, #efe7d8)',
      }}
      role="group"
      aria-label="Cajonera de la Rebotica: elige un cajón"
    >
      {/* Cabecera de la máquina: madera + placa de latón con el nombre */}
      <div className="mb-4 flex items-center justify-between gap-2 rounded-lg border border-[#d8cdb4] bg-[#f4efe3] px-3 py-2">
        <span className="font-display text-xs font-semibold uppercase tracking-[0.18em] text-[#5a4b32]">
          La Rebotica
        </span>
        <span className="rounded-full border border-[#88c835]/40 bg-[#88c835]/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-[#4c7418]">
          Cada cajón lleva premio
        </span>
      </div>

      <div className="grid grid-cols-3 gap-3 sm:gap-4">
        {drawers.map((n) => {
          const isSelected = selected === n;
          return (
            <button
              key={n}
              type="button"
              disabled={disabled}
              onClick={() => onSelect(n)}
              aria-pressed={isSelected}
              aria-label={`Cajón ${REBOTICA_DRAWER_LABELS[n - 1]}`}
              className={cn(
                'group relative flex aspect-[4/5] flex-col items-center justify-end rounded-lg border pb-3 pt-5 transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#88c835] focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60',
                isSelected
                  ? 'border-[#88c835] shadow-[0_10px_24px_-10px_rgba(136,200,53,0.55)]'
                  : 'border-[#d8cdb4] hover:-translate-y-0.5 hover:shadow-md',
              )}
              style={{
                background: isSelected
                  ? 'linear-gradient(180deg, #fbfcf8, #eaf3dc)'
                  : 'linear-gradient(180deg, #ffffff, #ece3d1)',
              }}
            >
              {/* Rótulo de latón con el número romano del cajón */}
              <span
                className={cn(
                  'absolute left-1.5 top-1.5 rounded-sm px-1.5 py-0.5 font-mono text-[10px] font-bold tracking-wide',
                  isSelected ? 'bg-[#88c835]/20 text-[#4c7418]' : 'bg-[#5a4b32]/10 text-[#5a4b32]',
                )}
              >
                {REBOTICA_DRAWER_LABELS[n - 1]}
              </span>

              {/* Tirador */}
              <motion.span
                animate={isSelected ? { scale: 1.08 } : { scale: 1 }}
                transition={{ type: 'spring', stiffness: 300, damping: 18 }}
                className={cn(
                  'h-2.5 w-8 rounded-full border shadow-inner',
                  isSelected
                    ? 'border-[#4c7418] bg-[#88c835]'
                    : 'border-[#a4967a] bg-gradient-to-b from-[#c9bb9c] to-[#a4967a] group-hover:from-[#d6c9ab]',
                )}
              />

              {isSelected && (
                <span className="mt-2 text-[10px] font-semibold uppercase tracking-wide text-[#4c7418]">
                  Elegido
                </span>
              )}
            </button>
          );
        })}
      </div>

      <p className="mt-4 flex items-center justify-center gap-1.5 text-center text-xs text-muted-foreground">
        <Lock className="h-3 w-3 shrink-0" />
        Los premios de dentro no se enseñan hasta que abres. Elegir cajón no cambia lo que te toca.
      </p>
    </div>
  );
}
