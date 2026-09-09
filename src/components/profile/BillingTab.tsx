
import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Download, FileText, Settings } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { ROLE_LABELS } from '@/lib/plans';

interface BillingTabProps {
  profile: any;
  isAdmin: boolean;
}

interface PortalInvoice {
  id: string;
  created_at: string;
  concept: string | null;
  total_eur: number | null;
  holded_doc_number: string | null;
  sent_at: string | null;
}

const formatEur = (n: number | null) =>
  new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' }).format(Number(n ?? 0));

const formatDate = (iso: string) =>
  new Intl.DateTimeFormat('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric' }).format(new Date(iso));

export const BillingTab = ({ profile, isAdmin }: BillingTabProps) => {
  const { user } = useAuth();
  const [managementLoading, setManagementLoading] = useState(false);
  const [invoices, setInvoices] = useState<PortalInvoice[]>([]);
  const [invoicesLoading, setInvoicesLoading] = useState(true);
  const [downloading, setDownloading] = useState<string | null>(null);

  // Facturas emitidas en Holded por el webhook (suscripciones y packs). RLS:
  // cada usuario lee solo las suyas.
  useEffect(() => {
    if (!user) { setInvoicesLoading(false); return; }
    let cancelled = false;
    supabase
      .from('portal_holded_invoices')
      .select('id, created_at, concept, total_eur, holded_doc_number, sent_at')
      .eq('status', 'done')
      .order('created_at', { ascending: false })
      .then(({ data }) => {
        if (cancelled) return;
        setInvoices((data ?? []) as PortalInvoice[]);
        setInvoicesLoading(false);
      });
    return () => { cancelled = true; };
  }, [user]);

  const handleDownload = async (inv: PortalInvoice) => {
    setDownloading(inv.id);
    try {
      const { data, error } = await supabase.functions.invoke('holded-invoice-pdf', { body: { id: inv.id } });
      if (error || !data?.pdfBase64) throw error ?? new Error('sin pdf');
      const bytes = Uint8Array.from(atob(data.pdfBase64 as string), (c) => c.charCodeAt(0));
      const url = URL.createObjectURL(new Blob([bytes], { type: 'application/pdf' }));
      const a = document.createElement('a');
      a.href = url;
      a.download = (data.filename as string) || 'factura.pdf';
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 10_000);
    } catch (e) {
      console.error('Error downloading invoice:', e);
      toast.error('No se pudo descargar la factura. Inténtalo de nuevo en un momento.');
    } finally {
      setDownloading(null);
    }
  };

  const getCurrentPlan = () => {
    if (isAdmin) return 'admin';
    return profile?.subscription_role || 'freemium';
  };

  const currentPlan = getCurrentPlan();
  const planName = ROLE_LABELS[currentPlan] ?? 'Gratis';

  const handleManageSubscription = async () => {
    if (currentPlan === 'freemium') {
      toast.error('Necesitas tener una suscripción activa para acceder al portal de facturación');
      return;
    }

    setManagementLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('customer-portal');

      if (error) throw error;

      window.open(data.url, '_blank');
      
      toast.success('Abriendo portal de cliente');
    } catch (error) {
      console.error('Error opening customer portal:', error);
      toast.error('No se pudo abrir el portal de gestión');
    } finally {
      setManagementLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Información de Facturación</CardTitle>
        <CardDescription>
          Gestiona tu método de pago, tu suscripción y descarga tus facturas
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="p-4 border rounded-lg">
              <h4 className="font-medium mb-2">Estado de Cuenta</h4>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Estado actual:</span>
                  <Badge variant={currentPlan === 'admin' ? 'destructive' : profile?.subscription_status === 'active' ? 'default' : 'secondary'}>
                    {currentPlan === 'admin' ? ROLE_LABELS.admin :
                     profile?.subscription_status === 'active' ? 'Activo' : 
                     profile?.subscription_status === 'trialing' ? 'Periodo de prueba' : 'Inactivo'}
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Plan:</span>
                  <span className="text-sm font-medium">{planName}</span>
                </div>
              </div>
            </div>
            
            <div className="p-4 border rounded-lg">
              <h4 className="font-medium mb-2">Próxima Facturación</h4>
              <p className="text-sm text-muted-foreground">
                {currentPlan === 'freemium'
                  ? 'No tienes una suscripción activa' 
                  : currentPlan === 'admin'
                  ? 'Sin facturación - Cuenta administrativa'
                  : 'Tu próxima facturación será procesada automáticamente'
                }
              </p>
            </div>
          </div>

          {(currentPlan === 'freemium' || currentPlan === 'admin') && (
            <div className={`${currentPlan === 'admin' ? 'bg-info/10 border-info/30' : 'bg-warning/10 border-warning/30'} border rounded-lg p-4 mb-4`}>
              <p className={`${currentPlan === 'admin' ? 'text-info' : 'text-warning'} text-sm`}>
                <strong>{currentPlan === 'admin' ? 'Cuenta de administrador:' : 'Plan Gratuito:'}</strong> 
                {currentPlan === 'admin' 
                  ? ' Como administrador, tienes acceso completo al sistema sin necesidad de suscripción ni facturación.'
                  : ' Para acceder a la gestión de pagos y facturas, necesitas suscribirte a uno de nuestros planes de pago. Ve a la pestaña "Plan" para explorar las opciones disponibles.'
                }
              </p>
            </div>
          )}

          {currentPlan !== 'admin' && (
            <div className="space-y-4">
              <Button
                onClick={handleManageSubscription}
                disabled={managementLoading}
                className="flex items-center gap-2 w-full rounded-full"
              >
                <Settings className="h-4 w-4" />
                {managementLoading ? 'Abriendo...' : 'Gestionar o cancelar mi suscripción'}
              </Button>

            </div>
          )}

          {(currentPlan !== 'admin' || invoices.length > 0) && (
            <div className="space-y-3">
              <h4 className="font-medium flex items-center gap-2">
                <FileText className="h-4 w-4" />
                Mis facturas
              </h4>
              {invoicesLoading ? (
                <p className="text-sm text-muted-foreground">Cargando facturas…</p>
              ) : invoices.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  Todavía no hay facturas. Aparecerán aquí en cuanto se cobre tu suscripción o un pack.
                </p>
              ) : (
                <ul className="divide-y rounded-lg border">
                  {invoices.map((inv) => (
                    <li key={inv.id} className="flex flex-wrap items-center justify-between gap-3 p-3">
                      <div className="min-w-0">
                        <p className="text-sm font-medium truncate">
                          {inv.holded_doc_number ? `Factura ${inv.holded_doc_number}` : 'Factura'}
                          <span className="ml-2 tabular-nums text-muted-foreground">{formatDate(inv.created_at)}</span>
                        </p>
                        <p className="text-xs text-muted-foreground truncate">{inv.concept}</p>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-sm font-medium tabular-nums">{formatEur(inv.total_eur)}</span>
                        <Button
                          variant="outline"
                          size="sm"
                          className="rounded-full"
                          disabled={downloading === inv.id}
                          onClick={() => void handleDownload(inv)}
                        >
                          <Download className="h-4 w-4" />
                          {downloading === inv.id ? 'Preparando…' : 'PDF'}
                        </Button>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}

          {currentPlan !== 'admin' && (
            <div className="bg-info/10 border border-info/30 rounded-lg p-4">
              <p className="text-sm text-info">
                <strong>Qué hay detrás del botón:</strong> el portal seguro de Stripe, donde
                puedes cambiar la tarjeta, actualizar tus datos fiscales, cambiar de plan o
                cancelar la suscripción cuando quieras. La cancelación se hace efectiva al
                final del periodo que ya tienes pagado; hasta entonces conservas el acceso.
                Para pasar de Plus a Equipo también puedes hacerlo desde la página de planes.
                <br />
                <strong>Tus facturas</strong> se emiten con número cada vez que se cobra la
                suscripción o un pack, te llegan por email con tu NIF y tu dirección fiscal, y
                las tienes siempre aquí para descargarlas.
              </p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
