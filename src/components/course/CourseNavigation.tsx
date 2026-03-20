
import { useState } from 'react';
import type { CourseModule } from '@/types/course';

interface CourseNavigationProps {
  modules: CourseModule[];
  isModuleCompleted: (moduleId: string) => boolean;
}

export const useCourseNavigation = ({ modules, isModuleCompleted }: CourseNavigationProps) => {
  const [currentModuleIndex, setCurrentModuleIndex] = useState(0);

  const handlePreviousModule = () => {
    if (currentModuleIndex > 0) {
      setCurrentModuleIndex(currentModuleIndex - 1);
    }
  };

  const handleNextModule = () => {
    const currentModule = modules[currentModuleIndex];
    
    if (!isModuleCompleted(currentModule.id)) {
      return;
    }
    
    if (currentModuleIndex < modules.length - 1) {
      setCurrentModuleIndex(currentModuleIndex + 1);
    }
  };

  const isNextModuleUnlocked = () => {
    const currentModule = modules[currentModuleIndex];
    return isModuleCompleted(currentModule.id);
  };

  const handleModuleSelect = (index: number) => {
    setCurrentModuleIndex(index);
  };

  return {
    currentModuleIndex,
    handlePreviousModule,
    handleNextModule,
    isNextModuleUnlocked,
    handleModuleSelect
  };
};
