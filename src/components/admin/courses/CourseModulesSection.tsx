
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Plus, Trash2, Download } from 'lucide-react';

interface DownloadableResource {
  title: string;
  url: string;
  type: string;
}

interface CourseModule {
  id: string;
  title: string;
  content: string;
  duration: number;
  video_url: string | null;
  downloadable_resources?: DownloadableResource[];
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
      video_url: null,
      downloadable_resources: []
    };
    
    const validModules = Array.isArray(modules) ? modules : [];
    const newModules = [...validModules, newModule];
    console.log('Añadiendo nuevo módulo:', newModules);
    onModulesChange(newModules);
  };

  const updateModule = (index: number, field: string, value: any) => {
    const validModules = Array.isArray(modules) ? modules : [];
    if (index < 0 || index >= validModules.length) {
      console.error('Índice de módulo inválido:', index);
      return;
    }

    const updatedModules = validModules.map((module, i) => 
      i === index ? { ...module, [field]: value } : module
    );
    
    console.log(`Actualizando módulo ${index}, campo ${field}:`, value);
    console.log('Módulos actualizados:', updatedModules);
    onModulesChange(updatedModules);
  };

  const removeModule = (index: number) => {
    const validModules = Array.isArray(modules) ? modules : [];
    if (index < 0 || index >= validModules.length) {
      console.error('Índice de módulo inválido para eliminar:', index);
      return;
    }

    const filteredModules = validModules.filter((_, i) => i !== index);
    console.log(`Eliminando módulo ${index}:`, filteredModules);
    onModulesChange(filteredModules);
  };

  const addResource = (moduleIndex: number) => {
    const validModules = Array.isArray(modules) ? modules : [];
    if (moduleIndex < 0 || moduleIndex >= validModules.length) return;

    const newResource = {
      title: '',
      url: '',
      type: 'PDF'
    };

    const currentResources = validModules[moduleIndex].downloadable_resources || [];
    const updatedResources = [...currentResources, newResource];
    
    updateModule(moduleIndex, 'downloadable_resources', updatedResources);
  };

  const updateResource = (moduleIndex: number, resourceIndex: number, field: string, value: string) => {
    const validModules = Array.isArray(modules) ? modules : [];
    if (moduleIndex < 0 || moduleIndex >= validModules.length) return;

    const currentResources = validModules[moduleIndex].downloadable_resources || [];
    if (resourceIndex < 0 || resourceIndex >= currentResources.length) return;

    const updatedResources = currentResources.map((resource, i) => 
      i === resourceIndex ? { ...resource, [field]: value } : resource
    );
    
    updateModule(moduleIndex, 'downloadable_resources', updatedResources);
  };

  const removeResource = (moduleIndex: number, resourceIndex: number) => {
    const validModules = Array.isArray(modules) ? modules : [];
    if (moduleIndex < 0 || moduleIndex >= validModules.length) return;

    const currentResources = validModules[moduleIndex].downloadable_resources || [];
    const updatedResources = currentResources.filter((_, i) => i !== resourceIndex);
    
    updateModule(moduleIndex, 'downloadable_resources', updatedResources);
  };

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
          <div key={module.id || index} className="border rounded-lg p-4 mb-4 space-y-4 bg-gray-50">
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

            {/* Sección de recursos descargables */}
            <div className="border-t pt-4">
              <div className="flex justify-between items-center mb-3">
                <Label className="font-medium">Recursos descargables</Label>
                <Button 
                  type="button" 
                  size="sm" 
                  variant="outline"
                  onClick={() => addResource(index)}
                >
                  <Download className="h-4 w-4 mr-2" />
                  Añadir recurso
                </Button>
              </div>
              
              {module.downloadable_resources && module.downloadable_resources.length > 0 ? (
                <div className="space-y-3">
                  {module.downloadable_resources.map((resource, resourceIndex) => (
                    <div key={resourceIndex} className="bg-white rounded-lg p-3 border border-gray-200">
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-3">
                        <div>
                          <Label>Título del recurso</Label>
                          <Input
                            value={resource.title || ''}
                            onChange={(e) => updateResource(index, resourceIndex, 'title', e.target.value)}
                            placeholder="Ej: Manual PDF, Plantilla Excel..."
                          />
                        </div>
                        <div>
                          <Label>Tipo de archivo</Label>
                          <Input
                            value={resource.type || ''}
                            onChange={(e) => updateResource(index, resourceIndex, 'type', e.target.value)}
                            placeholder="Ej: PDF, DOCX, XLSX..."
                          />
                        </div>
                        <div className="flex items-end">
                          <Button 
                            type="button" 
                            variant="destructive" 
                            size="sm"
                            onClick={() => removeResource(index, resourceIndex)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                      <div>
                        <Label>URL del archivo</Label>
                        <Input
                          value={resource.url || ''}
                          onChange={(e) => updateResource(index, resourceIndex, 'url', e.target.value)}
                          placeholder="https://ejemplo.com/archivo.pdf"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-6 border-2 border-dashed border-gray-200 rounded-lg bg-gray-50">
                  <Download className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                  <p className="text-gray-500 text-sm">No hay recursos descargables</p>
                  <p className="text-gray-400 text-xs">Añade PDFs, documentos o plantillas</p>
                </div>
              )}
            </div>
          </div>
        ))
      )}
    </div>
  );
};

export default CourseModulesSection;
