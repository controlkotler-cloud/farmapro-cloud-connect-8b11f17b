
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Mail, Phone, MapPin, Copyright } from 'lucide-react';

export const Footer = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-gray-900 text-white py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div>
            <div className="flex items-center space-x-3 mb-4">
              <img src="/lovable-uploads/9312b52a-2ecc-45f4-a83d-1fbfdbd673db.png" alt="farmapro" className="w-8 h-8" />
              <img src="/lovable-uploads/436f630b-82e2-4604-bbee-e932d97e61e2.png" alt="farmapro" className="h-6" />
            </div>
            <p className="text-gray-400 mb-4">
              Impulsando la excelencia farmacéutica en España
            </p>
          </div>
          
          <div>
            <h3 className="font-semibold mb-4">Navegación</h3>
            <ul className="space-y-2 text-gray-400">
              <li><a href="#" className="hover:text-white transition-colors">Home</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Servicios para Farmacias</a></li>
              <li><a href="#" className="hover:text-white transition-colors">farmapro IMPULSO</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Blog</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Portal de Suscripción</a></li>
              <li><a href="#" className="hover:text-white transition-colors">FAQ's</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Contacto</a></li>
            </ul>
          </div>
          
          <div>
            <h3 className="font-semibold mb-4">Legal</h3>
            <ul className="space-y-2 text-gray-400">
              <li>
                <Link to="/politica-privacidad" className="hover:text-white transition-colors">
                  Política de Privacidad
                </Link>
              </li>
              <li><a href="#" className="hover:text-white transition-colors">Términos y Condiciones</a></li>
              <li>
                <Link to="/aviso-legal" className="hover:text-white transition-colors">
                  Aviso Legal
                </Link>
              </li>
              <li>
                <Link to="/politica-cookies" className="hover:text-white transition-colors">
                  Cookies
                </Link>
              </li>
            </ul>
          </div>
          
          <div>
            <h3 className="font-semibold mb-4">Contacto</h3>
            <ul className="space-y-2 text-gray-400">
              <li className="flex items-center space-x-2">
                <Mail className="h-4 w-4" />
                <span>info@farmapro.com</span>
              </li>
              <li className="flex items-center space-x-2">
                <Phone className="h-4 w-4" />
                <span>+34 900 123 456</span>
              </li>
              <li className="flex items-center space-x-2">
                <MapPin className="h-4 w-4" />
                <span>Madrid, España</span>
              </li>
            </ul>
            
            <div className="mt-6">
              <h4 className="font-medium mb-2">Mantente informado</h4>
              <div className="flex space-x-2">
                <Input 
                  type="email" 
                  placeholder="Tu email" 
                  className="bg-gray-800 border-gray-700 text-white"
                />
                <Button size="sm" className="bg-gradient-to-r from-blue-600 to-green-600">
                  OK
                </Button>
              </div>
            </div>
          </div>
        </div>
        
        <div className="border-t border-gray-800 mt-8 pt-8">
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4 text-sm text-gray-400">
            <div className="flex items-center gap-2">
              <Copyright className="h-4 w-4" />
              <span>{currentYear} farmapro | Impulsando la excelencia farmacéutica en España</span>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};
