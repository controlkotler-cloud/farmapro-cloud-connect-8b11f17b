
import { Card, CardContent } from '@/components/ui/card';
import { Trophy } from 'lucide-react';

const AdminRetos = () => {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Gestión de Retos</h1>
        <p className="text-gray-600">Crear y gestionar retos y desafíos para usuarios</p>
      </div>

      <Card>
        <CardContent className="p-12 text-center">
          <Trophy className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600">Sistema de retos disponible próximamente</p>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminRetos;
