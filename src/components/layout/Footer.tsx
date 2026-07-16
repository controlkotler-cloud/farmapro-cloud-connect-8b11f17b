import { Link } from 'react-router-dom';
import { Copyright } from 'lucide-react';
import { CookieIcon } from '@/components/cookies/CookieIcon';

const Footer = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-card border-t border-border py-4 px-6 mt-auto">
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4 text-sm text-muted-foreground">
        <div className="flex items-center gap-2">
          <Copyright className="h-4 w-4" />
          <span>{currentYear} farmapro</span>
        </div>

        <div className="flex flex-wrap items-center gap-4 text-xs">
          <a
            href="https://farmapro.es"
            className="hover:text-foreground transition-colors"
          >
            farmapro.es
          </a>
          <Link
            to="/politica-cookies"
            className="hover:text-foreground transition-colors"
          >
            Política de Cookies
          </Link>
          <CookieIcon />
          <Link
            to="/politica-privacidad"
            className="hover:text-foreground transition-colors"
          >
            Política de Privacidad
          </Link>
          <Link
            to="/aviso-legal"
            className="hover:text-foreground transition-colors"
          >
            Aviso Legal
          </Link>
          <Link
            to="/contacto-soporte"
            className="hover:text-foreground transition-colors"
          >
            Contacto y Soporte
          </Link>
        </div>
      </div>
    </footer>
  );
};

export { Footer };
