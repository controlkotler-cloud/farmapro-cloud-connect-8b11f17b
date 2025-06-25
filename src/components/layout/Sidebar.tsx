
import { useLocation, Link } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import {
  Home,
  BookOpen,
  FileText,
  MessageSquare,
  Trophy,
  Briefcase,
  Building,
  Calendar,
  Tag,
  Settings,
} from 'lucide-react';

export const Sidebar = () => {
  const location = useLocation();
  const { profile } = useAuth();

  const menuItems = [
    { name: 'Dashboard', icon: Home, path: '/dashboard' },
    { name: 'Formación', icon: BookOpen, path: '/formacion' },
    { name: 'Recursos', icon: FileText, path: '/recursos' },
    { name: 'Comunidad', icon: MessageSquare, path: '/comunidad' },
    { name: 'Retos', icon: Trophy, path: '/retos' },
    { name: 'Empleo', icon: Briefcase, path: '/empleo' },
    { name: 'Farmacias', icon: Building, path: '/farmacias' },
    { name: 'Eventos', icon: Calendar, path: '/eventos' },
    { name: 'Promociones', icon: Tag, path: '/promociones' },
  ];

  // Admin menu items - only visible to admin users
  const adminMenuItems = [
    { name: 'Panel Admin', icon: Settings, path: '/admin' },
    { name: 'Gestión Cursos', icon: BookOpen, path: '/admin/cursos' },
    { name: 'Gestión Recursos', icon: FileText, path: '/admin/recursos' },
  ];

  // Check if user is admin
  const isAdmin = profile?.subscription_role === 'admin';

  return (
    <div className="flex flex-col w-64 bg-white border-r border-gray-200">
      <div className="h-16 flex items-center justify-center border-b border-gray-200">
        <img src="/lovable-uploads/9312b52a-2ecc-45f4-a83d-1fbfdbd673db.png" alt="farmapro" className="w-8 h-8 mr-2" />
        <img src="/lovable-uploads/436f630b-82e2-4604-bbee-e932d97e61e2.png" alt="farmapro" className="h-6" />
      </div>

      <nav className="flex-1 space-y-1 px-2 py-4">
        {menuItems.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <Link
              key={item.name}
              to={item.path}
              className={`group flex items-center px-2 py-2 text-sm font-medium rounded-md transition-colors ${
                isActive
                  ? 'bg-blue-100 text-blue-600'
                  : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
              }`}
            >
              <item.icon
                className={`mr-3 h-5 w-5 ${
                  isActive ? 'text-blue-600' : 'text-gray-400 group-hover:text-gray-500'
                }`}
              />
              {item.name}
            </Link>
          );
        })}
        
        {/* Admin Section - Only visible to admin users */}
        {isAdmin && (
          <>
            <div className="border-t border-gray-200 my-4"></div>
            <div className="px-2 py-2">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
                Administración
              </p>
              {adminMenuItems.map((item) => {
                const isActive = location.pathname === item.path;
                return (
                  <Link
                    key={item.name}
                    to={item.path}
                    className={`group flex items-center px-2 py-2 text-sm font-medium rounded-md transition-colors ${
                      isActive
                        ? 'bg-red-100 text-red-600'
                        : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
                    }`}
                  >
                    <item.icon
                      className={`mr-3 h-4 w-4 ${
                        isActive ? 'text-red-600' : 'text-gray-400 group-hover:text-gray-500'
                      }`}
                    />
                    {item.name}
                  </Link>
                );
              })}
            </div>
          </>
        )}
      </nav>

      <div className="p-4">
        {profile ? (
          <div className="space-y-2">
            <p className="text-sm font-medium text-gray-900">
              Bienvenido, {profile.full_name || 'Usuario'}
            </p>
            <Link to="/perfil" className="text-sm text-blue-600 hover:underline">
              Editar Perfil
            </Link>
          </div>
        ) : (
          <Link to="/login" className="text-sm text-blue-600 hover:underline">
            Iniciar Sesión
          </Link>
        )}
      </div>
    </div>
  );
};
