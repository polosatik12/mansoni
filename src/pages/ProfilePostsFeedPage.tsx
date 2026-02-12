import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import { ArrowLeft, Loader2 } from "lucide-react";
import { BrandBackground } from "@/components/ui/brand-background";
import { PostCard } from "@/components/feed/PostCard";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { formatDistanceToNow } from "date-fns";
import { ru } from "date-fns/locale";

export function ProfilePostsFeedPage() {
  const { userId } = useParams<{ userId: string }>();
  const [searchParams] = useSearchParams();
  const startPostId = searchParams.get("startPost");
  const navigate = useNavigate();
  const { user } = useAuth();
  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const scrollRef = useRef<HTMLDivElement>(null);
  const targetRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!userId) return;

    const fetchPosts = async () => {
      try {
        const { data: postsData } = await supabase
          .from("posts")
          .select("*, post_media(media_url, media_type, sort_order)")
          .eq("author_id", userId)
          .eq("is_published", true)
          .order("created_at", { ascending: false });

        if (!postsData) return;

        const { data: profile } = await supabase
          .from("profiles")
          .select("display_name, avatar_url, verified")
          .eq("user_id", userId)
          .single();

        // Check likes
        let likedIds = new Set<string>();
        if (user) {
          const { data: likes } = await supabase
            .from("post_likes")
            .select("post_id")
            .eq("user_id", user.id)
            .in("post_id", postsData.map(p => p.id));
          likedIds = new Set((likes || []).map(l => l.post_id));
        }

        const enriched = postsData.map(post => ({
          ...post,
          profile,
          isLiked: likedIds.has(post.id),
          media: (post.post_media || []).sort((a: any, b: any) => a.sort_order - b.sort_order),
        }));

        setPosts(enriched);
      } catch (err) {
        console.error("Error fetching profile posts:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchPosts();
  }, [userId, user]);

  // Scroll to target post after loading
  useEffect(() => {
    if (!loading && startPostId && targetRef.current) {
      targetRef.current.scrollIntoView({ behavior: "instant", block: "start" });
    }
  }, [loading, startPostId]);

  const formatTime = (dateStr: string) => {
    try {
      return formatDistanceToNow(new Date(dateStr), { addSuffix: true, locale: ru });
    } catch {
      return "";
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen relative overflow-hidden">
        <BrandBackground />
        <div className="relative z-10 min-h-screen flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-white/60" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen relative overflow-hidden">
      <BrandBackground />
      <div className="relative z-10 min-h-screen pb-24">
        {/* Header */}
        <div className="sticky top-0 z-20 bg-black/40 backdrop-blur-xl border-b border-white/10">
          <div className="flex items-center gap-3 px-4 py-3">
            <button onClick={() => navigate(-1)} className="w-10 h-10 rounded-full bg-white/10 border border-white/20 flex items-center justify-center">
              <ArrowLeft className="w-5 h-5 text-white" />
            </button>
            <h1 className="font-semibold text-white">Публикации</h1>
          </div>
        </div>

        {/* Posts feed */}
        <div ref={scrollRef}>
          {posts.map((post) => (
            <div
              key={post.id}
              ref={post.id === startPostId ? targetRef : undefined}
            >
              <PostCard
                id={post.id}
                authorId={post.author_id}
                author={{
                  name: post.profile?.display_name || "Пользователь",
                  username: post.profile?.display_name || "Пользователь",
                  avatar: post.profile?.avatar_url || "",
                  verified: post.profile?.verified || false,
                }}
                content={post.content || ""}
                images={post.media.map((m: any) => m.media_url)}
                likes={post.likes_count}
                comments={post.comments_count}
                shares={post.shares_count}
                timeAgo={formatTime(post.created_at)}
                isLiked={post.isLiked}
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
