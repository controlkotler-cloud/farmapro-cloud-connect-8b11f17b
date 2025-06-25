
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
  const addModule = () => {
    const newModules = [
      ...modules,
      {
        id: `temp-${Date.now()}`,
        title: '',
        content: '',
        duration: 0,
        video_url: null
      }
    ];
    onModulesChange(newModules);
  };

  const updateModule = (index: number, field: string, value: any) => {
    const updatedModules = modules.map((module, i) => 
      i === index ? { ...module, [field]: value } : module
    );
    onModulesChange(updatedModules);
  };

  const removeModule = (index: number) => {
    const filteredModules = modules.filter((_, i) => i !== index);
    onModulesChange(filteredModules);
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <Label>Módulos del curso</Label>
        <Button type="button" size="sm" onClick={addModule}>
          <Plus className="h-4 w-4 mr-2" />
          Añadir Módulo
        </Button>
      </div>
      
      {modules.map((module, index) => (
        <div key={index} className="border rounded-lg p-4 mb-4 space-y-3">
          <div className="flex justify-between items-center">
            <h4 className="font-medium">Módulo {index + 1}</h4>
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
              <Label>Título del módulo</Label>
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
              rows={3}
              placeholder="Contenido y descripción del módulo"
            />
          </div>
        </div>
      ))}
    </div>
  );
};

export default CourseModulesSection;
