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
  const { user, profile, reloadProfile } = useAuth();
  const [telefono, setTelefono] = useState('');
  const [mensaje, setMensaje] = useState('');
  const [consent, setConsent] = useState(false);
  const [sending, setSending] = useState(false);
  const [farmaciaInput, setFarmaciaInput] = useState('');
  const [ciudadInput, setCiudadInput] = useState('');

  if (!promotion) return null;

  const empresa = promotion.company_name || 'el partner';
  const nombre = (profile?.full_name || '').trim();
  const email = (profile?.email || user?.email || '').trim();
  const farmacia = (profile?.pharmacy_name || '').trim();
  const ciudad = (profile?.pharmacy_city || '').trim();

  const faltaFarmacia = !farmacia;
  const faltaCiudad = !ciudad;
  const farmaciaFinal = faltaFarmacia ? farmaciaInput.trim() : farmacia;
  const ciudadFinal = faltaCiudad ? ciudadInput.trim() : ciudad;
  const datosIncompletos = !farmaciaFinal || !ciudadFinal;

  const reset = () => {
    setTelefono('');
    setMensaje('');
    setConsent(false);
    setFarmaciaInput('');
    setCiudadInput('');
  };

  const handleClose = (next: boolean) => {
    if (!next) reset();
    onOpenChange(next);
  };

  const handleSubmit = async () => {
    if (!user || !consent || !promotion.partner_email || datosIncompletos) return;
    setSending(true);
    try {
      if (faltaFarmacia || faltaCiudad) {
        const { error: profileError } = await supabase
          .from('profiles')
          .update({
            ...(faltaFarmacia ? { pharmacy_name: farmaciaFinal } : {}),
            ...(faltaCiudad ? { pharmacy_city: ciudadFinal } : {}),
          } as any)
          .eq('id', user.id);

        if (profileError) {
          console.error('Error guardando los datos de la farmacia:', profileError);
          toast({
            title: 'No hemos podido guardar los datos de tu farmacia',
            description: 'Vuelve a intentarlo en un momento.',
            variant: 'destructive',
          });
          return;
        }

        await reloadProfile();
      }

      const { data, error } = await supabase.functions.invoke('request-promotion', {
        body: {
          promotion_id: promotion.id,
          telefono: telefono.trim(),
          mensaje: mensaje.trim(),
          consent: true,
        },
      });

      if (error || !data?.ok) {
        console.error('Error en la solicitud de promoción:', error, data);
        toast({
          title: 'No hemos podido enviar la solicitud',
          description: 'Vuelve a intentarlo en un momento o escríbenos a soporte@farmapro.es.',
          variant: 'destructive',
        });
        return;
      }

      if (data.duplicada) {
        toast({
          title: 'Ya habías solicitado esta oferta',
          description: `Tu solicitud sigue en curso con la referencia ${data.referencia}.`,
        });
      } else if (data.aviso_enviado === false) {
        toast({
          title: 'Hemos recibido tu solicitud',
          description: `El aviso automático no ha salido, así que la gestionamos nosotros. Tu referencia es ${data.referencia}.`,
        });
      } else {
        toast({
          title: 'Solicitud enviada',
          description: `Tu referencia es ${data.referencia}.`,
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
              {faltaFarmacia ? (
                <div>
                  <Label htmlFor="promo-farmacia">Nombre de la farmacia</Label>
                  <Input
                    id="promo-farmacia"
                    value={farmaciaInput}
                    maxLength={120}
                    onChange={(e) => setFarmaciaInput(e.target.value)}
                    className="mt-1 bg-background"
                  />
                  <p className="mt-1.5 text-xs text-muted-foreground">
                    Lo necesita el partner para atenderte. Lo guardamos en tu perfil.
                  </p>
                </div>
              ) : (
                <div className="flex gap-2">
                  <dt className="w-24 flex-none text-muted-foreground">Farmacia</dt>
                  <dd className="text-foreground">{farmacia}</dd>
                </div>
              )}
              {faltaCiudad ? (
                <div>
                  <Label htmlFor="promo-ciudad">Ciudad</Label>
                  <Input
                    id="promo-ciudad"
                    value={ciudadInput}
                    maxLength={120}
                    onChange={(e) => setCiudadInput(e.target.value)}
                    className="mt-1 bg-background"
                  />
                  <p className="mt-1.5 text-xs text-muted-foreground">
                    Lo necesita el partner para atenderte. Lo guardamos en tu perfil.
                  </p>
                </div>
              ) : (
                <div className="flex gap-2">
                  <dt className="w-24 flex-none text-muted-foreground">Ciudad</dt>
                  <dd className="text-foreground">{ciudad}</dd>
                </div>
              )}
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
            <div className="text-sm font-normal leading-relaxed text-muted-foreground">
              <Label htmlFor="promo-consent">
                Autorizo a farmapro (Mkpro Kotler SL) a comunicar a {empresa} mi nombre, el nombre y la ciudad de mi farmacia, mi correo electrónico y, si los he indicado, mi teléfono y mi mensaje, con la única finalidad de que atienda esta solicitud. A partir de ese envío, {empresa} tratará esos datos como responsable propio y bajo su propia política de privacidad. Puedo revocar esta autorización escribiendo a entra@farmapro.es, sin que ello afecte al envío ya realizado.
              </Label>
              <p className="mt-1.5 text-xs text-muted-foreground">
                Guardamos una copia de esta solicitud como prueba de tu autorización y te enviamos por correo el detalle de lo que se ha compartido.
              </p>
            </div>
          </div>
        </div>

        <DialogFooter className="gap-2 sm:gap-2">
          <Button variant="outline" className="rounded-full" onClick={() => handleClose(false)} disabled={sending}>
            Cancelar
          </Button>
          <Button
            variant="brand"
            size="pill"
            onClick={handleSubmit}
            disabled={!consent || sending || datosIncompletos}
          >
            {sending ? 'Enviando...' : 'Enviar solicitud'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
