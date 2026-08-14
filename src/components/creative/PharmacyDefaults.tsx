import { useState } from 'react';
import { Check, Store } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { IAFarmaDefaults } from '@/hooks/useIAFarmaDefaults';

const TONE_OPTIONS = ['Cercano y profesional', 'Divertido', 'Serio/científico'];

interface PharmacyDefaultsProps {
  defaults: IAFarmaDefaults;
  onChange: (key: keyof IAFarmaDefaults, value: string) => void;
}

export const PharmacyDefaults = ({ defaults, onChange }: PharmacyDefaultsProps) => {
  const { toast } = useToast();
  const { user, reloadProfile } = useAuth();
  const [saving, setSaving] = useState(false);

  // Guarda los datos en el PERFIL (profiles), no solo en este navegador: así
  // IAFarma los recuerda en cualquier dispositivo. La v1 tenía un botón que
  // solo mostraba un toast sin guardar nada.
  const handleSave = async () => {
    if (!user || saving) return;
    setSaving(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          pharmacy_name: defaults.farmacia.trim() || null,
          pharmacy_city: defaults.localidad.trim() || null,
          iafarma_tone: defaults.tono || null,
        })
        .eq('id', user.id);
      if (error) throw error;
      await reloadProfile();
      toast({
        title: 'Guardado en tu perfil',
        description: 'IAFarma usará estos datos en todos tus dispositivos.',
      });
    } catch (err) {
      console.error('Error saving IAFarma defaults to profile:', err);
      toast({
        title: 'No se pudo guardar',
        description: 'Los datos siguen activos en este navegador. Inténtalo de nuevo.',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <section className="rounded-lg bg-ciruela-soft/60 ring-1 ring-ciruela/20 p-5">
      <div className="flex items-center gap-2 mb-1">
        <Store className="h-4 w-4 text-ciruela" />
        <h2 className="text-sm font-semibold text-foreground">Datos de tu farmacia</h2>
      </div>
      <p className="text-xs text-muted-foreground mb-4">
        Se rellenan desde tu perfil la primera vez. Edítalos si quieres algo distinto para tus
        piezas; con "Guardar en mi perfil" quedan fijados para todos tus dispositivos.
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div>
          <label className="block text-xs font-medium text-muted-foreground mb-1">Nombre de la farmacia</label>
          <Input
            value={defaults.farmacia}
            onChange={e => onChange('farmacia', e.target.value)}
            placeholder="Farmacia..."
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-muted-foreground mb-1">Localidad</label>
          <Input
            value={defaults.localidad}
            onChange={e => onChange('localidad', e.target.value)}
            placeholder="Ciudad o pueblo..."
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-muted-foreground mb-1">Tono de comunicación</label>
          <Select value={defaults.tono || ''} onValueChange={v => onChange('tono', v)}>
            <SelectTrigger>
              <SelectValue placeholder="Seleccionar..." />
            </SelectTrigger>
            <SelectContent>
              {TONE_OPTIONS.map(o => (
                <SelectItem key={o} value={o}>{o}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="flex justify-end mt-3">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={handleSave}
          disabled={saving}
          className="text-ciruela hover:text-ciruela hover:bg-ciruela-soft"
        >
          <Check className="h-3.5 w-3.5 mr-1.5" />
          {saving ? 'Guardando...' : 'Guardar en mi perfil'}
        </Button>
      </div>
    </section>
  );
};
