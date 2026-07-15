import { motion } from 'framer-motion';
import { CONTENT_TYPES, ContentType } from '@/hooks/useCreativeChat';
import { cn } from '@/lib/utils';

interface ContentTypeGridProps {
  selected: ContentType;
  onSelect: (type: ContentType) => void;
}

export const ContentTypeGrid = ({ selected, onSelect }: ContentTypeGridProps) => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
      {CONTENT_TYPES.map((type, i) => (
        <motion.button
          key={type.id}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.04, duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
          onClick={() => onSelect(type.id)}
          className={cn(
            'text-left rounded-xl p-4 transition-all duration-200 ring-1 cursor-pointer',
            'hover:shadow-md active:scale-[0.97]',
            selected === type.id
              ? 'bg-ciruela-soft ring-ciruela shadow-sm'
              : 'bg-card ring-border hover:ring-muted-foreground/30'
          )}
        >
          <div className={cn(
            'text-2xl mb-2',
            selected === type.id ? 'text-ciruela' : 'text-muted-foreground'
          )}>{type.icon}</div>
          <div className={cn(
            'font-semibold text-sm mb-1',
            selected === type.id ? 'text-ciruela' : 'text-foreground'
          )}>
            {type.label}
          </div>
          <p className="text-xs text-muted-foreground leading-relaxed">{type.description}</p>
        </motion.button>
      ))}
    </div>
  );
};
