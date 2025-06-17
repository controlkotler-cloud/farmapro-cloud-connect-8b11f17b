
import { useState } from 'react';
import { Search, Bell, User, LogOut, Settings } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { motion } from 'framer-motion';

export const Header = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const { profile, signOut } = useAuth();

  const handleSignOut = async () => {
    await signOut();
  };

  return (
    <header className="bg-white border-b border-gray-200 px-6 py-4">
      <div className="flex items-center justify-between">
        {/* Logo */}
        <div className="flex items-center space-x-3">
          <img src="/lovable-uploads/436f630b-82e2-4604-bbee-e932d97e61e2.png" alt="farmapro" className="h-8" />
        </div>

        {/* Search */}
        <div className="flex-1 max-w-xl mx-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="Buscar cursos, recursos, comunidad..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 pr-4 py-2 w-full"
            />
          </div>
        </div>

        {/* Right Section */}
        <div className="flex items-center space-x-4">
          {/* Notifications */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="relative">
                <Bell className="h-5 w-5" />
                <Badge variant="destructive" className="absolute -top-1 -right-1 h-5 w-5 p-0 flex items-center justify-center text-xs">
                  3
                </Badge>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-80" align="end">
              <div className="p-3 border-b">
                <h3 className="font-semibold">Notificaciones</h3>
              </div>
              <div className="max-h-64 overflow-y-auto">
                <DropdownMenuItem className="p-3 flex flex-col items-start">
                  <p className="font-medium text-sm">¡Nuevo reto completado!</p>
                  <p className="text-xs text-gray-500">Has ganado 100 puntos por completar tu primer curso</p>
                </DropdownMenuItem>
                <DropdownMenuItem className="p-3 flex flex-col items-start">
                  <p className="font-medium text-sm">Nueva respuesta en el foro</p>
                  <p className="text-xs text-gray-500">Alguien ha respondido a tu hilo sobre marketing farmacéutico</p>
                </DropdownMenuItem>
                <DropdownMenuItem className="p-3 flex flex-col items-start">
                  <p className="font-medium text-sm">Recurso disponible</p>
                  <p className="text-xs text-gray-500">Nueva calculadora de rentabilidad disponible</p>
                </DropdownMenuItem>
              </div>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* User Menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-gradient-to-r from-green-500 to-green-600 rounded-full flex items-center justify-center text-white text-sm font-medium">
                  {profile?.full_name?.charAt(0) || 'U'}
                </div>
                <span className="font-medium">{profile?.full_name || 'Usuario'}</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56" align="end">
              <div className="p-3 border-b">
                <p className="font-medium">{profile?.full_name}</p>
                <p className="text-sm text-gray-500">{profile?.email}</p>
                {profile?.pharmacy_name && (
                  <p className="text-sm text-gray-500">{profile.pharmacy_name}</p>
                )}
              </div>
              <DropdownMenuItem>
                <User className="mr-2 h-4 w-4" />
                Mi Perfil
              </DropdownMenuItem>
              <DropdownMenuItem>
                <Settings className="mr-2 h-4 w-4" />
                Configuración
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleSignOut}>
                <LogOut className="mr-2 h-4 w-4" />
                Cerrar Sesión
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
};
