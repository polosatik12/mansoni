
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
    <div className="flex items-center gap-4 px-4 py-2 overflow-x-auto scrollbar-hide bg-black/10 backdrop-blur-md">
      {filters.map((f) => (
        <button
          key={f.id}
          onClick={() => onFilterChange(f.id)}
          className={cn(
            "relative py-1 text-sm font-medium whitespace-nowrap transition-all duration-200",
            filter === f.id
              ? "text-white/80"
              : "text-white/40 hover:text-white/60"
          )}
        >
          {f.label}
        </button>
      ))}
    </div>
  );
}
