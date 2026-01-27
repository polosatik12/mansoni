import { X, Search } from "lucide-react";
import { cn } from "@/lib/utils";
import { useNavigate } from "react-router-dom";

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
  const navigate = useNavigate();

  return (
    <div className="flex items-center gap-3 px-4 py-3">
      {/* Glass pill container for filters */}
      <div className="flex-1 flex items-center gap-1 px-1.5 py-1.5 rounded-full bg-black/40 backdrop-blur-xl border border-white/10">
        {filters.map((f) => (
          <button
            key={f.id}
            onClick={() => onFilterChange(f.id)}
            className={cn(
              "flex-1 px-3 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all duration-200",
              filter === f.id
                ? "bg-white/20 text-white"
                : "text-white/60 hover:text-white/80"
            )}
          >
            {f.label}
          </button>
        ))}
        
        {/* Reset button inside pill */}
        {filter !== 'all' && (
          <button
            onClick={() => onFilterChange('all')}
            className="p-2 rounded-full text-white/50 hover:text-white hover:bg-white/10 transition-colors"
            aria-label="Сбросить фильтр"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Separate circular search button */}
      <button
        onClick={() => navigate('/search')}
        className="w-12 h-12 rounded-full bg-black/40 backdrop-blur-xl border border-white/10 flex items-center justify-center text-white/70 hover:text-white hover:bg-black/50 transition-all"
        aria-label="Поиск"
      >
        <Search className="w-5 h-5" />
      </button>
    </div>
  );
}
