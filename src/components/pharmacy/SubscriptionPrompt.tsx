
import { Card, CardContent } from '@/components/ui/card';
import { Link } from 'react-router-dom';
import { ContactForm } from './ContactForm';

interface SubscriptionPromptProps {
  canCreateListing: boolean;
}

export const SubscriptionPrompt = ({ canCreateListing }: SubscriptionPromptProps) => {
  if (!canCreateListing) {
    return (
      <Card className="border-blue-200 bg-blue-50">
        <CardContent className="p-6">
          <p className="text-blue-800">
            <strong>¿Tienes una farmacia y quieres venderla?</strong> Actualiza al plan premium para poder subir todas las características y encontrar el comprador ideal.{' '}
            <Link 
              to="/subscription?tab=plans" 
              className="underline hover:text-blue-900 font-medium"
            >
              Ver planes
            </Link>
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-green-200 bg-green-50">
      <CardContent className="p-6">
        <ContactForm />
      </CardContent>
    </Card>
  );
};
