
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Plus } from 'lucide-react';

export const ContactForm = () => {
  const [showContactForm, setShowContactForm] = useState(false);
  const [contactForm, setContactForm] = useState({
    name: '',
    email: '',
    phone: '',
    pharmacyName: '',
    location: '',
    message: ''
  });

  const submitContactForm = async () => {
    console.log('Contact form submitted:', contactForm);
    setContactForm({
      name: '',
      email: '',
      phone: '',
      pharmacyName: '',
      location: '',
      message: ''
    });
    setShowContactForm(false);
  };

  return (
    <div className="space-y-4">
      <p className="text-green-800">
        <strong>¿Quieres vender tu farmacia?</strong> Rellena este formulario y contactaremos contigo
      </p>
      <Collapsible open={showContactForm} onOpenChange={setShowContactForm}>
        <CollapsibleTrigger asChild>
          <Button variant="outline" className="w-full">
            <Plus className="h-4 w-4 mr-2" />
            {showContactForm ? 'Ocultar formulario' : 'Mostrar formulario'}
          </Button>
        </CollapsibleTrigger>
        <CollapsibleContent className="space-y-4 mt-4">
          <div className="grid grid-cols-2 gap-4">
            <Input
              placeholder="Nombre completo"
              value={contactForm.name}
              onChange={(e) => setContactForm({ ...contactForm, name: e.target.value })}
            />
            <Input
              placeholder="Email"
              type="email"
              value={contactForm.email}
              onChange={(e) => setContactForm({ ...contactForm, email: e.target.value })}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Input
              placeholder="Teléfono"
              value={contactForm.phone}
              onChange={(e) => setContactForm({ ...contactForm, phone: e.target.value })}
            />
            <Input
              placeholder="Nombre de la farmacia"
              value={contactForm.pharmacyName}
              onChange={(e) => setContactForm({ ...contactForm, pharmacyName: e.target.value })}
            />
          </div>
          <Input
            placeholder="Ubicación de la farmacia"
            value={contactForm.location}
            onChange={(e) => setContactForm({ ...contactForm, location: e.target.value })}
          />
          <Textarea
            placeholder="Mensaje adicional (opcional)"
            value={contactForm.message}
            onChange={(e) => setContactForm({ ...contactForm, message: e.target.value })}
            rows={3}
          />
          <Button onClick={submitContactForm} className="w-full">
            Enviar
          </Button>
        </CollapsibleContent>
      </Collapsible>
    </div>
  );
};
