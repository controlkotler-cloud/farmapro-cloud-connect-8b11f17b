
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus, BookOpen, FileText, Users, Calendar, Briefcase, Store } from 'lucide-react';
import { Link } from 'react-router-dom';

const AdminDashboard = () => {
  const adminSections = [
    {
      title: 'Gestión de Cursos',
      description: 'Crear, editar y gestionar cursos de formación',
      icon: BookOpen,
      path: '/admin/cursos',
      color: 'bg-blue-500'
    },
    {
      title: 'Gestión de Recursos',
      description: 'Subir y organizar recursos descargables',
      icon: FileText,
      path: '/admin/recursos',
      color: 'bg-green-500'
    },
    {
      title: 'Gestión de Usuarios',
      description: 'Administrar perfiles y suscripciones',
      icon: Users,
      path: '/admin/usuarios',
      color: 'bg-purple-500'
    },
    {
      title: 'Gestión de Eventos',
      description: 'Crear y gestionar eventos y webinars',
      icon: Calendar,
      path: '/admin/eventos',
      color: 'bg-orange-500'
    },
    {
      title: 'Ofertas de Empleo',
      description: 'Moderar y gestionar ofertas de trabajo',
      icon: Briefcase,
      path: '/admin/empleo',
      color: 'bg-red-500'
    },
    {
      title: 'Farmacias',
      description: 'Gestionar directorio de farmacias',
      icon: Store,
      path: '/admin/farmacias',
      color: 'bg-indigo-500'
    }
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Panel de Administración</h1>
        <p className="text-gray-600">Gestiona el contenido y usuarios de farmapro</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {adminSections.map((section) => (
          <Card key={section.path} className="hover:shadow-lg transition-shadow cursor-pointer">
            <CardHeader className="pb-2">
              <div className="flex items-center space-x-3">
                <div className={`p-2 rounded-lg ${section.color}`}>
                  <section.icon className="h-6 w-6 text-white" />
                </div>
                <div>
                  <CardTitle className="text-lg">{section.title}</CardTitle>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <CardDescription className="mb-4">
                {section.description}
              </CardDescription>
              <Link to={section.path}>
                <Button className="w-full">
                  Acceder
                </Button>
              </Link>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Stats overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-8">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <BookOpen className="h-8 w-8 text-blue-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Cursos</p>
                <p className="text-2xl font-bold text-gray-900">24</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <FileText className="h-8 w-8 text-green-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Recursos</p>
                <p className="text-2xl font-bold text-gray-900">156</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <Users className="h-8 w-8 text-purple-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Usuarios Activos</p>
                <p className="text-2xl font-bold text-gray-900">1,247</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <Calendar className="h-8 w-8 text-orange-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Eventos</p>
                <p className="text-2xl font-bold text-gray-900">8</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AdminDashboard;
