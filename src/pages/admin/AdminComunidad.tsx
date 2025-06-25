
import { Card, CardContent } from '@/components/ui/card';
import { MessageSquare } from 'lucide-react';

const AdminComunidad = () => {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Gestión de Comunidad</h1>
        <p className="text-gray-600">Moderar foros y discusiones de la comunidad</p>
      </div>

      <Card>
        <CardContent className="p-12 text-center">
          <MessageSquare className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600">Panel de moderación de comunidad disponible próximamente</p>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminComunidad;
