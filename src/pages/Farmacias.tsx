
import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { MapPin, DollarSign, Home, TrendingUp, Mail, Plus, Building2 } from 'lucide-react';
import { motion } from 'framer-motion';

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

const Farmacias = () => {
  const { profile } = useAuth();
  const [listings, setListings] = useState<PharmacyListing[]>([]);
  const [loading, setLoading] = useState(true);
  const [showNewListingDialog, setShowNewListingDialog] = useState(false);
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
    const { data, error } = await supabase
      .from('pharmacy_listings')
      .select('*')
      .eq('is_active', true)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error loading pharmacy listings:', error);
    } else {
      setListings(data || []);
    }
    setLoading(false);
  };

  const createListing = async () => {
    if (!profile?.id || !newListing.title || !newListing.location) return;

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
      setShowNewListingDialog(false);
      loadListings();
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('es-ES', {
      style: 'currency',
      currency: 'EUR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(price);
  };

  const formatRevenue = (revenue: number) => {
    return new Intl.NumberFormat('es-ES', {
      style: 'currency',
      currency: 'EUR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(revenue) + '/año';
  };

  const canCreateListing = () => {
    return profile?.subscription_role && profile.subscription_role !== 'freemium';
  };

  // Placeholder images for pharmacy listings
  const pharmacyImages = [
    'https://images.unsplash.com/photo-1576091160399-112ba8d25d1f?w=400&h=300&fit=crop',
    'https://images.unsplash.com/photo-1585435557343-3b092031d03d?w=400&h=300&fit=crop',
    'https://images.unsplash.com/photo-1559757148-5c350d0d3c56?w=400&h=300&fit=crop',
    'https://images.unsplash.com/photo-1576091160550-2173dba999ef?w=400&h=300&fit=crop',
    'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=400&h=300&fit=crop',
    'https://images.unsplash.com/photo-1582750433449-648ed127bb54?w=400&h=300&fit=crop'
  ];

  const getPharmacyImage = (index: number) => {
    return pharmacyImages[index % pharmacyImages.length];
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Farmacias en Venta</h1>
          <p className="text-gray-600">Espacio para encontrar tu farmacia ideal</p>
        </div>
        {canCreateListing() && (
          <Dialog open={showNewListingDialog} onOpenChange={setShowNewListingDialog}>
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
        )}
      </div>

      {!canCreateListing() && (
        <Card className="border-blue-200 bg-blue-50">
          <CardContent className="p-6">
            <p className="text-blue-800">
              <strong>¿Quieres vender tu farmacia?</strong> Actualiza a un plan premium y encuentra el comprador ideal.
            </p>
          </CardContent>
        </Card>
      )}

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <div className="h-48 bg-gray-200"></div>
              <CardContent className="p-6">
                <div className="h-4 bg-gray-200 rounded mb-2"></div>
                <div className="h-3 bg-gray-200 rounded"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {listings.map((listing, index) => (
            <motion.div
              key={listing.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
            >
              <Card className="h-full hover:shadow-lg transition-shadow">
                <div className="relative">
                  <img
                    src={getPharmacyImage(index)}
                    alt={listing.title}
                    className="h-48 w-full object-cover rounded-t-lg"
                    onError={(e) => {
                      // Fallback to gradient background if image fails to load
                      const target = e.target as HTMLImageElement;
                      target.style.display = 'none';
                      const fallback = target.nextElementSibling as HTMLElement;
                      if (fallback) fallback.style.display = 'flex';
                    }}
                  />
                  <div className="h-48 bg-gradient-to-br from-blue-100 to-green-100 flex items-center justify-center rounded-t-lg" style={{ display: 'none' }}>
                    <Building2 className="h-16 w-16 text-blue-600" />
                  </div>
                  <Badge className="absolute top-2 right-2 bg-green-600">
                    En Venta
                  </Badge>
                </div>
                <CardHeader>
                  <CardTitle className="text-lg">{listing.title}</CardTitle>
                  <div className="flex items-center text-gray-600">
                    <MapPin className="h-4 w-4 mr-1" />
                    {listing.location}
                  </div>
                  <CardDescription>{listing.description}</CardDescription>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="space-y-3">
                    {listing.price && (
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">Precio:</span>
                        <span className="font-bold text-lg text-green-600">
                          {formatPrice(listing.price)}
                        </span>
                      </div>
                    )}
                    
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      {listing.surface_area && (
                        <div className="flex items-center">
                          <Home className="h-4 w-4 mr-1 text-gray-400" />
                          <span>{listing.surface_area} m²</span>
                        </div>
                      )}
                      {listing.annual_revenue && (
                        <div className="flex items-center">
                          <TrendingUp className="h-4 w-4 mr-1 text-gray-400" />
                          <span className="text-xs">{formatRevenue(listing.annual_revenue)}</span>
                        </div>
                      )}
                    </div>
                    
                    <Button 
                      className="w-full mt-4"
                      onClick={() => window.location.href = `mailto:${listing.contact_email}?subject=Interés en ${listing.title}`}
                    >
                      <Mail className="h-4 w-4 mr-2" />
                      Contactar
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Farmacias;
