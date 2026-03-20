
import { Card, CardContent } from '@/components/ui/card';
import { ThreadCard } from './ThreadCard';
import { EmptyForumState } from './EmptyForumState';

interface ForumThread {
  id: string;
  title: string;
  content: string;
  author_id: string;
  category_id: string;
  replies_count: number;
  is_pinned: boolean;
  last_reply_at: string;
  created_at: string;
  profiles?: {
    full_name: string;
  };
  forum_categories?: {
    name: string;
  };
}

interface ThreadListProps {
  threads: ForumThread[];
  loading: boolean;
  onThreadClick: (threadId: string) => void;
  onCreateThread: () => void;
}

export const ThreadList = ({ threads, loading, onThreadClick, onCreateThread }: ThreadListProps) => {
  if (loading) {
    return (
      <div className="space-y-4">
        {[...Array(5)].map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardContent className="p-6">
              <div className="h-4 bg-gray-200 rounded mb-2"></div>
              <div className="h-3 bg-gray-200 rounded"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (threads.length === 0) {
    return <EmptyForumState onCreateThread={onCreateThread} />;
  }

  return (
    <div className="space-y-3 md:space-y-4">
      {threads.map((thread, index) => (
        <ThreadCard
          key={thread.id}
          thread={thread}
          index={index}
          onClick={() => onThreadClick(thread.id)}
        />
      ))}
    </div>
  );
};
