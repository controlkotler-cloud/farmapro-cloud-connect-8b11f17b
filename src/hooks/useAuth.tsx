
import { createContext, useContext, useEffect, useState } from 'react';
import { User } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';

interface AuthContextType {
  user: User | null;
  profile: any | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: any }>;
  signUp: (email: string, password: string, fullName: string, pharmacyName?: string, position?: string) => Promise<{ error: any }>;
  signOut: () => Promise<void>;
  reloadProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);

  const loadProfile = async (userId: string) => {
    try {
      console.log('Loading profile for user:', userId);
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();
      
      if (error) {
        console.error('Error loading profile:', error);
        return;
      }
      
      console.log('Profile loaded:', data);
      console.log('User role:', data?.subscription_role);
      
      // Verificar específicamente si es admin
      if (data?.subscription_role === 'admin') {
        console.log('✅ Admin user detected and confirmed');
      }
      
      setProfile(data);
    } catch (error) {
      console.error('Error loading profile:', error);
    }
  };

  const reloadProfile = async () => {
    if (user) {
      console.log('Reloading profile for user:', user.id);
      await loadProfile(user.id);
    }
  };

  useEffect(() => {
    let mounted = true;

    // Get initial session
    const getSession = async () => {
      try {
        console.log('Getting initial session...');
        const { data: { session } } = await supabase.auth.getSession();
        if (mounted) {
          console.log('Initial session:', session?.user?.email);
          setUser(session?.user ?? null);
          if (session?.user) {
            await loadProfile(session.user.id);
          }
          setLoading(false);
        }
      } catch (error) {
        console.error('Error getting session:', error);
        if (mounted) {
          setLoading(false);
        }
      }
    };

    getSession();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('Auth state changed:', event, session?.user?.email);
      
      if (mounted) {
        setUser(session?.user ?? null);
        if (session?.user) {
          // Cargar perfil inmediatamente sin setTimeout
          console.log('Loading profile after auth change...');
          await loadProfile(session.user.id);
          
          // NO llamar checkSubscriptionStatus si el usuario ya es admin
          const { data: currentProfile } = await supabase
            .from('profiles')
            .select('subscription_role')
            .eq('id', session.user.id)
            .single();
          
          if (currentProfile?.subscription_role !== 'admin') {
            console.log('Not admin, checking subscription status...');
            await checkSubscriptionStatus();
          } else {
            console.log('User is admin, skipping subscription check');
          }
        } else {
          setProfile(null);
        }
        setLoading(false);
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const checkSubscriptionStatus = async () => {
    try {
      console.log('Checking subscription status...');
      await supabase.functions.invoke('check-subscription');
      // Reload profile after checking subscription to get updated role
      if (user) {
        setTimeout(() => {
          loadProfile(user.id);
        }, 500); // Small delay to ensure database is updated
      }
    } catch (error) {
      console.error('Error checking subscription status:', error);
    }
  };

  const signIn = async (email: string, password: string) => {
    try {
      console.log('Signing in user:', email);
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      return { error };
    } catch (error) {
      console.error('Sign in error:', error);
      return { error };
    }
  };

  const signUp = async (email: string, password: string, fullName: string, pharmacyName?: string, position?: string) => {
    try {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
            pharmacy_name: pharmacyName,
            position: position,
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
      console.log('Signing out user');
      setProfile(null); // Clear profile immediately
      await supabase.auth.signOut();
    } catch (error) {
      console.error('Sign out error:', error);
    }
  };

  return (
    <AuthContext.Provider value={{ user, profile, loading, signIn, signUp, signOut, reloadProfile }}>
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
