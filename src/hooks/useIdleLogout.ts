import { useCallback, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { toast } from '@/hooks/use-toast';

/**
 * Cierra la sesión tras un rato sin actividad. Pensado SOLO para el panel de
 * administración: ahí se ven emails, farmacias, suscripciones y facturas de los
 * clientes, y la sesión de Supabase no caduca nunca por sí sola
 * (persistSession + autoRefreshToken, sin `not_after`). El resto del portal
 * mantiene la sesión persistente a propósito.
 */

const STORAGE_KEY = 'farmapro_admin_last_activity';

// Eventos que cuentan como presencia real. `mousemove` queda fuera a propósito:
// lo dispara cualquier roce de la mesa y mantendría la sesión viva sin nadie
// delante, que es justo lo que esto viene a evitar.
const ACTIVITY_EVENTS: (keyof WindowEventMap)[] = ['pointerdown', 'keydown', 'wheel', 'touchstart'];

// El reloj se mira por intervalo, no con un setTimeout: así un portátil que se
// cierra y se abre dos horas después sale cerrado en la primera comprobación.
const TICK_MS = 15_000;
const PERSIST_MS = 20_000;

const readShared = (): number => {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    const parsed = raw ? Number(raw) : 0;
    return Number.isFinite(parsed) ? parsed : 0;
  } catch {
    return 0; // modo privado o almacenamiento bloqueado
  }
};

const writeShared = (ts: number) => {
  try {
    window.localStorage.setItem(STORAGE_KEY, String(ts));
  } catch {
    /* sin almacenamiento: el hook sigue funcionando por pestaña */
  }
};

interface UseIdleLogoutOptions {
  /** Minutos sin actividad antes de cerrar la sesión. */
  idleMinutes?: number;
  /** Minutos de aviso previo, para no perder un formulario a medias. */
  warnMinutes?: number;
  enabled?: boolean;
}

export const useIdleLogout = ({
  idleMinutes = 30,
  warnMinutes = 2,
  enabled = true,
}: UseIdleLogoutOptions = {}) => {
  const { signOut } = useAuth();
  const navigate = useNavigate();
  const lastActivity = useRef(Date.now());
  const lastPersist = useRef(0);
  const warned = useRef(false);
  const closing = useRef(false);

  const markActivity = useCallback(() => {
    const ts = Date.now();
    lastActivity.current = ts;
    warned.current = false;
    if (ts - lastPersist.current > PERSIST_MS) {
      lastPersist.current = ts;
      writeShared(ts);
    }
  }, []);

  useEffect(() => {
    if (!enabled) return;

    const idleMs = idleMinutes * 60_000;
    const warnMs = Math.max(0, idleMinutes - warnMinutes) * 60_000;

    markActivity();

    const check = async () => {
      // La actividad en otra pestaña del panel también cuenta.
      const last = Math.max(lastActivity.current, readShared());
      lastActivity.current = last;
      const idleFor = Date.now() - last;

      if (idleFor >= idleMs) {
        if (closing.current) return;
        closing.current = true;
        await signOut();
        navigate('/login', { replace: true });
        toast({
          title: 'Sesión cerrada por inactividad',
          description: `El panel se cierra solo tras ${idleMinutes} minutos sin actividad. Vuelve a entrar para seguir.`,
        });
        return;
      }

      if (!warned.current && idleFor >= warnMs) {
        warned.current = true;
        toast({
          title: 'Vas a salir del panel',
          description: `Llevas un rato sin actividad: cerramos la sesión en ${warnMinutes} minutos. Haz clic o pulsa una tecla para seguir trabajando.`,
        });
      }
    };

    const interval = window.setInterval(check, TICK_MS);
    // Al volver a la pestaña se comprueba el reloj, no se reinicia la cuenta.
    const onVisible = () => {
      if (document.visibilityState === 'visible') void check();
    };

    ACTIVITY_EVENTS.forEach((evt) =>
      window.addEventListener(evt, markActivity, { passive: true })
    );
    document.addEventListener('visibilitychange', onVisible);

    return () => {
      window.clearInterval(interval);
      ACTIVITY_EVENTS.forEach((evt) => window.removeEventListener(evt, markActivity));
      document.removeEventListener('visibilitychange', onVisible);
    };
  }, [enabled, idleMinutes, warnMinutes, markActivity, signOut, navigate]);
};
