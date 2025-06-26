
import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { ThreadView } from '@/components/forum/ThreadView';
import { CommunityHeader } from '@/components/community/CommunityHeader';
import { CommunityStats } from '@/components/community/CommunityStats';
import { CommunityContent } from '@/components/community/CommunityContent';

const Comunidad = () => {
  const { profile } = useAuth();
  const [selectedThreadId, setSelectedThreadId] = useState<string | null>(null);
  const [forumStats, setForumStats] = useState({
    totalThreads: 0,
    totalReplies: 0,
    userForumPosts: 0
  });

  useEffect(() => {
    // Scroll to top when component mounts
    window.scrollTo(0, 0);
    
    loadForumStats();
  }, []);

  const loadForumStats = async () => {
    // Total threads
    const { count: totalThreads } = await supabase
      .from('forum_threads')
      .select('*', { count: 'exact', head: true });

    // Total replies
    const { count: totalReplies } = await supabase
      .from('forum_replies')
      .select('*', { count: 'exact', head: true });

    // User forum posts (threads + replies)
    let userForumPosts = 0;
    if (profile?.id) {
      const { count: userThreads } = await supabase
        .from('forum_threads')
        .select('*', { count: 'exact', head: true })
        .eq('author_id', profile.id);

      const { count: userReplies } = await supabase
        .from('forum_replies')
        .select('*', { count: 'exact', head: true })
        .eq('author_id', profile.id);

      userForumPosts = (userThreads || 0) + (userReplies || 0);
    }

    setForumStats({
      totalThreads: totalThreads || 0,
      totalReplies: totalReplies || 0,
      userForumPosts
    });
  };

  const handleThreadClick = (threadId: string) => {
    setSelectedThreadId(threadId);
  };

  const handleBackToForum = () => {
    setSelectedThreadId(null);
    loadForumStats();
  };

  // Show thread view if a thread is selected
  if (selectedThreadId) {
    return (
      <ThreadView 
        threadId={selectedThreadId} 
        onBack={handleBackToForum}
      />
    );
  }

  return (
    <div className="space-y-6">
      {/* Header Section */}
      <CommunityHeader 
        userLevel={profile?.level || 1}
        userPoints={profile?.total_points || 0}
      />

      {/* Stats Section */}
      <CommunityStats 
        totalThreads={forumStats.totalThreads}
        totalReplies={forumStats.totalReplies}
        userForumPosts={forumStats.userForumPosts}
        userLevel={profile?.level || 1}
        userPoints={profile?.total_points || 0}
      />

      {/* Main Content */}
      <CommunityContent 
        onThreadClick={handleThreadClick}
        onDataChange={loadForumStats}
      />
    </div>
  );
};

export default Comunidad;
