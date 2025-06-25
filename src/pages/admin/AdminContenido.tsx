
import { Card, CardContent } from '@/components/ui/card';
import { Globe } from 'lucide-react';

const AdminContenido = () => {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Gestión de Contenido Público</h1>
        <p className="text-gray-600">Gestionar páginas públicas y contenido del sitio web</p>
      </div>

      <Card>
        <CardContent className="p-12 text-center">
          <Globe className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600">Editor de contenido público disponible próximamente</p>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminContenido;
