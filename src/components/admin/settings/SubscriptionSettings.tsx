import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface SubscriptionSettingsData {
  validationMode: 'beta' | 'active';
  stripeStudentLink: string;
  stripeProfessionalLink: string;
  stripePremiumLink: string;
}

export function SubscriptionSettings() {
  const [settings, setSettings] = useState<SubscriptionSettingsData>({
    validationMode: 'beta',
    stripeStudentLink: '',
    stripeProfessionalLink: '',
    stripePremiumLink: ''
  });
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    setLoading(true);
    try {
      const { data } = await supabase
        .from('system_settings')
        .select('key, value')
        .in('key', [
          'validation_mode',
          'stripe_student_payment_link',
          'stripe_professional_payment_link',
          'stripe_premium_payment_link'
        ]);

      if (data) {
        const settingsMap: Record<string, any> = {};
        data.forEach(item => {
          settingsMap[item.key] = typeof item.value === 'string' ? JSON.parse(item.value) : item.value;
        });

        setSettings({
          validationMode: settingsMap.validation_mode || 'beta',
          stripeStudentLink: settingsMap.stripe_student_payment_link || '',
          stripeProfessionalLink: settingsMap.stripe_professional_payment_link || '',
          stripePremiumLink: settingsMap.stripe_premium_payment_link || ''
        });
      }
    } catch (error) {
      console.error('Error loading settings:', error);
      toast({
        title: "Error",
        description: "No se pudieron cargar las configuraciones",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const saveSettings = async () => {
    setSaving(true);
    try {
      const updates = [
        {
          key: 'validation_mode',
          value: JSON.stringify(settings.validationMode),
          category: 'subscription',
          description: 'Controls whether to validate subscriptions with Stripe (beta/active)'
        },
        {
          key: 'stripe_student_payment_link',
          value: JSON.stringify(settings.stripeStudentLink),
          category: 'subscription',
          description: 'Stripe Payment Link for Student plan'
        },
        {
          key: 'stripe_professional_payment_link',
          value: JSON.stringify(settings.stripeProfessionalLink),
          category: 'subscription',
          description: 'Stripe Payment Link for Professional plan'
        },
        {
          key: 'stripe_premium_payment_link',
          value: JSON.stringify(settings.stripePremiumLink),
          category: 'subscription',
          description: 'Stripe Payment Link for Premium plan'
        }
      ];

      for (const update of updates) {
        await supabase
          .from('system_settings')
          .upsert(update, { onConflict: 'key' });
      }

      toast({
        title: "Configuración guardada",
        description: "Los ajustes de suscripción se han actualizado correctamente",
      });
    } catch (error) {
      console.error('Error saving settings:', error);
      toast({
        title: "Error",
        description: "No se pudieron guardar las configuraciones",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="p-4">Cargando configuración...</div>;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Configuración de Suscripciones</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label>Modo de Validación</Label>
            <div className="text-sm text-muted-foreground">
              Beta: No valida con Stripe. Activo: Valida pagos reales con Stripe
            </div>
          </div>
          <Switch
            checked={settings.validationMode === 'active'}
            onCheckedChange={(checked) => 
              setSettings(prev => ({ 
                ...prev, 
                validationMode: checked ? 'active' : 'beta' 
              }))
            }
          />
        </div>

        <div className="space-y-4">
          <h4 className="font-medium">Enlaces de Pago de Stripe</h4>
          
          <div className="space-y-2">
            <Label htmlFor="student-link">Plan Estudiante</Label>
            <Input
              id="student-link"
              placeholder="https://buy.stripe.com/..."
              value={settings.stripeStudentLink}
              onChange={(e) => setSettings(prev => ({ 
                ...prev, 
                stripeStudentLink: e.target.value 
              }))}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="professional-link">Plan Profesional</Label>
            <Input
              id="professional-link"
              placeholder="https://buy.stripe.com/..."
              value={settings.stripeProfessionalLink}
              onChange={(e) => setSettings(prev => ({ 
                ...prev, 
                stripeProfessionalLink: e.target.value 
              }))}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="premium-link">Plan Premium</Label>
            <Input
              id="premium-link"
              placeholder="https://buy.stripe.com/..."
              value={settings.stripePremiumLink}
              onChange={(e) => setSettings(prev => ({ 
                ...prev, 
                stripePremiumLink: e.target.value 
              }))}
            />
          </div>
        </div>

        <Button onClick={saveSettings} disabled={saving}>
          {saving ? 'Guardando...' : 'Guardar Configuración'}
        </Button>
      </CardContent>
    </Card>
  );
}