
import { useLocation } from 'react-router-dom';
import { useEffect, useRef } from 'react';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { Footer } from './Footer';
import { SidebarProvider, SidebarInset } from '@/components/ui/sidebar';
import { useIsMobile } from '@/hooks/use-mobile';
import { PortalChatbot } from '@/components/ai/PortalChatbot';
import { CreativeAssistant } from '@/components/ai/CreativeAssistant';

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export const DashboardLayout = ({ children }: DashboardLayoutProps) => {
  const location = useLocation();
  const mainRef = useRef<HTMLElement>(null);
  const isMobile = useIsMobile();
  
  // Páginas legales que no necesitan el footer del dashboard
  const legalPages = [
    '/politica-cookies',
    '/politica-privacidad', 
    '/aviso-legal',
    '/contacto-soporte'
  ];
  
  const isLegalPage = legalPages.includes(location.pathname);

  // Scroll to top when route changes
  useEffect(() => {
    if (mainRef.current) {
      mainRef.current.scrollTo({ top: 0, left: 0, behavior: 'instant' });
    }
  }, [location.pathname]);

  return (
    <SidebarProvider defaultOpen={!isMobile}>
      <div className="flex h-screen bg-gray-50 w-full">
        <Sidebar />
        <SidebarInset className="flex-1 flex flex-col overflow-hidden">
          <Header />
          <main ref={mainRef} className="flex-1 overflow-y-auto p-4 md:p-6">
            {children}
          </main>
          {!isLegalPage && <Footer />}
        </SidebarInset>
        <PortalChatbot />
        <CreativeAssistant />
      </div>
    </SidebarProvider>
  );
};
