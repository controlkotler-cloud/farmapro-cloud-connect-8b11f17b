
import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { motion } from 'framer-motion';
import { useToast } from '@/hooks/use-toast';
import { PharmacyGrid } from '@/components/pharmacy/PharmacyGrid';
import { FarmaciasHeader } from '@/components/pharmacy/FarmaciasHeader';
import { FarmaciasActions } from '@/components/pharmacy/FarmaciasActions';
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
  const [showDialog, setShowDialog] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [newListing, setNewListing] = useState({
    title: '',
    location: '',
    description: '',
    price: '',
    surface_area: '',
    annual_revenue: '',
    contact_email: ''
  });

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

  const createListing = async () => {
    if (!profile?.id || !newListing.title || !newListing.location) {
      toast({
        title: "Error",
        description: "Por favor completa todos los campos obligatorios",
        variant: "destructive"
      });
      return;
    }

    try {
      setSubmitting(true);
      console.log('Creating pharmacy listing:', newListing.title);

      const { error } = await supabase
        .from('pharmacy_listings')
        .insert([{
          title: newListing.title,
          location: newListing.location,
          description: newListing.description,
          price: parseFloat(newListing.price) || null,
          surface_area: parseInt(newListing.surface_area) || null,
          annual_revenue: parseFloat(newListing.annual_revenue) || null,
          contact_email: newListing.contact_email,
          seller_id: profile.id
        }]);

      if (error) {
        console.error('Error creating pharmacy listing:', error);
        throw error;
      }

      toast({
        title: "Éxito",
        description: "Farmacia publicada correctamente"
      });

      setNewListing({
        title: '',
        location: '',
        description: '',
        price: '',
        surface_area: '',
        annual_revenue: '',
        contact_email: ''
      });
      setShowDialog(false);
      await loadListings();
    } catch (error: any) {
      console.error('Error creating pharmacy listing:', error);
      toast({
        title: "Error",
        description: `No se pudo crear el anuncio: ${error.message || 'Error desconocido'}`,
        variant: "destructive"
      });
    } finally {
      setSubmitting(false);
    }
  };

  const canCreateListing = () => {
    return profile?.subscription_role === 'premium' || profile?.subscription_role === 'admin';
  };

  const isPremium = () => {
    return profile?.subscription_role === 'premium';
  };

  const checkIsAdmin = () => {
    return profile?.subscription_role === 'admin';
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
        'get_pharmacy_contact_email', 
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

  const handleCreateListing = () => {
    setShowDialog(true);
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

      <FarmaciasActions 
        canCreateListing={canCreateListing()}
        isPremium={isPremium()}
        isAdmin={checkIsAdmin()}
        onCreateListing={handleCreateListing}
      />

      {/* Dialog para crear anuncios */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Publicar Farmacia en Venta</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <Input
              placeholder="Título del anuncio *"
              value={newListing.title}
              onChange={(e) => setNewListing({ ...newListing, title: e.target.value })}
            />
            <Input
              placeholder="Ubicación *"
              value={newListing.location}
              onChange={(e) => setNewListing({ ...newListing, location: e.target.value })}
            />
            <div className="grid grid-cols-3 gap-4">
              <Input
                placeholder="Precio (€)"
                type="number"
                value={newListing.price}
                onChange={(e) => setNewListing({ ...newListing, price: e.target.value })}
              />
              <Input
                placeholder="Superficie (m²)"
                type="number"
                value={newListing.surface_area}
                onChange={(e) => setNewListing({ ...newListing, surface_area: e.target.value })}
              />
              <Input
                placeholder="Facturación anual (€)"
                type="number"
                value={newListing.annual_revenue}
                onChange={(e) => setNewListing({ ...newListing, annual_revenue: e.target.value })}
              />
            </div>
            <Input
              placeholder="Email de contacto"
              type="email"
              value={newListing.contact_email}
              onChange={(e) => setNewListing({ ...newListing, contact_email: e.target.value })}
            />
            <Textarea
              placeholder="Descripción de la farmacia"
              value={newListing.description}
              onChange={(e) => setNewListing({ ...newListing, description: e.target.value })}
              rows={4}
            />
            <Button onClick={createListing} className="w-full" disabled={submitting}>
              {submitting ? 'Publicando...' : 'Publicar Anuncio'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <PharmacyGrid listings={listings} loading={loading} onContactClick={handleContactClick} />
    </motion.div>
  );
};

export default Farmacias;
