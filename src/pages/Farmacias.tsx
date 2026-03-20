
import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { motion } from 'framer-motion';
import { useToast } from '@/hooks/use-toast';
import { PharmacyGrid } from '@/components/pharmacy/PharmacyGrid';
import { FarmaciasHeader } from '@/components/pharmacy/FarmaciasHeader';
import { useSectionVisibility } from '@/hooks/useSectionVisibility';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertCircle } from 'lucide-react';

interface PharmacyListing {
  id: string;
  title: string;
  location: string;
  description: string;
  price: number;
  surface_area: number;
  annual_revenue: number;
  contact_email: string;
  seller_id: string;
  is_active: boolean;
  created_at: string;
}

// Interface for public view without sensitive information
interface PublicPharmacyListing {
  id: string;
  title: string;
  location: string;
  description: string;
  price: number;
  surface_area: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  images_urls: string[] | null;
}

const Farmacias = () => {
  const { profile, user, isAdmin: userIsAdmin } = useAuth();
  const { isFarmaciasVisible } = useSectionVisibility();
  const { toast } = useToast();
  const [listings, setListings] = useState<PublicPharmacyListing[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadListings();
  }, []);

  const loadListings = async () => {
    setLoading(true);
    
    // Use the secure public view that doesn't expose contact emails to anonymous users
    const { data, error } = await supabase
      .from('pharmacy_listings_public')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error loading pharmacy listings:', error);
      toast({
        title: "Error",
        description: "Error al cargar farmacias",
        variant: "destructive"
      });
    } else {
      setListings(data || []);
    }
    setLoading(false);
  };


  // Function to handle contact click with secure email retrieval
  const handleContactClick = async (pharmacyId: string, title: string) => {
    if (!user) {
      toast({
        title: "Autenticación requerida",
        description: "Debes iniciar sesión para ver la información de contacto",
        variant: "destructive"
      });
      return;
    }

    try {
      // Use the secure function to get contact email
      const { data: contactEmail, error } = await supabase.rpc(
        'get_pharmacy_contact_email' as any, 
        { pharmacy_id: pharmacyId }
      );

      if (error) {
        console.error('Error getting contact email:', error);
        toast({
          title: "Error",
          description: "No se pudo obtener la información de contacto",
          variant: "destructive"
        });
        return;
      }

      if (!contactEmail) {
        toast({
          title: "Sin acceso",
          description: "No tienes permisos para ver esta información de contacto",
          variant: "destructive"
        });
        return;
      }

      // Open email client with contact information
      window.location.href = `mailto:${contactEmail}?subject=Interés en ${title}`;
    } catch (error) {
      console.error('Error:', error);
      toast({
        title: "Error",
        description: "Ocurrió un error al obtener la información de contacto",
        variant: "destructive"
      });
    }
  };


  // Show message if section is not visible to public users (except admins)
  if (!userIsAdmin && !isFarmaciasVisible()) {
    return (
      <motion.div 
        className="space-y-8"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
      >
        <FarmaciasHeader />
        
        <Card className="border-amber-200 bg-amber-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-amber-800">
              <AlertCircle className="h-5 w-5" />
              Sección en Desarrollo
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-amber-700">
              La sección de Farmacias estará disponible próximamente. Estamos preparando el mejor marketplace para la compra y venta de farmacias.
            </p>
          </CardContent>
        </Card>
      </motion.div>
    );
  }

  return (
    <motion.div 
      className="space-y-8"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ staggerChildren: 0.1 }}
    >
      <FarmaciasHeader />

      <PharmacyGrid listings={listings} loading={loading} onContactClick={handleContactClick} />
    </motion.div>
  );
};

export default Farmacias;
