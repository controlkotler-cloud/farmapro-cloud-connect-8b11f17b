
import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface PersonalInfoTabProps {
  profile: any;
  user: any;
}

export const PersonalInfoTab = ({ profile, user }: PersonalInfoTabProps) => {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    full_name: profile?.full_name || '',
    email: profile?.email || user?.email || '',
    pharmacy_name: profile?.pharmacy_name || '',
    position: profile?.position || '',
  });

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

  return (
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
                <SelectItem value="titular">Titular</SelectItem>
                <SelectItem value="gerente">Gerente</SelectItem>
                <SelectItem value="estudiante">Estudiante</SelectItem>
                <SelectItem value="administrador">Administrador</SelectItem>
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
  );
};
