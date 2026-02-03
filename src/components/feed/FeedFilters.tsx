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
    <div className="flex items-center gap-1 px-4 py-2 overflow-x-auto scrollbar-hide">
      {filters.map((f) => (
        <button
          key={f.id}
          onClick={() => onFilterChange(f.id)}
          className={cn(
            "px-3 py-1 rounded-full text-sm font-medium whitespace-nowrap transition-all duration-200",
            filter === f.id
              ? "text-foreground dark:text-primary-foreground bg-black/10 dark:bg-primary"
              : "text-foreground/50 dark:text-muted-foreground hover:text-foreground/70"
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
