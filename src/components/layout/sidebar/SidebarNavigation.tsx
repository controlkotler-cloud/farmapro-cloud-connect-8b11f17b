
import { Link, useLocation } from 'react-router-dom';
import { 
  BookOpen, 
  FileText, 
  Users, 
  Award, 
  Building, 
  Briefcase, 
  MessageSquare,
  Tag, 
  Calendar,
  LayoutDashboard
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/hooks/useAuth';
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface NavigationItem {
  name: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: string;
}

export const SidebarNavigation = () => {
  const location = useLocation();
  const { profile } = useAuth();
  const [unreadConversations, setUnreadConversations] = useState(0);

  useEffect(() => {
    if (profile?.id) {
      loadUnreadConversations();
    }
  }, [profile]);

  const loadUnreadConversations = async () => {
    if (!profile?.id) return;

    try {
      const { data: conversations } = await supabase
        .from('job_conversations')
        .select('id');

      if (!conversations) return;

      let totalUnread = 0;
      
      for (const conv of conversations) {
        const { count } = await supabase
          .from('job_messages')
          .select('*', { count: 'exact', head: true })
          .eq('conversation_id', conv.id)
          .neq('sender_id', profile.id)
          .is('read_at', null);
          
        totalUnread += count || 0;
      }

      setUnreadConversations(totalUnread);
    } catch (error) {
      console.error('Error loading unread conversations:', error);
    }
  };

  const navigation: NavigationItem[] = [
    { name: 'Dashboard', href: '/', icon: LayoutDashboard },
    { name: 'Formación', href: '/formacion', icon: BookOpen },
    { name: 'Recursos', href: '/recursos', icon: FileText },
    { name: 'Comunidad', href: '/comunidad', icon: Users },
    { name: 'Retos', href: '/retos', icon: Award },
    { name: 'Farmacias', href: '/farmacias', icon: Building },
    { name: 'Empleo', href: '/empleo', icon: Briefcase },
    { 
      name: 'Mis Conversaciones', 
      href: '/empleo/conversaciones', 
      icon: MessageSquare,
      badge: unreadConversations > 0 ? unreadConversations.toString() : undefined
    },
    { name: 'Promociones', href: '/promociones', icon: Tag },
    { name: 'Eventos', href: '/eventos', icon: Calendar },
  ];

  return (
    <nav className="flex-1 space-y-1 px-2 py-4">
      {navigation.map((item) => {
        const isActive = location.pathname === item.href || 
          (item.href !== '/' && location.pathname.startsWith(item.href));
        
        return (
          <Link
            key={item.name}
            to={item.href}
            className={`
              group flex items-center justify-between px-2 py-2 text-sm font-medium rounded-md transition-colors duration-150 ease-in-out
              ${isActive 
                ? 'bg-blue-100 text-blue-900 border-r-2 border-blue-600' 
                : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
              }
            `}
          >
            <div className="flex items-center">
              <item.icon 
                className={`mr-3 h-5 w-5 flex-shrink-0 ${
                  isActive ? 'text-blue-600' : 'text-gray-400 group-hover:text-gray-500'
                }`} 
              />
              <span className="truncate">{item.name}</span>
            </div>
            {item.badge && (
              <Badge variant="destructive" className="text-xs h-5 px-1.5">
                {item.badge}
              </Badge>
            )}
          </Link>
        );
      })}
    </nav>
  );
};
