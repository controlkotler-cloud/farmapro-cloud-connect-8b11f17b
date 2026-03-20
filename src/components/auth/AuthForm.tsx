
import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from '@/hooks/use-toast';
import { usePasswordReset } from '@/hooks/usePasswordReset';
import { z } from 'zod';

// Security: Strong validation schema for authentication
const authSchema = z.object({
  email: z.string()
    .min(1, "El email es obligatorio")
    .email("Formato de email inválido")
    .max(255, "El email es demasiado largo"),
  password: z.string()
    .min(8, "La contraseña debe tener al menos 8 caracteres")
    .max(100, "La contraseña es demasiado larga")
    .regex(/[A-Z]/, "La contraseña debe contener al menos una mayúscula")
    .regex(/[a-z]/, "La contraseña debe contener al menos una minúscula")
    .regex(/[0-9]/, "La contraseña debe contener al menos un número"),
  fullName: z.string()
    .min(2, "El nombre debe tener al menos 2 caracteres")
    .max(100, "El nombre es demasiado largo")
    .optional(),
  pharmacyName: z.string()
    .max(200, "El nombre de la farmacia es demasiado largo")
    .optional(),
  position: z.string()
    .max(100, "El cargo es demasiado largo")
    .optional()
});

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

    try {
      // Security: Validate input before sending to server
      const validationData = isRegistering 
        ? { email, password, fullName, pharmacyName, position }
        : { email, password };
      
      const result = authSchema.safeParse(validationData);
      
      if (!result.success) {
        const firstError = result.error.issues[0];
        toast({
          title: "Error de validación",
          description: firstError.message,
          variant: "destructive",
        });
        setLoading(false);
        return;
      }

      if (isRegistering) {
        const { error } = await signUp(email, password, fullName, pharmacyName, position);

        if (error) {
          // Security: Don't expose internal error details
          const errorMessage = error.message.includes('already registered')
            ? 'Este email ya está registrado'
            : error.message.includes('invalid')
            ? 'Datos inválidos. Por favor, verifica la información'
            : 'Error al registrarse. Intenta de nuevo';
          
          toast({
            title: "Error de registro",
            description: errorMessage,
            variant: "destructive",
          });
        } else {
          toast({
            title: "¡Registro exitoso!",
            description: "Tu cuenta ha sido creada correctamente. Puedes iniciar sesión ahora.",
          });
          onToggleMode();
          setFullName('');
          setPharmacyName('');
          setPosition('');
        }
      } else {
        const { error } = await signIn(email, password);

        if (error) {
          // Security: Generic error message to prevent user enumeration
          const errorMessage = error.message.includes('Invalid') || error.message.includes('invalid')
            ? 'Email o contraseña incorrectos'
            : 'Error al iniciar sesión. Intenta de nuevo';
          
          toast({
            title: "Error de inicio de sesión",
            description: errorMessage,
            variant: "destructive",
          });
        } else {
          toast({
            title: "¡Bienvenido!",
            description: "Has iniciado sesión correctamente",
          });
        }
      }
    } catch (error) {
      console.error('Authentication error:', error);
      toast({
        title: "Error",
        description: "Ha ocurrido un error inesperado",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
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
          {isRegistering && (
            <p className="text-xs text-muted-foreground mt-1">
              Mínimo 8 caracteres, una mayúscula, una minúscula y un número
            </p>
          )}
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
