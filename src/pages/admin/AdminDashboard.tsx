import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus, BookOpen, FileText, Users, Calendar, Briefcase, Store, Megaphone, MessageSquare, Trophy, Settings } from 'lucide-react';
import { Link } from 'react-router-dom';

interface AdminStats {
  totalCourses: number;
  totalResources: number;
  activeUsers: number;
  totalEvents: number;
}

const AdminDashboard = () => {
  useEffect(() => {
    // Scroll to top when component mounts
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
  }, []);

  // Fetch real statistics from the database
  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ['admin-dashboard-stats'],
    queryFn: async (): Promise<AdminStats> => {
      console.log('Fetching admin dashboard statistics...');
      
      // Fetch courses count
      const { count: coursesCount, error: coursesError } = await supabase
        .from('courses')
        .select('*', { count: 'exact', head: true });

      if (coursesError) {
        console.error('Error fetching courses count:', coursesError);
        throw coursesError;
      }

      // Fetch resources count
      const { count: resourcesCount, error: resourcesError } = await supabase
        .from('resources')
        .select('*', { count: 'exact', head: true });

      if (resourcesError) {
        console.error('Error fetching resources count:', resourcesError);
        throw resourcesError;
      }

      // Fetch active users count (users with recent activity in last 30 days)
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const { count: activeUsersCount, error: usersError } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true })
        .gte('updated_at', thirtyDaysAgo.toISOString());

      if (usersError) {
        console.error('Error fetching active users count:', usersError);
        throw usersError;
      }

      // Fetch events count
      const { count: eventsCount, error: eventsError } = await supabase
        .from('events')
        .select('*', { count: 'exact', head: true });

      if (eventsError) {
        console.error('Error fetching events count:', eventsError);
        throw eventsError;
      }

      const statsData = {
        totalCourses: coursesCount || 0,
        totalResources: resourcesCount || 0,
        activeUsers: activeUsersCount || 0,
        totalEvents: eventsCount || 0,
      };

      console.log('Admin dashboard stats loaded:', statsData);
      return statsData;
    }
  });

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
    },
    {
      title: 'Promociones',
      description: 'Gestionar ofertas y descuentos',
      icon: Megaphone,
      path: '/admin/promociones',
      color: 'bg-pink-500'
    },
    {
      title: 'Comunidad',
      description: 'Moderar foros y discusiones',
      icon: MessageSquare,
      path: '/admin/comunidad',
      color: 'bg-cyan-500'
    },
    {
      title: 'Retos y Desafíos',
      description: 'Crear y gestionar retos para usuarios',
      icon: Trophy,
      path: '/admin/retos',
      color: 'bg-yellow-500'
    },
    {
      title: 'Configuración General',
      description: 'Ajustes del portal y configuraciones',
      icon: Settings,
      path: '/admin/configuracion',
      color: 'bg-gray-600'
    }
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Panel de Administración</h1>
        <p className="text-gray-600">Gestiona todo el contenido y funcionalidades de farmapro</p>
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

      {/* Real-time stats overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-8">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <BookOpen className="h-8 w-8 text-blue-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Cursos</p>
                {statsLoading ? (
                  <div className="animate-pulse bg-gray-200 h-8 w-12 rounded"></div>
                ) : (
                  <p className="text-2xl font-bold text-gray-900">{stats?.totalCourses || 0}</p>
                )}
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
                {statsLoading ? (
                  <div className="animate-pulse bg-gray-200 h-8 w-12 rounded"></div>
                ) : (
                  <p className="text-2xl font-bold text-gray-900">{stats?.totalResources || 0}</p>
                )}
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
                {statsLoading ? (
                  <div className="animate-pulse bg-gray-200 h-8 w-12 rounded"></div>
                ) : (
                  <p className="text-2xl font-bold text-gray-900">{stats?.activeUsers || 0}</p>
                )}
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
                {statsLoading ? (
                  <div className="animate-pulse bg-gray-200 h-8 w-12 rounded"></div>
                ) : (
                  <p className="text-2xl font-bold text-gray-900">{stats?.totalEvents || 0}</p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AdminDashboard;
