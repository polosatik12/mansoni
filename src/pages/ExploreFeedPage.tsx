import { useEffect, useRef, useState, useCallback } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { ArrowLeft, Loader2 } from "lucide-react";
import { useSearch, ExplorePost } from "@/hooks/useSearch";
import { PostCard } from "@/components/feed/PostCard";
import { BrandBackground } from "@/components/ui/brand-background";
import { formatDistanceToNow } from "date-fns";
import { ru } from "date-fns/locale";
import { supabase } from "@/integrations/supabase/client";

export function ExploreFeedPage() {
  const navigate = useNavigate();
  const { postIndex } = useParams();
  const [searchParams] = useSearchParams();
  const hashtag = searchParams.get("tag");
  const { explorePosts, exploring, fetchExplorePosts } = useSearch();
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const hasScrolled = useRef(false);
  const [initialLoad, setInitialLoad] = useState(true);
  const [hashtagPosts, setHashtagPosts] = useState<ExplorePost[]>([]);
  const [hashtagLoading, setHashtagLoading] = useState(false);

  const fetchHashtagPosts = useCallback(async (tag: string) => {
    setHashtagLoading(true);
    try {
      const { data, error } = await supabase
        .from("posts")
        .select(`
          id, author_id, content, likes_count, comments_count, shares_count, views_count, created_at,
          post_media (media_url, media_type, sort_order)
        `)
        .eq("is_published", true)
        .ilike("content", `%#${tag}%`)
        .order("created_at", { ascending: false })
        .limit(50);

      if (error) throw error;

      const postsWithMedia = (data || []).filter((p: any) => p.post_media && p.post_media.length > 0);

      // Fetch profiles
      const authorIds = [...new Set(postsWithMedia.map((p: any) => p.author_id))];
      let profilesMap = new Map<string, any>();
      if (authorIds.length > 0) {
        const { data: profiles } = await supabase
          .from("profiles")
          .select("user_id, display_name, avatar_url, verified")
          .in("user_id", authorIds);
        profilesMap = new Map(profiles?.map(p => [p.user_id, p]) || []);
      }

      const enriched: ExplorePost[] = postsWithMedia.map((p: any) => ({
        id: p.id,
        author_id: p.author_id,
        content: p.content,
        likes_count: p.likes_count,
        comments_count: p.comments_count,
        shares_count: p.shares_count,
        views_count: p.views_count,
        created_at: p.created_at,
        profile: profilesMap.get(p.author_id) || undefined,
        media: p.post_media,
      }));

      setHashtagPosts(enriched);
    } catch (error) {
      console.error("Error fetching hashtag posts:", error);
    } finally {
      setHashtagLoading(false);
    }
  }, []);

  // Fetch posts based on context
  useEffect(() => {
    if (hashtag) {
      fetchHashtagPosts(hashtag).finally(() => setInitialLoad(false));
    } else {
      fetchExplorePosts().finally(() => setInitialLoad(false));
    }
  }, [hashtag, fetchExplorePosts, fetchHashtagPosts]);

  const posts = hashtag ? hashtagPosts : explorePosts;
  const loading = hashtag ? hashtagLoading : exploring;

  // Scroll to selected post once posts are loaded
  useEffect(() => {
    if (posts.length > 0 && postIndex && !hasScrolled.current) {
      const index = parseInt(postIndex, 10);
      if (!isNaN(index) && index >= 0 && index < posts.length) {
        setTimeout(() => {
          const element = document.getElementById(`explore-post-${index}`);
          if (element) {
            element.scrollIntoView({ behavior: "instant", block: "start" });
            hasScrolled.current = true;
          }
        }, 50);
      }
    }
  }, [posts, postIndex]);

  const formatTimeAgo = (dateStr: string) => {
    try {
      return formatDistanceToNow(new Date(dateStr), { addSuffix: true, locale: ru });
    } catch {
      return "";
    }
  };

  return (
    <div className="min-h-screen pb-20 relative" ref={scrollContainerRef}>
      <BrandBackground />
      {/* Header */}
      <header className="sticky top-0 z-30 bg-black/30 backdrop-blur-xl border-b border-white/10 safe-area-top">
        <div className="flex items-center h-12 px-4">
          <button
            onClick={() => navigate("/search")}
            className="flex items-center justify-center w-10 h-10 -ml-2 rounded-full hover:bg-white/10 transition-colors"
          >
            <ArrowLeft className="w-6 h-6 text-white" />
          </button>
          <h1 className="font-semibold text-lg ml-2 text-white">
            {hashtag ? `#${hashtag}` : "Публикации"}
          </h1>
        </div>
      </header>

      {/* Posts Feed */}
      {loading || initialLoad ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-white/40" />
        </div>
      ) : posts.length > 0 ? (
        <div>
          {posts.map((post, index) => (
            <div key={post.id} id={`explore-post-${index}`}>
              <PostCard
                id={post.id}
                authorId={post.author_id}
                author={{
                  name: post.profile?.display_name || "Пользователь",
                  username: post.profile?.display_name || "user",
                  avatar: post.profile?.avatar_url || null,
                  verified: post.profile?.verified,
                }}
                content={post.content || ""}
                images={post.media?.map((m) => m.media_url)}
                likes={post.likes_count}
                comments={post.comments_count}
                shares={post.shares_count}
                timeAgo={formatTimeAgo(post.created_at)}
              />
            </div>
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-20 text-white/40">
          <p>Нет публикаций</p>
        </div>
      )}
    </div>
  );
}
