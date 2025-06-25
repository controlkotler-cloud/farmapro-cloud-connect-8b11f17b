
import { useAuth } from '@/hooks/useAuth';
import { Navigate } from 'react-router-dom';
import { useEffect } from 'react';

interface AdminRouteProps {
  children: React.ReactNode;
}

export const AdminRoute = ({ children }: AdminRouteProps) => {
  const { user, profile, loading, reloadProfile } = useAuth();

  useEffect(() => {
    console.log('AdminRoute - User:', user?.email);
    console.log('AdminRoute - Profile:', profile);
    console.log('AdminRoute - Loading:', loading);
    console.log('AdminRoute - Is Admin:', profile?.subscription_role === 'admin');
  }, [user, profile, loading]);

  if (loading) {
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

  // Redirect to dashboard if not admin
  if (profile?.subscription_role !== 'admin') {
    console.log('AdminRoute - User is not admin, redirecting to dashboard');
    console.log('Current role:', profile?.subscription_role);
    
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center max-w-md mx-auto p-6">
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            <strong className="font-bold">Acceso Denegado</strong>
            <span className="block sm:inline"> No tienes permisos de administrador.</span>
          </div>
          <p className="text-gray-600 mb-4">
            Usuario: {user.email}<br/>
            Rol actual: {profile?.subscription_role || 'sin rol'}
          </p>
          <button 
            onClick={reloadProfile}
            className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded mr-2"
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
    );
  }

  console.log('AdminRoute - Access granted to admin user');
  return <>{children}</>;
};
