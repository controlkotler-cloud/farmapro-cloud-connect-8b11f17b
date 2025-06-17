
import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';

interface SubscriptionLimits {
  coursesPerMonth: number;
  resourcesPerMonth: number;
  forumPostsPerMonth: number;
  premiumAccess: boolean;
}

interface UsageStats {
  coursesThisMonth: number;
  resourcesThisMonth: number;
  forumPostsThisMonth: number;
}

export const useSubscriptionLimits = () => {
  const { profile } = useAuth();
  const [limits, setLimits] = useState<SubscriptionLimits>({
    coursesPerMonth: 0,
    resourcesPerMonth: 0,
    forumPostsPerMonth: 0,
    premiumAccess: false
  });
  const [usage, setUsage] = useState<UsageStats>({
    coursesThisMonth: 0,
    resourcesThisMonth: 0,
    forumPostsThisMonth: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (profile?.id) {
      loadLimitsAndUsage();
    }
  }, [profile]);

  const loadLimitsAndUsage = async () => {
    if (!profile?.id) return;

    setLoading(true);

    // Define limits based on subscription role
    const planLimits = getPlanLimits(profile.subscription_role);
    setLimits(planLimits);

    // Calculate usage for current month
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    // Get courses completed this month
    const { data: coursesData } = await supabase
      .from('course_enrollments')
      .select('id')
      .eq('user_id', profile.id)
      .gte('completed_at', startOfMonth.toISOString())
      .not('completed_at', 'is', null);

    // Get resources downloaded this month
    const { data: resourcesData } = await supabase
      .from('resource_downloads')
      .select('id')
      .eq('user_id', profile.id)
      .gte('downloaded_at', startOfMonth.toISOString());

    // Get forum posts this month
    const { data: forumData } = await supabase
      .from('forum_threads')
      .select('id')
      .eq('author_id', profile.id)
      .gte('created_at', startOfMonth.toISOString());

    setUsage({
      coursesThisMonth: coursesData?.length || 0,
      resourcesThisMonth: resourcesData?.length || 0,
      forumPostsThisMonth: forumData?.length || 0
    });

    setLoading(false);
  };

  const getPlanLimits = (role: string): SubscriptionLimits => {
    switch (role) {
      case 'freemium':
        return {
          coursesPerMonth: 2,
          resourcesPerMonth: 5,
          forumPostsPerMonth: 10,
          premiumAccess: false
        };
      case 'student':
        return {
          coursesPerMonth: 5,
          resourcesPerMonth: 15,
          forumPostsPerMonth: 25,
          premiumAccess: true
        };
      case 'professional':
        return {
          coursesPerMonth: -1, // unlimited
          resourcesPerMonth: -1, // unlimited
          forumPostsPerMonth: -1, // unlimited
          premiumAccess: true
        };
      default:
        return {
          coursesPerMonth: 2,
          resourcesPerMonth: 5,
          forumPostsPerMonth: 10,
          premiumAccess: false
        };
    }
  };

  const canAccessCourse = (isPremium: boolean = false) => {
    if (isPremium && !limits.premiumAccess) return false;
    if (limits.coursesPerMonth === -1) return true;
    return usage.coursesThisMonth < limits.coursesPerMonth;
  };

  const canDownloadResource = (isPremium: boolean = false) => {
    if (isPremium && !limits.premiumAccess) return false;
    if (limits.resourcesPerMonth === -1) return true;
    return usage.resourcesThisMonth < limits.resourcesPerMonth;
  };

  const canCreateForumPost = () => {
    if (limits.forumPostsPerMonth === -1) return true;
    return usage.forumPostsThisMonth < limits.forumPostsPerMonth;
  };

  const getRemainingCourses = () => {
    if (limits.coursesPerMonth === -1) return -1;
    return Math.max(0, limits.coursesPerMonth - usage.coursesThisMonth);
  };

  const getRemainingResources = () => {
    if (limits.resourcesPerMonth === -1) return -1;
    return Math.max(0, limits.resourcesPerMonth - usage.resourcesThisMonth);
  };

  const getRemainingForumPosts = () => {
    if (limits.forumPostsPerMonth === -1) return -1;
    return Math.max(0, limits.forumPostsPerMonth - usage.forumPostsThisMonth);
  };

  return {
    limits,
    usage,
    loading,
    canAccessCourse,
    canDownloadResource,
    canCreateForumPost,
    getRemainingCourses,
    getRemainingResources,
    getRemainingForumPosts,
    refreshLimits: loadLimitsAndUsage
  };
};
