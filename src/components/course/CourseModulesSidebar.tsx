
import type { CourseModule } from '@/types/course';
import { ModuleCard } from './ModuleCard';

interface CourseModulesSidebarProps {
  modules: CourseModule[];
  currentModuleIndex: number;
  isModuleCompleted: (moduleId: string) => boolean;
  onModuleSelect: (index: number) => void;
}

export const CourseModulesSidebar = ({
  modules,
  currentModuleIndex,
  isModuleCompleted,
  onModuleSelect
}: CourseModulesSidebarProps) => {
  return (
    <div className="lg:col-span-1 space-y-4">
      <h3 className="text-lg font-semibold">📚 Módulos del curso</h3>
      {modules.map((module, index) => {
        const isLocked = index > 0 && !isModuleCompleted(modules[index - 1].id);
        return (
          <ModuleCard
            key={module.id}
            module={module}
            index={index}
            isActive={index === currentModuleIndex}
            isCompleted={isModuleCompleted(module.id)}
            isLocked={isLocked}
            onClick={() => {
              if (!isLocked) {
                onModuleSelect(index);
              }
            }}
          />
        );
      })}
    </div>
  );
};
