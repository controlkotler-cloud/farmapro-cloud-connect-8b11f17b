
import { motion } from 'framer-motion';
import { useCourses } from '@/hooks/useCourses';
import { CourseHeader } from '@/components/course/CourseHeader';
import { CategoryTabs } from '@/components/course/CategoryTabs';
import { CourseGrid } from '@/components/course/CourseGrid';
import { LoadingSkeleton } from '@/components/course/LoadingSkeleton';

export const Formacion = () => {
  const { 
    courses, 
    enrollments, 
    loading, 
    selectedCategory, 
    setSelectedCategory, 
    enrollInCourse, 
    canAccessCourse 
  } = useCourses();

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 }
  };

  if (loading) {
    return <LoadingSkeleton />;
  }

  return (
    <motion.div 
      className="space-y-8"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      {/* Header with gradient background matching sidebar style */}
      <motion.div 
        className="bg-gradient-to-r from-blue-50 to-blue-100 rounded-xl p-8 shadow-lg ring-1 ring-blue-200"
        variants={itemVariants}
      >
        <div className="relative">
          <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-16 bg-gradient-to-b from-blue-400 to-blue-600 rounded-r-full shadow-lg"></div>
          <div className="ml-6">
            <CourseHeader />
          </div>
        </div>
      </motion.div>

      {/* Category tabs with enhanced styling */}
      <motion.div variants={itemVariants}>
        <CategoryTabs 
          selectedCategory={selectedCategory}
          onCategoryChange={setSelectedCategory}
        />
      </motion.div>

      {/* Course grid with staggered animations */}
      <motion.div variants={itemVariants}>
        <CourseGrid 
          courses={courses}
          enrollments={enrollments}
          canAccessCourse={canAccessCourse}
          onEnroll={enrollInCourse}
        />
      </motion.div>
    </motion.div>
  );
};
