
import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Footer } from '@/components/home/Footer';
import { HeroSection } from '@/components/subscription/HeroSection';
import { BenefitsSection } from '@/components/subscription/BenefitsSection';
import { PortalPreviewSection } from '@/components/subscription/PortalPreviewSection';
import { FeaturedContentSection } from '@/components/subscription/FeaturedContentSection';
import { PricingSection } from '@/components/subscription/PricingSection';
import { TestimonialsSection } from '@/components/subscription/TestimonialsSection';
import { FAQSection } from '@/components/subscription/FAQSection';
import { MainCTASection } from '@/components/subscription/MainCTASection';
import { AdditionalFeaturesSection } from '@/components/subscription/AdditionalFeaturesSection';
import { OnboardingSection } from '@/components/subscription/OnboardingSection';

const Subscription = () => {
  const [searchParams] = useSearchParams();
  const [activeTab, setActiveTab] = useState('status');

  useEffect(() => {
    const tab = searchParams.get('tab');
    if (tab === 'plans') {
      setActiveTab('plans');
    }
  }, [searchParams]);

  return (
    <div className="min-h-screen bg-gray-50">
      <HeroSection />
      <BenefitsSection />
      <PortalPreviewSection />
      <FeaturedContentSection />
      <PricingSection />
      <TestimonialsSection />
      <FAQSection />
      <MainCTASection />
      <AdditionalFeaturesSection />
      <OnboardingSection />
      <Footer />
    </div>
  );
};

export default Subscription;
