
import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { motion } from 'framer-motion';
import { AuthHeader } from './AuthHeader';
import { AuthForm } from './AuthForm';

export const LoginForm = () => {
  // Entrada directa en modo registro con email preseleccionado (usado por la
  // Rebotica: /login?modo=registro&e=... tras elegir cajón sin cuenta). Sin
  // estos parámetros el comportamiento es el de siempre (modo login).
  const [params] = useSearchParams();
  const [isRegistering, setIsRegistering] = useState(params.get('modo') === 'registro');
  const initialEmail = params.get('e') && params.get('e')!.includes('@') ? params.get('e')! : undefined;

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
        <Card className="w-full max-w-md shadow-2xl">
          <CardHeader>
            <AuthHeader isRegistering={isRegistering} />
          </CardHeader>
          <CardContent>
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
