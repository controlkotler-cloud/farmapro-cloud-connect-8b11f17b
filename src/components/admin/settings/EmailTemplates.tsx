
import { useState } from 'react';
import { SettingsSection } from './SettingsSection';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Mail, Save } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface EmailTemplate {
  subject: string;
  content: string;
  variables: string[];
}

interface EmailTemplatesConfig {
  password_reset: EmailTemplate;
  welcome: EmailTemplate;
  course_completion: EmailTemplate;
  subscription_renewal: EmailTemplate;
  verification: EmailTemplate;
}

interface EmailTemplatesProps {
  config: EmailTemplatesConfig;
  onSave: (config: EmailTemplatesConfig) => void;
}

export const EmailTemplates = ({ config, onSave }: EmailTemplatesProps) => {
  const [formData, setFormData] = useState(config);
  const { toast } = useToast();

  const handleSave = () => {
    onSave(formData);
    toast({
      title: "Plantillas guardadas",
      description: "Las plantillas de email se han actualizado correctamente",
    });
  };

  const updateTemplate = (templateKey: keyof EmailTemplatesConfig, field: keyof EmailTemplate, value: string) => {
    setFormData(prev => ({
      ...prev,
      [templateKey]: {
        ...prev[templateKey],
        [field]: value
      }
    }));
  };

  const templates = [
    {
      key: 'password_reset' as keyof EmailTemplatesConfig,
      title: 'Recuperación de Contraseña',
      description: 'Email enviado cuando un usuario solicita restablecer su contraseña',
      variables: ['{{user_name}}', '{{reset_link}}', '{{company_name}}']
    },
    {
      key: 'welcome' as keyof EmailTemplatesConfig,
      title: 'Bienvenida',
      description: 'Email de bienvenida para nuevos usuarios registrados',
      variables: ['{{user_name}}', '{{company_name}}', '{{login_url}}']
    },
    {
      key: 'course_completion' as keyof EmailTemplatesConfig,
      title: 'Curso Completado',
      description: 'Email enviado cuando un usuario completa un curso',
      variables: ['{{user_name}}', '{{course_name}}', '{{certificate_url}}', '{{points_earned}}']
    },
    {
      key: 'subscription_renewal' as keyof EmailTemplatesConfig,
      title: 'Renovación de Suscripción',
      description: 'Email recordatorio de renovación de suscripción',
      variables: ['{{user_name}}', '{{plan_name}}', '{{renewal_date}}', '{{renewal_url}}']
    },
    {
      key: 'verification' as keyof EmailTemplatesConfig,
      title: 'Verificación de Email',
      description: 'Email para verificar la dirección de correo electrónico',
      variables: ['{{user_name}}', '{{verification_link}}', '{{company_name}}']
    }
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Plantillas de Email</h2>
          <p className="text-gray-600">Personaliza los mensajes de email automáticos del portal</p>
        </div>
        <Button onClick={handleSave} size="lg" className="flex items-center space-x-2">
          <Save className="h-4 w-4" />
          <span>Guardar Todas</span>
        </Button>
      </div>

      {templates.map((template) => (
        <SettingsSection
          key={template.key}
          title={template.title}
          description={template.description}
          icon={<Mail className="h-5 w-5 text-blue-600" />}
        >
          <div className="space-y-4">
            <div>
              <Label htmlFor={`${template.key}-subject`}>Asunto del Email</Label>
              <Input
                id={`${template.key}-subject`}
                value={formData[template.key].subject}
                onChange={(e) => updateTemplate(template.key, 'subject', e.target.value)}
                placeholder="Asunto del email..."
              />
            </div>
            
            <div>
              <Label htmlFor={`${template.key}-content`}>Contenido del Email</Label>
              <Textarea
                id={`${template.key}-content`}
                value={formData[template.key].content}
                onChange={(e) => updateTemplate(template.key, 'content', e.target.value)}
                placeholder="Contenido del email en HTML o texto plano..."
                rows={8}
                className="font-mono text-sm"
              />
            </div>

            <div className="bg-gray-50 p-4 rounded-lg">
              <h4 className="font-medium mb-2 text-gray-700">Variables Disponibles:</h4>
              <div className="flex flex-wrap gap-2">
                {template.variables.map((variable) => (
                  <code key={variable} className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-sm">
                    {variable}
                  </code>
                ))}
              </div>
              <p className="text-sm text-gray-600 mt-2">
                Usa estas variables en el asunto o contenido del email. Se reemplazarán automáticamente con los valores correspondientes.
              </p>
            </div>
          </div>
        </SettingsSection>
      ))}
    </div>
  );
};
