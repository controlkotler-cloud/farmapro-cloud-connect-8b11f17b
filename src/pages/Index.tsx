
import { PublicLayout } from '@/components/layout/PublicLayout';
import { HeroSection } from '@/components/home/HeroSection';
import { ValuesSection } from '@/components/home/ValuesSection';
import { ConceptSection } from '@/components/home/ConceptSection';
import { EcosystemComponents } from '@/components/home/EcosystemComponents';
import { TestimonialsSection } from '@/components/home/TestimonialsSection';
import { CTASection } from '@/components/home/CTASection';
import { NewsletterSection } from '@/components/home/NewsletterSection';
import { ContactSection } from '@/components/home/ContactSection';

const Index = () => {
  return (
    <PublicLayout>
      <HeroSection />
      <ValuesSection />
      <ConceptSection />
      <EcosystemComponents />
      <TestimonialsSection />
      <CTASection />
      <NewsletterSection />
      <ContactSection />
    </PublicLayout>
  );
};

export default Index;
