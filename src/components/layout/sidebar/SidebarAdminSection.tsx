
import { ChevronDown, Settings, Users, BookOpen, MessageSquare, Trophy, BriefcaseIcon, Building2, Gift, Calendar, FolderOpen, HelpCircle } from 'lucide-react';
import { NavLink } from 'react-router-dom';
import { useState } from 'react';

export const SidebarAdminSection = () => {
  const [isExpanded, setIsExpanded] = useState(false);

  const adminItems = [
    { 
      title: 'Dashboard', 
      url: '/admin', 
      icon: Settings,
      exact: true
    },
    { 
      title: 'Usuarios', 
      url: '/admin/usuarios', 
      icon: Users 
    },
    { 
      title: 'Cursos', 
      url: '/admin/cursos', 
      icon: BookOpen 
    },
    { 
      title: 'Quizzes', 
      url: '/admin/quizzes', 
      icon: HelpCircle 
    },
    { 
      title: 'Recursos', 
      url: '/admin/recursos', 
      icon: FolderOpen 
    },
    { 
      title: 'Comunidad', 
      url: '/admin/comunidad', 
      icon: MessageSquare 
    },
    { 
      title: 'Retos', 
      url: '/admin/retos', 
      icon: Trophy 
    },
    { 
      title: 'Empleo', 
      url: '/admin/empleo', 
      icon: BriefcaseIcon 
    },
    { 
      title: 'Farmacias', 
      url: '/admin/farmacias', 
      icon: Building2 
    },
    { 
      title: 'Promociones', 
      url: '/admin/promociones', 
      icon: Gift 
    },
    { 
      title: 'Eventos', 
      url: '/admin/eventos', 
      icon: Calendar 
    },
    { 
      title: 'Configuración', 
      url: '/admin/configuracion', 
      icon: Settings 
    }
  ];

  return (
    <div className="border-t border-gray-200 pt-4">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="flex items-center justify-between w-full px-6 py-2 text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-50 transition-colors"
      >
        <span>Administración</span>
        <ChevronDown className={`h-4 w-4 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
      </button>
      
      {isExpanded && (
        <div className="space-y-1 mt-2">
          {adminItems.map((item) => (
            <NavLink
              key={item.url}
              to={item.url}
              end={item.exact}
              className={({ isActive }) =>
                `flex items-center px-8 py-2 text-sm font-medium rounded-r-full transition-all duration-200 ${
                  isActive
                    ? 'bg-gradient-to-r from-blue-50 to-blue-100 text-blue-700 border-r-4 border-blue-500 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                }`
              }
            >
              <item.icon className="mr-3 h-4 w-4" />
              <span>{item.title}</span>
            </NavLink>
          ))}
        </div>
      )}
    </div>
  );
};
