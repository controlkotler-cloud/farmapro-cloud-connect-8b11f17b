
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface Event {
  id: string;
  title: string;
  description: string;
  event_type: string;
  start_date: string;
  end_date: string;
  location: string;
  registration_url: string;
  image_url: string;
  is_featured: boolean;
  created_at: string;
}

export const useEvents = (selectedType: string) => {
  const { toast } = useToast();
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);

  const loadEvents = async () => {
    try {
      setLoading(true);
      console.log('Loading events from database...');
      
      let query = supabase
        .from('events')
        .select('*')
        .gte('end_date', new Date().toISOString())
        .order('is_featured', { ascending: false })
        .order('start_date', { ascending: true });

      if (selectedType !== 'all') {
        query = query.eq('event_type', selectedType);
      }

      const { data, error } = await query;
      
      if (error) {
        console.error('Error loading events:', error);
        toast({
          title: "Error",
          description: `Error al cargar eventos: ${error.message}`,
          variant: "destructive"
        });
        return;
      }

      console.log('Events loaded:', data?.length || 0);
      setEvents(data || []);
    } catch (error: any) {
      console.error('Exception loading events:', error);
      toast({
        title: "Error",
        description: "Error inesperado al cargar eventos",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadEvents();
  }, [selectedType]);

  return { events, loading, loadEvents };
};
