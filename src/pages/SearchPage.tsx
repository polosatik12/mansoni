import { useState, useEffect, useCallback } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Search, Play, Hash, User, Loader2, TrendingUp, Grid3X3, Heart, MessageCircle } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useSearch } from "@/hooks/useSearch";
import { VerifiedBadge } from "@/components/ui/verified-badge";
import { BrandBackground } from "@/components/ui/brand-background";
import { supabase } from "@/integrations/supabase/client";

interface HashtagResult {
  tag: string;
  count: number;
}

const defaultTrends = [
  { tag: "новости", posts: "12.5K" },
  { tag: "технологии", posts: "8.2K" },
  { tag: "путешествия", posts: "5.1K" },
  { tag: "еда", posts: "15.3K" },
  { tag: "мода", posts: "9.7K" },
  { tag: "спорт", posts: "6.8K" },
];

export function SearchPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const initialQ = searchParams.get("q") || "";
  const [query, setQuery] = useState(initialQ);
  const [activeTab, setActiveTab] = useState<"explore" | "users" | "hashtags">(initialQ.startsWith("#") ? "hashtags" : "explore");
  const { users, explorePosts, loading, exploring, searchUsers, fetchExplorePosts, toggleFollow } = useSearch();
  const [hashtagPosts, setHashtagPosts] = useState<any[]>([]);
  const [hashtagLoading, setHashtagLoading] = useState(false);
  const [activeHashtag, setActiveHashtag] = useState<string | null>(null);

  useEffect(() => {
    fetchExplorePosts();
  }, [fetchExplorePosts]);

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      if (query.trim()) {
        if (query.startsWith("#")) {
          setActiveTab("hashtags");
          searchByHashtag(query.slice(1));
        } else {
          setActiveTab("users");
          searchUsers(query);
        }
      } else {
        setActiveTab("explore");
        setActiveHashtag(null);
        setHashtagPosts([]);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [query, searchUsers]);

  const searchByHashtag = useCallback(async (tag: string) => {
    if (!tag.trim()) return;
    setHashtagLoading(true);
    setActiveHashtag(tag);
    try {
      const { data, error } = await supabase
        .from("posts")
        .select(`
          id, author_id, content, likes_count, comments_count, views_count, created_at,
          post_media (media_url, media_type, sort_order)
        `)
        .eq("is_published", true)
        .ilike("content", `%#${tag}%`)
        .order("created_at", { ascending: false })
        .limit(50);

      if (error) throw error;

      const postsWithMedia = (data || []).filter((p: any) => p.post_media && p.post_media.length > 0);
      setHashtagPosts(postsWithMedia);
    } catch (error) {
      console.error("Error searching hashtag:", error);
    } finally {
      setHashtagLoading(false);
    }
  }, []);

  const handleTrendClick = (tag: string) => {
    setQuery(`#${tag}`);
    setActiveTab("hashtags");
    searchByHashtag(tag);
  };

  const handleUserClick = (userId: string) => {
    navigate(`/user/${userId}`);
  };

  const handlePostClick = (index: number) => {
    navigate(`/explore/${index}`);
  };

  return (
    <div className="min-h-screen pb-20 relative">
      <BrandBackground />
      {/* Search Bar */}
      <div className="sticky top-0 z-20 bg-black/30 backdrop-blur-xl border-b border-white/10 px-4 pt-[calc(env(safe-area-inset-top,12px)+12px)] pb-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-white/50" />
          <Input
            placeholder="Поиск людей или #хештегов..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="pl-10 pr-4 h-11 rounded-xl bg-white/10 border-0 focus-visible:ring-1 focus-visible:ring-primary text-white placeholder:text-white/50"
          />
        </div>
      </div>

      {/* Tab indicators when searching */}
      {query.trim() && (
        <div className="flex items-center gap-1 px-4 py-2 border-b border-white/10">
          <button
            onClick={() => { setActiveTab("users"); searchUsers(query.replace("#", "")); }}
            className={`px-3 py-1.5 text-sm font-medium rounded-full transition-all ${
              activeTab === "users" ? "bg-primary/15 text-primary" : "text-white/50"
            }`}
          >
            Люди
          </button>
          <button
            onClick={() => { setActiveTab("hashtags"); searchByHashtag(query.replace("#", "")); }}
            className={`px-3 py-1.5 text-sm font-medium rounded-full transition-all ${
              activeTab === "hashtags" ? "bg-primary/15 text-primary" : "text-white/50"
            }`}
          >
            # Хештеги
          </button>
        </div>
      )}

      {activeTab === "users" && query.trim() ? (
        // User Search Results
        <div className="px-4 py-2">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
            </div>
          ) : users.length > 0 ? (
            <div className="space-y-2">
              {users.map((user) => (
                <div
                  key={user.user_id}
                  className="flex items-center gap-3 p-3 rounded-xl hover:bg-white/10 active:bg-white/15 transition-colors cursor-pointer"
                  onClick={() => handleUserClick(user.user_id)}
                  onTouchEnd={(e) => {
                    const target = e.target as HTMLElement;
                    if (target.closest('button')) return;
                    handleUserClick(user.user_id);
                  }}
                >
                  <Avatar className="w-12 h-12 pointer-events-none">
                    <AvatarImage src={user.avatar_url || undefined} />
                    <AvatarFallback className="bg-white/10">
                      <User className="w-5 h-5 text-white/50" />
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0 pointer-events-none">
                    <div className="flex items-center gap-1">
                      <span className="font-semibold text-white truncate">
                        {user.display_name}
                      </span>
                      {user.verified && (
                        <span className="pointer-events-auto">
                          <VerifiedBadge size="sm" />
                        </span>
                      )}
                    </div>
                    {user.bio && (
                      <p className="text-sm text-white/50 line-clamp-1">
                        {user.bio}
                      </p>
                    )}
                  </div>
                  <Button
                    variant={user.isFollowing ? "outline" : "default"}
                    size="sm"
                    className="rounded-full shrink-0"
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleFollow(user.user_id);
                    }}
                  >
                    {user.isFollowing ? "Отписаться" : "Подписаться"}
                  </Button>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-12 text-white/40">
              <User className="w-12 h-12 mb-2 opacity-20" />
              <p>Пользователи не найдены</p>
            </div>
          )}
        </div>
      ) : activeTab === "hashtags" && activeHashtag ? (
        // Hashtag search results
        <div>
          <div className="px-4 py-3 flex items-center gap-2">
            <div className="w-10 h-10 rounded-full bg-primary/15 flex items-center justify-center">
              <Hash className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h3 className="font-semibold text-white">#{activeHashtag}</h3>
              <p className="text-xs text-white/50">{hashtagPosts.length} публикаций</p>
            </div>
          </div>

          {hashtagLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-6 h-6 animate-spin text-white/40" />
            </div>
          ) : hashtagPosts.length > 0 ? (
            <div className="grid grid-cols-3 gap-[2px] px-1">
              {hashtagPosts.map((post, index) => {
                const isVideo = post.post_media?.[0]?.media_type === "video";
                return (
                  <div
                    key={post.id}
                    className="aspect-square relative group cursor-pointer overflow-hidden bg-muted"
                    onClick={() => handlePostClick(index)}
                  >
                    <img
                      src={post.post_media?.[0]?.media_url}
                      alt=""
                      className="w-full h-full object-cover transition-transform group-hover:scale-105"
                    />
                    {isVideo && (
                      <div className="absolute top-2 right-2">
                        <div className="w-6 h-6 rounded-full bg-black/60 flex items-center justify-center">
                          <Play className="w-3 h-3 text-white fill-white ml-0.5" />
                        </div>
                      </div>
                    )}
                    {/* Hover overlay with stats */}
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
                      <div className="flex items-center gap-3 text-white text-sm font-semibold">
                        <span className="flex items-center gap-1">
                          <Heart className="w-4 h-4 fill-white" />
                          {post.likes_count}
                        </span>
                        <span className="flex items-center gap-1">
                          <MessageCircle className="w-4 h-4 fill-white" />
                          {post.comments_count}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-12 text-white/40">
              <Hash className="w-12 h-12 mb-2 opacity-20" />
              <p>Нет публикаций с #{activeHashtag}</p>
            </div>
          )}
        </div>
      ) : (
        // Explore Mode
        <>
          {/* Trending Hashtags */}
          <div className="px-4 py-3">
            <div className="flex items-center gap-1.5 mb-2.5">
              <TrendingUp className="w-4 h-4 text-primary" />
              <span className="text-sm font-semibold text-white">Популярные</span>
            </div>
            <ScrollArea className="w-full whitespace-nowrap">
              <div className="flex gap-2">
                {defaultTrends.map((trend) => (
                  <button
                    key={trend.tag}
                    onClick={() => handleTrendClick(trend.tag)}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-white/10 hover:bg-white/15 transition-colors"
                  >
                    <Hash className="w-4 h-4 text-white/50" />
                    <span className="text-sm font-medium text-white">{trend.tag}</span>
                    <span className="text-xs text-white/50">{trend.posts}</span>
                  </button>
                ))}
              </div>
              <ScrollBar orientation="horizontal" className="h-0" />
            </ScrollArea>
          </div>

          {/* Explore Grid */}
          <div className="px-1">
            <div className="flex items-center gap-1.5 px-3 mb-2">
              <Grid3X3 className="w-4 h-4 text-white/50" />
              <span className="text-sm font-semibold text-white">Рекомендации</span>
            </div>
            {exploring ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-6 h-6 animate-spin text-white/40" />
              </div>
            ) : explorePosts.length > 0 ? (
              <div className="grid grid-cols-3 gap-[2px]">
                {explorePosts.map((post, index) => {
                  const isVideo = post.media?.[0]?.media_type === "video";
                  return (
                    <div
                      key={post.id}
                      className="aspect-square relative group cursor-pointer overflow-hidden bg-muted"
                      onClick={() => handlePostClick(index)}
                    >
                      <img
                        src={post.media?.[0]?.media_url}
                        alt=""
                        className="w-full h-full object-cover transition-transform group-hover:scale-105"
                      />
                      {isVideo && (
                        <div className="absolute top-2 right-2">
                          <div className="w-6 h-6 rounded-full bg-black/60 flex items-center justify-center">
                            <Play className="w-3 h-3 text-white fill-white ml-0.5" />
                          </div>
                        </div>
                      )}
                      {/* Hover overlay with stats */}
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
                        <div className="flex items-center gap-3 text-white text-sm font-semibold">
                          <span className="flex items-center gap-1">
                            <Heart className="w-4 h-4 fill-white" />
                            {post.likes_count}
                          </span>
                          <span className="flex items-center gap-1">
                            <MessageCircle className="w-4 h-4 fill-white" />
                            {post.comments_count}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-12 text-white/40">
                <Search className="w-12 h-12 mb-2 opacity-20" />
                <p>Нет публикаций для просмотра</p>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
