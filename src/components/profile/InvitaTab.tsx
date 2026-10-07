import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Copy, MessageCircle } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { trackEvent } from '@/lib/analytics';

interface Invitada {
  inicial: string;
  desde: string;
  paga: boolean;
}

interface MyReferrals {
  code: string;
  altas: number;
  pagan: number;
  meses_ganados: number;
  invitadas: Invitada[];
}

const formatFecha = (iso: string) => {
  const d = new Date(iso);
  return Number.isNaN(d.getTime())
    ? ''
    : d.toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' });
};

export const InvitaTab = ({ code: profileCode }: { code: string | null }) => {
  const [data, setData] = useState<MyReferrals | null>(null);

  useEffect(() => {
    let active = true;
    supabase.rpc('my_referrals').then(({ data: res, error }) => {
      if (!active || error || !res) return;
      setData(res as unknown as MyReferrals);
    });
    return () => {
      active = false;
    };
  }, []);

  const code = data?.code ?? profileCode;
  const link = code
    ? `${window.location.origin}/login?modo=registro&inv=${code}`
    : '';

  const copiar = async () => {
    if (!link) return;
    try {
      await navigator.clipboard.writeText(link);
      toast.success('Enlace copiado');
      trackEvent('referral_share', { method: 'copy' });
    } catch {
      toast.error('No se ha podido copiar. Selecciona el enlace y cópialo a mano.');
    }
  };

  const whatsapp = () => {
    if (!link) return;
    const texto =
      `Hola, te paso el portal de farmapro, donde estoy formándome y compartiendo con otras compañeras de farmacia. ` +
      `Si te das de alta con mi enlace tienes 60 días de prueba gratis en lugar de 30: ${link}`;
    trackEvent('referral_share', { method: 'whatsapp' });
    window.open(`https://wa.me/?text=${encodeURIComponent(texto)}`, '_blank', 'noopener,noreferrer');
  };

  const stats = [
    { label: 'Altas', value: data?.altas ?? 0 },
    { label: 'Ya pagan', value: data?.pagan ?? 0 },
    { label: 'Meses ganados', value: data?.meses_ganados ?? 0 },
  ];

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="[text-wrap:balance]">Invita a otra farmacia</CardTitle>
          <p className="text-sm text-muted-foreground [text-wrap:pretty]">
            Quien se da de alta con tu enlace tiene 60 días de prueba gratis en lugar de 30. Cuando
            empiece a pagar, tú tienes un mes gratis.
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          {code ? (
            <>
              <div className="break-all rounded-md border border-border bg-muted px-3 py-2 text-sm text-foreground">
                {link}
              </div>
              <div className="flex flex-col gap-2 sm:flex-row">
                <Button onClick={copiar} variant="outline" className="gap-2">
                  <Copy className="h-4 w-4" />
                  Copiar enlace
                </Button>
                <Button onClick={whatsapp} className="gap-2">
                  <MessageCircle className="h-4 w-4" />
                  Compartir por WhatsApp
                </Button>
              </div>
            </>
          ) : (
            <p className="text-sm text-muted-foreground">Estamos preparando tu enlace.</p>
          )}
          <p className="text-xs text-muted-foreground">Puedes ganar hasta 12 meses al año.</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Tus invitaciones</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-3 gap-3 text-center">
            {stats.map((s) => (
              <div key={s.label} className="rounded-md border border-border bg-card px-2 py-3">
                <p className="text-2xl font-extrabold tabular-nums text-foreground">{s.value}</p>
                <p className="text-xs text-muted-foreground">{s.label}</p>
              </div>
            ))}
          </div>
          {data && data.invitadas?.length > 0 && (
            <ul className="divide-y divide-border rounded-md border border-border">
              {data.invitadas.map((i, idx) => (
                <li key={idx} className="flex items-center justify-between px-3 py-2 text-sm">
                  <span className="font-semibold text-foreground">{i.inicial}.</span>
                  <span className="text-muted-foreground">
                    {formatFecha(i.desde)}
                    {i.paga ? ' · ya paga' : ' · en prueba'}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
