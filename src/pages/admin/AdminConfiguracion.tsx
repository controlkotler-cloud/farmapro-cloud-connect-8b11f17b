
import { Card, CardContent } from '@/components/ui/card';
import { Settings } from 'lucide-react';

const AdminConfiguracion = () => {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Configuración General</h1>
        <p className="text-gray-600">Ajustes del portal y configuraciones del sistema</p>
      </div>

      <Card>
        <CardContent className="p-12 text-center">
          <Settings className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600">Panel de configuración disponible próximamente</p>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminConfiguracion;
