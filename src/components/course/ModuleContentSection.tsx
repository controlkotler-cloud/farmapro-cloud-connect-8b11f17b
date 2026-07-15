
import { BookOpen } from 'lucide-react';
import DOMPurify from 'dompurify';
import { sanitizationLogger } from '@/lib/securityLogger';

interface ModuleContentSectionProps {
  content: string;
}

export const ModuleContentSection = ({ content }: ModuleContentSectionProps) => {
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3 mb-4">
        <div className="p-2 bg-brand-soft rounded-lg">
          <BookOpen className="h-5 w-5 text-brand-dark" />
        </div>
        <h4 className="text-lg font-semibold text-foreground flex items-center gap-2">
          <BookOpen className="h-5 w-5" /> Contenido del módulo
        </h4>
      </div>
      <div className="bg-brand-soft rounded-xl p-6 border border-brand/20">
        <div
          className="prose max-w-none text-foreground leading-relaxed"
          dangerouslySetInnerHTML={{ 
            __html: (() => {
              const sanitized = DOMPurify.sanitize(content);
              // Use secure logging for content sanitization
              sanitizationLogger.logContentSanitization(content, sanitized);
              return sanitized;
            })()
          }}
          style={{
            fontSize: '16px',
            lineHeight: '1.7'
          }}
        />
      </div>
    </div>
  );
};
