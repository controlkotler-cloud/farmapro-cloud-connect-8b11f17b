
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
  Crown,
  Sparkles
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { useAuth } from '@/hooks/useAuth';

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

const planConfig = {
  freemium: {
    name: 'Freemium',
    icon: Sparkles,
    color: 'from-gray-400 to-gray-600',
    bgColor: 'bg-gray-100',
    textColor: 'text-gray-800',
  },
  estudiante: {
    name: 'Estudiante',
    icon: GraduationCap,
    color: 'from-green-400 to-blue-500',
    bgColor: 'bg-green-100',
    textColor: 'text-green-800',
  },
  profesional: {
    name: 'Profesional',
    icon: Briefcase,
    color: 'from-blue-500 to-purple-600',
    bgColor: 'bg-blue-100',
    textColor: 'text-blue-800',
  },
  premium: {
    name: 'Premium',
    icon: Crown,
    color: 'from-yellow-400 to-orange-500',
    bgColor: 'bg-yellow-100',
    textColor: 'text-yellow-800',
  },
};

export const Sidebar = () => {
  const [collapsed, setCollapsed] = useState(false);
  const { profile } = useAuth();

  const currentPlan = profile?.subscription_role || 'freemium';
  const config = planConfig[currentPlan as keyof typeof planConfig];
  const PlanIcon = config.icon;

  return (
    <div className={cn(
      "bg-white border-r border-gray-200 transition-all duration-300 flex flex-col",
      collapsed ? "w-16" : "w-64"
    )}>
      {/* Header */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          {!collapsed && (
            <div className="flex items-center justify-center w-full">
              <img 
                src="/lovable-uploads/9312b52a-2ecc-45f4-a83d-1fbfdbd673db.png" 
                alt="farmapro" 
                className="h-10 w-10"
              />
            </div>
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
        {collapsed && (
          <div className="flex items-center justify-center mt-2">
            <img 
              src="/lovable-uploads/9312b52a-2ecc-45f4-a83d-1fbfdbd673db.png" 
              alt="farmapro" 
              className="h-8 w-8"
            />
          </div>
        )}
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

      {/* Plan Card */}
      {!collapsed && (
        <div className="p-4 border-t border-gray-200">
          <div className={`${config.bgColor} rounded-lg p-3 border`}>
            <div className="flex items-center space-x-3">
              <div className={`w-8 h-8 rounded-full bg-gradient-to-r ${config.color} flex items-center justify-center flex-shrink-0`}>
                <PlanIcon className="h-4 w-4 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {profile?.full_name || 'Usuario'}
                  </p>
                  <Badge className={`${config.bgColor} ${config.textColor} text-xs px-2 py-1`}>
                    {config.name}
                  </Badge>
                </div>
                <p className="text-xs text-gray-600 truncate">
                  {profile?.email}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Mini Plan Icon for Collapsed State */}
      {collapsed && (
        <div className="p-2 border-t border-gray-200 flex justify-center">
          <div className={`w-8 h-8 rounded-full bg-gradient-to-r ${config.color} flex items-center justify-center`}>
            <PlanIcon className="h-4 w-4 text-white" />
          </div>
        </div>
      )}
    </div>
  );
};
