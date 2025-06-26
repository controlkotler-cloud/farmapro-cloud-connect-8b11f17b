
import { Card, CardContent } from '@/components/ui/card';
import { ContactForm } from './ContactForm';

interface SubscriptionPromptProps {
  canCreateListing: boolean;
}

export const SubscriptionPrompt = ({ canCreateListing }: SubscriptionPromptProps) => {
  if (!canCreateListing) {
    return null; // El componente FarmaciasActions ya maneja este caso
  }

  return (
    <Card className="border-green-200 bg-green-50">
      <CardContent className="p-6">
        <ContactForm />
      </CardContent>
    </Card>
  );
};
