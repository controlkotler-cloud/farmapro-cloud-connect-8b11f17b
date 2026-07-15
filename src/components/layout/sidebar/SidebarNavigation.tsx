
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
  Bot,
  Store,
  Archive,
  type LucideIcon,
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
import { useTeamManagement } from '@/hooks/useTeamManagement';

interface MenuItem {
  name: string;
  icon: LucideIcon;
  path: string;
}

interface MenuGroup {
  label: string;
  items: MenuItem[];
}

// Navegación agrupada por intención (canon farmapro): el día a día del
// usuario arriba, la comunidad en medio, el crecimiento después.
const menuGroups: MenuGroup[] = [
  {
    label: 'Tu farmacia',
    items: [
      { name: 'Inicio', icon: Home, path: '/dashboard' },
      { name: 'Formación', icon: BookOpen, path: '/formacion' },
      { name: 'Retos', icon: Trophy, path: '/retos' },
      { name: 'La Rebotica', icon: Archive, path: '/rebotica' },
    ],
  },
  {
    label: 'Comunidad',
    items: [
      { name: 'Foro', icon: MessageSquare, path: '/comunidad' },
      { name: 'Eventos', icon: Calendar, path: '/eventos' },
    ],
  },
  {
    label: 'Crecer',
    items: [
      { name: 'Recursos', icon: FileText, path: '/recursos' },
      { name: 'IAFarma', icon: Bot, path: '/asistente-creativo' },
      { name: 'Empleo', icon: Briefcase, path: '/empleo' },
      { name: 'Farmacias', icon: Building, path: '/farmacias' },
      { name: 'Promociones', icon: Tag, path: '/promociones' },
    ],
  },
];

export const SidebarNavigation = () => {
  const location = useLocation();
  const { setOpenMobile } = useSidebar();
  const isMobile = useIsMobile();
  const { isEmpleoVisible, isFarmaciasVisible } = useSectionVisibility();
  const { isAdmin } = useAuth();
  const { isTeamOwner, loading: teamLoading } = useTeamManagement();

  const handleNavClick = () => {
    if (isMobile) {
      setOpenMobile(false);
    }
  };

  const isItemVisible = (item: MenuItem) => {
    if (isAdmin) return true;
    if (item.path === '/empleo' && !isEmpleoVisible()) return false;
    if (item.path === '/farmacias' && !isFarmaciasVisible()) return false;
    return true;
  };

  const getVisibleGroups = (): MenuGroup[] => {
    return menuGroups
      .map((group) => {
        let items = group.items.filter(isItemVisible);
        if (group.label === 'Tu farmacia' && isTeamOwner && !teamLoading) {
          items = [...items, { name: 'Mi farmacia', icon: Store, path: '/mi-farmacia' }];
        }
        return { ...group, items };
      })
      .filter((group) => group.items.length > 0);
  };

  return (
    <>
      {getVisibleGroups().map((group) => (
        <SidebarGroup key={group.label}>
          <SidebarGroupContent>
            <p className="px-4 pb-1.5 pt-3 text-[10.5px] font-bold uppercase tracking-[0.12em] text-muted-foreground">
              {group.label}
            </p>
            <SidebarMenu className="space-y-0.5">
              {group.items.map((item) => {
                const isActive = location.pathname === item.path;
                return (
                  <SidebarMenuItem key={item.name}>
                    <SidebarMenuButton asChild>
                      <Link
                        to={item.path}
                        onClick={handleNavClick}
                        className={`flex items-center gap-3 rounded-lg px-4 py-2.5 text-sm font-semibold transition-colors duration-200 ${
                          isActive
                            ? 'bg-sidebar-accent text-brand-dark'
                            : 'text-muted-foreground hover:bg-sidebar-accent/60 hover:text-foreground'
                        }`}
                      >
                        <item.icon
                          className={`h-[17px] w-[17px] flex-none ${isActive ? 'text-brand-dark' : 'text-muted-foreground'}`}
                        />
                        <span className="flex-1 truncate">{item.name}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      ))}
    </>
  );
};
