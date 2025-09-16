
import { ChevronDown, Settings, Users, BookOpen, MessageSquare, Trophy, BriefcaseIcon, Building2, Gift, Calendar, FolderOpen, HelpCircle } from 'lucide-react';
import { NavLink, useLocation } from 'react-router-dom';
import { useState } from 'react';
import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from '@/components/ui/sidebar';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';

export const SidebarAdminSection = () => {
  const [isExpanded, setIsExpanded] = useState(false);
  const location = useLocation();

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

  const hasActiveAdminRoute = adminItems.some(item => 
    item.exact ? location.pathname === item.url : location.pathname.startsWith(item.url)
  );

  return (
    <SidebarGroup>
      <Collapsible defaultOpen={hasActiveAdminRoute} onOpenChange={setIsExpanded}>
        <CollapsibleTrigger asChild>
          <SidebarGroupLabel className="group/label flex items-center justify-between px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-50 transition-colors cursor-pointer">
            <span>Administración</span>
            <ChevronDown className={`h-4 w-4 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
          </SidebarGroupLabel>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <SidebarGroupContent>
            <SidebarMenu className="space-y-1">
              {adminItems.map((item) => {
                const isActive = item.exact 
                  ? location.pathname === item.url 
                  : location.pathname.startsWith(item.url);
                
                return (
                  <SidebarMenuItem key={item.url}>
                    <SidebarMenuButton asChild>
                      <NavLink
                        to={item.url}
                        end={item.exact}
                        className={`flex items-center px-8 py-2 text-sm font-medium rounded-r-full transition-all duration-200 ${
                          isActive
                            ? 'bg-gradient-to-r from-blue-50 to-blue-100 text-blue-700 border-r-4 border-blue-500 shadow-sm'
                            : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                        }`}
                      >
                        <item.icon className="mr-3 h-4 w-4" />
                        <span>{item.title}</span>
                      </NavLink>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </CollapsibleContent>
      </Collapsible>
    </SidebarGroup>
  );
};
