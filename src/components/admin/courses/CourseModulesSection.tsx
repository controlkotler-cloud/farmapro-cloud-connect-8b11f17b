
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Plus, Trash2 } from 'lucide-react';

interface CourseModule {
  id: string;
  title: string;
  content: string;
  duration: number;
  video_url: string | null;
}

interface CourseModulesSectionProps {
  modules: CourseModule[];
  onModulesChange: (modules: CourseModule[]) => void;
}

const CourseModulesSection = ({ modules, onModulesChange }: CourseModulesSectionProps) => {
  console.log('CourseModulesSection - módulos recibidos:', modules);

  const addModule = () => {
    const newModule = {
      id: `temp-${Date.now()}`,
      title: '',
      content: '',
      duration: 0,
      video_url: null
    };
    
    const newModules = [...(modules || []), newModule];
    console.log('Añadiendo nuevo módulo:', newModules);
    onModulesChange(newModules);
  };

  const updateModule = (index: number, field: string, value: any) => {
    if (!modules || !Array.isArray(modules)) {
      console.error('Módulos no válidos:', modules);
      return;
    }

    const updatedModules = modules.map((module, i) => 
      i === index ? { ...module, [field]: value } : module
    );
    
    console.log(`Actualizando módulo ${index}, campo ${field}:`, value);
    console.log('Módulos actualizados:', updatedModules);
    onModulesChange(updatedModules);
  };

  const removeModule = (index: number) => {
    if (!modules || !Array.isArray(modules)) {
      console.error('Módulos no válidos para eliminar:', modules);
      return;
    }

    const filteredModules = modules.filter((_, i) => i !== index);
    console.log(`Eliminando módulo ${index}:`, filteredModules);
    onModulesChange(filteredModules);
  };

  // Asegurar que modules es un array válido
  const validModules = Array.isArray(modules) ? modules : [];

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <Label className="text-lg font-medium">Módulos del curso</Label>
        <Button type="button" size="sm" onClick={addModule}>
          <Plus className="h-4 w-4 mr-2" />
          Añadir Módulo
        </Button>
      </div>
      
      {validModules.length === 0 ? (
        <div className="text-center py-8 border-2 border-dashed border-gray-300 rounded-lg">
          <p className="text-gray-500 mb-4">No hay módulos en este curso</p>
          <Button type="button" variant="outline" onClick={addModule}>
            <Plus className="h-4 w-4 mr-2" />
            Crear primer módulo
          </Button>
        </div>
      ) : (
        validModules.map((module, index) => (
          <div key={module.id || index} className="border rounded-lg p-4 mb-4 space-y-3 bg-gray-50">
            <div className="flex justify-between items-center">
              <h4 className="font-medium text-lg">Módulo {index + 1}</h4>
              <Button 
                type="button" 
                variant="outline" 
                size="sm" 
                onClick={() => removeModule(index)}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <Label>Título del módulo *</Label>
                <Input
                  value={module.title || ''}
                  onChange={(e) => updateModule(index, 'title', e.target.value)}
                  placeholder="Título del módulo"
                />
              </div>
              
              <div>
                <Label>Duración (minutos)</Label>
                <Input
                  type="number"
                  min="0"
                  value={module.duration || 0}
                  onChange={(e) => updateModule(index, 'duration', parseInt(e.target.value) || 0)}
                  placeholder="Duración en minutos"
                />
              </div>
            </div>
            
            <div>
              <Label>URL del video</Label>
              <Input
                value={module.video_url || ''}
                onChange={(e) => updateModule(index, 'video_url', e.target.value)}
                placeholder="https://ejemplo.com/video.mp4"
              />
            </div>
            
            <div>
              <Label>Contenido del módulo</Label>
              <Textarea
                value={module.content || ''}
                onChange={(e) => updateModule(index, 'content', e.target.value)}
                rows={4}
                placeholder="Contenido y descripción del módulo"
              />
            </div>
          </div>
        ))
      )}
    </div>
  );
};

export default CourseModulesSection;
