
import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { BookOpen, Clock, Users, Award, GraduationCap } from 'lucide-react';
import { CourseGrid } from '@/components/course/CourseGrid';
import { CategoryTabs } from '@/components/course/CategoryTabs';

const Formacion = () => {
  const { profile } = useAuth();
  const [stats, setStats] = useState({
    totalCourses: 0,
    completedCourses: 0,
    totalHours: 0,
    certificates: 0
  });

  useEffect(() => {
    loadStats();
  }, [profile?.id]);

  const loadStats = async () => {
    if (!profile?.id) return;

    // Load user stats
    const { count: totalCourses } = await supabase
      .from('courses')
      .select('*', { count: 'exact', head: true });

    const { count: completedCourses } = await supabase
      .from('user_course_progress')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', profile.id)
      .eq('completed', true);

    setStats({
      totalCourses: totalCourses || 0,
      completedCourses: completedCourses || 0,
      totalHours: (completedCourses || 0) * 4, // Estimate 4 hours per course
      certificates: completedCourses || 0
    });
  };

  return (
    <div className="space-y-6">
      {/* Header Section */}
      <div className="bg-gradient-to-r from-green-50 to-blue-50 border border-gray-100 rounded-lg p-8">
        <div className="text-center">
          <div className="flex items-center justify-center mb-4">
            <div className="bg-green-100 rounded-full p-3 mr-3">
              <GraduationCap className="h-8 w-8 text-green-600" />
            </div>
            <h1 className="text-3xl font-bold text-gray-900">
              Formación Continua
            </h1>
          </div>
          
          <p className="text-gray-600 mb-6 max-w-2xl mx-auto">
            Accede a cursos especializados y mantente actualizado con las últimas tendencias farmacéuticas
          </p>

          <div className="flex flex-wrap gap-3 justify-center">
            <Card className="bg-white/80 border-gray-200">
              <CardContent className="p-3 flex items-center space-x-2">
                <Award className="h-5 w-5 text-green-600" />
                <div className="text-left">
                  <p className="text-gray-900 font-medium text-sm">Nivel {profile?.level || 1}</p>
                  <p className="text-gray-500 text-xs">Tu nivel</p>
                </div>
              </CardContent>
            </Card>

            <Badge variant="secondary" className="bg-green-100 text-green-800 px-3 py-1">
              <BookOpen className="h-3 w-3 mr-1" />
              {stats.completedCourses} Completados
            </Badge>
          </div>
        </div>
      </div>

      {/* Stats Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="border-gray-200 hover:shadow-md transition-shadow">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium text-gray-700">
                Cursos Disponibles
              </CardTitle>
              <div className="p-2 rounded-lg bg-blue-50">
                <BookOpen className="h-4 w-4 text-blue-600" />
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="text-2xl font-bold text-gray-900 mb-1">
              {stats.totalCourses}
            </div>
            <p className="text-sm text-gray-500">Formación disponible</p>
          </CardContent>
        </Card>

        <Card className="border-gray-200 hover:shadow-md transition-shadow">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium text-gray-700">
                Completados
              </CardTitle>
              <div className="p-2 rounded-lg bg-green-50">
                <Award className="h-4 w-4 text-green-600" />
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="text-2xl font-bold text-gray-900 mb-1">
              {stats.completedCourses}
            </div>
            <p className="text-sm text-gray-500">Cursos finalizados</p>
          </CardContent>
        </Card>

        <Card className="border-gray-200 hover:shadow-md transition-shadow">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium text-gray-700">
                Horas de Formación
              </CardTitle>
              <div className="p-2 rounded-lg bg-purple-50">
                <Clock className="h-4 w-4 text-purple-600" />
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="text-2xl font-bold text-gray-900 mb-1">
              {stats.totalHours}h
            </div>
            <p className="text-sm text-gray-500">Tiempo invertido</p>
          </CardContent>
        </Card>

        <Card className="border-gray-200 hover:shadow-md transition-shadow">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium text-gray-700">
                Certificados
              </CardTitle>
              <div className="p-2 rounded-lg bg-orange-50">
                <Users className="h-4 w-4 text-orange-600" />
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="text-2xl font-bold text-gray-900 mb-1">
              {stats.certificates}
            </div>
            <p className="text-sm text-gray-500">Obtenidos</p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Card className="border-gray-200">
        <CardHeader className="bg-gray-50 border-b border-gray-200">
          <CardTitle className="text-xl font-bold text-gray-900 flex items-center">
            <BookOpen className="h-6 w-6 text-blue-600 mr-3" />
            Catálogo de Cursos
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <CategoryTabs />
          <div className="mt-6">
            <CourseGrid />
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Formacion;
