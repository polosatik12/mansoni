import { Skeleton } from "@/components/ui/skeleton";

export function FeedSkeleton({ count = 3 }: { count?: number }) {
  return (
    <div className="space-y-0">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="border-b border-white/10 p-4 space-y-3">
          {/* Author row */}
          <div className="flex items-center gap-3">
            <Skeleton className="w-10 h-10 rounded-full" />
            <div className="space-y-1.5 flex-1">
              <Skeleton className="h-4 w-28 rounded" />
              <Skeleton className="h-3 w-16 rounded" />
            </div>
          </div>
          {/* Content */}
          <div className="space-y-1.5">
            <Skeleton className="h-4 w-full rounded" />
            <Skeleton className="h-4 w-3/4 rounded" />
          </div>
          {/* Image placeholder (every other) */}
          {i % 2 === 0 && (
            <Skeleton className="h-48 w-full rounded-xl" />
          )}
          {/* Actions row */}
          <div className="flex items-center gap-6 pt-1">
            <Skeleton className="h-5 w-12 rounded" />
            <Skeleton className="h-5 w-12 rounded" />
            <Skeleton className="h-5 w-12 rounded" />
          </div>
        </div>
      ))}
    </div>
  );
}
