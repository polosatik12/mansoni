import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { Heart, MessageCircle, ChevronRight } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface SharedPost {
  id: string;
  content: string | null;
  author_id: string;
  likes_count: number;
  comments_count: number;
  author?: {
    display_name: string | null;
    avatar_url: string | null;
  };
  media?: {
    media_url: string;
    media_type: string;
  }[];
}

interface SharedPostCardProps {
  postId: string;
  isOwn: boolean;
}

export function SharedPostCard({ postId, isOwn }: SharedPostCardProps) {
  const [post, setPost] = useState<SharedPost | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchPost = async () => {
      try {
        // Fetch post with author profile
        const { data: postData, error: postError } = await supabase
          .from("posts")
          .select("id, content, author_id, likes_count, comments_count")
          .eq("id", postId)
          .single();

        if (postError) throw postError;

        // Fetch author profile
        const { data: profile } = await supabase
          .from("profiles")
          .select("display_name, avatar_url")
          .eq("user_id", postData.author_id)
          .single();

        // Fetch post media (first image only for preview)
        const { data: media } = await supabase
          .from("post_media")
          .select("media_url, media_type")
          .eq("post_id", postId)
          .order("sort_order", { ascending: true })
          .limit(1);

        setPost({
          ...postData,
          author: profile || undefined,
          media: media || [],
        });
      } catch (error) {
        console.error("Error fetching shared post:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchPost();
  }, [postId]);

  const handleClick = () => {
    navigate(`/post/${postId}`);
  };

  if (loading) {
    return (
      <div
        className={`w-64 rounded-xl overflow-hidden ${
          isOwn ? "bg-[#1e3a4f]" : "bg-[#1a2733]"
        }`}
      >
        <div className="animate-pulse">
          <div className="h-32 bg-white/10" />
          <div className="p-3 space-y-2">
            <div className="h-3 bg-white/10 rounded w-3/4" />
            <div className="h-3 bg-white/10 rounded w-1/2" />
          </div>
        </div>
      </div>
    );
  }

  if (!post) {
    return (
      <div
        className={`w-64 rounded-xl p-3 ${
          isOwn ? "bg-[#1e3a4f]" : "bg-[#1a2733]"
        }`}
      >
        <p className="text-sm text-white/50">Пост удалён</p>
      </div>
    );
  }

  const imageUrl = post.media?.[0]?.media_url;
  const authorName = post.author?.display_name || "Пользователь";
  const contentPreview = post.content
    ? post.content.slice(0, 80) + (post.content.length > 80 ? "..." : "")
    : "";

  return (
    <button
      onClick={handleClick}
      className={`w-64 rounded-xl overflow-hidden text-left transition-transform active:scale-[0.98] ${
        isOwn ? "bg-[#1e3a4f]" : "bg-[#1a2733]"
      }`}
    >
      {/* Image preview */}
      {imageUrl && (
        <div className="relative h-36 overflow-hidden">
          <img
            src={imageUrl}
            alt=""
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
        </div>
      )}

      {/* Content */}
      <div className="p-3">
        {/* Author info */}
        <div className="flex items-center gap-2 mb-2">
          <img
            src={post.author?.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${post.author_id}`}
            alt={authorName}
            className="w-6 h-6 rounded-full object-cover"
          />
          <span className="text-sm font-medium text-white truncate flex-1">
            {authorName}
          </span>
          <ChevronRight className="w-4 h-4 text-white/40 shrink-0" />
        </div>

        {/* Text preview */}
        {contentPreview && (
          <p className="text-sm text-white/80 line-clamp-2 mb-2">
            {contentPreview}
          </p>
        )}

        {/* Stats */}
        <div className="flex items-center gap-4 text-xs text-white/50">
          <span className="flex items-center gap-1">
            <Heart className="w-3.5 h-3.5" />
            {post.likes_count}
          </span>
          <span className="flex items-center gap-1">
            <MessageCircle className="w-3.5 h-3.5" />
            {post.comments_count}
          </span>
        </div>
      </div>
    </button>
  );
}
