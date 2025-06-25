
import { useAuth } from '@/hooks/useAuth';
import { SidebarHeader } from './sidebar/SidebarHeader';
import { SidebarNavigation } from './sidebar/SidebarNavigation';
import { SidebarAdminSection } from './sidebar/SidebarAdminSection';
import { SidebarFooter } from './sidebar/SidebarFooter';

export const Sidebar = () => {
  const { profile } = useAuth();
  const isAdmin = profile?.subscription_role === 'admin';

  return (
    <div className="flex flex-col w-72 bg-white border-r border-gray-200 shadow-xl">
      <SidebarHeader />
      <SidebarNavigation />
      {isAdmin && <SidebarAdminSection />}
      <SidebarFooter />
    </div>
  );
};
