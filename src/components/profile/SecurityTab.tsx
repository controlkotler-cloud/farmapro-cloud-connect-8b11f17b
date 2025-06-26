
import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Check, X } from 'lucide-react';

interface PasswordValidation {
  hasMinLength: boolean;
  hasUppercase: boolean;
  hasLowercase: boolean;
  hasNumber: boolean;
  hasSymbol: boolean;
  passwordsMatch: boolean;
}

export const SecurityTab = () => {
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  const validatePassword = (password: string, confirmPassword: string): PasswordValidation => {
    return {
      hasMinLength: password.length >= 10,
      hasUppercase: /[A-Z]/.test(password),
      hasLowercase: /[a-z]/.test(password),
      hasNumber: /\d/.test(password),
      hasSymbol: /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password),
      passwordsMatch: password === confirmPassword && password.length > 0 && confirmPassword.length > 0,
    };
  };

  const validation = validatePassword(passwordData.newPassword, passwordData.confirmPassword);
  const isPasswordValid = Object.values(validation).every(Boolean);

  const handlePasswordChange = (field: string, value: string) => {
    setPasswordData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const changePassword = async () => {
    if (!passwordData.newPassword || !passwordData.confirmPassword) {
      toast.error('Por favor, completa todos los campos');
      return;
    }

    if (!isPasswordValid) {
      toast.error('La contraseña no cumple con todos los requisitos de seguridad');
      return;
    }

    setPasswordLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({ 
        password: passwordData.newPassword 
      });

      if (error) throw error;
      
      toast.success('Contraseña actualizada correctamente');
      setPasswordData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      });
    } catch (error) {
      console.error('Error updating password:', error);
      toast.error('Error al actualizar la contraseña');
    } finally {
      setPasswordLoading(false);
    }
  };

  const ValidationIndicator = ({ isValid, text }: { isValid: boolean; text: string }) => (
    <div className={`flex items-center gap-2 text-sm ${isValid ? 'text-green-600' : 'text-red-500'}`}>
      {isValid ? <Check className="h-4 w-4" /> : <X className="h-4 w-4" />}
      <span>{text}</span>
    </div>
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle>Cambiar Contraseña</CardTitle>
        <CardDescription>
          Actualiza tu contraseña para mantener tu cuenta segura
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="newPassword">Nueva contraseña</Label>
          <Input
            id="newPassword"
            type="password"
            value={passwordData.newPassword}
            onChange={(e) => handlePasswordChange('newPassword', e.target.value)}
            placeholder="Introduce tu nueva contraseña"
          />
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="confirmPassword">Confirmar nueva contraseña</Label>
          <Input
            id="confirmPassword"
            type="password"
            value={passwordData.confirmPassword}
            onChange={(e) => handlePasswordChange('confirmPassword', e.target.value)}
            placeholder="Confirma tu nueva contraseña"
          />
        </div>

        {(passwordData.newPassword || passwordData.confirmPassword) && (
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 space-y-3">
            <h4 className="font-medium text-gray-900 mb-2">Requisitos de seguridad:</h4>
            <div className="grid grid-cols-1 gap-2">
              <ValidationIndicator 
                isValid={validation.hasMinLength} 
                text="Mínimo 10 caracteres" 
              />
              <ValidationIndicator 
                isValid={validation.hasUppercase} 
                text="Al menos 1 letra mayúscula" 
              />
              <ValidationIndicator 
                isValid={validation.hasLowercase} 
                text="Al menos 1 letra minúscula" 
              />
              <ValidationIndicator 
                isValid={validation.hasNumber} 
                text="Al menos 1 número" 
              />
              <ValidationIndicator 
                isValid={validation.hasSymbol} 
                text="Al menos 1 símbolo (!@#$%^&*()_+-=[]{}|;':\",./<>?)" 
              />
              <ValidationIndicator 
                isValid={validation.passwordsMatch} 
                text="Las contraseñas coinciden" 
              />
            </div>
          </div>
        )}

        <Button 
          onClick={changePassword} 
          disabled={passwordLoading || !passwordData.newPassword || !passwordData.confirmPassword || !isPasswordValid}
          className="w-full"
        >
          {passwordLoading ? 'Actualizando...' : 'Cambiar Contraseña'}
        </Button>
      </CardContent>
    </Card>
  );
};
