
import { useState } from 'react';
import { SettingsSection } from './SettingsSection';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Globe, Scale, Cookie } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface RegionalConfig {
  localization: {
    default_language: string;
    timezone: string;
    date_format: string;
  };
  legal_config: {
    privacy_policy_url: string;
    terms_url: string;
    cookies_url: string;
  };
}

interface RegionalSettingsProps {
  config: RegionalConfig;
  onSave: (config: RegionalConfig) => void;
}

export const RegionalSettings = ({ config, onSave }: RegionalSettingsProps) => {
  const [formData, setFormData] = useState(config);
  const { toast } = useToast();

  const handleSave = () => {
    onSave(formData);
    toast({
      title: "Configuración guardada",
      description: "La configuración regional se ha actualizado correctamente",
    });
  };

  const languages = [
    { value: 'es', label: 'Español' },
    { value: 'en', label: 'English' },
    { value: 'fr', label: 'Français' },
    { value: 'pt', label: 'Português' }
  ];

  const timezones = [
    { value: 'Europe/Madrid', label: 'Madrid (GMT+1)' },
    { value: 'Europe/London', label: 'Londres (GMT+0)' },
    { value: 'America/New_York', label: 'Nueva York (GMT-5)' },
    { value: 'America/Los_Angeles', label: 'Los Ángeles (GMT-8)' }
  ];

  const dateFormats = [
    { value: 'DD/MM/YYYY', label: 'DD/MM/YYYY (25/12/2023)' },
    { value: 'MM/DD/YYYY', label: 'MM/DD/YYYY (12/25/2023)' },
    { value: 'YYYY-MM-DD', label: 'YYYY-MM-DD (2023-12-25)' },
    { value: 'DD-MM-YYYY', label: 'DD-MM-YYYY (25-12-2023)' }
  ];

  return (
    <div className="space-y-6">
      <SettingsSection
        title="Idioma y Localización"
        description="Configurar idiomas, zona horaria y formatos"
        icon={<Globe className="h-5 w-5 text-blue-600" />}
      >
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <Label htmlFor="language">Idioma por defecto</Label>
            <Select
              value={formData.localization.default_language}
              onValueChange={(value) =>
                setFormData(prev => ({
                  ...prev,
                  localization: { ...prev.localization, default_language: value }
                }))
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Seleccionar idioma" />
              </SelectTrigger>
              <SelectContent>
                {languages.map((lang) => (
                  <SelectItem key={lang.value} value={lang.value}>
                    {lang.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label htmlFor="timezone">Zona horaria</Label>
            <Select
              value={formData.localization.timezone}
              onValueChange={(value) =>
                setFormData(prev => ({
                  ...prev,
                  localization: { ...prev.localization, timezone: value }
                }))
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Seleccionar zona horaria" />
              </SelectTrigger>
              <SelectContent>
                {timezones.map((tz) => (
                  <SelectItem key={tz.value} value={tz.value}>
                    {tz.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label htmlFor="date-format">Formato de fecha</Label>
            <Select
              value={formData.localization.date_format}
              onValueChange={(value) =>
                setFormData(prev => ({
                  ...prev,
                  localization: { ...prev.localization, date_format: value }
                }))
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Seleccionar formato" />
              </SelectTrigger>
              <SelectContent>
                {dateFormats.map((format) => (
                  <SelectItem key={format.value} value={format.value}>
                    {format.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </SettingsSection>

      <SettingsSection
        title="Configuración Legal"
        description="Enlaces a políticas, términos y avisos legales"
        icon={<Scale className="h-5 w-5 text-blue-600" />}
      >
        <div className="space-y-4">
          <div>
            <Label htmlFor="privacy-policy">URL de Política de Privacidad</Label>
            <Input
              id="privacy-policy"
              value={formData.legal_config.privacy_policy_url}
              onChange={(e) =>
                setFormData(prev => ({
                  ...prev,
                  legal_config: { ...prev.legal_config, privacy_policy_url: e.target.value }
                }))
              }
            />
          </div>
          <div>
            <Label htmlFor="terms-url">URL de Términos y Condiciones</Label>
            <Input
              id="terms-url"
              value={formData.legal_config.terms_url}
              onChange={(e) =>
                setFormData(prev => ({
                  ...prev,
                  legal_config: { ...prev.legal_config, terms_url: e.target.value }
                }))
              }
            />
          </div>
          <div>
            <Label htmlFor="cookies-url">URL de Política de Cookies</Label>
            <Input
              id="cookies-url"
              value={formData.legal_config.cookies_url}
              onChange={(e) =>
                setFormData(prev => ({
                  ...prev,
                  legal_config: { ...prev.legal_config, cookies_url: e.target.value }
                }))
              }
            />
          </div>
        </div>
      </SettingsSection>

      <div className="flex justify-end">
        <Button onClick={handleSave} size="lg">
          Guardar Configuración Regional
        </Button>
      </div>
    </div>
  );
};
