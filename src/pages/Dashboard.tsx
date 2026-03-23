
import { useAuth } from '@/hooks/useAuth';
import { useDashboard } from '@/hooks/useDashboard';
import { WelcomeCard } from '@/components/dashboard/WelcomeCard';
import { StatsGrid } from '@/components/dashboard/StatsGrid';
import { RecentActivity } from '@/components/dashboard/RecentActivity';
import { UpcomingChallenges } from '@/components/dashboard/UpcomingChallenges';
import { RecentBadges } from '@/components/dashboard/RecentBadges';
import { EngagementWidget } from '@/components/dashboard/EngagementWidget';
import { MotivationalBanner } from '@/components/dashboard/MotivationalBanner';

export const Dashboard = () => {
  const { profile } = useAuth();
  const { stats, recentActivity, getNextLevelProgress, getPointsToNextLevel } = useDashboard();

  return (
    <div className="space-y-6">
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
        </div>
      </div>
    </div>
  );
};
