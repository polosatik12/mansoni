import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Heart, MessageCircle, Share2, Bookmark, MoreHorizontal } from "lucide-react";
import { BrandBackground } from "@/components/ui/brand-background";
import { GradientAvatar } from "@/components/ui/gradient-avatar";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { CommentsSheet } from "@/components/feed/CommentsSheet";
import { ShareSheet } from "@/components/feed/ShareSheet";
import { PostOptionsSheet } from "@/components/feed/PostOptionsSheet";
import { formatDistanceToNow } from "date-fns";
import { ru } from "date-fns/locale";

interface PostDetail {
  id: string;
  content: string | null;
  author_id: string;
  likes_count: number;
  comments_count: number;
  views_count: number;
  created_at: string;
  author?: {
    display_name: string | null;
    avatar_url: string | null;
  };
  media: {
    media_url: string;
    media_type: string;
  }[];
  isLiked?: boolean;
  isSaved?: boolean;
}

export function PostDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [post, setPost] = useState<PostDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [showComments, setShowComments] = useState(false);
  const [showShare, setShowShare] = useState(false);
  const [showOptions, setShowOptions] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [likeAnimation, setLikeAnimation] = useState(false);

  useEffect(() => {
    if (!id) return;

    const fetchPost = async () => {
      try {
        // Fetch post
        const { data: postData, error: postError } = await supabase
          .from("posts")
          .select("*")
          .eq("id", id)
          .single();

        if (postError) throw postError;

        // Fetch author profile
        const { data: profile } = await supabase
          .from("profiles")
          .select("display_name, avatar_url")
          .eq("user_id", postData.author_id)
          .single();

        // Fetch post media
        const { data: media } = await supabase
          .from("post_media")
          .select("media_url, media_type")
          .eq("post_id", id)
          .order("sort_order", { ascending: true });

        // Check if liked
        let isLiked = false;
        if (user) {
          const { data: likeData } = await supabase
            .from("post_likes")
            .select("id")
            .eq("post_id", id)
            .eq("user_id", user.id)
            .maybeSingle();
          isLiked = !!likeData;
        }

        // Check if saved
        let isSaved = false;
        if (user) {
          const { data: savedData } = await supabase
            .from("saved_posts")
            .select("id")
            .eq("post_id", id)
            .eq("user_id", user.id)
            .maybeSingle();
          isSaved = !!savedData;
        }

        setPost({
          ...postData,
          author: profile || undefined,
          media: media || [],
          isLiked,
          isSaved,
        });
      } catch (error) {
        console.error("Error fetching post:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchPost();
  }, [id, user]);

  const handleLike = async () => {
    if (!post || !user) return;

    try {
      if (post.isLiked) {
        await supabase
          .from("post_likes")
          .delete()
          .eq("post_id", post.id)
          .eq("user_id", user.id);
        setPost({ ...post, isLiked: false, likes_count: post.likes_count - 1 });
      } else {
        await supabase
          .from("post_likes")
          .insert({ post_id: post.id, user_id: user.id });
        setPost({ ...post, isLiked: true, likes_count: post.likes_count + 1 });
      }
    } catch (error) {
      console.error("Error toggling like:", error);
    }
  };

  const handleSave = async () => {
    if (!post || !user) return;

    try {
      if (post.isSaved) {
        await supabase
          .from("saved_posts")
          .delete()
          .eq("post_id", post.id)
          .eq("user_id", user.id);
        setPost({ ...post, isSaved: false });
      } else {
        await supabase
          .from("saved_posts")
          .insert({ post_id: post.id, user_id: user.id });
        setPost({ ...post, isSaved: true });
      }
    } catch (error) {
      console.error("Error toggling save:", error);
    }
  };

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
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white" />
        </div>
      </div>
    );
  }

  if (!post) {
    return (
      <div className="min-h-screen relative overflow-hidden">
        <BrandBackground />
        <div className="relative z-10 min-h-screen flex flex-col items-center justify-center p-6">
          <h2 className="text-xl font-semibold mb-2 text-white">Пост не найден</h2>
          <p className="text-white/60 mb-4">Возможно, он был удалён</p>
          <Button onClick={() => navigate(-1)} variant="outline" className="bg-white/10 border-white/20 text-white">Назад</Button>
        </div>
      </div>
    );
  }

  const authorName = post.author?.display_name || "Пользователь";

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
          <h1 className="font-semibold text-white">Публикация</h1>
        </div>
      </div>

      {/* Post Content */}
      <div className="pb-20">
        {/* Author header */}
        <div className="flex items-center gap-3 px-4 py-3">
          <GradientAvatar
            name={authorName}
            seed={post.author_id}
            avatarUrl={post.author?.avatar_url}
            size="sm"
          />
          <div className="flex-1">
            <p className="font-semibold text-sm text-white">{authorName}</p>
            <p className="text-xs text-white/60">{formatTime(post.created_at)}</p>
          </div>
          <button className="p-2" onClick={() => setShowOptions(true)}>
            <MoreHorizontal className="w-5 h-5 text-white/60" />
          </button>
        </div>

        {/* Media */}
        {post.media.length > 0 && (
          <div className="relative" onDoubleClick={() => {
            if (!post.isLiked) {
              setLikeAnimation(true);
              setTimeout(() => setLikeAnimation(false), 600);
              handleLike();
            }
          }}>
            {likeAnimation && (
              <div className="absolute inset-0 z-10 flex items-center justify-center pointer-events-none">
                <Heart className="w-20 h-20 text-red-500 fill-red-500 animate-ping" />
              </div>
            )}
            <img
              src={post.media[currentImageIndex]?.media_url}
              alt=""
              className="w-full aspect-square object-cover"
            />
            {post.media.length > 1 && (
              <>
                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-1">
                  {post.media.map((_, idx) => (
                    <div
                      key={idx}
                      className={`w-1.5 h-1.5 rounded-full transition-colors ${
                        idx === currentImageIndex ? "bg-white" : "bg-white/50"
                      }`}
                    />
                  ))}
                </div>
                <div className="absolute inset-0 flex">
                  <button
                    className="flex-1"
                    onClick={() => setCurrentImageIndex((prev) => Math.max(0, prev - 1))}
                  />
                  <button
                    className="flex-1"
                    onClick={() => setCurrentImageIndex((prev) => Math.min(post.media.length - 1, prev + 1))}
                  />
                </div>
              </>
            )}
          </div>
        )}

        {/* Content */}
        {post.content && (
          <div className="px-4 py-2">
            <p className="text-sm text-white">
              <span className="font-semibold mr-1">{authorName}</span>
              {post.content}
            </p>
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-4">
            <button onClick={handleLike} className="flex items-center gap-1">
              <Heart
                className={`w-6 h-6 transition-colors ${
                  post.isLiked ? "fill-red-500 text-red-500" : "text-white"
                }`}
              />
              <span className="text-sm font-medium text-white">{post.likes_count}</span>
            </button>
            <button onClick={() => setShowComments(true)} className="flex items-center gap-1">
              <MessageCircle className="w-6 h-6 text-white" />
              <span className="text-sm font-medium text-white">{post.comments_count}</span>
            </button>
            <button onClick={() => setShowShare(true)}>
              <Share2 className="w-6 h-6 text-white" />
            </button>
          </div>
          <button onClick={handleSave}>
            <Bookmark
              className={`w-6 h-6 transition-colors ${
                post.isSaved ? "fill-white text-white" : "text-white"
              }`}
            />
          </button>
        </div>

      </div>
      </div>

      {/* Comments Sheet */}
      <CommentsSheet
        isOpen={showComments}
        onClose={() => setShowComments(false)}
        postId={post.id}
        commentsCount={post.comments_count}
      />

      {/* Share Sheet */}
      <ShareSheet
        isOpen={showShare}
        onClose={() => setShowShare(false)}
        postId={post.id}
        postContent={post.content || ""}
        postImage={post.media[0]?.media_url}
      />

      {/* Options Sheet */}
      <PostOptionsSheet
        isOpen={showOptions}
        onClose={() => setShowOptions(false)}
        postId={post.id}
        authorId={post.author_id}
        authorUsername={post.author?.display_name || "Пользователь"}
      />
    </div>
  );
}
