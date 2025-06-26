
import { useLocation } from 'react-router-dom';
import { useEffect, useRef } from 'react';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { Footer } from './Footer';

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export const DashboardLayout = ({ children }: DashboardLayoutProps) => {
  const location = useLocation();
  const mainRef = useRef<HTMLElement>(null);
  
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
    <div className="flex h-screen bg-gray-50">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header />
        <main ref={mainRef} className="flex-1 overflow-y-auto p-6">
          {children}
        </main>
        {!isLegalPage && <Footer />}
      </div>
    </div>
  );
};
