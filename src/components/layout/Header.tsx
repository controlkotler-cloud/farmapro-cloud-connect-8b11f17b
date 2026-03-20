
import { Bell, User, LogOut, Menu } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { GlobalSearch } from '@/components/search/GlobalSearch';
import { useNotifications } from '@/hooks/useNotifications';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { useIsMobile } from '@/hooks/use-mobile';

export const Header = () => {
  const { profile, signOut } = useAuth();
  const navigate = useNavigate();
  const { notifications, loading, markAsRead, getTargetUrl } = useNotifications();
  const isMobile = useIsMobile();

  const handleSignOut = async () => {
    await signOut();
  };

  const handleProfileClick = () => {
    navigate('/perfil');
  };

  const handleNotificationClick = async (notification: any) => {
    // Marcar como leída
    await markAsRead(notification.id);
    
    // Navegar al destino
    const targetUrl = getTargetUrl(notification);
    navigate(targetUrl);
  };

  const getNotificationIcon = (type: string) => {
    // Podríamos usar diferentes iconos según el tipo
    return '🔔';
  };

  return (
    <header className="bg-white border-b border-gray-200 px-4 md:px-6 py-4">
      <div className="flex items-center justify-between">
        {/* Mobile: Hamburger + Logo */}
        <div className="flex items-center space-x-3">
          <SidebarTrigger className="lg:hidden" />
          <img src="/lovable-uploads/436f630b-82e2-4604-bbee-e932d97e61e2.png" alt="farmapro" className="h-8" />
        </div>

        {/* Desktop: Search */}
        {!isMobile && <GlobalSearch />}

        {/* Right Section */}
        <div className="flex items-center space-x-2 md:space-x-4">
          {/* Notifications */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="relative">
                <Bell className="h-5 w-5" />
                {notifications.length > 0 && (
                  <Badge variant="destructive" className="absolute -top-1 -right-1 h-5 w-5 p-0 flex items-center justify-center text-xs">
                    {notifications.length}
                  </Badge>
                )}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-80" align="end">
              <div className="p-3 border-b">
                <h3 className="font-semibold">Notificaciones</h3>
              </div>
              <div className="max-h-64 overflow-y-auto">
                {loading ? (
                  <div className="p-3 text-center text-gray-500">
                    Cargando notificaciones...
                  </div>
                ) : notifications.length === 0 ? (
                  <div className="p-3 text-center text-gray-500">
                    No tienes notificaciones nuevas
                  </div>
                ) : (
                  notifications.map((notification) => (
                    <DropdownMenuItem 
                      key={notification.id}
                      className="p-3 flex flex-col items-start cursor-pointer hover:bg-gray-50"
                      onClick={() => handleNotificationClick(notification)}
                    >
                      <div className="flex items-start justify-between w-full">
                        <div className="flex-1">
                          <p className="font-medium text-sm">{notification.title}</p>
                          <p className="text-xs text-gray-500 mt-1">{notification.message}</p>
                          <p className="text-xs text-gray-400 mt-1">
                            {new Date(notification.created_at).toLocaleDateString('es-ES', {
                              day: 'numeric',
                              month: 'short',
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </p>
                        </div>
                        <span className="text-lg ml-2">
                          {getNotificationIcon(notification.type)}
                        </span>
                      </div>
                    </DropdownMenuItem>
                  ))
                )}
              </div>
              {notifications.length > 0 && (
                <div className="p-2 border-t">
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="w-full text-xs"
                    onClick={() => navigate('/notificaciones')}
                  >
                    Ver todas las notificaciones
                  </Button>
                </div>
              )}
            </DropdownMenuContent>
          </DropdownMenu>

          {/* User Menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-gradient-to-r from-green-500 to-green-600 rounded-full flex items-center justify-center text-white text-sm font-medium">
                  {profile?.full_name?.charAt(0) || 'U'}
                </div>
                {!isMobile && <span className="font-medium">{profile?.full_name || 'Usuario'}</span>}
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
              <DropdownMenuItem onClick={handleProfileClick}>
                <User className="mr-2 h-4 w-4" />
                Mi Perfil
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
      
      {/* Mobile: Search below header */}
      {isMobile && (
        <div className="mt-4">
          <GlobalSearch />
        </div>
      )}
    </header>
  );
};
