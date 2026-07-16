import { MessageSquare, Clock, Pin, Star, Eye } from 'lucide-react';

interface ThreadCardProps {
  thread: {
    id: string;
    title: string;
    content: string;
    author_id: string;
    category_id: string;
    replies_count: number;
    views_count?: number;
    is_pinned: boolean;
    last_reply_at: string;
    created_at: string;
    author_display_name?: string | null;
    profiles?: {
      full_name: string;
    };
    forum_categories?: {
      name: string;
    };
  };
  index: number;
  onClick: () => void;
}

export const ThreadCard = ({ thread, onClick }: ThreadCardProps) => {
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));

    if (diffInHours < 1) return 'Hace menos de 1 hora';
    if (diffInHours < 24) return `Hace ${diffInHours} horas`;
    return `Hace ${Math.floor(diffInHours / 24)} días`;
  };

  const isFeaturedCategory =
    !!thread.forum_categories?.name &&
    ['Gestión Farmacéutica', 'Nuevos Medicamentos'].includes(thread.forum_categories.name);

  const excerpt = thread.content
    .substring(0, 150)
    .replace(/[*_~`#>\-]/g, '')
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    .replace(/\n+/g, ' ');

  return (
    <div onClick={onClick} className="group cursor-pointer py-4 transition-colors hover:bg-muted/40">
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-center gap-2">
          {thread.is_pinned && <Pin className="h-4 w-4 flex-none text-terracota" />}
          <h3 className="truncate font-bold text-foreground transition-colors group-hover:text-terracota">
            {thread.title}
          </h3>
        </div>
        <span className="inline-flex flex-none items-center gap-1 rounded-full bg-terracota-soft px-2.5 py-0.5 text-[10.5px] font-extrabold uppercase tracking-[0.12em] text-terracota">
          {thread.forum_categories?.name || 'General'}
          {isFeaturedCategory && <Star className="h-3 w-3" />}
        </span>
      </div>

      <p className="mt-1.5 line-clamp-2 text-sm text-muted-foreground">{excerpt}...</p>

      <div className="mt-2.5 flex flex-col gap-1.5 text-xs text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
          <span className="font-semibold text-foreground">
            {thread.author_display_name || thread.profiles?.full_name || 'Usuario farmapro'}
          </span>
          <span className="inline-flex items-center gap-1">
            <MessageSquare className="h-3.5 w-3.5" />
            <span className="font-bold tabular-nums text-terracota">{thread.replies_count}</span>
            respuestas
          </span>
          <span className="inline-flex items-center gap-1">
            <Eye className="h-3.5 w-3.5" />
            {thread.views_count ?? 0} vistas
          </span>
        </div>
        <span className="inline-flex items-center gap-1">
          <Clock className="h-3.5 w-3.5" />
          {formatDate(thread.last_reply_at)}
        </span>
      </div>
    </div>
  );
};
