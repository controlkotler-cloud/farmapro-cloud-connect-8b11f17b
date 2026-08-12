
import { SidebarHeader as SidebarHeaderPrimitive } from '@/components/ui/sidebar';

export const SidebarHeader = () => {
  return (
    <SidebarHeaderPrimitive>
      <div className="h-20 flex items-center justify-center gap-2.5 border-b border-sidebar-border">
        <img
          src="/logo-farmapro.svg"
          alt="farmapro"
          className="h-7"
        />
        <span className="border-l border-sidebar-border pl-2.5 text-[11px] font-bold uppercase tracking-[0.14em] text-muted-foreground">
          Portal
        </span>
      </div>
    </SidebarHeaderPrimitive>
  );
};
