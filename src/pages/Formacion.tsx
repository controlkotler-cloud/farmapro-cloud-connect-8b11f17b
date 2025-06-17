
import { useCourses } from '@/hooks/useCourses';
import { CategoryTabs } from '@/components/course/CategoryTabs';
import { CourseGrid } from '@/components/course/CourseGrid';
import { LoadingSkeleton } from '@/components/course/LoadingSkeleton';
import type { CategoryItem } from '@/types/course';

const Formacion = () => {
  const {
    courses,
    enrollments,
    loading,
    selectedCategory,
    setSelectedCategory,
    enrollInCourse,
    canAccessCourse
  } = useCourses();

  const categories: CategoryItem[] = [
    { id: 'all', name: 'Todos los Cursos' },
    { id: 'gestion', name: 'Gestión Farmacéutica' },
    { id: 'marketing', name: 'Marketing y Ventas' },
    { id: 'liderazgo', name: 'Liderazgo' },
    { id: 'atencion_cliente', name: 'Atención al Cliente' },
    { id: 'tecnologia', name: 'Tecnología' },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Formación Continua</h1>
        <p className="text-gray-600">Desarrolla tus competencias profesionales con nuestros cursos especializados</p>
      </div>

      <CategoryTabs
        categories={categories}
        selectedCategory={selectedCategory}
        onCategoryChange={setSelectedCategory}
      >
        {loading ? (
          <LoadingSkeleton />
        ) : (
          <CourseGrid
            courses={courses}
            enrollments={enrollments}
            canAccessCourse={canAccessCourse}
            onEnroll={enrollInCourse}
          />
        )}
      </CategoryTabs>
    </div>
  );
};

export default Formacion;
