import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface ClientifySyncOptions {
  action: 'sync_user' | 'send_email' | 'team_invitation' | 'add_to_automation';
  userId?: string;
  email?: string;
  data?: any;
}

export const useClientifySync = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);

  const syncWithClientify = async (options: ClientifySyncOptions) => {
    if (!user) {
      toast.error('Usuario no autenticado');
      return null;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('clientify-sync', {
        body: {
          action: options.action,
          userId: options.userId || user.id,
          email: options.email || user.email,
          data: options.data
        }
      });

      if (error) {
        console.error('Error syncing with Clientify:', error);
        toast.error('Error al sincronizar con Clientify');
        return null;
      }

      return data;
    } catch (error) {
      console.error('Clientify sync error:', error);
      toast.error('Error al comunicarse con Clientify');
      return null;
    } finally {
      setLoading(false);
    }
  };

  const syncCurrentUser = async () => {
    return await syncWithClientify({
      action: 'sync_user'
    });
  };

  const sendEmail = async (email: string, subject: string, content: string, templateId?: string, personalization?: any) => {
    return await syncWithClientify({
      action: 'send_email',
      email,
      data: {
        subject,
        content,
        template_id: templateId,
        personalization
      }
    });
  };

  const addToAutomation = async (email: string, automationId: string) => {
    return await syncWithClientify({
      action: 'add_to_automation',
      email,
      data: {
        automationId
      }
    });
  };

  return {
    syncWithClientify,
    syncCurrentUser,
    sendEmail,
    addToAutomation,
    loading
  };
};