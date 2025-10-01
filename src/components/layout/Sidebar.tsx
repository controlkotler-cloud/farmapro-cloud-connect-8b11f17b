
import { useAuth } from '@/hooks/useAuth';
import { SidebarHeader } from './sidebar/SidebarHeader';
import { SidebarNavigation } from './sidebar/SidebarNavigation';
import { SidebarCreativeSection } from './sidebar/SidebarCreativeSection';
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
    <SidebarPrimitive variant="sidebar" className="border-r border-gray-200 shadow-xl">
      <SidebarContent className="bg-white">
        <SidebarHeader />
        <SidebarNavigation />
        <SidebarCreativeSection />
        {isAdmin && <SidebarAdminSection />}
        <SidebarFooter />
      </SidebarContent>
      <SidebarRail />
    </SidebarPrimitive>
  );
};
