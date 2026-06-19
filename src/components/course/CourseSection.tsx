import { getCourseCover } from '@/lib/courseCover';
import { CourseGrid } from './CourseGrid';
import type { Course, CourseEnrollment } from '@/types/course';

interface CourseSectionProps {
  /** Categoría real (clave del enum) para tomar icono + etiqueta de courseCover. */
  category: string;
  courses: Course[];
  enrollments: CourseEnrollment[];
  canAccessCourse: (course: Course) => boolean;
  onEnroll: (courseSlug: string) => void;
}

// Sección por categoría: cabecera con icono + etiqueta de courseCover y el
// contador de cursos, seguida de la sub-rejilla de tarjetas.
export const CourseSection = ({
  category,
  courses,
  enrollments,
  canAccessCourse,
  onEnroll,
}: CourseSectionProps) => {
  if (courses.length === 0) return null;
  const cover = getCourseCover(category);

  return (
    <section className="space-y-4">
      <div className="flex items-center gap-3">
        <div className={`flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br ${cover.gradient}`}>
          <cover.Icon className="h-5 w-5 text-white" strokeWidth={1.75} />
        </div>
        <div>
          <h2 className="text-lg font-bold text-gray-900 leading-tight">{cover.label}</h2>
          <p className="text-xs text-gray-500">
            {courses.length} {courses.length === 1 ? 'curso' : 'cursos'}
          </p>
        </div>
      </div>

      <CourseGrid
        courses={courses}
        enrollments={enrollments}
        canAccessCourse={canAccessCourse}
        onEnroll={onEnroll}
      />
    </section>
  );
};
