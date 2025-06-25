
import { Badge } from '@/components/ui/badge';
import { BookOpen, Clock, Users, Award, GraduationCap } from 'lucide-react';
import { CourseGrid } from '@/components/course/CourseGrid';
import { CategoryTabs } from '@/components/course/CategoryTabs';
import { useCourses } from '@/hooks/useCourses';
import { useAuth } from '@/hooks/useAuth';
import type { CategoryItem } from '@/types/course';

const Formacion = () => {
  const { profile } = useAuth();
  const { courses, enrollments, loading, selectedCategory, setSelectedCategory, enrollInCourse, canAccessCourse } = useCourses();

  const categories: CategoryItem[] = [
    { id: 'all', name: 'Todos' },
    { id: 'gestion', name: 'Gestión' },
    { id: 'marketing', name: 'Marketing' },
    { id: 'liderazgo', name: 'Liderazgo' },
    { id: 'atencion', name: 'Atención' },
    { id: 'finanzas', name: 'Finanzas' }
  ];

  const stats = {
    totalCourses: courses.length,
    completedCourses: enrollments.filter(e => e.completed_at).length,
    totalHours: enrollments.filter(e => e.completed_at).length * 4,
    certificates: enrollments.filter(e => e.completed_at).length
  };

  return (
    <div className="space-y-8">
      {/* Header Section */}
      <div className="bg-white border border-gray-100 rounded-lg p-8 shadow-sm">
        <div className="text-center">
          <div className="flex items-center justify-center mb-4">
            <div className="bg-blue-50 rounded-full p-3 mr-3">
              <GraduationCap className="h-8 w-8 text-blue-600" />
            </div>
            <h1 className="text-3xl font-bold text-gray-900">
              Formación Continua
            </h1>
          </div>
          
          <p className="text-gray-600 mb-6 max-w-2xl mx-auto">
            Accede a cursos especializados y mantente actualizado con las últimas tendencias farmacéuticas
          </p>

          <div className="flex flex-wrap gap-3 justify-center">
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 flex items-center space-x-2">
              <Award className="h-5 w-5 text-blue-600" />
              <div className="text-left">
                <p className="text-gray-900 font-medium text-sm">Nivel {profile?.level || 1}</p>
                <p className="text-gray-500 text-xs">Tu nivel</p>
              </div>
            </div>

            <Badge variant="secondary" className="bg-blue-50 text-blue-700 border-blue-200 px-3 py-1">
              <BookOpen className="h-3 w-3 mr-1" />
              {stats.completedCourses} Completados
            </Badge>
          </div>
        </div>
      </div>

      {/* Stats Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white border border-gray-100 rounded-lg p-6 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-medium text-gray-700">
              Cursos Disponibles
            </h3>
            <div className="p-2 rounded-lg bg-blue-50">
              <BookOpen className="h-4 w-4 text-blue-600" />
            </div>
          </div>
          <div className="text-2xl font-bold text-gray-900 mb-1">
            {stats.totalCourses}
          </div>
          <p className="text-sm text-gray-500">Formación disponible</p>
        </div>

        <div className="bg-white border border-gray-100 rounded-lg p-6 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-medium text-gray-700">
              Completados
            </h3>
            <div className="p-2 rounded-lg bg-green-50">
              <Award className="h-4 w-4 text-green-600" />
            </div>
          </div>
          <div className="text-2xl font-bold text-gray-900 mb-1">
            {stats.completedCourses}
          </div>
          <p className="text-sm text-gray-500">Cursos finalizados</p>
        </div>

        <div className="bg-white border border-gray-100 rounded-lg p-6 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-medium text-gray-700">
              Horas de Formación
            </h3>
            <div className="p-2 rounded-lg bg-purple-50">
              <Clock className="h-4 w-4 text-purple-600" />
            </div>
          </div>
          <div className="text-2xl font-bold text-gray-900 mb-1">
            {stats.totalHours}h
          </div>
          <p className="text-sm text-gray-500">Tiempo invertido</p>
        </div>

        <div className="bg-white border border-gray-100 rounded-lg p-6 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-medium text-gray-700">
              Certificados
            </h3>
            <div className="p-2 rounded-lg bg-orange-50">
              <Users className="h-4 w-4 text-orange-600" />
            </div>
          </div>
          <div className="text-2xl font-bold text-gray-900 mb-1">
            {stats.certificates}
          </div>
          <p className="text-sm text-gray-500">Obtenidos</p>
        </div>
      </div>

      {/* Main Content */}
      <div className="bg-white border border-gray-100 rounded-lg shadow-sm">
        <div className="bg-gray-50 border-b border-gray-100 p-6">
          <h2 className="text-xl font-bold text-gray-900 flex items-center">
            <BookOpen className="h-6 w-6 text-blue-600 mr-3" />
            Catálogo de Cursos
          </h2>
        </div>
        <div className="p-6">
          <CategoryTabs 
            categories={categories}
            selectedCategory={selectedCategory}
            onCategoryChange={setSelectedCategory}
          >
            <div className="mt-6">
              {loading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {[...Array(6)].map((_, i) => (
                    <div key={i} className="bg-gray-100 rounded-lg p-6 animate-pulse">
                      <div className="h-4 bg-gray-200 rounded mb-4"></div>
                      <div className="h-3 bg-gray-200 rounded mb-2"></div>
                      <div className="h-8 bg-gray-200 rounded"></div>
                    </div>
                  ))}
                </div>
              ) : (
                <CourseGrid 
                  courses={courses}
                  enrollments={enrollments}
                  canAccessCourse={canAccessCourse}
                  onEnroll={enrollInCourse}
                />
              )}
            </div>
          </CategoryTabs>
        </div>
      </div>
    </div>
  );
};

export default Formacion;
