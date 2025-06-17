
import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from '@/hooks/use-toast';
import { usePasswordReset } from '@/hooks/usePasswordReset';

interface AuthFormProps {
  isRegistering: boolean;
  onToggleMode: () => void;
}

export const AuthForm = ({ isRegistering, onToggleMode }: AuthFormProps) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [pharmacyName, setPharmacyName] = useState('');
  const [position, setPosition] = useState('');
  const [loading, setLoading] = useState(false);
  const { signIn, signUp } = useAuth();
  const { handlePasswordReset } = usePasswordReset();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    if (isRegistering) {
      // Registro
      if (!fullName.trim()) {
        toast({
          title: "Error",
          description: "El nombre completo es requerido",
          variant: "destructive",
        });
        setLoading(false);
        return;
      }

      const { error } = await signUp(email, password, fullName, pharmacyName, position);

      if (error) {
        toast({
          title: "Error de registro",
          description: error.message,
          variant: "destructive",
        });
      } else {
        toast({
          title: "¡Registro exitoso!",
          description: "Tu cuenta ha sido creada correctamente. Puedes iniciar sesión ahora.",
        });
        // Cambiar a modo login después del registro exitoso
        onToggleMode();
        setFullName('');
        setPharmacyName('');
        setPosition('');
      }
    } else {
      // Login
      const { error } = await signIn(email, password);

      if (error) {
        toast({
          title: "Error de inicio de sesión",
          description: error.message,
          variant: "destructive",
        });
      } else {
        toast({
          title: "¡Bienvenido!",
          description: "Has iniciado sesión correctamente",
        });
      }
    }

    setLoading(false);
  };

  const clearFields = () => {
    setEmail('');
    setPassword('');
    setFullName('');
    setPharmacyName('');
    setPosition('');
  };

  const handleToggle = () => {
    clearFields();
    onToggleMode();
  };

  return (
    <div className="space-y-4">
      <form onSubmit={handleSubmit} className="space-y-4">
        {isRegistering && (
          <div>
            <Label htmlFor="fullName">Nombre Completo *</Label>
            <Input
              id="fullName"
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              required
              className="mt-1"
              placeholder="Tu nombre completo"
            />
          </div>
        )}
        
        <div>
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="mt-1"
            placeholder="tu@email.com"
          />
        </div>
        
        <div>
          <Label htmlFor="password">Contraseña</Label>
          <Input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            className="mt-1"
            placeholder="Tu contraseña"
          />
        </div>

        {isRegistering && (
          <>
            <div>
              <Label htmlFor="pharmacyName">Farmacia (opcional)</Label>
              <Input
                id="pharmacyName"
                type="text"
                value={pharmacyName}
                onChange={(e) => setPharmacyName(e.target.value)}
                className="mt-1"
                placeholder="Nombre de tu farmacia"
              />
            </div>
            
            <div>
              <Label htmlFor="position">Cargo (opcional)</Label>
              <Input
                id="position"
                type="text"
                value={position}
                onChange={(e) => setPosition(e.target.value)}
                className="mt-1"
                placeholder="Tu cargo profesional"
              />
            </div>
          </>
        )}
        
        <Button type="submit" className="w-full" disabled={loading}>
          {loading 
            ? (isRegistering ? 'Creando cuenta...' : 'Iniciando sesión...') 
            : (isRegistering ? 'Crear Cuenta' : 'Iniciar Sesión')
          }
        </Button>
      </form>
      
      {!isRegistering && (
        <div className="text-center">
          <Button
            variant="link"
            onClick={() => handlePasswordReset(email)}
            className="text-gray-600 hover:text-gray-700 p-0 h-auto text-sm"
          >
            ¿Olvidaste tu contraseña?
          </Button>
        </div>
      )}
      
      <div className="mt-6 text-center">
        <p className="text-sm text-gray-600">
          {isRegistering ? '¿Ya tienes una cuenta?' : '¿No tienes una cuenta?'}
        </p>
        <Button
          variant="link"
          onClick={handleToggle}
          className="text-blue-600 hover:text-blue-700 p-0 h-auto font-medium"
        >
          {isRegistering ? 'Iniciar Sesión' : 'Registrarse'}
        </Button>
      </div>
    </div>
  );
};
