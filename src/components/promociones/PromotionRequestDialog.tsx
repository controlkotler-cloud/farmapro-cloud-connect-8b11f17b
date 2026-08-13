import { useState } from 'react';
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';

const CONSENT_VERSION = 'promo-cesion-v1';
const COPIA_INTERNA = 'control@mkpro.es';

interface PromotionLite {
  id: string;
  title: string;
  company_name: string;
  partner_email: string | null;
}

interface Props {
  promotion: PromotionLite | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const PromotionRequestDialog = ({ promotion, open, onOpenChange }: Props) => {
  const { toast } = useToast();
  const { user, profile } = useAuth();
  const [telefono, setTelefono] = useState('');
  const [mensaje, setMensaje] = useState('');
  const [consent, setConsent] = useState(false);
  const [sending, setSending] = useState(false);

  if (!promotion) return null;

  const empresa = promotion.company_name || 'el partner';
  const nombre = (profile?.full_name || '').trim();
  const email = (profile?.email || user?.email || '').trim();
  const farmacia = (profile?.pharmacy_name || '').trim();
  const ciudad = (profile?.pharmacy_city || '').trim();

  const reset = () => {
    setTelefono('');
    setMensaje('');
    setConsent(false);
  };

  const handleClose = (next: boolean) => {
    if (!next) reset();
    onOpenChange(next);
  };

  const handleSubmit = async () => {
    if (!user || !consent || !promotion.partner_email) return;
    setSending(true);
    try {
      const { data: refData, error: refError } = await supabase.rpc('next_promotion_reference');
      if (refError) throw refError;
      const referencia = String(refData ?? '');

      const { error: insertError } = await supabase.from('promotion_requests').insert({
        promotion_id: promotion.id,
        user_id: user.id,
        referencia,
        nombre: nombre || email,
        email,
        farmacia: farmacia || null,
        ciudad: ciudad || null,
        telefono: telefono.trim() || null,
        mensaje: mensaje.trim() || null,
        consent_texto_version: CONSENT_VERSION,
        partner_email: promotion.partner_email,
        estado: 'enviada',
      });

      if (insertError) {
        console.error('Error guardando la solicitud:', insertError);
        toast({
          title: 'No hemos podido enviar la solicitud',
          description: 'Vuelve a intentarlo en un momento.',
          variant: 'destructive',
        });
        return;
      }

      const partnerData = {
        referencia,
        promocionTitulo: promotion.title,
        companyName: promotion.company_name,
        solicitanteNombre: nombre,
        solicitanteEmail: email,
        solicitanteFarmacia: farmacia,
        solicitanteCiudad: ciudad,
        solicitanteTelefono: telefono.trim(),
        mensaje: mensaje.trim(),
      };

      const results = await Promise.all([
        supabase.functions.invoke('send-portal-email', {
          body: { template: 'promocion-solicitud-partner', to: promotion.partner_email, data: partnerData },
        }),
        supabase.functions.invoke('send-portal-email', {
          body: {
            template: 'promocion-solicitud-usuario',
            to: email,
            data: { ...partnerData, nombre },
          },
        }),
        supabase.functions.invoke('send-portal-email', {
          body: { template: 'promocion-solicitud-partner', to: COPIA_INTERNA, data: partnerData },
        }),
      ]);

      const emailFailed = results.some((r) => r.error);

      if (emailFailed) {
        await supabase
          .from('promotion_requests')
          .update({ estado: 'error_envio' })
          .eq('referencia', referencia);
        toast({
          title: 'Hemos recibido tu solicitud',
          description: `El aviso automático no ha salido, así que la gestionamos nosotros. Tu referencia es ${referencia}.`,
        });
      } else {
        toast({
          title: 'Solicitud enviada',
          description: `Solicitud enviada. Tu referencia es ${referencia}.`,
        });
      }

      handleClose(false);
    } catch (err) {
      console.error('Error en la solicitud de promoción:', err);
      toast({
        title: 'No hemos podido enviar la solicitud',
        description: 'Vuelve a intentarlo en un momento.',
        variant: 'destructive',
      });
    } finally {
      setSending(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Solicitar: {promotion.title}</DialogTitle>
          <DialogDescription>{empresa}</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="rounded-lg bg-brand-soft p-4">
            <p className="text-sm font-bold text-foreground">Qué se comparte con {empresa}</p>
            <dl className="mt-3 space-y-1.5 text-sm">
              <div className="flex gap-2">
                <dt className="w-24 flex-none text-muted-foreground">Nombre</dt>
                <dd className="text-foreground">{nombre || 'Sin indicar'}</dd>
              </div>
              <div className="flex gap-2">
                <dt className="w-24 flex-none text-muted-foreground">Farmacia</dt>
                <dd className="text-foreground">{farmacia || 'Sin indicar'}</dd>
              </div>
              <div className="flex gap-2">
                <dt className="w-24 flex-none text-muted-foreground">Ciudad</dt>
                <dd className="text-foreground">{ciudad || 'Sin indicar'}</dd>
              </div>
              <div className="flex gap-2">
                <dt className="w-24 flex-none text-muted-foreground">Correo</dt>
                <dd className="break-all text-foreground">{email || 'Sin indicar'}</dd>
              </div>
            </dl>
          </div>

          <div>
            <Label htmlFor="promo-telefono">Teléfono (opcional)</Label>
            <Input
              id="promo-telefono"
              type="tel"
              value={telefono}
              maxLength={30}
              onChange={(e) => setTelefono(e.target.value)}
            />
            <p className="mt-1.5 text-xs text-muted-foreground">Solo si prefieres que te llamen.</p>
          </div>

          <div>
            <Label htmlFor="promo-mensaje">Mensaje (opcional)</Label>
            <Textarea
              id="promo-mensaje"
              rows={3}
              value={mensaje}
              maxLength={1000}
              onChange={(e) => setMensaje(e.target.value)}
              placeholder="¿Algo que quieras contarles? Por ejemplo, qué necesitas o para cuándo."
            />
          </div>

          <div className="flex items-start gap-3">
            <Checkbox
              id="promo-consent"
              checked={consent}
              onCheckedChange={(v) => setConsent(v === true)}
              className="mt-0.5"
            />
            <Label htmlFor="promo-consent" className="text-sm font-normal leading-relaxed text-muted-foreground">
              Autorizo a farmapro a enviar mis datos de contacto a {empresa} para gestionar esta
              solicitud. Puedo revocarlo escribiendo a entra@farmapro.es.
            </Label>
          </div>
        </div>

        <DialogFooter className="gap-2 sm:gap-2">
          <Button variant="outline" className="rounded-full" onClick={() => handleClose(false)} disabled={sending}>
            Cancelar
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={!consent || sending}
            className="rounded-full bg-brand-dark px-5 text-sm font-bold text-white hover:bg-brand-dark"
          >
            {sending ? 'Enviando...' : 'Enviar solicitud'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
