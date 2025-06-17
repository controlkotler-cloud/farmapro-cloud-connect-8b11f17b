
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { HeroSection } from '@/components/home/HeroSection';
import { ConceptSection } from '@/components/home/ConceptSection';
import { EcosystemComponents } from '@/components/home/EcosystemComponents';
import { ValuesSection } from '@/components/home/ValuesSection';
import { TestimonialsSection } from '@/components/home/TestimonialsSection';
import { NewsletterSection } from '@/components/home/NewsletterSection';
import { CTASection } from '@/components/home/CTASection';
import { ContactSection } from '@/components/home/ContactSection';
import { Footer } from '@/components/home/Footer';

const Index = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-md border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-3">
              <img src="/lovable-uploads/9312b52a-2ecc-45f4-a83d-1fbfdbd673db.png" alt="farmapro" className="w-10 h-10" />
              <img src="/lovable-uploads/436f630b-82e2-4604-bbee-e932d97e61e2.png" alt="farmapro" className="h-8" />
            </div>
            <Link to="/login">
              <Button className="bg-gradient-to-r from-blue-600 to-green-600 hover:from-blue-700 hover:to-green-700">
                Iniciar Sesión
              </Button>
            </Link>
          </div>
        </div>
      </header>

      <HeroSection />
      <ConceptSection />
      <EcosystemComponents />
      <ValuesSection />
      <TestimonialsSection />
      <NewsletterSection />
      <CTASection />
      <ContactSection />
      <Footer />
    </div>
  );
};

export default Index;
