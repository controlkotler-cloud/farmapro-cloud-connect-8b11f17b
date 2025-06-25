
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
  User,
  ChevronRight,
  Sparkles,
} from 'lucide-react';

export const Sidebar = () => {
  const location = useLocation();
  const { profile } = useAuth();

  const menuItems = [
    { name: 'Dashboard', icon: Home, path: '/dashboard', color: 'from-blue-500 to-blue-600' },
    { name: 'Formación', icon: BookOpen, path: '/formacion', color: 'from-green-500 to-green-600' },
    { name: 'Recursos', icon: FileText, path: '/recursos', color: 'from-purple-500 to-purple-600' },
    { name: 'Comunidad', icon: MessageSquare, path: '/comunidad', color: 'from-pink-500 to-pink-600' },
    { name: 'Retos', icon: Trophy, path: '/retos', color: 'from-yellow-500 to-yellow-600' },
    { name: 'Empleo', icon: Briefcase, path: '/empleo', color: 'from-indigo-500 to-indigo-600' },
    { name: 'Farmacias', icon: Building, path: '/farmacias', color: 'from-teal-500 to-teal-600' },
    { name: 'Eventos', icon: Calendar, path: '/eventos', color: 'from-orange-500 to-orange-600' },
    { name: 'Promociones', icon: Tag, path: '/promociones', color: 'from-red-500 to-red-600' },
  ];

  const adminMenuItems = [
    { name: 'Panel Admin', icon: Settings, path: '/admin', color: 'from-gray-700 to-gray-800' },
    { name: 'Gestión Cursos', icon: BookOpen, path: '/admin/cursos', color: 'from-gray-600 to-gray-700' },
    { name: 'Gestión Recursos', icon: FileText, path: '/admin/recursos', color: 'from-gray-600 to-gray-700' },
  ];

  const isAdmin = profile?.subscription_role === 'admin';

  return (
    <div className="flex flex-col w-72 bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900 border-r border-slate-700/50 shadow-2xl">
      {/* Header mejorado */}
      <div className="h-20 flex items-center justify-center border-b border-slate-700/50 bg-gradient-to-r from-slate-800/50 to-slate-700/50 backdrop-blur-sm">
        <div className="flex items-center space-x-3">
          <div className="relative">
            <img 
              src="/lovable-uploads/9312b52a-2ecc-45f4-a83d-1fbfdbd673db.png" 
              alt="farmapro" 
              className="w-10 h-10 rounded-lg shadow-lg ring-2 ring-white/20" 
            />
            <div className="absolute -top-1 -right-1 w-4 h-4 bg-gradient-to-r from-green-400 to-green-500 rounded-full shadow-lg animate-pulse"></div>
          </div>
          <img 
            src="/lovable-uploads/436f630b-82e2-4604-bbee-e932d97e61e2.png" 
            alt="farmapro" 
            className="h-8 filter brightness-110" 
          />
        </div>
      </div>

      {/* Navigation con diseño moderno */}
      <nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto scrollbar-thin scrollbar-thumb-slate-600 scrollbar-track-transparent">
        {menuItems.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <Link
              key={item.name}
              to={item.path}
              className={`group relative flex items-center px-4 py-3 text-sm font-medium rounded-xl transition-all duration-300 ease-in-out transform hover:scale-[1.02] ${
                isActive
                  ? 'bg-gradient-to-r from-white/10 to-white/5 text-white shadow-lg ring-1 ring-white/20 translate-x-1'
                  : 'text-slate-300 hover:bg-gradient-to-r hover:from-white/5 hover:to-transparent hover:text-white'
              }`}
            >
              {/* Indicador de estado activo */}
              {isActive && (
                <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-gradient-to-b from-blue-400 to-blue-600 rounded-r-full shadow-lg"></div>
              )}
              
              {/* Icono con gradiente */}
              <div className={`relative p-2 rounded-lg bg-gradient-to-r ${item.color} shadow-lg mr-4 transition-transform group-hover:scale-110`}>
                <item.icon
                  className="h-5 w-5 text-white"
                />
                {isActive && (
                  <div className="absolute inset-0 rounded-lg bg-white/20 animate-pulse"></div>
                )}
              </div>
              
              <span className="flex-1 font-semibold tracking-wide">{item.name}</span>
              
              {/* Flecha indicadora */}
              <ChevronRight
                className={`h-4 w-4 transition-all duration-300 ${
                  isActive ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-2 group-hover:opacity-70 group-hover:translate-x-0'
                }`}
              />
            </Link>
          );
        })}
        
        {/* Sección Admin con diseño especial */}
        {isAdmin && (
          <>
            <div className="my-8 mx-4">
              <div className="h-px bg-gradient-to-r from-transparent via-slate-600 to-transparent"></div>
              <div className="flex items-center justify-center -mt-3">
                <div className="px-4 py-1 bg-gradient-to-r from-slate-800 to-slate-700 rounded-full border border-slate-600">
                  <div className="flex items-center space-x-2">
                    <Sparkles className="h-3 w-3 text-yellow-400" />
                    <span className="text-xs font-bold text-slate-300 uppercase tracking-wider">Admin</span>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="space-y-2">
              {adminMenuItems.map((item) => {
                const isActive = location.pathname === item.path;
                return (
                  <Link
                    key={item.name}
                    to={item.path}
                    className={`group relative flex items-center px-4 py-3 text-sm font-medium rounded-xl transition-all duration-300 ease-in-out transform hover:scale-[1.02] ${
                      isActive
                        ? 'bg-gradient-to-r from-red-500/20 to-red-600/10 text-red-200 shadow-lg ring-1 ring-red-500/30 translate-x-1'
                        : 'text-slate-400 hover:bg-gradient-to-r hover:from-red-500/10 hover:to-transparent hover:text-red-300'
                    }`}
                  >
                    {isActive && (
                      <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-gradient-to-b from-red-400 to-red-600 rounded-r-full shadow-lg"></div>
                    )}
                    
                    <div className={`relative p-2 rounded-lg bg-gradient-to-r ${item.color} shadow-lg mr-4 transition-transform group-hover:scale-110`}>
                      <item.icon className="h-4 w-4 text-white" />
                      {isActive && (
                        <div className="absolute inset-0 rounded-lg bg-white/20 animate-pulse"></div>
                      )}
                    </div>
                    
                    <span className="flex-1 font-semibold tracking-wide">{item.name}</span>
                    
                    <ChevronRight
                      className={`h-4 w-4 transition-all duration-300 ${
                        isActive ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-2 group-hover:opacity-70 group-hover:translate-x-0'
                      }`}
                    />
                  </Link>
                );
              })}
            </div>
          </>
        )}
      </nav>

      {/* Footer del usuario mejorado */}
      <div className="p-6 border-t border-slate-700/50 bg-gradient-to-r from-slate-800/30 to-slate-700/30 backdrop-blur-sm">
        {profile ? (
          <div className="space-y-4">
            <div className="flex items-center space-x-4">
              <div className="relative">
                <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center shadow-lg ring-2 ring-white/20">
                  <User className="w-6 h-6 text-white" />
                </div>
                <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-slate-800 shadow-sm"></div>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-white truncate">
                  {profile.full_name || 'Usuario farmapro'}
                </p>
                <p className="text-xs text-slate-400 capitalize font-medium">
                  {profile.subscription_role || 'freemium'}
                </p>
              </div>
            </div>
            
            <Link 
              to="/perfil" 
              className="group flex items-center justify-center w-full px-4 py-2 text-sm font-medium text-slate-300 bg-gradient-to-r from-slate-700/50 to-slate-600/50 rounded-lg border border-slate-600/50 hover:from-slate-600/50 hover:to-slate-500/50 hover:text-white hover:border-slate-500/50 transition-all duration-300 shadow-lg"
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
    </div>
  );
};
