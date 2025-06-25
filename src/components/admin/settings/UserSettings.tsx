
import { useState } from 'react';
import { SettingsSection } from './SettingsSection';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Users, UserCheck, Trophy } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface UserConfig {
  registration_config: {
    email_verification: boolean;
    manual_moderation: boolean;
    required_fields: string[];
  };
  subscription_limits: {
    freemium: {
      courses: number;
      resources: number;
    };
    premium: {
      courses: number;
      resources: number;
    };
  };
  points_config: {
    points_per_course: number;
    points_per_resource: number;
    level_threshold: number;
  };
}

interface UserSettingsProps {
  config: UserConfig;
  onSave: (config: UserConfig) => void;
}

export const UserSettings = ({ config, onSave }: UserSettingsProps) => {
  const [formData, setFormData] = useState(config);
  const { toast } = useToast();

  const handleSave = () => {
    onSave(formData);
    toast({
      title: "Configuración guardada",
      description: "La configuración de usuarios se ha actualizado correctamente",
    });
  };

  return (
    <div className="space-y-6">
      <SettingsSection
        title="Configuración de Registro"
        description="Campos obligatorios y verificación de usuarios"
        icon={<Users className="h-5 w-5 text-blue-600" />}
      >
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <Label>Verificación de Email</Label>
              <p className="text-sm text-gray-500">Requerir verificación de email al registrarse</p>
            </div>
            <Switch
              checked={formData.registration_config.email_verification}
              onCheckedChange={(checked) =>
                setFormData(prev => ({
                  ...prev,
                  registration_config: { ...prev.registration_config, email_verification: checked }
                }))
              }
            />
          </div>
          <div className="flex items-center justify-between">
            <div>
              <Label>Moderación Manual</Label>
              <p className="text-sm text-gray-500">Los registros requieren aprobación manual</p>
            </div>
            <Switch
              checked={formData.registration_config.manual_moderation}
              onCheckedChange={(checked) =>
                setFormData(prev => ({
                  ...prev,
                  registration_config: { ...prev.registration_config, manual_moderation: checked }
                }))
              }
            />
          </div>
        </div>
      </SettingsSection>

      <SettingsSection
        title="Límites de Suscripción"
        description="Configurar límites por tipo de suscripción"
        icon={<UserCheck className="h-5 w-5 text-blue-600" />}
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h4 className="font-medium mb-3">Plan Freemium</h4>
            <div className="space-y-3">
              <div>
                <Label htmlFor="freemium-courses">Cursos máximos</Label>
                <Input
                  id="freemium-courses"
                  type="number"
                  value={formData.subscription_limits.freemium.courses}
                  onChange={(e) =>
                    setFormData(prev => ({
                      ...prev,
                      subscription_limits: {
                        ...prev.subscription_limits,
                        freemium: { ...prev.subscription_limits.freemium, courses: parseInt(e.target.value) }
                      }
                    }))
                  }
                />
              </div>
              <div>
                <Label htmlFor="freemium-resources">Recursos máximos</Label>
                <Input
                  id="freemium-resources"
                  type="number"
                  value={formData.subscription_limits.freemium.resources}
                  onChange={(e) =>
                    setFormData(prev => ({
                      ...prev,
                      subscription_limits: {
                        ...prev.subscription_limits,
                        freemium: { ...prev.subscription_limits.freemium, resources: parseInt(e.target.value) }
                      }
                    }))
                  }
                />
              </div>
            </div>
          </div>
          <div>
            <h4 className="font-medium mb-3">Plan Premium</h4>
            <div className="space-y-3">
              <div>
                <Label htmlFor="premium-courses">Cursos máximos (-1 = ilimitado)</Label>
                <Input
                  id="premium-courses"
                  type="number"
                  value={formData.subscription_limits.premium.courses}
                  onChange={(e) =>
                    setFormData(prev => ({
                      ...prev,
                      subscription_limits: {
                        ...prev.subscription_limits,
                        premium: { ...prev.subscription_limits.premium, courses: parseInt(e.target.value) }
                      }
                    }))
                  }
                />
              </div>
              <div>
                <Label htmlFor="premium-resources">Recursos máximos (-1 = ilimitado)</Label>
                <Input
                  id="premium-resources"
                  type="number"
                  value={formData.subscription_limits.premium.resources}
                  onChange={(e) =>
                    setFormData(prev => ({
                      ...prev,
                      subscription_limits: {
                        ...prev.subscription_limits,
                        premium: { ...prev.subscription_limits.premium, resources: parseInt(e.target.value) }
                      }
                    }))
                  }
                />
              </div>
            </div>
          </div>
        </div>
      </SettingsSection>

      <SettingsSection
        title="Sistema de Puntos"
        description="Configurar puntos, conversiones y niveles"
        icon={<Trophy className="h-5 w-5 text-blue-600" />}
      >
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <Label htmlFor="points-course">Puntos por curso completado</Label>
            <Input
              id="points-course"
              type="number"
              value={formData.points_config.points_per_course}
              onChange={(e) =>
                setFormData(prev => ({
                  ...prev,
                  points_config: { ...prev.points_config, points_per_course: parseInt(e.target.value) }
                }))
              }
            />
          </div>
          <div>
            <Label htmlFor="points-resource">Puntos por recurso descargado</Label>
            <Input
              id="points-resource"
              type="number"
              value={formData.points_config.points_per_resource}
              onChange={(e) =>
                setFormData(prev => ({
                  ...prev,
                  points_config: { ...prev.points_config, points_per_resource: parseInt(e.target.value) }
                }))
              }
            />
          </div>
          <div>
            <Label htmlFor="level-threshold">Puntos por nivel</Label>
            <Input
              id="level-threshold"
              type="number"
              value={formData.points_config.level_threshold}
              onChange={(e) =>
                setFormData(prev => ({
                  ...prev,
                  points_config: { ...prev.points_config, level_threshold: parseInt(e.target.value) }
                }))
              }
            />
          </div>
        </div>
      </SettingsSection>

      <div className="flex justify-end">
        <Button onClick={handleSave} size="lg">
          Guardar Configuración de Usuarios
        </Button>
      </div>
    </div>
  );
};
