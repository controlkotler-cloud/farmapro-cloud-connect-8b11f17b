
import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Crown, Sparkles, GraduationCap, Briefcase, User, CreditCard, Bell } from 'lucide-react';
import { toast } from 'sonner';
import { useNotificationSettings } from '@/hooks/useNotificationSettings';
import { SubscriptionStatus } from '@/components/subscription/SubscriptionStatus';
import { SubscriptionPlans } from '@/components/subscription/SubscriptionPlans';

const planConfig = {
  freemium: {
    name: 'Freemium',
    icon: Sparkles,
    color: 'from-gray-400 to-gray-600',
    bgColor: 'bg-gray-100',
    textColor: 'text-gray-800',
  },
  estudiante: {
    name: 'Estudiante',
    icon: GraduationCap,
    color: 'from-green-400 to-blue-500',
    bgColor: 'bg-green-100',
    textColor: 'text-green-800',
  },
  profesional: {
    name: 'Profesional',
    icon: Briefcase,
    color: 'from-blue-500 to-purple-600',
    bgColor: 'bg-blue-100',
    textColor: 'text-blue-800',
  },
  premium: {
    name: 'Premium',
    icon: Crown,
    color: 'from-yellow-400 to-orange-500',
    bgColor: 'bg-yellow-100',
    textColor: 'text-yellow-800',
  },
};

export default function Perfil() {
  const { profile, user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    full_name: '',
    email: '',
    pharmacy_name: '',
    position: '',
  });
  
  const { settings, updateSetting, saveSettings } = useNotificationSettings();

  useEffect(() => {
    if (profile) {
      setFormData({
        full_name: profile.full_name || '',
        email: profile.email || '',
        pharmacy_name: profile.pharmacy_name || '',
        position: profile.position || '',
      });
    }
  }, [profile]);

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const saveProfile = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          full_name: formData.full_name,
          pharmacy_name: formData.pharmacy_name,
          position: formData.position,
        })
        .eq('id', user.id);

      if (error) throw error;
      
      toast.success('Perfil actualizado correctamente');
    } catch (error) {
      console.error('Error updating profile:', error);
      toast.error('Error al actualizar el perfil');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveNotificationSettings = () => {
    saveSettings(settings);
  };

  const currentPlan = profile?.subscription_role || 'freemium';

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Mi Perfil</h1>
          <p className="text-gray-600 mt-2">Gestiona tu información personal y configuración de cuenta</p>
        </div>

        <Tabs defaultValue="personal" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="personal" className="flex items-center gap-2">
              <User className="h-4 w-4" />
              Personal
            </TabsTrigger>
            <TabsTrigger value="plan" className="flex items-center gap-2">
              <Crown className="h-4 w-4" />
              Plan
            </TabsTrigger>
            <TabsTrigger value="billing" className="flex items-center gap-2">
              <CreditCard className="h-4 w-4" />
              Facturación
            </TabsTrigger>
            <TabsTrigger value="notifications" className="flex items-center gap-2">
              <Bell className="h-4 w-4" />
              Notificaciones
            </TabsTrigger>
          </TabsList>

          <TabsContent value="personal" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Información Personal</CardTitle>
                <CardDescription>
                  Actualiza tu información personal y datos de contacto
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="full_name">Nombre completo</Label>
                    <Input
                      id="full_name"
                      value={formData.full_name}
                      onChange={(e) => handleInputChange('full_name', e.target.value)}
                      placeholder="Tu nombre completo"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      disabled
                      className="bg-gray-100"
                    />
                    <p className="text-xs text-gray-500">El email no se puede modificar</p>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="pharmacy_name">Nombre de la farmacia</Label>
                    <Input
                      id="pharmacy_name"
                      value={formData.pharmacy_name}
                      onChange={(e) => handleInputChange('pharmacy_name', e.target.value)}
                      placeholder="Farmacia donde trabajas"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="position">Cargo/Posición</Label>
                    <Select
                      value={formData.position}
                      onValueChange={(value) => handleInputChange('position', value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecciona tu cargo" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="farmaceutico">Farmacéutico/a</SelectItem>
                        <SelectItem value="auxiliar">Auxiliar de Farmacia</SelectItem>
                        <SelectItem value="propietario">Propietario/a</SelectItem>
                        <SelectItem value="gerente">Gerente</SelectItem>
                        <SelectItem value="estudiante">Estudiante</SelectItem>
                        <SelectItem value="otro">Otro</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <Button onClick={saveProfile} disabled={loading} className="w-full">
                  {loading ? 'Guardando...' : 'Guardar cambios'}
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="plan" className="space-y-6">
            <div className="space-y-8">
              <SubscriptionStatus />
              <SubscriptionPlans />
            </div>
          </TabsContent>

          <TabsContent value="billing" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Información de Facturación</CardTitle>
                <CardDescription>
                  Gestiona tu información de pago y historial de facturas
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="p-4 border rounded-lg">
                    <h4 className="font-medium mb-2">Estado de Suscripción</h4>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Estado actual:</span>
                      <Badge variant={profile?.subscription_status === 'active' ? 'default' : 'secondary'}>
                        {profile?.subscription_status || 'Inactivo'}
                      </Badge>
                    </div>
                  </div>
                  
                  <div className="p-4 border rounded-lg">
                    <h4 className="font-medium mb-2">Próxima Facturación</h4>
                    <p className="text-sm text-gray-600">
                      {currentPlan === 'freemium' 
                        ? 'No tienes una suscripción activa' 
                        : 'Tu próxima facturación será procesada automáticamente'
                      }
                    </p>
                  </div>

                  <Button variant="outline" className="w-full">
                    Ver Historial de Facturas
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="notifications" className="space-y-6">
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
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
