
import { supabase } from '@/integrations/supabase/client';

/**
 * Verifica si el usuario actual tiene permisos de administrador
 */
export const checkIsAdmin = async (): Promise<boolean> => {
  try {
    const { data, error } = await supabase.rpc('is_current_user_admin');
    
    if (error) {
      console.error('Error checking admin status:', error);
      return false;
    }
    
    return !!data;
  } catch (error) {
    console.error('Exception checking admin status:', error);
    return false;
  }
};

/**
 * Verifica si el usuario puede acceder a datos de otro usuario
 */
export const canAccessUserData = async (targetUserId: string): Promise<boolean> => {
  try {
    const { data, error } = await supabase.rpc('can_access_user_data', { 
      target_user_id: targetUserId 
    });
    
    if (error) {
      console.error('Error checking user data access:', error);
      return false;
    }
    
    return !!data;
  } catch (error) {
    console.error('Exception checking user data access:', error);
    return false;
  }
};

/**
 * Verifica si el usuario actual puede crear contenido premium (farmacias, empleos)
 */
export const canCreatePremiumContent = async (): Promise<boolean> => {
  try {
    const { data: user } = await supabase.auth.getUser();
    
    if (!user.user) {
      return false;
    }

    const { data: profile, error } = await supabase
      .from('profiles')
      .select('subscription_role')
      .eq('id', user.user.id)
      .single();

    if (error) {
      console.error('Error checking subscription role:', error);
      return false;
    }

    const premiumRoles = ['premium', 'profesional', 'admin'];
    return premiumRoles.includes(profile?.subscription_role);
    
  } catch (error) {
    console.error('Exception checking premium content access:', error);
    return false;
  }
};

/**
 * Obtiene el rol de suscripción del usuario actual
 */
export const getCurrentUserRole = async (): Promise<string | null> => {
  try {
    const { data: user } = await supabase.auth.getUser();
    
    if (!user.user) {
      return null;
    }

    const { data: profile, error } = await supabase
      .from('profiles')
      .select('subscription_role')
      .eq('id', user.user.id)
      .single();

    if (error) {
      console.error('Error getting user role:', error);
      return null;
    }

    return profile?.subscription_role || 'freemium';
    
  } catch (error) {
    console.error('Exception getting user role:', error);
    return null;
  }
};

/**
 * Constantes para los diferentes roles de usuario
 */
export const USER_ROLES = {
  FREEMIUM: 'freemium',
  ESTUDIANTE: 'estudiante',  
  PROFESIONAL: 'profesional',
  PREMIUM: 'premium',
  ADMIN: 'admin'
} as const;

/**
 * Verifica si un rol tiene permisos premium
 */
export const isPremiumRole = (role: string): boolean => {
  const premiumRoles = [USER_ROLES.PREMIUM, USER_ROLES.PROFESIONAL, USER_ROLES.ADMIN];
  return premiumRoles.includes(role as any);
};

/**
 * Manejo de errores RLS con mensajes user-friendly
 */
export const handleRLSError = (error: any): string => {
  if (error?.message?.includes('row-level security')) {
    return 'No tienes permisos para realizar esta acción. Verifica tu suscripción o contacta con soporte.';
  }
  
  if (error?.message?.includes('violates row-level security policy')) {
    return 'Operación no permitida. Asegúrate de tener los permisos necesarios.';
  }
  
  if (error?.message?.includes('permission denied')) {
    return 'Acceso denegado. Es posible que necesites permisos de administrador.';
  }
  
  return error?.message || 'Error desconocido en la operación';
};
