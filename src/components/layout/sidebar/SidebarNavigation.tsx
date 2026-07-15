
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
  MessageCircle,
  Bot,
} from 'lucide-react';
import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from '@/components/ui/sidebar';
import { useIsMobile } from '@/hooks/use-mobile';
import { useSectionVisibility } from '@/hooks/useSectionVisibility';
import { useAuth } from '@/hooks/useAuth';


const menuItems = [
  { name: 'Dashboard', icon: Home, path: '/dashboard' },
  { name: 'Formación', icon: BookOpen, path: '/formacion' },
  { name: 'Recursos', icon: FileText, path: '/recursos' },
  { name: 'IAFarma', icon: Bot, path: '/asistente-creativo' },
  { name: 'Comunidad', icon: MessageSquare, path: '/comunidad' },
  { name: 'Retos', icon: Trophy, path: '/retos' },
  { name: 'Empleo', icon: Briefcase, path: '/empleo' },
  { name: 'Farmacias', icon: Building, path: '/farmacias' },
  { name: 'Eventos', icon: Calendar, path: '/eventos' },
  { name: 'Promociones', icon: Tag, path: '/promociones' },
];

export const SidebarNavigation = () => {
  const location = useLocation();
  const { setOpenMobile } = useSidebar();
  const isMobile = useIsMobile();
  const { isEmpleoVisible, isFarmaciasVisible } = useSectionVisibility();
  const { isAdmin } = useAuth();

  const handleNavClick = () => {
    if (isMobile) {
      setOpenMobile(false);
    }
  };

  // Filter menu items based on visibility settings
  const getVisibleMenuItems = () => {
    return menuItems.filter(item => {
      // Always show all items to admins
      if (isAdmin) return true;
      
      // Filter based on visibility settings for regular users
      if (item.path === '/empleo' && !isEmpleoVisible()) return false;
      if (item.path === '/farmacias' && !isFarmaciasVisible()) return false;
      
      return true;
    });
  };

  return (
    <SidebarGroup>
      <SidebarGroupContent>
        <SidebarMenu className="space-y-2 lg:space-y-7">
          {getVisibleMenuItems().map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <SidebarMenuItem key={item.name}>
                <SidebarMenuButton asChild>
                   <Link
                     to={item.path}
                     onClick={handleNavClick}
                     className={`group relative flex items-center px-4 py-3 lg:py-4 text-sm lg:text-base font-medium rounded-xl transition-all duration-300 ease-in-out transform hover:scale-[1.02] ${
                       isActive
                         ? 'bg-sidebar-accent text-brand-dark shadow-sm translate-x-1'
                         : 'text-muted-foreground hover:bg-sidebar-accent/60 hover:text-foreground'
                     }`}
                   >
                    {/* Indicador de estado activo */}
                    {isActive && (
                      <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-brand rounded-r-full"></div>
                    )}

                    {/* Icono */}
                    <div className="relative p-2 rounded-lg mr-4 lg:mr-5 transition-transform group-hover:scale-110">
                      <item.icon
                        className={`h-4 w-4 ${isActive ? 'text-brand-dark' : 'text-muted-foreground'}`}
                      />
                    </div>

                    <span className="flex-1 font-semibold tracking-wide">{item.name}</span>
                    
                    {/* Flecha indicadora */}
                    <ChevronRight
                      className={`h-4 w-4 transition-all duration-300 ${
                        isActive ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-2 group-hover:opacity-70 group-hover:translate-x-0'
                      }`}
                    />
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            );
          })}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  );
};
