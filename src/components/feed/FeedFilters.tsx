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
    <div className="flex items-center gap-4 px-4 py-2 overflow-x-auto scrollbar-hide">
      {filters.map((f) => (
        <button
          key={f.id}
          onClick={() => onFilterChange(f.id)}
          className={cn(
            "relative py-1 text-sm font-medium whitespace-nowrap transition-all duration-200",
            "text-foreground/55 hover:text-foreground/75",
            "dark:text-muted-foreground dark:hover:text-foreground/80",
            filter === f.id && [
              "text-foreground dark:text-foreground",
              "after:content-[''] after:absolute after:left-0 after:right-0 after:-bottom-0.5 after:h-[2px]",
              "after:bg-foreground/25 dark:after:bg-foreground/30 after:rounded-full",
            ]
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
