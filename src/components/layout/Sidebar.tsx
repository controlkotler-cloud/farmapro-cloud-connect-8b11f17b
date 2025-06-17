
import { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { 
  Home, 
  GraduationCap, 
  FileText, 
  Users, 
  Trophy, 
  Briefcase, 
  Building, 
  Calendar, 
  Tag,
  ChevronLeft,
  ChevronRight,
  Settings,
  CreditCard
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';

const menuItems = [
  { icon: Home, label: 'Dashboard', path: '/dashboard' },
  { icon: GraduationCap, label: 'Formación', path: '/formacion' },
  { icon: FileText, label: 'Recursos', path: '/recursos' },
  { icon: Users, label: 'Comunidad', path: '/comunidad' },
  { icon: Trophy, label: 'Retos', path: '/retos' },
  { icon: Briefcase, label: 'Empleo', path: '/empleo' },
  { icon: Building, label: 'Farmacias', path: '/farmacias' },
  { icon: Calendar, label: 'Eventos', path: '/eventos' },
  { icon: Tag, label: 'Promociones', path: '/promociones' },
];

const settingsItems = [
  { icon: CreditCard, label: 'Suscripción', path: '/subscription' },
  { icon: Settings, label: 'Configuración', path: '/settings' },
];

export const Sidebar = () => {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <div className={cn(
      "bg-white border-r border-gray-200 transition-all duration-300 flex flex-col",
      collapsed ? "w-16" : "w-64"
    )}>
      {/* Header */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          {!collapsed && (
            <img 
              src="/lovable-uploads/436f630b-82e2-4604-bbee-e932d97e61e2.png" 
              alt="farmapro" 
              className="h-8"
            />
          )}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setCollapsed(!collapsed)}
            className="h-8 w-8 p-0"
          >
            {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
          </Button>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-1">
        {menuItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) =>
              cn(
                "flex items-center px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                "hover:bg-green-50 hover:text-green-700",
                isActive
                  ? "bg-green-100 text-green-700"
                  : "text-gray-700 hover:text-gray-900"
              )
            }
          >
            <item.icon className="h-5 w-5 flex-shrink-0" />
            {!collapsed && <span className="ml-3">{item.label}</span>}
          </NavLink>
        ))}
      </nav>

      {/* Settings */}
      <div className="p-4 border-t border-gray-200">
        <Separator className="mb-4" />
        <div className="space-y-1">
          {settingsItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                cn(
                  "flex items-center px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                  "hover:bg-green-50 hover:text-green-700",
                  isActive
                    ? "bg-green-100 text-green-700"
                    : "text-gray-700 hover:text-gray-900"
                )
              }
            >
              <item.icon className="h-5 w-5 flex-shrink-0" />
              {!collapsed && <span className="ml-3">{item.label}</span>}
            </NavLink>
          ))}
        </div>
      </div>
    </div>
  );
};
