
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';

export interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'course' | 'forum' | 'resource' | 'challenge' | 'general';
  target_url?: string;
  target_id?: string;
  is_read: boolean;
  created_at: string;
  user_id: string;
}

export const useNotifications = () => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const { toast } = useToast();

  // Cargar notificaciones del usuario
  const fetchNotifications = async () => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', user.id)
        .eq('is_read', false)
        .order('created_at', { ascending: false })
        .limit(10);

      if (error) throw error;
      setNotifications(data || []);
    } catch (error) {
      console.error('Error fetching notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  // Marcar notificación como leída
  const markAsRead = async (notificationId: string) => {
    try {
      const { error } = await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('id', notificationId);

      if (error) throw error;

      // Actualizar estado local
      setNotifications(prev => prev.filter(n => n.id !== notificationId));
      
      toast({
        title: "Notificación marcada como leída",
        duration: 2000,
      });
    } catch (error) {
      console.error('Error marking notification as read:', error);
      toast({
        title: "Error al marcar notificación",
        description: "No se pudo marcar la notificación como leída",
        variant: "destructive",
      });
    }
  };

  // Obtener URL de destino basada en el tipo y target_id
  const getTargetUrl = (notification: Notification): string => {
    if (notification.target_url) {
      return notification.target_url;
    }

    switch (notification.type) {
      case 'course':
        return `/formacion${notification.target_id ? `?course=${notification.target_id}` : ''}`;
      case 'forum':
        return `/comunidad${notification.target_id ? `?thread=${notification.target_id}` : ''}`;
      case 'resource':
        return `/recursos${notification.target_id ? `?resource=${notification.target_id}` : ''}`;
      case 'challenge':
        return `/retos${notification.target_id ? `?challenge=${notification.target_id}` : ''}`;
      default:
        return '/dashboard';
    }
  };

  useEffect(() => {
    fetchNotifications();

    // Suscribirse a nuevas notificaciones en tiempo real
    const channel = supabase
      .channel('notifications')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${user?.id}`,
        },
        (payload) => {
          const newNotification = payload.new as Notification;
          setNotifications(prev => [newNotification, ...prev]);
          
          // Mostrar toast para nueva notificación
          toast({
            title: newNotification.title,
            description: newNotification.message,
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, toast]);

  return {
    notifications,
    loading,
    markAsRead,
    getTargetUrl,
    refetch: fetchNotifications,
  };
};
