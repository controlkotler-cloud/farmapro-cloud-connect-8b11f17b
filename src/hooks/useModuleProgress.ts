
import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';

interface ModuleProgress {
  moduleId: string;
  completedAt: string | null;
}

export const useModuleProgress = (courseId: string) => {
  const { profile } = useAuth();
  const [completedModules, setCompletedModules] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (profile?.id && courseId) {
      loadModuleProgress();
    }
  }, [profile?.id, courseId]);

  const loadModuleProgress = async () => {
    if (!profile?.id) return;

    try {
      // Por ahora simularemos el progreso usando localStorage hasta que tengamos la tabla de progreso de módulos
      const storageKey = `module_progress_${courseId}_${profile.id}`;
      const savedProgress = localStorage.getItem(storageKey);
      
      if (savedProgress) {
        const progressData = JSON.parse(savedProgress);
        setCompletedModules(new Set(progressData));
      }
    } catch (error) {
      console.error('Error loading module progress:', error);
    } finally {
      setLoading(false);
    }
  };

  const markModuleAsCompleted = async (moduleId: string) => {
    if (!profile?.id) return;

    try {
      const newCompleted = new Set(completedModules);
      newCompleted.add(moduleId);
      setCompletedModules(newCompleted);

      // Guardar en localStorage por ahora
      const storageKey = `module_progress_${courseId}_${profile.id}`;
      localStorage.setItem(storageKey, JSON.stringify(Array.from(newCompleted)));

      console.log(`Módulo ${moduleId} marcado como completado`);
    } catch (error) {
      console.error('Error marking module as completed:', error);
    }
  };

  const isModuleCompleted = (moduleId: string) => {
    return completedModules.has(moduleId);
  };

  const getCompletionPercentage = (totalModules: number) => {
    return totalModules > 0 ? Math.round((completedModules.size / totalModules) * 100) : 0;
  };

  const canAccessModule = (moduleIndex: number, modules: any[]) => {
    // El primer módulo siempre es accesible
    if (moduleIndex === 0) return true;
    
    // Para acceder a un módulo, el anterior debe estar completado
    const previousModule = modules[moduleIndex - 1];
    return previousModule ? isModuleCompleted(previousModule.id) : false;
  };

  return {
    completedModules,
    loading,
    markModuleAsCompleted,
    isModuleCompleted,
    getCompletionPercentage,
    canAccessModule
  };
};
