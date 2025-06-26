
import { BookOpen } from 'lucide-react';

interface ModuleContentSectionProps {
  content: string;
}

export const ModuleContentSection = ({ content }: ModuleContentSectionProps) => {
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3 mb-4">
        <div className="p-2 bg-blue-100 rounded-lg">
          <BookOpen className="h-5 w-5 text-blue-600" />
        </div>
        <h4 className="text-lg font-semibold text-gray-800">
          📚 Contenido del módulo
        </h4>
      </div>
      <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-6 border border-blue-200">
        <div 
          className="prose max-w-none text-gray-700 leading-relaxed"
          dangerouslySetInnerHTML={{ __html: content }}
          style={{
            fontSize: '16px',
            lineHeight: '1.7'
          }}
        />
      </div>
    </div>
  );
};
