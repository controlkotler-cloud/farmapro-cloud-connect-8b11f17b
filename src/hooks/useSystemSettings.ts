
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface SystemSetting {
  id: string;
  category: string;
  key: string;
  value: any;
  description: string;
  created_at: string;
  updated_at: string;
}

export const useSystemSettings = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: settings, isLoading } = useQuery({
    queryKey: ['system-settings'],
    queryFn: async (): Promise<SystemSetting[]> => {
      console.log('Fetching system settings...');
      
      const { data, error } = await supabase
        .from('system_settings')
        .select('*')
        .order('category', { ascending: true });

      if (error) {
        console.error('Error fetching system settings:', error);
        throw error;
      }

      console.log('System settings loaded:', data);
      return data || [];
    }
  });

  const updateSettingMutation = useMutation({
    mutationFn: async ({ category, key, value }: { category: string; key: string; value: any }) => {
      console.log('Updating system setting:', { category, key, value });
      
      const { data, error } = await supabase
        .from('system_settings')
        .update({ 
          value,
          updated_at: new Date().toISOString()
        })
        .eq('category', category)
        .eq('key', key)
        .select()
        .single();

      if (error) {
        console.error('Error updating system setting:', error);
        throw error;
      }

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['system-settings'] });
      toast({
        title: "Configuración actualizada",
        description: "La configuración se ha guardado correctamente",
      });
    },
    onError: (error) => {
      console.error('Error updating setting:', error);
      toast({
        title: "Error",
        description: "No se pudo actualizar la configuración",
        variant: "destructive",
      });
    }
  });

  const getSettingsByCategory = (category: string) => {
    if (!settings) return {};
    
    const categorySettings = settings.filter(setting => setting.category === category);
    const result: Record<string, any> = {};
    
    categorySettings.forEach(setting => {
      result[setting.key] = setting.value;
    });
    
    return result;
  };

  const updateCategorySettings = async (category: string, newSettings: Record<string, any>) => {
    console.log('Updating category settings:', { category, newSettings });
    
    const promises = Object.entries(newSettings).map(([key, value]) =>
      updateSettingMutation.mutateAsync({ category, key, value })
    );
    
    await Promise.all(promises);
  };

  return {
    settings,
    isLoading,
    getSettingsByCategory,
    updateCategorySettings,
    updateSetting: updateSettingMutation.mutateAsync,
    isUpdating: updateSettingMutation.isPending
  };
};
