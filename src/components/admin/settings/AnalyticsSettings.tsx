
import { useState } from 'react';
import { SettingsSection } from './SettingsSection';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { BarChart3, FileBarChart, Settings } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface AnalyticsConfig {
  google_analytics: {
    tracking_id: string;
    enabled: boolean;
  };
  reports_config: {
    frequency: string;
    recipients: string[];
    metrics: string[];
  };
}

interface AnalyticsSettingsProps {
  config: AnalyticsConfig;
  onSave: (config: AnalyticsConfig) => void;
}

export const AnalyticsSettings = ({ config, onSave }: AnalyticsSettingsProps) => {
  const [formData, setFormData] = useState(config);
  const { toast } = useToast();

  const handleSave = () => {
    onSave(formData);
    toast({
      title: "Configuración guardada",
      description: "La configuración de análisis se ha actualizado correctamente",
    });
  };

  const availableMetrics = [
    'users', 'courses', 'resources', 'engagement', 'subscriptions', 'events', 'forum_activity'
  ];

  return (
    <div className="space-y-6">
      <SettingsSection
        title="Google Analytics"
        description="Configurar tracking y objetivos"
        icon={<BarChart3 className="h-5 w-5 text-blue-600" />}
      >
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <Label>Habilitar Google Analytics</Label>
              <p className="text-sm text-gray-500">Activar tracking de Google Analytics</p>
            </div>
            <Switch
              checked={formData.google_analytics.enabled}
              onCheckedChange={(checked) =>
                setFormData(prev => ({
                  ...prev,
                  google_analytics: { ...prev.google_analytics, enabled: checked }
                }))
              }
            />
          </div>
          <div>
            <Label htmlFor="tracking-id">ID de Seguimiento</Label>
            <Input
              id="tracking-id"
              placeholder="G-XXXXXXXXXX"
              value={formData.google_analytics.tracking_id}
              onChange={(e) =>
                setFormData(prev => ({
                  ...prev,
                  google_analytics: { ...prev.google_analytics, tracking_id: e.target.value }
                }))
              }
            />
          </div>
        </div>
      </SettingsSection>

      <SettingsSection
        title="Reportes Automáticos"
        description="Configurar frecuencia, destinatarios y métricas"
        icon={<FileBarChart className="h-5 w-5 text-blue-600" />}
      >
        <div className="space-y-4">
          <div>
            <Label htmlFor="frequency">Frecuencia de reportes</Label>
            <Select
              value={formData.reports_config.frequency}
              onValueChange={(value) =>
                setFormData(prev => ({
                  ...prev,
                  reports_config: { ...prev.reports_config, frequency: value }
                }))
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Seleccionar frecuencia" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="daily">Diario</SelectItem>
                <SelectItem value="weekly">Semanal</SelectItem>
                <SelectItem value="monthly">Mensual</SelectItem>
                <SelectItem value="quarterly">Trimestral</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label htmlFor="recipients">Destinatarios (emails separados por coma)</Label>
            <Input
              id="recipients"
              placeholder="admin@farmapro.com, manager@farmapro.com"
              value={formData.reports_config.recipients.join(', ')}
              onChange={(e) =>
                setFormData(prev => ({
                  ...prev,
                  reports_config: { 
                    ...prev.reports_config, 
                    recipients: e.target.value.split(',').map(email => email.trim()).filter(email => email) 
                  }
                }))
              }
            />
          </div>
          <div>
            <Label>Métricas a incluir</Label>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mt-2">
              {availableMetrics.map((metric) => (
                <div key={metric} className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id={metric}
                    checked={formData.reports_config.metrics.includes(metric)}
                    onChange={(e) => {
                      const updatedMetrics = e.target.checked
                        ? [...formData.reports_config.metrics, metric]
                        : formData.reports_config.metrics.filter(m => m !== metric);
                      setFormData(prev => ({
                        ...prev,
                        reports_config: { ...prev.reports_config, metrics: updatedMetrics }
                      }));
                    }}
                    className="rounded border-gray-300"
                  />
                  <Label htmlFor={metric} className="text-sm capitalize">
                    {metric.replace('_', ' ')}
                  </Label>
                </div>
              ))}
            </div>
          </div>
        </div>
      </SettingsSection>

      <div className="flex justify-end">
        <Button onClick={handleSave} size="lg">
          Guardar Configuración de Análisis
        </Button>
      </div>
    </div>
  );
};
