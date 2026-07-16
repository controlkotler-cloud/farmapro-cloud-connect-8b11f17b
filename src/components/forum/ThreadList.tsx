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
      <div className="divide-y divide-border">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="animate-pulse py-4">
            <div className="mb-2 h-4 w-2/3 rounded bg-muted"></div>
            <div className="h-3 w-1/3 rounded bg-muted"></div>
          </div>
        ))}
      </div>
    );
  }

  if (threads.length === 0) {
    return <EmptyForumState onCreateThread={onCreateThread} />;
  }

  return (
    <div className="divide-y divide-border">
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
