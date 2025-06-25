
import { useAuth } from '@/hooks/useAuth';
import { Navigate } from 'react-router-dom';

interface AdminRouteProps {
  children: React.ReactNode;
}

export const AdminRoute = ({ children }: AdminRouteProps) => {
  const { user, isAdmin, loading, reloadProfile } = useAuth();

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

  if (!isAdmin) {
    console.log('AdminRoute - User is not admin, showing access denied');
    console.log('User email:', user.email);
    console.log('Is admin:', isAdmin);
    
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center max-w-md mx-auto p-6">
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            <strong className="font-bold">Acceso Denegado</strong>
            <span className="block sm:inline"> No tienes permisos de administrador.</span>
          </div>
          <p className="text-gray-600 mb-4">
            Usuario: {user.email}
          </p>
          <div className="space-x-2">
            <button 
              onClick={reloadProfile}
              className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
            >
              Recargar Permisos
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
