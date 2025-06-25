
import { useState } from 'react';
import { SettingsSection } from './SettingsSection';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { FileText, Shield, Zap, Database } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface TechnicalConfig {
  file_config: {
    max_upload_size: number;
    allowed_types: string[];
    storage_provider: string;
  };
  security_config: {
    min_password_length: number;
    session_timeout: number;
    max_login_attempts: number;
  };
  integrations: {
    google_analytics: string;
    webhooks: string[];
  };
}

interface TechnicalSettingsProps {
  config: TechnicalConfig;
  onSave: (config: TechnicalConfig) => void;
}

export const TechnicalSettings = ({ config, onSave }: TechnicalSettingsProps) => {
  const [formData, setFormData] = useState(config);
  const { toast } = useToast();

  const handleSave = () => {
    onSave(formData);
    toast({
      title: "Configuración guardada",
      description: "La configuración técnica se ha actualizado correctamente",
    });
  };

  const formatFileSize = (bytes: number) => {
    return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
  };

  return (
    <div className="space-y-6">
      <SettingsSection
        title="Configuración de Archivos"
        description="Límites de subida y tipos permitidos"
        icon={<FileText className="h-5 w-5 text-blue-600" />}
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="max-upload">Tamaño máximo de subida (bytes)</Label>
            <Input
              id="max-upload"
              type="number"
              value={formData.file_config.max_upload_size}
              onChange={(e) =>
                setFormData(prev => ({
                  ...prev,
                  file_config: { ...prev.file_config, max_upload_size: parseInt(e.target.value) }
                }))
              }
            />
            <p className="text-sm text-gray-500 mt-1">
              Actual: {formatFileSize(formData.file_config.max_upload_size)}
            </p>
          </div>
          <div>
            <Label htmlFor="storage-provider">Proveedor de almacenamiento</Label>
            <Input
              id="storage-provider"
              value={formData.file_config.storage_provider}
              onChange={(e) =>
                setFormData(prev => ({
                  ...prev,
                  file_config: { ...prev.file_config, storage_provider: e.target.value }
                }))
              }
            />
          </div>
        </div>
        <div className="mt-4">
          <Label htmlFor="allowed-types">Tipos de archivo permitidos (separados por coma)</Label>
          <Input
            id="allowed-types"
            value={formData.file_config.allowed_types.join(', ')}
            onChange={(e) =>
              setFormData(prev => ({
                ...prev,
                file_config: { 
                  ...prev.file_config, 
                  allowed_types: e.target.value.split(',').map(type => type.trim()) 
                }
              }))
            }
          />
        </div>
      </SettingsSection>

      <SettingsSection
        title="Configuración de Seguridad"
        description="Políticas de contraseñas y sesiones"
        icon={<Shield className="h-5 w-5 text-blue-600" />}
      >
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <Label htmlFor="min-password">Longitud mínima de contraseña</Label>
            <Input
              id="min-password"
              type="number"
              min="6"
              max="50"
              value={formData.security_config.min_password_length}
              onChange={(e) =>
                setFormData(prev => ({
                  ...prev,
                  security_config: { ...prev.security_config, min_password_length: parseInt(e.target.value) }
                }))
              }
            />
          </div>
          <div>
            <Label htmlFor="session-timeout">Timeout de sesión (segundos)</Label>
            <Input
              id="session-timeout"
              type="number"
              value={formData.security_config.session_timeout}
              onChange={(e) =>
                setFormData(prev => ({
                  ...prev,
                  security_config: { ...prev.security_config, session_timeout: parseInt(e.target.value) }
                }))
              }
            />
          </div>
          <div>
            <Label htmlFor="max-attempts">Máximos intentos de login</Label>
            <Input
              id="max-attempts"
              type="number"
              min="1"
              max="10"
              value={formData.security_config.max_login_attempts}
              onChange={(e) =>
                setFormData(prev => ({
                  ...prev,
                  security_config: { ...prev.security_config, max_login_attempts: parseInt(e.target.value) }
                }))
              }
            />
          </div>
        </div>
      </SettingsSection>

      <SettingsSection
        title="Integraciones Externas"
        description="APIs externas, webhooks y servicios de terceros"
        icon={<Zap className="h-5 w-5 text-blue-600" />}
      >
        <div className="space-y-4">
          <div>
            <Label htmlFor="google-analytics">Google Analytics ID</Label>
            <Input
              id="google-analytics"
              placeholder="GA-XXXXXXXXX-X"
              value={formData.integrations.google_analytics}
              onChange={(e) =>
                setFormData(prev => ({
                  ...prev,
                  integrations: { ...prev.integrations, google_analytics: e.target.value }
                }))
              }
            />
          </div>
          <div>
            <Label htmlFor="webhooks">Webhooks (uno por línea)</Label>
            <Textarea
              id="webhooks"
              rows={4}
              placeholder="https://ejemplo.com/webhook1&#10;https://ejemplo.com/webhook2"
              value={formData.integrations.webhooks.join('\n')}
              onChange={(e) =>
                setFormData(prev => ({
                  ...prev,
                  integrations: { 
                    ...prev.integrations, 
                    webhooks: e.target.value.split('\n').filter(url => url.trim() !== '') 
                  }
                }))
              }
            />
          </div>
        </div>
      </SettingsSection>

      <div className="flex justify-end">
        <Button onClick={handleSave} size="lg">
          Guardar Configuración Técnica
        </Button>
      </div>
    </div>
  );
};
