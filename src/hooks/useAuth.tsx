
import { createContext, useContext, useEffect, useState } from 'react';
import { User } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { validateFiscalId } from '@/lib/cif';
import { getStoredUtms } from '@/lib/analytics';

interface AuthContextType {
  user: User | null;
  profile: any | null;
  isAdmin: boolean;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: any }>;
  signUp: (email: string, password: string, fullName: string, pharmacyName?: string, position?: string, cif?: string, consents?: { rgpd: boolean; comercial: boolean; textoVersion: string }) => Promise<{ error: any }>;
  signOut: () => Promise<void>;
  reloadProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<any | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  const loadProfile = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();
      
      if (error) {
        console.error('Error loading profile:', error.message);
        return;
      }
      
      setProfile(data);
    } catch (error) {
      console.error('Error loading profile:', error);
    }
  };

  const checkAdminStatus = async () => {
    try {
      const { data: isAdminResult, error } = await supabase.rpc('is_current_user_admin');
      
      if (error) {
        console.error('Error checking admin status:', error.message);
        setIsAdmin(false);
      } else {
        setIsAdmin(!!isAdminResult);
      }
    } catch (error) {
      console.error('Exception checking admin status:', error);
      setIsAdmin(false);
    }
  };

  const reloadProfile = async () => {
    if (user) {
      await loadProfile(user.id);
      await checkAdminStatus();
    }
  };

  useEffect(() => {
    let mounted = true;

    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!mounted) return;

      setUser(session?.user ?? null);

      if (session?.user) {
        // Use setTimeout to avoid potential callback loops
        setTimeout(async () => {
          if (mounted) {
            await loadProfile(session.user.id);
            await checkAdminStatus();
          }
        }, 0);
      } else {
        setProfile(null);
        setIsAdmin(false);
      }

      // Set loading to false after first auth state change
      if (mounted) {
        setLoading(false);
      }
    });

    // Get initial session
    supabase.auth.getSession().then(({ data: { session }, error }) => {
      if (error) {
        console.error('Error getting session:', error.message);
        if (mounted) {
          setLoading(false);
        }
        return;
      }

      if (mounted && !session) {
        // If no initial session, set loading to false
        setLoading(false);
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const signIn = async (email: string, password: string) => {
    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      return { error };
    } catch (error) {
      console.error('Sign in error:', error);
      return { error };
    }
  };

  const signUp = async (email: string, password: string, fullName: string, pharmacyName?: string, position?: string, cif?: string, consents?: { rgpd: boolean; comercial: boolean; textoVersion: string }) => {
    try {
      // CIF/NIF normalizado (anti-pillaje: 1 prueba gratis por farmacia).
      const cifNormalized = cif ? validateFiscalId(cif).normalized : undefined;
      // Atribución: qué canal trajo este registro (UTMs capturados al aterrizar).
      const utms = getStoredUtms();
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          // Preserva a dónde volver tras confirmar el email (invitación de
          // equipo con su token, cajón de la Rebotica, UTMs...) — sin esto,
          // el link del email de confirmación lleva al Site URL genérico y
          // se pierde el contexto del flujo desde el que se registró.
          emailRedirectTo: window.location.href,
          data: {
            full_name: fullName,
            pharmacy_name: pharmacyName,
            position: position,
            cif: cifNormalized,
            // Consentimientos RGPD (KPI nº 1 del lanzamiento): el trigger
            // handle_new_user los vuelca a consent_ledger con la versión
            // literal del texto aceptado (prueba art. 7.1 RGPD).
            ...(consents ? {
              consent_rgpd: consents.rgpd,
              consent_comercial: consents.comercial,
              consent_texto_version: consents.textoVersion,
              consent_accepted_at: new Date().toISOString(),
            } : {}),
            ...(utms?.utm_source ? { utm_source: utms.utm_source } : {}),
            ...(utms?.utm_medium ? { utm_medium: utms.utm_medium } : {}),
            ...(utms?.utm_campaign ? { utm_campaign: utms.utm_campaign } : {}),
            ...(utms?.utm_term ? { utm_term: utms.utm_term } : {}),
            ...(utms?.utm_content ? { utm_content: utms.utm_content } : {}),
            ...(utms?.landing_page ? { landing_page: utms.landing_page } : {}),
          },
        },
      });
      return { error };
    } catch (error) {
      console.error('Sign up error:', error);
      return { error };
    }
  };

  const signOut = async () => {
    try {
      // Clear state immediately to prevent UI issues
      setUser(null);
      setProfile(null);
      setIsAdmin(false);
      await supabase.auth.signOut();
    } catch (error) {
      console.error('Sign out error:', error);
    }
  };

  return (
    <AuthContext.Provider value={{ user, profile, isAdmin, loading, signIn, signUp, signOut, reloadProfile }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
