
import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from '@/hooks/use-toast';
import { usePasswordReset } from '@/hooks/usePasswordReset';
import { z } from 'zod';
import { isValidFiscalId, validateFiscalId } from '@/lib/cif';
import { supabase } from '@/integrations/supabase/client';
import { trackRegistration } from '@/lib/analytics';
import { Checkbox } from '@/components/ui/checkbox';

/**
 * Consentimientos RGPD del registro (KPI nº 1 del lanzamiento).
 * `CONSENT_TEXTO_VERSION` identifica la versión LITERAL de los textos de abajo
 * en consent_ledger (prueba art. 7.1 RGPD). Si cambias cualquiera de los dos
 * textos, sube la versión (v2, v3...) y anótalo en la ficha de la Rebotica.
 */
export const CONSENT_TEXTO_VERSION = 'registro-portal-v1-2026-07-10';
export const CONSENT_TEXTO_RGPD =
  'He leído y acepto la política de privacidad. Responsable: Mkpro Kotler SL. Finalidad: gestionar tu cuenta del portal farmapro.';
export const CONSENT_TEXTO_COMERCIAL =
  'Acepto recibir comunicaciones del sector de farmapro (newsletter quincenal, novedades del portal y ofertas de servicios). Puedes darte de baja en cualquier momento.';

/** Aviso amable cuando el CIF ya tiene una cuenta (1 prueba gratis por farmacia). */
const CIF_DUPLICADO_TOAST = {
  title: 'Este CIF ya tiene cuenta',
  description:
    'La prueba gratuita es una por farmacia y este CIF ya la ha usado. Inicia sesión con la cuenta original o hazte Plus. Si crees que es un error, escríbenos a somos@farmapro.es.',
  variant: 'destructive' as const,
};

/**
 * Pre-check de disponibilidad del CIF vía RPC `cif_disponible` (SECURITY DEFINER).
 * Si la RPC aún no existe o falla, devolvemos true y dejamos que el registro siga:
 * la última red es el índice único de profiles (el error se mapea abajo).
 */
const checkCifDisponible = async (cifNormalized: string): Promise<boolean> => {
  try {
    const { data, error } = await supabase.rpc('cif_disponible', { p_cif: cifNormalized });
    if (error) return true;
    return data !== false;
  } catch {
    return true;
  }
};

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
  /** Preselección de email (p. ej. desde el enlace de un email de campaña). Opcional. */
  initialEmail?: string;
}

export const AuthForm = ({ isRegistering, onToggleMode, initialEmail }: AuthFormProps) => {
  const [email, setEmail] = useState(initialEmail ?? '');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [pharmacyName, setPharmacyName] = useState('');
  const [position, setPosition] = useState('');
  const [cif, setCif] = useState('');
  const [aceptaRgpd, setAceptaRgpd] = useState(false);
  const [aceptaComercial, setAceptaComercial] = useState(false);
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
        // RGPD (KPI nº 1): doble check obligatorio y NUNCA premarcado. El acceso
        // gratuito al portal es el intercambio de valor por las comunicaciones.
        if (!aceptaRgpd || !aceptaComercial) {
          toast({
            title: 'Falta tu consentimiento',
            description: 'Para crear la cuenta necesitamos que aceptes la política de privacidad y las comunicaciones del sector.',
            variant: 'destructive',
          });
          setLoading(false);
          return;
        }

        // Anti-pillaje: el CIF/NIF de la farmacia es obligatorio y debe ser válido
        // (1 prueba gratis por farmacia; la verificación de existencia se hará en el alta).
        if (!isValidFiscalId(cif)) {
          toast({
            title: 'Revisa el CIF/NIF',
            description: 'Introduce el CIF o NIF de tu farmacia (formato válido).',
            variant: 'destructive',
          });
          setLoading(false);
          return;
        }

        // Anti-pillaje: si el CIF ya gastó su prueba, avisamos ANTES de crear nada.
        const cifNormalized = validateFiscalId(cif).normalized;
        const disponible = await checkCifDisponible(cifNormalized);
        if (!disponible) {
          toast(CIF_DUPLICADO_TOAST);
          setLoading(false);
          return;
        }

        const { error } = await signUp(email, password, fullName, pharmacyName, position, cif, {
          rgpd: aceptaRgpd,
          comercial: aceptaComercial,
          textoVersion: CONSENT_TEXTO_VERSION,
        });

        if (error) {
          // El índice único de profiles hace fallar el trigger handle_new_user con
          // "Database error saving new user": a esta altura del formulario, la causa
          // realista es el CIF duplicado (carrera con el pre-check o RPC ausente).
          const isDbTriggerError = error.message?.toLowerCase().includes('database error');
          if (isDbTriggerError) {
            toast(CIF_DUPLICADO_TOAST);
            setLoading(false);
            return;
          }
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
          // Conversión del lanzamiento: registro completado (GA4 + píxel Meta).
          trackRegistration();
          toast({
            title: "¡Registro exitoso!",
            description: "Tu cuenta ha sido creada correctamente. Puedes iniciar sesión ahora.",
          });
          onToggleMode();
          setFullName('');
          setPharmacyName('');
          setPosition('');
          setCif('');
          setAceptaRgpd(false);
          setAceptaComercial(false);
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
    setCif('');
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
              <Label htmlFor="cif">CIF / NIF de la farmacia *</Label>
              <Input
                id="cif"
                type="text"
                value={cif}
                onChange={(e) => setCif(e.target.value)}
                required
                className="mt-1"
                placeholder="Ej. B12345674"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Lo usamos para validar tu farmacia. Incluye 1 prueba gratis por farmacia.
              </p>
            </div>

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

            {/* Doble check RGPD: obligatorio, nunca premarcado (consent_ledger vía handle_new_user) */}
            <div className="space-y-3 rounded-md border border-border p-3">
              <div className="flex items-start gap-2">
                <Checkbox
                  id="consent-rgpd"
                  checked={aceptaRgpd}
                  onCheckedChange={(v) => setAceptaRgpd(v === true)}
                  className="mt-0.5"
                />
                <Label htmlFor="consent-rgpd" className="text-xs font-normal leading-snug text-muted-foreground cursor-pointer">
                  He leído y acepto la{' '}
                  <a href="/politica-privacidad" target="_blank" rel="noopener noreferrer" className="underline text-foreground">
                    política de privacidad
                  </a>
                  . Responsable: Mkpro Kotler SL. Finalidad: gestionar tu cuenta del portal farmapro. *
                </Label>
              </div>
              <div className="flex items-start gap-2">
                <Checkbox
                  id="consent-comercial"
                  checked={aceptaComercial}
                  onCheckedChange={(v) => setAceptaComercial(v === true)}
                  className="mt-0.5"
                />
                <Label htmlFor="consent-comercial" className="text-xs font-normal leading-snug text-muted-foreground cursor-pointer">
                  Acepto recibir comunicaciones del sector de farmapro (newsletter quincenal, novedades del portal y ofertas de servicios). Puedes darte de baja en cualquier momento. *
                </Label>
              </div>
              <p className="text-[11px] text-muted-foreground">
                El acceso gratuito al portal es el intercambio por estas comunicaciones: sin los dos consentimientos no podemos crear la cuenta.
              </p>
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
            className="text-muted-foreground hover:text-foreground p-0 h-auto text-sm"
          >
            ¿Olvidaste tu contraseña?
          </Button>
        </div>
      )}
      
      <div className="mt-6 text-center">
        <p className="text-sm text-muted-foreground">
          {isRegistering ? '¿Ya tienes una cuenta?' : '¿No tienes una cuenta?'}
        </p>
        <Button
          variant="link"
          onClick={handleToggle}
          className="text-primary hover:text-primary/80 p-0 h-auto font-medium"
        >
          {isRegistering ? 'Iniciar Sesión' : 'Registrarse'}
        </Button>
      </div>
    </div>
  );
};
