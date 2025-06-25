
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ReactNode } from 'react';

interface SettingsSectionProps {
  title: string;
  description?: string;
  icon?: ReactNode;
  children: ReactNode;
}

export const SettingsSection = ({ title, description, icon, children }: SettingsSectionProps) => {
  return (
    <Card className="mb-6">
      <CardHeader>
        <div className="flex items-center space-x-3">
          {icon && <div className="p-2 bg-blue-100 rounded-lg">{icon}</div>}
          <div>
            <CardTitle className="text-lg">{title}</CardTitle>
            {description && (
              <CardDescription className="mt-1">{description}</CardDescription>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent>{children}</CardContent>
    </Card>
  );
};
