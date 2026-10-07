
import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { motion } from 'framer-motion';
import { AuthHeader } from './AuthHeader';
import { AuthForm } from './AuthForm';
import { captureReferralFromParams, getReferralCode } from '@/lib/analytics';

export const LoginForm = () => {
  // Entrada directa en modo registro con email preseleccionado (usado por la
  // Rebotica: /login?modo=registro&e=... tras elegir cajón sin cuenta). Sin
  // estos parámetros el comportamiento es el de siempre (modo login).
  const [params] = useSearchParams();
  // Llegada desde un enlace protegido (ProtectedRoute añade ?next= sin ?modo=):
  // casi siempre es alguien sin cuenta que quería un recurso. Se abre en registro
  // y se le dice que la cuenta es gratis. /activar (invitaciones de equipo) y el
  // consentimiento OAuth quedan fuera: ahí lo normal es que ya tengan cuenta.
  const next = params.get('next');
  const vieneDeEnlace =
    !!next && !params.get('modo') && next !== '/activar' && !next.startsWith('/oauth');
  const [isRegistering, setIsRegistering] = useState(
    params.get('modo') === 'registro' || vieneDeEnlace,
  );
  const initialEmail = params.get('e') && params.get('e')!.includes('@') ? params.get('e')! : undefined;

  // Captura aquí también por si CookieManager aún no ha corrido.
  captureReferralFromParams(params);
  const hasReferral = !!getReferralCode();

  const toggleMode = () => {
    setIsRegistering(!isRegistering);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-brand-soft to-background p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <Card className="w-full max-w-md shadow-lift">
          <CardHeader>
            <AuthHeader isRegistering={isRegistering} />
          </CardHeader>
          <CardContent>
            {vieneDeEnlace && (
              <div className="mb-5 rounded-md border border-border bg-brand-soft px-4 py-3 text-sm text-foreground">
                <p className="font-semibold [text-wrap:balance]">
                  Para verlo necesitas una cuenta del portal, y es gratis.
                </p>
                <p className="mt-1 text-muted-foreground [text-wrap:pretty]">
                  Al terminar el registro te llevamos directo a lo que buscabas.
                </p>
              </div>
            )}
            {isRegistering && hasReferral && (
              <div className="mb-5 rounded-md border border-border bg-brand-soft px-4 py-3 text-sm text-foreground">
                <p className="font-semibold [text-wrap:balance]">
                  Te ha invitado una compañera: tienes 60 días de prueba en lugar de 30.
                </p>
              </div>
            )}
            <AuthForm
              isRegistering={isRegistering}
              onToggleMode={toggleMode}
              initialEmail={initialEmail}
            />
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
};
