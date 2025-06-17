
import { Link, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Footer } from '@/components/home/Footer';

interface PublicLayoutProps {
  children: React.ReactNode;
}

export const PublicLayout = ({ children }: PublicLayoutProps) => {
  const location = useLocation();

  const isActive = (path: string) => {
    return location.pathname === path;
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Header público */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <Link to="/" className="flex items-center space-x-3">
              <img src="/lovable-uploads/9312b52a-2ecc-45f4-a83d-1fbfdbd673db.png" alt="farmapro" className="w-8 h-8" />
              <img src="/lovable-uploads/436f630b-82e2-4604-bbee-e932d97e61e2.png" alt="farmapro" className="h-6" />
            </Link>

            {/* Navegación principal */}
            <nav className="hidden md:flex items-center space-x-8">
              <Link 
                to="/" 
                className={`text-sm font-medium transition-colors ${
                  isActive('/') ? 'text-blue-600' : 'text-gray-700 hover:text-blue-600'
                }`}
              >
                Inicio
              </Link>
              <Link 
                to="/servicios" 
                className={`text-sm font-medium transition-colors ${
                  isActive('/servicios') ? 'text-blue-600' : 'text-gray-700 hover:text-blue-600'
                }`}
              >
                Servicios
              </Link>
              <Link 
                to="/farmapro-impulso" 
                className={`text-sm font-medium transition-colors ${
                  isActive('/farmapro-impulso') ? 'text-blue-600' : 'text-gray-700 hover:text-blue-600'
                }`}
              >
                farmapro IMPULSO
              </Link>
              <Link 
                to="/blog" 
                className={`text-sm font-medium transition-colors ${
                  isActive('/blog') ? 'text-blue-600' : 'text-gray-700 hover:text-blue-600'
                }`}
              >
                Blog
              </Link>
              <Link 
                to="/faqs-contacto" 
                className={`text-sm font-medium transition-colors ${
                  isActive('/faqs-contacto') ? 'text-blue-600' : 'text-gray-700 hover:text-blue-600'
                }`}
              >
                FAQ's
              </Link>
            </nav>

            {/* Botones de acción */}
            <div className="flex items-center space-x-4">
              <Link to="/subscription">
                <Button variant="outline" size="sm">
                  Ver Planes
                </Button>
              </Link>
              <a href="https://portal.farmapro.es/login" target="_blank" rel="noopener noreferrer">
                <Button size="sm" className="bg-gradient-to-r from-blue-600 to-green-600 hover:from-blue-700 hover:to-green-700">
                  Acceder al Portal
                </Button>
              </a>
            </div>
          </div>
        </div>
      </header>

      {/* Contenido principal */}
      <main>
        {children}
      </main>

      {/* Footer */}
      <Footer />
    </div>
  );
};
