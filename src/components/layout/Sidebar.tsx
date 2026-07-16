
import { useAuth } from '@/hooks/useAuth';
import { SidebarHeader } from './sidebar/SidebarHeader';
import { SidebarNavigation } from './sidebar/SidebarNavigation';
import { SidebarAdminSection } from './sidebar/SidebarAdminSection';
import { SidebarFooter } from './sidebar/SidebarFooter';
import {
  Sidebar as SidebarPrimitive,
  SidebarContent,
  SidebarRail,
} from '@/components/ui/sidebar';

export const Sidebar = () => {
  const { isAdmin } = useAuth();

  return (
    <SidebarPrimitive variant="sidebar" className="border-r border-border">
      <SidebarContent className="bg-card">
        <SidebarHeader />
        <SidebarNavigation />
        {isAdmin && <SidebarAdminSection />}
        <SidebarFooter />
      </SidebarContent>
      <SidebarRail />
    </SidebarPrimitive>
  );
};
