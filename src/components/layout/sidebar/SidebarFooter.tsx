
import { Link } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { User } from 'lucide-react';
import { SidebarGroup, SidebarGroupContent } from '@/components/ui/sidebar';

export const SidebarFooter = () => {
  const { profile, isAdmin } = useAuth();

  return (
    <SidebarGroup className="mt-auto">
      <SidebarGroupContent>
        <div className="p-6 border-t border-sidebar-border bg-sidebar">
          {profile ? (
            <div className="flex items-center space-x-4">
              <div className="relative">
                <div className="w-12 h-12 bg-primary rounded-full flex items-center justify-center shadow-lg">
                  <User className="w-6 h-6 text-primary-foreground" />
                </div>
                <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-success rounded-full border-2 border-sidebar shadow-sm"></div>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-sidebar-foreground truncate">
                  {profile.full_name || 'Usuario farmapro'}
                </p>
                <p className="text-xs text-sidebar-foreground/60 capitalize font-medium">
                  {isAdmin ? 'admin' : (profile.subscription_role || 'freemium')}
                </p>
              </div>
            </div>
          ) : (
            <Link
              to="/login"
              className="flex items-center justify-center w-full px-4 py-3 text-sm font-medium text-primary-foreground bg-primary rounded-lg hover:bg-primary/90 transition-all duration-300 shadow-lg transform hover:scale-105"
            >
              Iniciar Sesión
            </Link>
          )}
        </div>
      </SidebarGroupContent>
    </SidebarGroup>
  );
};
