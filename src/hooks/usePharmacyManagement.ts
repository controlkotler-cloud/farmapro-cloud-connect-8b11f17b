
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface PharmacyListing {
  id: string;
  title: string;
  location: string;
  description: string;
  price: number;
  surface_area: number;
  annual_revenue: number;
  is_active: boolean;
  contact_email: string;
  seller_id: string;
  created_at: string;
}

export const usePharmacyManagement = () => {
  const { toast } = useToast();
  const [pharmacies, setPharmacies] = useState<PharmacyListing[]>([]);
  const [loading, setLoading] = useState(true);

  const loadPharmacies = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('pharmacy_listings')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error loading pharmacies:', error);
      toast({
        title: "Error",
        description: "No se pudieron cargar las farmacias",
        variant: "destructive",
      });
    } else {
      setPharmacies(data || []);
    }
    setLoading(false);
  };

  const togglePharmacyStatus = async (pharmacyId: string, currentStatus: boolean) => {
    console.log('Toggling pharmacy status:', pharmacyId, 'from', currentStatus, 'to', !currentStatus);
    
    const { error } = await supabase
      .from('pharmacy_listings')
      .update({ is_active: !currentStatus })
      .eq('id', pharmacyId);

    if (error) {
      console.error('Error updating pharmacy status:', error);
      toast({
        title: "Error",
        description: "No se pudo actualizar el estado de la farmacia",
        variant: "destructive",
      });
    } else {
      toast({
        title: "Éxito",
        description: `Farmacia ${!currentStatus ? 'activada' : 'desactivada'} correctamente`,
      });
      setPharmacies(prevPharmacies => 
        prevPharmacies.map(pharmacy => 
          pharmacy.id === pharmacyId 
            ? { ...pharmacy, is_active: !currentStatus }
            : pharmacy
        )
      );
    }
  };

  const deletePharmacy = async (pharmacyId: string) => {
    console.log('Attempting to delete pharmacy:', pharmacyId);
    
    try {
      const { error } = await supabase
        .from('pharmacy_listings')
        .delete()
        .eq('id', pharmacyId);

      if (error) {
        console.error('Error deleting pharmacy:', error);
        toast({
          title: "Error",
          description: `No se pudo eliminar la farmacia: ${error.message}`,
          variant: "destructive",
        });
        return false;
      } else {
        console.log('Pharmacy deleted successfully');
        toast({
          title: "Éxito",
          description: "Farmacia eliminada correctamente",
        });
        setPharmacies(prevPharmacies => prevPharmacies.filter(pharmacy => pharmacy.id !== pharmacyId));
        return true;
      }
    } catch (error) {
      console.error('Unexpected error deleting pharmacy:', error);
      toast({
        title: "Error",
        description: "Error inesperado al eliminar la farmacia",
        variant: "destructive",
      });
      return false;
    }
  };

  useEffect(() => {
    loadPharmacies();
  }, []);

  return {
    pharmacies,
    loading,
    loadPharmacies,
    togglePharmacyStatus,
    deletePharmacy
  };
};
