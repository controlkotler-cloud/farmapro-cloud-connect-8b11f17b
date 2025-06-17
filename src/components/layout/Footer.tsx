
import { Link } from 'react-router-dom';
import { Copyright } from 'lucide-react';

const Footer = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-white border-t border-gray-100 py-4 px-6 mt-auto">
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4 text-sm text-gray-500">
        <div className="flex items-center gap-2">
          <Copyright className="h-4 w-4" />
          <span>{currentYear} farmapro</span>
        </div>
        
        <div className="flex flex-wrap items-center gap-4 text-xs">
          <Link 
            to="/politica-cookies" 
            className="hover:text-gray-700 transition-colors"
          >
            Política de Cookies
          </Link>
          <Link 
            to="/politica-privacidad" 
            className="hover:text-gray-700 transition-colors"
          >
            Política de Privacidad
          </Link>
          <Link 
            to="/aviso-legal" 
            className="hover:text-gray-700 transition-colors"
          >
            Aviso Legal
          </Link>
          <Link 
            to="/contacto-soporte" 
            className="hover:text-gray-700 transition-colors"
          >
            Contacto y Soporte
          </Link>
        </div>
      </div>
    </footer>
  );
};

export { Footer };
