import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Lock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useAuth } from '@/hooks/useAuth';
import { useEntitlements } from '@/hooks/useEntitlements';
import { FREE_LIMITS } from '@/lib/plans';

const SEEN_KEY = 'farmapro:trial-locked-notice-seen';

/** Fecha (texto) en la que terminó la prueba: alta + 30 días. */
const useTrialEndLabel = () => {
  const { profile } = useAuth();
  if (!profile?.created_at) return null;
  const end = new Date(new Date(profile.created_at).getTime() + FREE_LIMITS.trialDays * 86_400_000);
  return end.toLocaleDateString('es-ES', { day: 'numeric', month: 'long' });
};

/**
 * Aviso de prueba terminada (free_locked). Con validation_mode='beta' el
 * usuario caducado sigue navegando por todo el portal y, sin esto, solo
 * descubría el bloqueo al pulsar algo: parecía un fallo del portal, no el fin
 * de la prueba (reporte Francesc 02-10-2026). Dos piezas:
 *  - franja fija arriba de cada página del panel (no se puede cerrar);
 *  - diálogo una vez por sesión que explica qué queda cerrado y qué sigue abierto.
 */
export const TrialLockedNotice = () => {
  const { isLocked, pricingPath } = useEntitlements();
  const endLabel = useTrialEndLabel();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!isLocked) return;
    let seen = false;
    try {
      seen = sessionStorage.getItem(SEEN_KEY) === '1';
    } catch {
      // Sin sessionStorage (modo privado estricto): se enseña igual.
    }
    if (!seen) setOpen(true);
  }, [isLocked]);

  const close = () => {
    try {
      sessionStorage.setItem(SEEN_KEY, '1');
    } catch {
      // Sin almacenamiento: volverá a salir en la próxima carga, no pasa nada.
    }
    setOpen(false);
  };

  if (!isLocked) return null;

  const terminada = endLabel ? `Tu prueba gratuita terminó el ${endLabel}.` : 'Tu prueba gratuita de 30 días ha terminado.';

  return (
    <>
      <div
        role="status"
        className="mb-4 flex flex-col gap-3 rounded-lg border border-ciruela/30 bg-ciruela-soft px-4 py-3 text-sm sm:flex-row sm:items-center sm:justify-between"
      >
        <div className="flex items-start gap-3">
          <Lock className="mt-0.5 h-4 w-4 flex-none text-ciruela" aria-hidden="true" />
          <p className="text-foreground text-pretty">
            <span className="font-semibold">{terminada}</span>{' '}
            Tu cuenta y tu progreso siguen aquí, pero los cursos, los recursos e IAFarma están cerrados
            hasta que elijas un plan. Sin permanencia.
          </p>
        </div>
        <Button asChild size="sm" className="shrink-0">
          <Link to={pricingPath}>Ver los planes</Link>
        </Button>
      </div>

      <Dialog open={open} onOpenChange={(next) => (next ? setOpen(true) : close())}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <div className="mb-2 flex h-11 w-11 items-center justify-center rounded-lg bg-ciruela text-primary-foreground">
              <Lock className="h-5 w-5" aria-hidden="true" />
            </div>
            <DialogTitle>Tu prueba de 30 días ha terminado</DialogTitle>
            <DialogDescription className="text-pretty">
              No es un fallo del portal: {endLabel ? `desde el ${endLabel}` : 'desde que terminó la prueba'} el
              contenido del plan está cerrado. Tu cuenta sigue activa y no has perdido nada: tus cursos
              empezados, tus puntos y tu perfil siguen ahí.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 text-sm sm:grid-cols-2">
            <div>
              <p className="mb-1.5 font-semibold text-foreground">Cerrado hasta elegir plan</p>
              <ul className="space-y-1 text-muted-foreground">
                <li>Cursos y masterclasses</li>
                <li>Recursos descargables</li>
                <li>IAFarma</li>
              </ul>
            </div>
            <div>
              <p className="mb-1.5 font-semibold text-foreground">Sigue abierto</p>
              <ul className="space-y-1 text-muted-foreground">
                <li>Foro y eventos</li>
                <li>Retos y La Rebotica</li>
                <li>Descargables de Impulso</li>
                <li>Tu perfil</li>
              </ul>
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="ghost" onClick={close}>
              Seguir mirando
            </Button>
            <Button asChild onClick={close}>
              <Link to={pricingPath}>Ver los planes</Link>
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};
