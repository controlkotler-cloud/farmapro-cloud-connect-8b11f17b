
import { Link } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { User, Settings } from 'lucide-react';

export const SidebarFooter = () => {
  const { profile } = useAuth();

  return (
    <div className="p-6 border-t border-gray-200 bg-gradient-to-r from-gray-50 to-white">
      {profile ? (
        <div className="space-y-4">
          <div className="flex items-center space-x-4">
            <div className="relative">
              <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center shadow-lg ring-2 ring-blue-200">
                <User className="w-6 h-6 text-white" />
              </div>
              <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-white shadow-sm"></div>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-gray-800 truncate">
                {profile.full_name || 'Usuario farmapro'}
              </p>
              <p className="text-xs text-gray-500 capitalize font-medium">
                {profile.subscription_role || 'freemium'}
              </p>
            </div>
          </div>
          
          <Link 
            to="/perfil" 
            className="group flex items-center justify-center w-full px-4 py-2 text-sm font-medium text-gray-600 bg-gradient-to-r from-gray-100 to-gray-200 rounded-lg border border-gray-300 hover:from-gray-200 hover:to-gray-300 hover:text-gray-800 hover:border-gray-400 transition-all duration-300 shadow-lg"
          >
            <Settings className="w-4 h-4 mr-2 group-hover:rotate-90 transition-transform duration-300" />
            Editar Perfil
          </Link>
        </div>
      ) : (
        <Link 
          to="/login" 
          className="flex items-center justify-center w-full px-4 py-3 text-sm font-medium text-white bg-gradient-to-r from-blue-600 to-blue-700 rounded-lg hover:from-blue-700 hover:to-blue-800 transition-all duration-300 shadow-lg transform hover:scale-105"
        >
          Iniciar Sesión
        </Link>
      )}
    </div>
  );
};
