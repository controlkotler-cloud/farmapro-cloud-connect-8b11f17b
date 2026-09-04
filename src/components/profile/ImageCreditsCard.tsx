import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Sparkles, Users } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useImageCredits } from '@/hooks/useImageCredits';
import { IMAGE_ADDONS, PACKS_CHECKOUT_READY } from '@/lib/plans';

const formatPrice = (price: number): string => `${price.toFixed(2).replace('.', ',')} €`;

interface ImageCreditsCardProps {
  /** Solo los planes de pago tienen bolsa de créditos y pueden comprar packs. */
  isPaid: boolean;
}

/**
 * Créditos de IAFarma en el perfil: cuántos quedan y cómo recargar.
 *
 * Antes esto solo existía dentro del generador de imágenes, así que el saldo no
 * se podía consultar sin ponerse a generar y los packs eran invisibles para
 * quien no entraba en la herramienta.
 */
export const ImageCreditsCard = ({ isPaid }: ImageCreditsCardProps) => {
  const { toast } = useToast();
  const { status, loading, error } = useImageCredits(isPaid);
  const [buying, setBuying] = useState<number | null>(null);

  if (!isPaid) return null;

  const handleBuy = async (credits: number) => {
    if (!PACKS_CHECKOUT_READY) {
      toast({
        title: 'Muy pronto',
        description: 'La recarga instantánea de créditos llega en unos días con el pago online.',
      });
      return;
    }
    setBuying(credits);
    try {
      const { data, error: fnError } = await supabase.functions.invoke('create-checkout', {
        body: { pack: credits },
      });
      const url = (data as { url?: string } | null)?.url;
      if (fnError || !url) throw new Error('No se pudo iniciar el pago. Inténtalo de nuevo.');
      window.location.href = url;
    } catch (err) {
      toast({
        title: 'Error',
        description: err instanceof Error ? err.message : 'No se pudo iniciar el pago.',
        variant: 'destructive',
      });
      setBuying(null);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-primary" />
          Créditos de imagen · IAFarma
        </CardTitle>
        <CardDescription>
          Cuántos te quedan y cómo recargar. Los créditos de pack no caducan.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {loading && <p className="text-sm text-muted-foreground">Consultando tu saldo…</p>}

        {!loading && error && (
          <p className="text-sm text-muted-foreground">
            No hemos podido consultar tu saldo ahora mismo. Vuelve a entrar en un momento
            o escríbenos desde Contacto y soporte.
          </p>
        )}

        {!loading && status && (
          <>
            <div className="rounded-lg border-2 bg-muted/40 p-6">
              <p className="text-3xl font-bold tabular-nums">
                {status.remaining}
                <span className="ml-2 text-base font-normal text-muted-foreground">
                  {status.remaining === 1 ? 'imagen disponible' : 'imágenes disponibles'}
                </span>
              </p>

              <dl className="mt-4 grid grid-cols-1 gap-2 text-sm sm:grid-cols-3">
                <div>
                  <dt className="text-muted-foreground">De tu cuota mensual</dt>
                  <dd className="font-medium tabular-nums">
                    {status.monthlyLeft} de {status.monthLimit}
                  </dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">Comprados en packs</dt>
                  <dd className="font-medium tabular-nums">{status.packBalance}</dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">Hoy llevas</dt>
                  <dd className="font-medium tabular-nums">
                    {status.dayUsed} de {status.dayLimit}
                  </dd>
                </div>
              </dl>

              {status.shared && (
                <p className="mt-4 flex items-start gap-2 text-sm text-muted-foreground">
                  <Users className="mt-0.5 h-4 w-4 flex-shrink-0" />
                  Esta bolsa es del plan Equipo: la compartís entre todas las plazas de la
                  farmacia.
                </p>
              )}

              <div className="mt-4">
                <Button asChild variant="outline" className="rounded-full">
                  <Link to="/asistente-creativo">Ir a IAFarma</Link>
                </Button>
              </div>
            </div>

            <div>
              <h4 className="mb-3 font-medium">Recargar</h4>
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
                {IMAGE_ADDONS.map((pack) => (
                  <button
                    key={pack.credits}
                    type="button"
                    onClick={() => handleBuy(pack.credits)}
                    disabled={buying !== null}
                    className="flex items-center justify-between rounded-lg border border-border bg-card px-4 py-3 transition-colors hover:border-primary hover:bg-primary/5 disabled:opacity-60"
                  >
                    <span className="text-sm font-medium tabular-nums">
                      {pack.credits} créditos
                    </span>
                    <span className="text-sm font-semibold tabular-nums text-primary">
                      {buying === pack.credits ? 'Abriendo…' : formatPrice(pack.price)}
                    </span>
                  </button>
                ))}
              </div>
              <p className="pt-2 text-xs text-muted-foreground">
                Pago único, sin suscripción. Se suman a tu cuota mensual.
              </p>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
};
