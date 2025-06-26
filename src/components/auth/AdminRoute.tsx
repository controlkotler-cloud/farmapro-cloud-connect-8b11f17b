
import { useAuth } from '@/hooks/useAuth';
import { Navigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { RefreshCw, Home } from 'lucide-react';

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
          <p className="mt-4 text-gray-600">Verificando permisos de administrador...</p>
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
        <div className="text-center max-w-md mx-auto p-8 bg-white rounded-lg shadow-lg">
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6">
            <strong className="font-bold block">Acceso Denegado</strong>
            <span className="text-sm">No tienes permisos de administrador para acceder a esta sección.</span>
          </div>
          
          <div className="mb-6">
            <p className="text-gray-600 mb-2">Usuario actual:</p>
            <p className="font-medium text-gray-900">{user.email}</p>
          </div>
          
          <div className="space-y-3">
            <Button 
              onClick={reloadProfile}
              className="w-full flex items-center justify-center gap-2"
              variant="outline"
            >
              <RefreshCw className="h-4 w-4" />
              Recargar Permisos
            </Button>
            
            <Button 
              onClick={() => window.location.href = '/dashboard'}
              className="w-full flex items-center justify-center gap-2"
            >
              <Home className="h-4 w-4" />
              Ir al Dashboard
            </Button>
          </div>
          
          <div className="mt-6 p-4 bg-gray-50 rounded text-sm text-gray-600">
            <p className="font-medium mb-1">¿Necesitas acceso de administrador?</p>
            <p>Contacta con el administrador del sistema para solicitar los permisos necesarios.</p>
          </div>
        </div>
      </div>
    );
  }

  console.log('AdminRoute - Access granted to admin user');
  return <>{children}</>;
};
