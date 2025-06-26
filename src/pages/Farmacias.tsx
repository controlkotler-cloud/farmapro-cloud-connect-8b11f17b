
import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { PharmacyForm } from '@/components/pharmacy/PharmacyForm';
import { PharmacyGrid } from '@/components/pharmacy/PharmacyGrid';
import { SubscriptionPrompt } from '@/components/pharmacy/SubscriptionPrompt';

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

  useEffect(() => {
    // Scroll to top when component mounts
    window.scrollTo(0, 0);
    
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

  const canCreateListing = () => {
    return profile?.subscription_role && profile.subscription_role !== 'freemium';
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Farmacias en Venta</h1>
          <p className="text-gray-600">Espacio para encontrar tu farmacia ideal</p>
        </div>
        {canCreateListing() && profile?.id && (
          <PharmacyForm profileId={profile.id} onListingCreated={loadListings} />
        )}
      </div>

      <SubscriptionPrompt canCreateListing={canCreateListing()} />

      <PharmacyGrid listings={listings} loading={loading} />
    </div>
  );
};

export default Farmacias;
