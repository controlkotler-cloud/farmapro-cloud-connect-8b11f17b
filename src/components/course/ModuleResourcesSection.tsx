
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Download } from 'lucide-react';
import type { DownloadableResource } from '@/types/course';

interface ModuleResourcesSectionProps {
  resources: DownloadableResource[];
}

export const ModuleResourcesSection = ({ resources }: ModuleResourcesSectionProps) => {
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3 mb-4">
        <div className="p-2 bg-green-100 rounded-lg">
          <Download className="h-5 w-5 text-green-600" />
        </div>
        <h4 className="text-lg font-semibold text-gray-800">
          📥 Recursos Descargables
        </h4>
      </div>
      <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl p-6 border border-green-200">
        <div className="grid gap-4">
          {resources.map((resource, index) => (
            <div key={index} className="bg-white rounded-lg p-4 border border-green-200 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="flex-shrink-0 p-2 bg-green-100 rounded-lg">
                    <Download className="h-5 w-5 text-green-600" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900 flex items-center gap-2">
                      📄 {resource.title}
                    </p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-sm text-gray-600">Formato:</span>
                      <Badge variant="outline" className="text-xs">
                        {resource.type}
                      </Badge>
                    </div>
                  </div>
                </div>
                <Button asChild variant="outline" size="sm" className="shrink-0">
                  <a 
                    href={resource.url} 
                    download
                    className="flex items-center gap-2"
                  >
                    <Download className="h-4 w-4" />
                    Descargar
                  </a>
                </Button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
