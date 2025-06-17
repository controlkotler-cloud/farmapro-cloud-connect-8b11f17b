
import { useAuth } from '@/hooks/useAuth';

type PlanType = 'freemium' | 'estudiante' | 'profesional' | 'premium';

const planHierarchy: Record<PlanType, number> = {
  freemium: 0,
  estudiante: 1,
  profesional: 2,
  premium: 3
};

export const useAccessControl = () => {
  const { profile } = useAuth();
  
  const currentPlan = (profile?.subscription_role || 'freemium') as PlanType;
  const currentPlanLevel = planHierarchy[currentPlan];

  const hasAccess = (requiredPlan: PlanType): boolean => {
    const requiredPlanLevel = planHierarchy[requiredPlan];
    return currentPlanLevel >= requiredPlanLevel;
  };

  const getPlanRestrictions = () => {
    switch (currentPlan) {
      case 'freemium':
        return {
          canAccessPremiumEvents: false,
          canAccessPremiumPromotions: false,
          canAccessAdvancedCourses: false,
          canCreatePharmacyListings: false,
          canAccessPremiumResources: false
        };
      case 'estudiante':
        return {
          canAccessPremiumEvents: true,
          canAccessPremiumPromotions: false,
          canAccessAdvancedCourses: true,
          canCreatePharmacyListings: false,
          canAccessPremiumResources: true
        };
      case 'profesional':
        return {
          canAccessPremiumEvents: true,
          canAccessPremiumPromotions: true,
          canAccessAdvancedCourses: true,
          canCreatePharmacyListings: true,
          canAccessPremiumResources: true
        };
      case 'premium':
        return {
          canAccessPremiumEvents: true,
          canAccessPremiumPromotions: true,
          canAccessAdvancedCourses: true,
          canCreatePharmacyListings: true,
          canAccessPremiumResources: true
        };
      default:
        return {
          canAccessPremiumEvents: false,
          canAccessPremiumPromotions: false,
          canAccessAdvancedCourses: false,
          canCreatePharmacyListings: false,
          canAccessPremiumResources: false
        };
    }
  };

  return {
    currentPlan,
    hasAccess,
    restrictions: getPlanRestrictions()
  };
};
