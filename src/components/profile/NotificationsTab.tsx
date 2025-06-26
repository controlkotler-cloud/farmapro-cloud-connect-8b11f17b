
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { useNotificationSettings } from '@/hooks/useNotificationSettings';

export const NotificationsTab = () => {
  const { settings, updateSetting, saveSettings } = useNotificationSettings();

  const handleSaveNotificationSettings = () => {
    saveSettings(settings);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Configuración de Notificaciones</CardTitle>
        <CardDescription>
          Controla qué notificaciones quieres recibir
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="email_courses">Notificaciones de cursos</Label>
              <p className="text-sm text-gray-500">Recibe notificaciones sobre nuevos cursos y actualizaciones</p>
            </div>
            <Switch
              id="email_courses"
              checked={settings.email_courses}
              onCheckedChange={(checked) => updateSetting('email_courses', checked)}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="email_promotions">Promociones y ofertas</Label>
              <p className="text-sm text-gray-500">Recibe información sobre promociones especiales</p>
            </div>
            <Switch
              id="email_promotions"
              checked={settings.email_promotions}
              onCheckedChange={(checked) => updateSetting('email_promotions', checked)}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="email_community">Actividad de la comunidad</Label>
              <p className="text-sm text-gray-500">Notificaciones sobre respuestas en el foro</p>
            </div>
            <Switch
              id="email_community"
              checked={settings.email_community}
              onCheckedChange={(checked) => updateSetting('email_community', checked)}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="push_notifications">Notificaciones push</Label>
              <p className="text-sm text-gray-500">Recibe notificaciones en tiempo real</p>
            </div>
            <Switch
              id="push_notifications"
              checked={settings.push_notifications}
              onCheckedChange={(checked) => updateSetting('push_notifications', checked)}
            />
          </div>
        </div>

        <Button className="w-full" onClick={handleSaveNotificationSettings}>
          Guardar Configuración
        </Button>
      </CardContent>
    </Card>
  );
};
