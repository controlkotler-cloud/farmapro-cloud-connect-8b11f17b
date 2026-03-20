
import { useState } from 'react';
import { SettingsSection } from './SettingsSection';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { Building2, Mail, Bell } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface PlatformConfig {
  company_info: {
    name: string;
    description: string;
    contact_email: string;
  };
  email_config: {
    smtp_host: string;
    smtp_port: number;
    smtp_user: string;
    default_sender: string;
  };
  notifications_config: {
    push_enabled: boolean;
    email_enabled: boolean;
    sms_enabled: boolean;
  };
}

interface PlatformSettingsProps {
  config: PlatformConfig;
  onSave: (config: PlatformConfig) => void;
}

export const PlatformSettings = ({ config, onSave }: PlatformSettingsProps) => {
  const [formData, setFormData] = useState(config);
  const { toast } = useToast();

  const handleSave = () => {
    onSave(formData);
    toast({
      title: "Configuración guardada",
      description: "La configuración de la plataforma se ha actualizado correctamente",
    });
  };

  return (
    <div className="space-y-6">
      <SettingsSection
        title="Información de la Empresa"
        description="Datos básicos de la organización"
        icon={<Building2 className="h-5 w-5 text-blue-600" />}
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="company-name">Nombre de la empresa</Label>
            <Input
              id="company-name"
              value={formData.company_info.name}
              onChange={(e) =>
                setFormData(prev => ({
                  ...prev,
                  company_info: { ...prev.company_info, name: e.target.value }
                }))
              }
            />
          </div>
          <div>
            <Label htmlFor="contact-email">Email de contacto</Label>
            <Input
              id="contact-email"
              type="email"
              value={formData.company_info.contact_email}
              onChange={(e) =>
                setFormData(prev => ({
                  ...prev,
                  company_info: { ...prev.company_info, contact_email: e.target.value }
                }))
              }
            />
          </div>
        </div>
        <div className="mt-4">
          <Label htmlFor="company-description">Descripción</Label>
          <Textarea
            id="company-description"
            rows={3}
            value={formData.company_info.description}
            onChange={(e) =>
              setFormData(prev => ({
                ...prev,
                company_info: { ...prev.company_info, description: e.target.value }
              }))
            }
          />
        </div>
      </SettingsSection>

      <SettingsSection
        title="Configuración de Email"
        description="Configuración SMTP y remitente por defecto"
        icon={<Mail className="h-5 w-5 text-blue-600" />}
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="smtp-host">Servidor SMTP</Label>
            <Input
              id="smtp-host"
              value={formData.email_config.smtp_host}
              onChange={(e) =>
                setFormData(prev => ({
                  ...prev,
                  email_config: { ...prev.email_config, smtp_host: e.target.value }
                }))
              }
            />
          </div>
          <div>
            <Label htmlFor="smtp-port">Puerto SMTP</Label>
            <Input
              id="smtp-port"
              type="number"
              value={formData.email_config.smtp_port}
              onChange={(e) =>
                setFormData(prev => ({
                  ...prev,
                  email_config: { ...prev.email_config, smtp_port: parseInt(e.target.value) }
                }))
              }
            />
          </div>
          <div>
            <Label htmlFor="smtp-user">Usuario SMTP</Label>
            <Input
              id="smtp-user"
              value={formData.email_config.smtp_user}
              onChange={(e) =>
                setFormData(prev => ({
                  ...prev,
                  email_config: { ...prev.email_config, smtp_user: e.target.value }
                }))
              }
            />
          </div>
          <div>
            <Label htmlFor="default-sender">Remitente por defecto</Label>
            <Input
              id="default-sender"
              type="email"
              value={formData.email_config.default_sender}
              onChange={(e) =>
                setFormData(prev => ({
                  ...prev,
                  email_config: { ...prev.email_config, default_sender: e.target.value }
                }))
              }
            />
          </div>
        </div>
      </SettingsSection>

      <SettingsSection
        title="Configuración de Notificaciones"
        description="Activar/desactivar tipos de notificaciones"
        icon={<Bell className="h-5 w-5 text-blue-600" />}
      >
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <Label>Notificaciones Push</Label>
              <p className="text-sm text-gray-500">Enviar notificaciones push a los usuarios</p>
            </div>
            <Switch
              checked={formData.notifications_config.push_enabled}
              onCheckedChange={(checked) =>
                setFormData(prev => ({
                  ...prev,
                  notifications_config: { ...prev.notifications_config, push_enabled: checked }
                }))
              }
            />
          </div>
          <div className="flex items-center justify-between">
            <div>
              <Label>Notificaciones por Email</Label>
              <p className="text-sm text-gray-500">Enviar notificaciones por correo electrónico</p>
            </div>
            <Switch
              checked={formData.notifications_config.email_enabled}
              onCheckedChange={(checked) =>
                setFormData(prev => ({
                  ...prev,
                  notifications_config: { ...prev.notifications_config, email_enabled: checked }
                }))
              }
            />
          </div>
          <div className="flex items-center justify-between">
            <div>
              <Label>Notificaciones SMS</Label>
              <p className="text-sm text-gray-500">Enviar notificaciones por SMS</p>
            </div>
            <Switch
              checked={formData.notifications_config.sms_enabled}
              onCheckedChange={(checked) =>
                setFormData(prev => ({
                  ...prev,
                  notifications_config: { ...prev.notifications_config, sms_enabled: checked }
                }))
              }
            />
          </div>
        </div>
      </SettingsSection>

      <div className="flex justify-end">
        <Button onClick={handleSave} size="lg">
          Guardar Configuración de Plataforma
        </Button>
      </div>
    </div>
  );
};
