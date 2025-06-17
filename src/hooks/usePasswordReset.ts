
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

export const usePasswordReset = () => {
  const handlePasswordReset = async (email: string) => {
    if (!email) {
      toast({
        title: "Email requerido",
        description: "Por favor, introduce tu email para restablecer la contraseña",
        variant: "destructive",
      });
      return;
    }

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });

    if (error) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } else {
      toast({
        title: "Email enviado",
        description: "Revisa tu email para restablecer tu contraseña",
      });
    }
  };

  return { handlePasswordReset };
};
