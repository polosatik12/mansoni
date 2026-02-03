import { X } from "lucide-react";
import { cn } from "@/lib/utils";

export type ContentFilter = 'all' | 'media' | 'text';

interface FeedFiltersProps {
  filter: ContentFilter;
  onFilterChange: (filter: ContentFilter) => void;
}

const filters: { id: ContentFilter; label: string }[] = [
  { id: 'all', label: 'Все' },
  { id: 'media', label: 'Публикации' },
  { id: 'text', label: 'Текст' },
];

export function FeedFilters({ filter, onFilterChange }: FeedFiltersProps) {
  return (
    <div className="flex items-center gap-2 px-4 py-3 overflow-x-auto scrollbar-hide">
      {filters.map((f) => (
        <button
          key={f.id}
          onClick={() => onFilterChange(f.id)}
          className={cn(
            "px-4 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-all duration-200",
            filter === f.id
              ? "bg-foreground/90 dark:bg-primary text-background dark:text-primary-foreground"
              : "bg-white/30 dark:bg-secondary/50 backdrop-blur-sm text-foreground/70 dark:text-secondary-foreground hover:bg-white/50 dark:hover:bg-secondary/80"
          )}
        >
          {f.label}
        </button>
      ))}
      
      {filter !== 'all' && (
        <button
          onClick={() => onFilterChange('all')}
          className="p-1.5 rounded-full text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors ml-auto"
          aria-label="Сбросить фильтр"
        >
          <X className="w-4 h-4" />
        </button>
      )}
    </div>
  );
}
