
import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Plus } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface PharmacyFormProps {
  profileId: string;
  onListingCreated: () => void;
}

export const PharmacyForm = ({ profileId, onListingCreated }: PharmacyFormProps) => {
  const [showDialog, setShowDialog] = useState(false);
  const [newListing, setNewListing] = useState({
    title: '',
    location: '',
    description: '',
    price: '',
    surface_area: '',
    annual_revenue: '',
    contact_email: ''
  });

  const createListing = async () => {
    if (!profileId || !newListing.title || !newListing.location) return;

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
        seller_id: profileId
      }]);

    if (error) {
      console.error('Error creating listing:', error);
    } else {
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
      onListingCreated();
    }
  };

  return (
    <Dialog open={showDialog} onOpenChange={setShowDialog}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          Publicar Farmacia
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Publicar Farmacia en Venta</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 max-h-96 overflow-y-auto">
          <Input
            placeholder="Título del anuncio"
            value={newListing.title}
            onChange={(e) => setNewListing({ ...newListing, title: e.target.value })}
          />
          <Input
            placeholder="Ubicación"
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
          <Button onClick={createListing} className="w-full">
            Publicar Anuncio
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
