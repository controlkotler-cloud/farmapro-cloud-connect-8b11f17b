
import { useAuth } from '@/hooks/useAuth';
import { useDashboard } from '@/hooks/useDashboard';
import { WelcomeCard } from '@/components/dashboard/WelcomeCard';
import { StatsGrid } from '@/components/dashboard/StatsGrid';
import { RecentActivity } from '@/components/dashboard/RecentActivity';
import { UpcomingChallenges } from '@/components/dashboard/UpcomingChallenges';

export const Dashboard = () => {
  const { profile } = useAuth();
  const { stats, recentActivity, getNextLevelProgress, getPointsToNextLevel } = useDashboard();

  console.log('Dashboard stats:', stats);

  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <WelcomeCard
        userName={profile?.full_name || 'Usuario'}
        level={stats.level}
        totalPoints={stats.totalPoints}
        getNextLevelProgress={getNextLevelProgress}
        getPointsToNextLevel={getPointsToNextLevel}
      />

      {/* Stats Grid */}
      <StatsGrid
        coursesCompleted={stats.coursesCompleted}
        resourcesDownloaded={stats.resourcesDownloaded}
        forumPosts={stats.forumPosts}
        challengesCompleted={stats.challengesCompleted}
      />

      {/* Recent Activity & Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <RecentActivity activities={recentActivity} />
        <UpcomingChallenges 
          coursesCompleted={stats.coursesCompleted}
          resourcesDownloaded={stats.resourcesDownloaded}
        />
      </div>
    </div>
  );
};
