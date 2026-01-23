import { useState } from "react";
import { FeedHeader } from "@/components/feed/FeedHeader";
import { CreatePost } from "@/components/feed/CreatePost";
import { PostCard } from "@/components/feed/PostCard";
import { PullToRefresh } from "@/components/feed/PullToRefresh";
import { usePosts, FeedFilter } from "@/hooks/usePosts";
import { usePresence } from "@/hooks/usePresence";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { ru } from "date-fns/locale";
import { cn } from "@/lib/utils";

const feedTabs: { id: FeedFilter; label: string }[] = [
  { id: "all", label: "Для вас" },
  { id: "following", label: "Подписки" },
];

export function HomePage() {
  const [activeTab, setActiveTab] = useState<FeedFilter>("all");
  const { posts, loading, refetch } = usePosts(activeTab);
  
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

  return (
    <PullToRefresh onRefresh={handleRefresh}>
      <div className="min-h-screen">
        <FeedHeader />
        
        {/* Feed Tabs */}
        <div className="flex justify-center px-4 py-3 border-b border-border">
          <div className="flex bg-muted rounded-full p-1">
            {feedTabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  "px-4 py-1.5 text-sm font-medium rounded-full transition-all",
                  activeTab === tab.id
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>
        
        <CreatePost />
        
        {loading && posts.length === 0 ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : posts.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center px-4">
            <p className="text-muted-foreground text-lg">
              {activeTab === "following" 
                ? "Нет публикаций от подписок" 
                : "Пока нет публикаций"}
            </p>
            <p className="text-muted-foreground/70 text-sm mt-1">
              {activeTab === "following"
                ? "Подпишитесь на авторов, чтобы видеть их посты"
                : "Создайте первую запись или подпишитесь на авторов"}
            </p>
          </div>
        ) : (
          <div className="space-y-0">
            {posts.map((post) => (
              <PostCard
                key={post.id}
                id={post.id}
                author={{
                  name: post.author?.display_name || "Пользователь",
                  username: post.author_id.slice(0, 8),
                  avatar: post.author?.avatar_url || `https://i.pravatar.cc/150?u=${post.author_id}`,
                  verified: false,
                }}
                content={post.content || ""}
                images={post.media?.map(m => m.media_url)}
                likes={post.likes_count}
                comments={post.comments_count}
                shares={post.shares_count}
                views={post.views_count}
                timeAgo={formatTimeAgo(post.created_at)}
                isLiked={post.is_liked}
                onLikeChange={refetch}
              />
            ))}
          </div>
        )}
      </div>
    </PullToRefresh>
  );
}
