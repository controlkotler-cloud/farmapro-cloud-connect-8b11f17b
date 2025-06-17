
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent } from '@/components/ui/card';
import { motion } from 'framer-motion';
import { SubscriptionHeader } from './status/SubscriptionHeader';
import { PlanDetails } from './status/PlanDetails';
import { UserInfo } from './status/UserInfo';
import { ActionButtons } from './status/ActionButtons';
import { HelpSection } from './status/HelpSection';
import { PlanType } from './status/PlanConfig';

export const SubscriptionStatus = () => {
  const { profile } = useAuth();
  const currentPlan = (profile?.subscription_role || 'freemium') as PlanType;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <Card className="overflow-hidden">
        <SubscriptionHeader currentPlan={currentPlan} />
        
        <CardContent className="p-6">
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <PlanDetails 
                currentPlan={currentPlan}
                subscriptionStatus={profile?.subscription_status}
                trialEndsAt={profile?.trial_ends_at}
              />
              
              <UserInfo 
                email={profile?.email}
                fullName={profile?.full_name}
                pharmacyName={profile?.pharmacy_name}
              />
            </div>

            <ActionButtons currentPlan={currentPlan} />

            <HelpSection />
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};
