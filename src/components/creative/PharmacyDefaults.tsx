import { Check, Store } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { IAFarmaDefaults } from '@/hooks/useIAFarmaDefaults';

const TONE_OPTIONS = ['Cercano y profesional', 'Divertido', 'Serio/científico'];

interface PharmacyDefaultsProps {
  defaults: IAFarmaDefaults;
  onChange: (key: keyof IAFarmaDefaults, value: string) => void;
}

export const PharmacyDefaults = ({ defaults, onChange }: PharmacyDefaultsProps) => {
  const { toast } = useToast();

  const handleSave = () => {
    toast({
      title: 'Datos guardados',
      description: 'IAFarma los usará por defecto en cada generación.',
    });
  };

  return (
    <section className="rounded-xl bg-green-50/60 ring-1 ring-green-100 p-5">
      <div className="flex items-center gap-2 mb-1">
        <Store className="h-4 w-4 text-green-600" />
        <h2 className="text-sm font-semibold text-gray-800">Datos de tu farmacia</h2>
      </div>
      <p className="text-xs text-gray-500 mb-4">
        Se rellenan solos en cada contenido. Edítalos cuando quieras: se guardan en este navegador.
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">Nombre de la farmacia</label>
          <Input
            value={defaults.farmacia}
            onChange={e => onChange('farmacia', e.target.value)}
            placeholder="Farmacia..."
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">Localidad</label>
          <Input
            value={defaults.localidad}
            onChange={e => onChange('localidad', e.target.value)}
            placeholder="Ciudad o pueblo..."
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">Tono de comunicación</label>
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
          className="text-green-700 hover:text-green-800 hover:bg-green-100"
        >
          <Check className="h-3.5 w-3.5 mr-1.5" />
          Guardar como predeterminado
        </Button>
      </div>
    </section>
  );
};
