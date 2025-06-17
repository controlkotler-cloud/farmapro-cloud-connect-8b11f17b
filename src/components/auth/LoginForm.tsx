
import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from '@/hooks/use-toast';
import { motion } from 'framer-motion';

export const LoginForm = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [pharmacyName, setPharmacyName] = useState('');
  const [position, setPosition] = useState('');
  const [loading, setLoading] = useState(false);
  const [isRegistering, setIsRegistering] = useState(false);
  const { signIn, signUp } = useAuth();

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
        setIsRegistering(false);
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

  const toggleMode = () => {
    setIsRegistering(!isRegistering);
    // Limpiar campos al cambiar de modo
    setEmail('');
    setPassword('');
    setFullName('');
    setPharmacyName('');
    setPosition('');
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <Card className="w-full max-w-md shadow-2xl">
          <CardHeader className="text-center">
            <div className="mx-auto mb-6 space-y-3">
              {/* Imagotipo */}
              <div className="flex justify-center">
                <img src="/lovable-uploads/9312b52a-2ecc-45f4-a83d-1fbfdbd673db.png" alt="farmapro imagotipo" className="w-16 h-16" />
              </div>
              
              {/* Texto Portal */}
              <h1 className="text-xl font-bold text-gray-800">Portal</h1>
              
              {/* Logotipo */}
              <div className="flex justify-center">
                <img src="/lovable-uploads/984857f8-bf1d-4c44-947b-487d144f6aae.png" alt="farmapro logotipo" className="h-8" />
              </div>
            </div>
            
            <CardTitle className="text-2xl font-bold text-gray-900">
              {isRegistering ? 'Registro' : 'Accede a tu cuenta'}
            </CardTitle>
            <CardDescription>
              {isRegistering ? 'Crea tu cuenta profesional' : 'Inicia sesión en tu cuenta profesional'}
            </CardDescription>
          </CardHeader>
          <CardContent>
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
            
            <div className="mt-6 text-center">
              <p className="text-sm text-gray-600">
                {isRegistering ? '¿Ya tienes una cuenta?' : '¿No tienes una cuenta?'}
              </p>
              <Button
                variant="link"
                onClick={toggleMode}
                className="text-blue-600 hover:text-blue-700 p-0 h-auto font-medium"
              >
                {isRegistering ? 'Iniciar Sesión' : 'Registrarse'}
              </Button>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
};
