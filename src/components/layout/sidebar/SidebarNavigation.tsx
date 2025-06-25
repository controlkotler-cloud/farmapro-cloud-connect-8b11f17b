
import { useLocation, Link } from 'react-router-dom';
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
  ChevronRight,
} from 'lucide-react';

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

export const SidebarNavigation = () => {
  const location = useLocation();

  return (
    <nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-transparent">
      {menuItems.map((item) => {
        const isActive = location.pathname === item.path;
        return (
          <Link
            key={item.name}
            to={item.path}
            className={`group relative flex items-center px-4 py-3 text-sm font-medium rounded-xl transition-all duration-300 ease-in-out transform hover:scale-[1.02] ${
              isActive
                ? 'bg-gradient-to-r from-blue-50 to-blue-100 text-blue-800 shadow-lg ring-1 ring-blue-200 translate-x-1'
                : 'text-gray-600 hover:bg-gradient-to-r hover:from-gray-50 hover:to-gray-100 hover:text-gray-800'
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
    </nav>
  );
};
