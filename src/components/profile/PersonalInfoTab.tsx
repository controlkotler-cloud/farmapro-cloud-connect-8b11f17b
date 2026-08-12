
import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { EMPLOYEES_COUNT_OPTIONS, SPECIALTY_OPTIONS } from '@/lib/pharmacyProfile';
import { useAuth } from '@/hooks/useAuth';


interface PersonalInfoTabProps {
  profile: any;
  user: any;
}

export const PersonalInfoTab = ({ profile, user }: PersonalInfoTabProps) => {
  const { reloadProfile } = useAuth();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    full_name: profile?.full_name || '',
    email: profile?.email || user?.email || '',
    pharmacy_name: profile?.pharmacy_name || '',
    position: profile?.position || '',
    employees_count: profile?.employees_count || '',
    pharmacy_city: profile?.pharmacy_city || '',
  });
  const [specialtyAreas, setSpecialtyAreas] = useState<string[]>(profile?.specialty_areas || []);

  useEffect(() => {
    setFormData({
      full_name: profile?.full_name || '',
      email: profile?.email || user?.email || '',
      pharmacy_name: profile?.pharmacy_name || '',
      position: profile?.position || '',
      employees_count: profile?.employees_count || '',
      pharmacy_city: profile?.pharmacy_city || '',
    });
    setSpecialtyAreas(profile?.specialty_areas || []);
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
          employees_count: formData.employees_count || null,
          pharmacy_city: formData.pharmacy_city || null,
          specialty_areas: specialtyAreas,
        } as any)
        .eq('id', user.id);

      if (error) throw error;

      await reloadProfile();
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
      <CardContent className="space-y-6 p-4 md:p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
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
              className="bg-muted"
            />
            <p className="text-xs text-muted-foreground">El email no se puede modificar</p>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
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

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
          <div className="space-y-2">
            <Label htmlFor="pharmacy_city">Ciudad de la farmacia</Label>
            <Input
              id="pharmacy_city"
              value={formData.pharmacy_city}
              onChange={(e) => handleInputChange('pharmacy_city', e.target.value)}
              placeholder="Ej. Zaragoza"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="employees_count">Tamaño de tu equipo</Label>
            <Select
              value={formData.employees_count}
              onValueChange={(value) => handleInputChange('employees_count', value)}
            >
              <SelectTrigger id="employees_count">
                <SelectValue placeholder="Selecciona..." />
              </SelectTrigger>
              <SelectContent>
                {EMPLOYEES_COUNT_OPTIONS.map((o) => (
                  <SelectItem key={o.value} value={o.value}>
                    {o.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="space-y-2">
          <Label>Especialidades de tu farmacia</Label>
          <ToggleGroup
            type="multiple"
            value={specialtyAreas}
            onValueChange={setSpecialtyAreas}
            className="flex-wrap justify-start gap-1.5"
          >
            {SPECIALTY_OPTIONS.map((o) => (
              <ToggleGroupItem
                key={o.value}
                value={o.value}
                className="h-8 rounded-full border border-border px-3 text-xs data-[state=on]:bg-primary data-[state=on]:text-primary-foreground"
              >
                {o.label}
              </ToggleGroupItem>
            ))}
          </ToggleGroup>
        </div>

        <div className="pt-2">
          <Button onClick={saveProfile} disabled={loading} className="w-full rounded-full">
            {loading ? 'Guardando...' : 'Guardar cambios'}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};
