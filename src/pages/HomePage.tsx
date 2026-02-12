import { useState, useMemo } from "react";
import { FeedHeader } from "@/components/feed/FeedHeader";
import { FeedFilters, ContentFilter } from "@/components/feed/FeedFilters";
import { PostCard } from "@/components/feed/PostCard";
import { PullToRefresh } from "@/components/feed/PullToRefresh";
import { FeedSkeleton } from "@/components/feed/FeedSkeleton";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { BrandBackground } from "@/components/ui/brand-background";
import { usePosts } from "@/hooks/usePosts";
import { usePresence } from "@/hooks/usePresence";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";
import { ru } from "date-fns/locale";

export function HomePage() {
  const { posts, loading, refetch } = usePosts();
  const [contentFilter, setContentFilter] = useState<ContentFilter>('all');
  
  // Initialize presence tracking
  usePresence();

  const handleRefresh = async () => {
    await refetch();
    toast.success("Лента обновлена!", {
      duration: 2000,
      position: "top-center",
    });
  };

  const formatTimeAgo = (dateString: string) => {
    try {
      return formatDistanceToNow(new Date(dateString), { addSuffix: false, locale: ru });
    } catch {
      return "";
    }
  };

  // Client-side filtering based on content type
  const filteredPosts = useMemo(() => {
    if (contentFilter === 'media') {
      return posts.filter(p => (p.media?.length ?? 0) > 0);
    }
    if (contentFilter === 'text') {
      return posts.filter(p => (p.media?.length ?? 0) === 0);
    }
    return posts;
  }, [posts, contentFilter]);

  return (
    <PullToRefresh onRefresh={handleRefresh}>
      <BrandBackground />
      <div className="min-h-[100dvh] relative z-10">
        <FeedHeader />
        
        <FeedFilters 
          filter={contentFilter} 
          onFilterChange={setContentFilter} 
        />
        
        {loading && posts.length === 0 ? (
          <FeedSkeleton count={4} />
        ) : filteredPosts.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center px-4">
            <p className="text-white/60 text-lg">
              {contentFilter === 'all' 
                ? "Пока нет публикаций" 
                : contentFilter === 'media' 
                  ? "Нет публикаций с медиа"
                  : "Нет текстовых публикаций"}
            </p>
            <p className="text-white/30 text-sm mt-1">
              {contentFilter === 'all' 
                ? "Создайте первую запись или подпишитесь на авторов"
                : "Попробуйте другой фильтр"}
            </p>
          </div>
        ) : (
          <div className="space-y-0">
            {filteredPosts.map((post) => (
              <ErrorBoundary key={post.id}>
                <PostCard
                  id={post.id}
                  authorId={post.author_id}
                  author={{
                    name: post.author?.display_name || "Пользователь",
                    username: post.author?.display_name || post.author_id.slice(0, 8),
                    avatar: post.author?.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${post.author_id}`,
                    verified: false,
                  }}
                  content={post.content || ""}
                  images={post.media?.map(m => m.media_url)}
                  likes={post.likes_count}
                  comments={post.comments_count}
                  shares={post.shares_count}
                  mentions={post.mentions}
                  timeAgo={formatTimeAgo(post.created_at)}
                  isLiked={post.is_liked}
                />
              </ErrorBoundary>
            ))}
          </div>
        )}
      </div>
    </PullToRefresh>
  );
}
