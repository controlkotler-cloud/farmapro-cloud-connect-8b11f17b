
import { useState } from 'react';
import { PromotionFormDialog } from '@/components/admin/promotion/PromotionFormDialog';
import { PromotionGrid } from '@/components/admin/promotion/PromotionGrid';
import { EmptyPromotionState } from '@/components/admin/promotion/EmptyPromotionState';
import { PromotionLoadingSkeleton } from '@/components/admin/promotion/PromotionLoadingSkeleton';
import { usePromotionManagement } from '@/hooks/usePromotionManagement';
import { PromotionRequestsList } from '@/components/admin/promotion/PromotionRequestsList';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';


interface Promotion {
  id: string;
  title: string;
  company_name: string;
  company_type: string;
  description: string;
  discount_details: string;
  is_active: boolean;
  valid_until: string | null;
  terms_conditions: string | null;
  image_url: string | null;
  target_url: string | null;
  partner_email: string | null;
  created_at: string;
}

const AdminPromociones = () => {
  const [editingPromotion, setEditingPromotion] = useState<Promotion | null>(null);
  const {
    promotions,
    loading,
    deletingId,
    loadPromotions,
    togglePromotionStatus,
    deletePromotion
  } = usePromotionManagement();

  const handleEdit = (promotion: Promotion) => {
    console.log('Editing promotion:', promotion.id);
    setEditingPromotion(promotion);
  };

  const handlePromotionUpdated = () => {
    setEditingPromotion(null);
    loadPromotions();
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold tracking-tight text-foreground sm:text-3xl [text-wrap:balance]">Gestión de promociones</h1>
        <p className="mt-1.5 text-sm text-muted-foreground">Gestionar ofertas, descuentos y solicitudes</p>
      </div>

      <Tabs defaultValue="promociones" className="space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <TabsList>
            <TabsTrigger value="promociones">Promociones</TabsTrigger>
            <TabsTrigger value="solicitudes">Solicitudes</TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="promociones" className="space-y-6">
          <div className="flex justify-end">
            <PromotionFormDialog
              editingPromotion={editingPromotion}
              onPromotionUpdated={handlePromotionUpdated}
            />
          </div>

          {loading ? (
            <PromotionLoadingSkeleton />
          ) : promotions.length === 0 ? (
            <EmptyPromotionState onPromotionUpdated={handlePromotionUpdated} />
          ) : (
            <PromotionGrid
              promotions={promotions}
              onEdit={handleEdit}
              onToggleStatus={togglePromotionStatus}
              onDelete={deletePromotion}
              deletingId={deletingId}
            />
          )}
        </TabsContent>

        <TabsContent value="solicitudes">
          <PromotionRequestsList />
        </TabsContent>
      </Tabs>
    </div>
  );
};


export default AdminPromociones;
