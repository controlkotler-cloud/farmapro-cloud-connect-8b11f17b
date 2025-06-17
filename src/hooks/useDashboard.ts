
import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { loadUserStats, loadRecentActivity } from '@/services/dashboardStatsService';
import { getNextLevelProgress, getPointsToNextLevel } from '@/services/pointsService';
import type { DashboardStats, ActivityItem } from '@/types/dashboard';

export const useDashboard = () => {
  const { profile } = useAuth();
  const [stats, setStats] = useState<DashboardStats>({
    totalPoints: 0,
    level: 1,
    coursesCompleted: 0,
    resourcesDownloaded: 0,
    forumPosts: 0,
    challengesCompleted: 0,
  });
  const [recentActivity, setRecentActivity] = useState<ActivityItem[]>([]);

  useEffect(() => {
    if (profile?.id) {
      loadDashboardData();
    }
  }, [profile]);

  const reloadStats = async () => {
    if (profile?.id) {
      await loadDashboardData();
    }
  };

  const loadDashboardData = async () => {
    if (!profile?.id) return;

    try {
      const [statsData, activityData] = await Promise.all([
        loadUserStats(profile.id),
        loadRecentActivity(profile.id)
      ]);

      setStats(statsData);
      setRecentActivity(activityData);
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    }
  };

  const getNextLevelProgressValue = () => getNextLevelProgress(stats.totalPoints);
  const getPointsToNextLevelValue = () => getPointsToNextLevel(stats.totalPoints);

  return {
    stats,
    recentActivity,
    getNextLevelProgress: getNextLevelProgressValue,
    getPointsToNextLevel: getPointsToNextLevelValue,
    reloadStats,
  };
};
