import { Skeleton } from "@/components/ui/skeleton";

export function ChatListSkeleton({ count = 6 }: { count?: number }) {
  return (
    <div className="divide-y divide-white/10">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="flex items-center gap-3 px-4 py-3">
          <Skeleton className="w-12 h-12 rounded-full bg-white/10" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-32 bg-white/10 rounded" />
            <Skeleton className="h-3 w-48 bg-white/5 rounded" />
          </div>
          <Skeleton className="h-3 w-10 bg-white/5 rounded" />
        </div>
      ))}
    </div>
  );
}
