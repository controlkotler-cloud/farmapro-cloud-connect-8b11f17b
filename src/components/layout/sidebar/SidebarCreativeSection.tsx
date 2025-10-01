import { useState } from 'react';
import { Sparkles, ChevronDown } from 'lucide-react';
import {
  SidebarGroup,
  SidebarMenu,
  SidebarMenuItem,
} from '@/components/ui/sidebar';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { CreativePanelContent } from './CreativePanelContent';

export const SidebarCreativeSection = () => {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <SidebarGroup>
      <Collapsible open={isExpanded} onOpenChange={setIsExpanded}>
        <SidebarMenu>
          <SidebarMenuItem>
            <CollapsibleTrigger className="flex w-full items-center justify-between rounded-lg px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 transition-colors">
              <div className="flex items-center gap-3">
                <Sparkles className="h-5 w-5 text-purple-600" />
                <span>Asistente Creativo</span>
              </div>
              <ChevronDown
                className={`h-4 w-4 transition-transform duration-200 ${
                  isExpanded ? 'rotate-180' : ''
                }`}
              />
            </CollapsibleTrigger>
          </SidebarMenuItem>
        </SidebarMenu>

        <CollapsibleContent className="px-2 py-2">
          <CreativePanelContent />
        </CollapsibleContent>
      </Collapsible>
    </SidebarGroup>
  );
};
