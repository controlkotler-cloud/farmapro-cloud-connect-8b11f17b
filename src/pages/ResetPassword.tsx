
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { motion } from 'framer-motion';
import { z } from 'zod';
import { toast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

const passwordSchema = z.object({
  password: z.string()
    .min(8, "La contraseña debe tener al menos 8 caracteres")
    .max(100, "La contraseña es demasiado larga")
    .regex(/[A-Z]/, "La contraseña debe contener al menos una mayúscula")
    .regex(/[a-z]/, "La contraseña debe contener al menos una minúscula")
    .regex(/[0-9]/, "La contraseña debe contener al menos un número"),
});

export const ResetPassword = () => {
  const navigate = useNavigate();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  // El link del email establece una sesión temporal (evento PASSWORD_RECOVERY)
  // de forma asíncrona al cargar; hasta que llega no dejamos enviar el formulario.
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY') {
        setReady(true);
      }
    });

    // Cubre el caso de que el evento ya se haya procesado antes de montar el listener.
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) setReady(true);
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const result = passwordSchema.safeParse({ password });
    if (!result.success) {
      toast({
        title: "Revisa la contraseña",
        description: result.error.issues[0].message,
        variant: "destructive",
      });
      return;
    }

    if (password !== confirmPassword) {
      toast({
        title: "Las contraseñas no coinciden",
        description: "Escribe la misma contraseña en los dos campos",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    const { error } = await supabase.auth.updateUser({ password });
    setLoading(false);

    if (error) {
      toast({
        title: "Error",
        description: "No se ha podido actualizar la contraseña. Pide un nuevo enlace desde \"¿Olvidaste tu contraseña?\".",
        variant: "destructive",
      });
      return;
    }

    toast({
      title: "Contraseña actualizada",
      description: "Ya puedes usar tu nueva contraseña.",
    });
    navigate('/dashboard');
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
            <div className="text-center">
              <div className="mx-auto mb-6 space-y-3">
                <div className="flex justify-center">
                  <img src="/icono-farmapro.svg" alt="farmapro imagotipo" className="w-16 h-16" />
                </div>
                <h1 className="text-sm font-bold uppercase tracking-[0.12em] text-muted-foreground">Portal</h1>
                <div className="flex justify-center">
                  <img src="/logo-farmapro.svg" alt="farmapro logotipo" className="h-8" />
                </div>
              </div>
              <h2 className="text-2xl font-extrabold tracking-tight text-foreground mb-2 [text-wrap:balance]">Nueva contraseña</h2>
              <p className="text-sm text-muted-foreground">Escribe tu nueva contraseña para el Portal farmapro</p>
            </div>
          </CardHeader>
          <CardContent>
            {!ready ? (
              <p className="text-sm text-muted-foreground text-center py-4">
                Comprobando el enlace de restablecimiento&hellip;
              </p>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <Label htmlFor="password">Nueva contraseña</Label>
                  <Input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="mt-1"
                    placeholder="Tu nueva contraseña"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Mínimo 8 caracteres, una mayúscula, una minúscula y un número
                  </p>
                </div>

                <div>
                  <Label htmlFor="confirmPassword">Confirma la contraseña</Label>
                  <Input
                    id="confirmPassword"
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    className="mt-1"
                    placeholder="Repite la contraseña"
                  />
                </div>

                <Button type="submit" className="w-full rounded-full" disabled={loading}>
                  {loading ? 'Guardando...' : 'Guardar contraseña'}
                </Button>
              </form>
            )}
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
};
