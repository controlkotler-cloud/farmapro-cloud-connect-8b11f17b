
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

export interface NotificationSettings {
  email_courses: boolean;
  email_promotions: boolean;
  email_community: boolean;
  push_notifications: boolean;
}

export const useNotificationSettings = () => {
  const [settings, setSettings] = useState<NotificationSettings>({
    email_courses: true,
    email_promotions: true,
    email_community: false,
    push_notifications: true,
  });
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  // Cargar configuración de notificaciones
  const fetchSettings = async () => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase
        .from('user_notification_settings')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      if (error && error.code !== 'PGRST116') { // PGRST116 = no rows found
        console.error('Error fetching notification settings:', error);
        return;
      }

      if (data) {
        setSettings({
          email_courses: data.email_courses,
          email_promotions: data.email_promotions,
          email_community: data.email_community,
          push_notifications: data.push_notifications,
        });
      }
    } catch (error) {
      console.error('Error fetching notification settings:', error);
    } finally {
      setLoading(false);
    }
  };

  // Guardar configuración de notificaciones
  const saveSettings = async (newSettings: NotificationSettings) => {
    if (!user) return;
    
    try {
      const { error } = await supabase
        .from('user_notification_settings')
        .upsert({
          user_id: user.id,
          email_courses: newSettings.email_courses,
          email_promotions: newSettings.email_promotions,
          email_community: newSettings.email_community,
          push_notifications: newSettings.push_notifications,
        });

      if (error) {
        console.error('Error saving notification settings:', error);
        toast.error('Error al guardar la configuración de notificaciones');
        return;
      }

      setSettings(newSettings);
      toast.success('Configuración de notificaciones guardada correctamente');
    } catch (error) {
      console.error('Error saving notification settings:', error);
      toast.error('Error al guardar la configuración de notificaciones');
    }
  };

  // Actualizar configuración individual
  const updateSetting = (key: keyof NotificationSettings, value: boolean) => {
    setSettings(prev => ({
      ...prev,
      [key]: value
    }));
  };

  useEffect(() => {
    fetchSettings();
  }, [user]);

  return {
    settings,
    loading,
    updateSetting,
    saveSettings,
  };
};
