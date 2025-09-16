
import { SidebarHeader as SidebarHeaderPrimitive } from '@/components/ui/sidebar';

export const SidebarHeader = () => {
  return (
    <SidebarHeaderPrimitive>
      <div className="h-20 flex items-center justify-center border-b border-gray-200 bg-gradient-to-r from-gray-50 to-white">
        <div className="flex items-center space-x-3">
          <div className="relative">
            <img 
              src="/lovable-uploads/9312b52a-2ecc-45f4-a83d-1fbfdbd673db.png" 
              alt="farmapro" 
              className="w-10 h-10 rounded-lg shadow-lg ring-2 ring-blue-200" 
            />
            <div className="absolute -top-1 -right-1 w-4 h-4 bg-gradient-to-r from-green-400 to-green-500 rounded-full shadow-lg animate-pulse"></div>
          </div>
          <img 
            src="/lovable-uploads/436f630b-82e2-4604-bbee-e932d97e61e2.png" 
            alt="farmapro" 
            className="h-8" 
          />
        </div>
      </div>
    </SidebarHeaderPrimitive>
  );
};
