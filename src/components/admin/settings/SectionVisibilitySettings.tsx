import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Eye, EyeOff, Briefcase, Building } from 'lucide-react';

interface SectionVisibilitySettingsProps {
  config: {
    empleo_visible: boolean;
    farmacias_visible: boolean;
  };
  onSave: (config: any) => Promise<void>;
}

export const SectionVisibilitySettings = ({ config, onSave }: SectionVisibilitySettingsProps) => {
  const handleToggle = async (section: string, value: boolean) => {
    const newConfig = {
      ...config,
      [section]: value
    };
    await onSave(newConfig);
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Eye className="h-5 w-5" />
            Control de Visibilidad de Secciones
          </CardTitle>
          <CardDescription>
            Controla qué secciones son visibles para los usuarios públicos. Las secciones deshabilitadas no aparecerán en el menú lateral.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-gradient-to-r from-indigo-500 to-indigo-600">
                  <Briefcase className="h-5 w-5 text-white" />
                </div>
                <div>
                  <Label htmlFor="empleo-visible" className="text-base font-medium">
                    Sección Empleo
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    Ofertas de trabajo y oportunidades laborales
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {config.empleo_visible ? (
                  <Eye className="h-4 w-4 text-green-600" />
                ) : (
                  <EyeOff className="h-4 w-4 text-red-600" />
                )}
                <Switch
                  id="empleo-visible"
                  checked={config.empleo_visible}
                  onCheckedChange={(checked) => handleToggle('empleo_visible', checked)}
                />
              </div>
            </div>

            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-gradient-to-r from-teal-500 to-teal-600">
                  <Building className="h-5 w-5 text-white" />
                </div>
                <div>
                  <Label htmlFor="farmacias-visible" className="text-base font-medium">
                    Sección Farmacias
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    Farmacia en venta y traspasos
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {config.farmacias_visible ? (
                  <Eye className="h-4 w-4 text-green-600" />
                ) : (
                  <EyeOff className="h-4 w-4 text-red-600" />
                )}
                <Switch
                  id="farmacias-visible"
                  checked={config.farmacias_visible}
                  onCheckedChange={(checked) => handleToggle('farmacias_visible', checked)}
                />
              </div>
            </div>
          </div>

          <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-sm text-blue-800">
              <strong>Nota:</strong> Los cambios se aplicarán inmediatamente. Las secciones deshabilitadas no aparecerán en el menú lateral para los usuarios, pero los administradores siempre tendrán acceso completo.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};