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
import { getTrialEnd } from '@/lib/plans';

const SEEN_KEY = 'farmapro:trial-locked-notice-seen';

/** Fecha (texto) en la que terminó la prueba: alta + 30 días, o el fin de la concesión. */
const useTrialEndLabel = () => {
  const { profile } = useAuth();
  const end = getTrialEnd(profile?.created_at, profile?.trial_ends_at);
  if (!end) return null;
  return end.toLocaleDateString('es-ES', { day: 'numeric', month: 'long' });
};

/**
 * Franja de prueba terminada (free_locked). Con validation_mode='beta' el
 * usuario caducado sigue navegando por todo el portal y, sin esto, solo
 * descubría el bloqueo al pulsar algo: parecía un fallo del portal, no el fin
 * de la prueba (reporte Francesc 02-10-2026). Va FUERA del área con scroll
 * (bajo la cabecera), así que se ve siempre, en cualquier pantalla, y no se
 * puede cerrar. La Rebotica, que tiene layout propio, la pinta también.
 */
export const TrialLockedBanner = () => {
  const { isLocked, pricingPath } = useEntitlements();
  const endLabel = useTrialEndLabel();
  if (!isLocked) return null;

  return (
    <div
      role="status"
      className="flex flex-none flex-col gap-2 border-b border-ciruela/30 bg-ciruela-soft px-4 py-2.5 text-sm sm:flex-row sm:items-center sm:justify-between md:px-6"
    >
      <div className="flex items-start gap-2.5">
        <Lock className="mt-0.5 h-4 w-4 flex-none text-ciruela" aria-hidden="true" />
        <p className="text-foreground text-pretty">
          <span className="font-semibold">
            {endLabel ? `Tu periodo de prueba terminó el ${endLabel}.` : 'Tu periodo de prueba ha terminado.'}
          </span>{' '}
          Para seguir usando el portal tienes que contratar un plan. Tu cuenta y tu progreso se conservan.
        </p>
      </div>
      <Button asChild size="sm" className="shrink-0">
        <Link to={pricingPath}>Contratar un plan</Link>
      </Button>
    </div>
  );
};

/**
 * Diálogo de prueba terminada: una vez por sesión, al entrar, explica que no
 * es un fallo y qué queda cerrado.
 */
export const TrialLockedDialog = () => {
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

  return (
    <Dialog open={open} onOpenChange={(next) => (next ? setOpen(true) : close())}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="mb-2 flex h-11 w-11 items-center justify-center rounded-lg bg-ciruela text-primary-foreground">
            <Lock className="h-5 w-5" aria-hidden="true" />
          </div>
          <DialogTitle>Tu periodo de prueba ha terminado</DialogTitle>
          <DialogDescription className="text-pretty">
            No es un fallo del portal: {endLabel ? `desde el ${endLabel}` : 'desde que terminó la prueba'} el
            contenido está cerrado y para seguir usándolo tienes que contratar un plan. Tu cuenta sigue
            activa y no has perdido nada: tus cursos empezados, tus puntos y tu perfil siguen ahí.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 text-sm sm:grid-cols-2">
          <div>
            <p className="mb-1.5 font-semibold text-foreground">Cerrado hasta contratar</p>
            <ul className="space-y-1 text-muted-foreground">
              <li>Cursos y masterclasses</li>
              <li>Recursos descargables</li>
              <li>IAFarma</li>
              <li>Cajones de La Rebotica</li>
            </ul>
          </div>
          <div>
            <p className="mb-1.5 font-semibold text-foreground">Sigue abierto</p>
            <ul className="space-y-1 text-muted-foreground">
              <li>Foro y eventos</li>
              <li>Descargables de Impulso</li>
              <li>Tu perfil y facturación</li>
            </ul>
          </div>
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="ghost" onClick={close}>
            Seguir mirando
          </Button>
          <Button asChild onClick={close}>
            <Link to={pricingPath}>Contratar un plan</Link>
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
