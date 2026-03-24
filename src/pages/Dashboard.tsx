import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useDashboard } from '@/hooks/useDashboard';
import { WelcomeCard } from '@/components/dashboard/WelcomeCard';
import { StatsGrid } from '@/components/dashboard/StatsGrid';
import { RecentActivity } from '@/components/dashboard/RecentActivity';
import { UpcomingChallenges } from '@/components/dashboard/UpcomingChallenges';
import { RecentBadges } from '@/components/dashboard/RecentBadges';
import { MiniLeaderboard } from '@/components/dashboard/MiniLeaderboard';
import { EngagementWidget } from '@/components/dashboard/EngagementWidget';
import { MotivationalBanner } from '@/components/dashboard/MotivationalBanner';
import { OnboardingWizard } from '@/components/onboarding/OnboardingWizard';

export const Dashboard = () => {
  const { profile, reloadProfile } = useAuth();
  const { stats, recentActivity, getNextLevelProgress, getPointsToNextLevel } = useDashboard();
  const [showOnboarding, setShowOnboarding] = useState(
    profile ? !(profile as any).has_completed_onboarding : false
  );

  const handleOnboardingComplete = () => {
    setShowOnboarding(false);
    reloadProfile();
  };

  return (
    <div className="space-y-6">
      {showOnboarding && <OnboardingWizard onComplete={handleOnboardingComplete} />}
      <MotivationalBanner />
      <WelcomeCard
        userName={profile?.full_name || 'Usuario'}
        level={stats.level}
        totalPoints={stats.totalPoints}
        getNextLevelProgress={getNextLevelProgress}
        getPointsToNextLevel={getPointsToNextLevel}
      />

      <StatsGrid
        coursesCompleted={stats.coursesCompleted}
        resourcesDownloaded={stats.resourcesDownloaded}
        forumPosts={stats.forumPosts}
        challengesCompleted={stats.challengesCompleted}
      />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="space-y-6">
          <RecentActivity activities={recentActivity} />
          <EngagementWidget />
        </div>
        <div className="space-y-6">
          <UpcomingChallenges />
          <RecentBadges />
          <MiniLeaderboard />
        </div>
      </div>
    </div>
  );
};
