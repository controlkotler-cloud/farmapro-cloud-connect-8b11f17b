
import { useAuth } from '@/hooks/useAuth';
import { Navigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface AdminRouteProps {
  children: React.ReactNode;
}

export const AdminRoute = ({ children }: AdminRouteProps) => {
  const { user, profile, loading, reloadProfile } = useAuth();
  const [isVerifyingAdmin, setIsVerifyingAdmin] = useState(false);
  const [adminVerified, setAdminVerified] = useState(false);

  useEffect(() => {
    const verifyAdminStatus = async () => {
      if (!user || loading) return;

      setIsVerifyingAdmin(true);
      console.log('AdminRoute - Verifying admin status...');
      console.log('AdminRoute - User:', user?.email);
      console.log('AdminRoute - Profile:', profile);
      console.log('AdminRoute - Profile Role:', profile?.subscription_role);

      try {
        // Verificar usando la función de base de datos
        const { data: isAdminResult, error } = await supabase.rpc('is_admin');
        console.log('AdminRoute - Database is_admin result:', isAdminResult);
        
        if (error) {
          console.error('AdminRoute - Error checking admin status:', error);
          setAdminVerified(false);
        } else {
          setAdminVerified(!!isAdminResult);
          console.log('AdminRoute - Admin verification result:', !!isAdminResult);
        }
      } catch (error) {
        console.error('AdminRoute - Exception checking admin status:', error);
        setAdminVerified(false);
      }

      setIsVerifyingAdmin(false);
    };

    verifyAdminStatus();
  }, [user, profile, loading]);

  if (loading || isVerifyingAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Verificando permisos...</p>
        </div>
      </div>
    );
  }

  // Redirect to login if not authenticated
  if (!user) {
    console.log('AdminRoute - No user, redirecting to login');
    return <Navigate to="/login" replace />;
  }

  // Check both profile role and database verification
  const isAdmin = profile?.subscription_role === 'admin' || adminVerified;

  if (!isAdmin) {
    console.log('AdminRoute - User is not admin, showing access denied');
    console.log('Profile role:', profile?.subscription_role);
    console.log('Database verification:', adminVerified);
    
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center max-w-md mx-auto p-6">
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            <strong className="font-bold">Acceso Denegado</strong>
            <span className="block sm:inline"> No tienes permisos de administrador.</span>
          </div>
          <p className="text-gray-600 mb-4">
            Usuario: {user.email}<br/>
            Rol actual: {profile?.subscription_role || 'sin rol'}
          </p>
          <div className="space-x-2">
            <button 
              onClick={reloadProfile}
              className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
            >
              Recargar Perfil
            </button>
            <button 
              onClick={() => window.location.href = '/dashboard'}
              className="bg-gray-500 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded"
            >
              Ir al Dashboard
            </button>
          </div>
        </div>
      </div>
    );
  }

  console.log('AdminRoute - Access granted to admin user');
  return <>{children}</>;
};
