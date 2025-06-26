
import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { PharmacyFormDialog } from '@/components/admin/pharmacy/PharmacyFormDialog';
import { PharmacyCard } from '@/components/admin/pharmacy/PharmacyCard';
import { EmptyPharmacyState } from '@/components/admin/pharmacy/EmptyPharmacyState';
import { PharmacyLoadingSkeleton } from '@/components/admin/pharmacy/PharmacyLoadingSkeleton';
import { usePharmacyManagement } from '@/hooks/usePharmacyManagement';

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

const AdminFarmacias = () => {
  const { isAdmin } = useAuth();
  const { pharmacies, loading, loadPharmacies, togglePharmacyStatus, deletePharmacy } = usePharmacyManagement();
  const [editingPharmacy, setEditingPharmacy] = useState<PharmacyListing | null>(null);

  useEffect(() => {
    // Scroll to top when component mounts
    window.scrollTo(0, 0);
  }, []);

  const handleEdit = (pharmacy: PharmacyListing) => {
    console.log('Editing pharmacy listing:', pharmacy.id);
    setEditingPharmacy(pharmacy);
  };

  const handlePharmacyUpdated = () => {
    setEditingPharmacy(null);
    loadPharmacies();
  };

  if (!isAdmin) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Acceso Denegado</h2>
          <p className="text-gray-600">No tienes permisos para acceder a esta página.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Gestión de Farmacias</h1>
          <p className="text-gray-600">Gestionar directorio de farmacias en venta</p>
        </div>
        <PharmacyFormDialog 
          editingPharmacy={editingPharmacy} 
          onPharmacyUpdated={handlePharmacyUpdated} 
        />
      </div>

      {loading ? (
        <PharmacyLoadingSkeleton />
      ) : pharmacies.length === 0 ? (
        <EmptyPharmacyState onCreateClick={() => setEditingPharmacy(null)} />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {pharmacies.map((pharmacy) => (
            <PharmacyCard
              key={pharmacy.id}
              pharmacy={pharmacy}
              onEdit={handleEdit}
              onToggleStatus={togglePharmacyStatus}
              onDelete={deletePharmacy}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default AdminFarmacias;
