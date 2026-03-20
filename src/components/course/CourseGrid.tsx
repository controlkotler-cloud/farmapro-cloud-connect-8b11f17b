
import { CourseCard } from './CourseCard';
import type { Course, CourseEnrollment } from '@/types/course';

interface CourseGridProps {
  courses: Course[];
  enrollments: CourseEnrollment[];
  canAccessCourse: (course: Course) => boolean;
  onEnroll: (courseId: string) => void;
}

export const CourseGrid = ({ courses, enrollments, canAccessCourse, onEnroll }: CourseGridProps) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {courses.map((course, index) => (
        <CourseCard
          key={course.id}
          course={course}
          index={index}
          enrollments={enrollments}
          canAccessCourse={canAccessCourse}
          onEnroll={onEnroll}
        />
      ))}
    </div>
  );
};
