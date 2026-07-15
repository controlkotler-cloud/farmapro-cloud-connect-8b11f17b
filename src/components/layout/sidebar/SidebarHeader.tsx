
import { SidebarHeader as SidebarHeaderPrimitive } from '@/components/ui/sidebar';

export const SidebarHeader = () => {
  return (
    <SidebarHeaderPrimitive>
      <div className="h-20 flex items-center justify-center border-b border-sidebar-border">
        <img
          src="/logo-farmapro.svg"
          alt="farmapro"
          className="h-7"
        />
      </div>
    </SidebarHeaderPrimitive>
  );
};
