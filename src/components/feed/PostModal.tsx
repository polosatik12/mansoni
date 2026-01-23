import { useState, useRef, useEffect } from "react";
import { X, Heart, MessageCircle, Send, Bookmark, MoreHorizontal, BadgeCheck, ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useNavigate } from "react-router-dom";
import { usePostActions } from "@/hooks/usePosts";
import { useSavedPosts } from "@/hooks/useSavedPosts";
import { useComments } from "@/hooks/useComments";
import { useAuth } from "@/hooks/useAuth";
import { cn } from "@/lib/utils";
import { formatDistanceToNow } from "date-fns";
import { ru } from "date-fns/locale";

interface PostModalProps {
  post: {
    id: string;
    author_id: string;
    content: string | null;
    likes_count: number;
    comments_count: number;
    shares_count: number;
    views_count: number;
    created_at: string;
    profile?: {
      display_name: string | null;
      avatar_url: string | null;
      verified?: boolean;
    };
    media?: {
      media_url: string;
      media_type: string;
    }[];
  };
  onClose: () => void;
  onNavigate?: (direction: "prev" | "next") => void;
  hasPrev?: boolean;
  hasNext?: boolean;
}

export function PostModal({ post, onClose, onNavigate, hasPrev, hasNext }: PostModalProps) {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toggleLike } = usePostActions();
  const { isSaved, toggleSave } = useSavedPosts();
  const { comments, loading: commentsLoading, addComment } = useComments(post.id);
  
  // Fetch user's like status
  const [initialLiked, setInitialLiked] = useState(false);
  useEffect(() => {
    const checkLikeStatus = async () => {
      if (!user) return;
      const { data } = await (await import("@/integrations/supabase/client")).supabase
        .from("post_likes")
        .select("id")
        .eq("post_id", post.id)
        .eq("user_id", user.id)
        .maybeSingle();
      setInitialLiked(!!data);
    };
    checkLikeStatus();
  }, [post.id, user]);
  const [liked, setLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(post.likes_count);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [commentText, setCommentText] = useState("");
  const [likeAnimation, setLikeAnimation] = useState(false);
  const [floatingHearts, setFloatingHearts] = useState<{ id: number; x: number; y: number }[]>([]);
  
  // Sync initial liked state
  useEffect(() => {
    setLiked(initialLiked);
  }, [initialLiked]);
  const heartIdRef = useRef(0);
  const commentsEndRef = useRef<HTMLDivElement>(null);
  
  const saved = isSaved(post.id);
  const allImages = post.media?.map((m) => m.media_url) || [];
  const hasMultipleImages = allImages.length > 1;
  
  const authorName = post.profile?.display_name || "Пользователь";
  const authorAvatar = post.profile?.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${post.author_id}`;

  // (removed userLikes effect - now using initialLiked)

  // Scroll comments to bottom on new comment
  useEffect(() => {
    commentsEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [comments.length]);

  // Handle keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      } else if (e.key === "ArrowLeft" && hasPrev) {
        onNavigate?.("prev");
      } else if (e.key === "ArrowRight" && hasNext) {
        onNavigate?.("next");
      }
    };
    
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose, onNavigate, hasPrev, hasNext]);

  const handleLike = async () => {
    if (!liked) {
      setLikeAnimation(true);
      setTimeout(() => setLikeAnimation(false), 300);
    }
    
    const newLiked = !liked;
    setLiked(newLiked);
    setLikeCount(liked ? likeCount - 1 : likeCount + 1);
    
    const { error } = await toggleLike(post.id, liked);
    if (error) {
      setLiked(!newLiked);
      setLikeCount(newLiked ? likeCount - 1 : likeCount + 1);
    }
  };

  const handleDoubleTap = (e: React.MouseEvent) => {
    if (!liked) {
      const rect = e.currentTarget.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      
      const newHeart = { id: heartIdRef.current++, x, y };
      setFloatingHearts((prev) => [...prev, newHeart]);
      
      setTimeout(() => {
        setFloatingHearts((prev) => prev.filter((h) => h.id !== newHeart.id));
      }, 1000);
      
      setLiked(true);
      setLikeCount(likeCount + 1);
      setLikeAnimation(true);
      setTimeout(() => setLikeAnimation(false), 300);
      toggleLike(post.id, false);
    }
  };

  const handleSave = async () => {
    await toggleSave(post.id);
  };

  const handleSendComment = async () => {
    if (!commentText.trim() || !user) return;
    await addComment(commentText.trim());
    setCommentText("");
  };

  const formatTime = (dateStr: string) => {
    try {
      return formatDistanceToNow(new Date(dateStr), { addSuffix: false, locale: ru });
    } catch {
      return "";
    }
  };

  const formatNumber = (num: number) => {
    if (num >= 1000000) {
      return (num / 1000000).toFixed(1).replace(/\.0$/, "") + " млн";
    }
    if (num >= 1000) {
      return (num / 1000).toFixed(1).replace(/\.0$/, "") + " тыс.";
    }
    return num.toString();
  };

  const goToProfile = () => {
    onClose();
    navigate(`/user/${authorName}`);
  };

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div
      className="fixed inset-0 bg-black/80 z-[70] flex items-center justify-center p-4"
      onClick={handleBackdropClick}
    >
      {/* Close button */}
      <Button
        variant="ghost"
        size="icon"
        onClick={onClose}
        className="absolute top-4 right-4 text-white hover:bg-white/20 z-10"
      >
        <X className="w-6 h-6" />
      </Button>

      {/* Navigation arrows */}
      {hasPrev && (
        <Button
          variant="ghost"
          size="icon"
          onClick={() => onNavigate?.("prev")}
          className="absolute left-4 top-1/2 -translate-y-1/2 text-white hover:bg-white/20 z-10 h-12 w-12"
        >
          <ChevronLeft className="w-8 h-8" />
        </Button>
      )}
      {hasNext && (
        <Button
          variant="ghost"
          size="icon"
          onClick={() => onNavigate?.("next")}
          className="absolute right-4 top-1/2 -translate-y-1/2 text-white hover:bg-white/20 z-10 h-12 w-12"
        >
          <ChevronRight className="w-8 h-8" />
        </Button>
      )}

      {/* Modal content */}
      <div className="bg-card rounded-lg overflow-hidden max-w-5xl w-full max-h-[90vh] flex flex-col md:flex-row animate-scale-in">
        {/* Image section */}
        <div 
          className="relative bg-black flex-shrink-0 md:w-[60%] aspect-square md:aspect-auto md:max-h-[90vh]"
          onDoubleClick={handleDoubleTap}
        >
          {allImages.length > 0 ? (
            <img
              src={allImages[currentImageIndex]}
              alt=""
              className="w-full h-full object-contain"
            />
          ) : (
            <div className="w-full h-full bg-muted flex items-center justify-center">
              <span className="text-muted-foreground">Нет изображения</span>
            </div>
          )}

          {/* Floating hearts */}
          {floatingHearts.map((heart) => (
            <div
              key={heart.id}
              className="absolute pointer-events-none animate-float-heart"
              style={{ left: heart.x - 30, top: heart.y - 30 }}
            >
              <Heart className="w-16 h-16 text-destructive fill-current drop-shadow-lg" />
            </div>
          ))}

          {/* Image navigation */}
          {hasMultipleImages && (
            <>
              <div className="absolute top-3 right-3 bg-black/60 text-white text-xs px-2 py-1 rounded-full">
                {currentImageIndex + 1}/{allImages.length}
              </div>
              {currentImageIndex > 0 && (
                <button
                  onClick={() => setCurrentImageIndex(currentImageIndex - 1)}
                  className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 bg-white/90 rounded-full flex items-center justify-center"
                >
                  <ChevronLeft className="w-5 h-5 text-black" />
                </button>
              )}
              {currentImageIndex < allImages.length - 1 && (
                <button
                  onClick={() => setCurrentImageIndex(currentImageIndex + 1)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 bg-white/90 rounded-full flex items-center justify-center"
                >
                  <ChevronRight className="w-5 h-5 text-black" />
                </button>
              )}
              <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1">
                {allImages.map((_, i) => (
                  <button
                    key={i}
                    onClick={() => setCurrentImageIndex(i)}
                    className={cn(
                      "w-1.5 h-1.5 rounded-full transition-all",
                      i === currentImageIndex ? "bg-white w-2" : "bg-white/50"
                    )}
                  />
                ))}
              </div>
            </>
          )}
        </div>

        {/* Content section */}
        <div className="flex flex-col md:w-[40%] max-h-[50vh] md:max-h-[90vh]">
          {/* Header */}
          <div className="flex items-center gap-3 p-4 border-b border-border">
            <Avatar className="w-8 h-8 cursor-pointer" onClick={goToProfile}>
              <AvatarImage src={authorAvatar} />
              <AvatarFallback>{authorName.charAt(0)}</AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <div className="flex items-center gap-1">
                <span 
                  className="font-semibold text-sm cursor-pointer hover:underline"
                  onClick={goToProfile}
                >
                  {authorName}
                </span>
                {post.profile?.verified && (
                  <BadgeCheck className="w-4 h-4 text-primary fill-primary stroke-primary-foreground" />
                )}
              </div>
            </div>
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <MoreHorizontal className="w-5 h-5" />
            </Button>
          </div>

          {/* Comments section */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {/* Post caption */}
            {post.content && (
              <div className="flex gap-3">
                <Avatar className="w-8 h-8 shrink-0">
                  <AvatarImage src={authorAvatar} />
                  <AvatarFallback>{authorName.charAt(0)}</AvatarFallback>
                </Avatar>
                <div>
                  <p className="text-sm">
                    <span className="font-semibold">{authorName}</span>{" "}
                    {post.content}
                  </p>
                  <span className="text-xs text-muted-foreground">
                    {formatTime(post.created_at)}
                  </span>
                </div>
              </div>
            )}

            {/* Comments */}
            {commentsLoading ? (
              <div className="flex items-center justify-center py-4">
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-primary" />
              </div>
            ) : comments.length > 0 ? (
              comments.map((comment) => (
                <div key={comment.id} className="flex gap-3">
                  <Avatar className="w-8 h-8 shrink-0">
                    <AvatarImage src={comment.author?.avatar_url || undefined} />
                    <AvatarFallback>
                      {(comment.author?.display_name || "U").charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <p className="text-sm">
                      <span className="font-semibold">
                        {comment.author?.display_name || "Пользователь"}
                      </span>{" "}
                      {comment.content}
                    </p>
                    <div className="flex items-center gap-3 mt-1">
                      <span className="text-xs text-muted-foreground">
                        {formatTime(comment.created_at)}
                      </span>
                      <button className="text-xs text-muted-foreground hover:text-foreground">
                        Ответить
                      </button>
                    </div>
                  </div>
                  <button className="shrink-0">
                    <Heart className="w-3 h-3 text-muted-foreground" />
                  </button>
                </div>
              ))
            ) : (
              <div className="text-center py-8 text-muted-foreground text-sm">
                Пока нет комментариев
              </div>
            )}
            <div ref={commentsEndRef} />
          </div>

          {/* Actions */}
          <div className="border-t border-border p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <button onClick={handleLike} className={cn("transition-colors", liked && "text-destructive")}>
                  <Heart
                    className={cn(
                      "w-6 h-6",
                      liked && "fill-current",
                      likeAnimation && "animate-like-bounce"
                    )}
                  />
                </button>
                <button>
                  <MessageCircle className="w-6 h-6" />
                </button>
                <button>
                  <Send className="w-6 h-6" />
                </button>
              </div>
              <button onClick={handleSave} className={cn("transition-colors", saved && "text-primary")}>
                <Bookmark className={cn("w-6 h-6", saved && "fill-current")} />
              </button>
            </div>

            <p className="font-semibold text-sm">{formatNumber(likeCount)} отметок «Нравится»</p>
            
            <span className="text-xs text-muted-foreground uppercase">
              {formatTime(post.created_at)}
            </span>
          </div>

          {/* Comment input */}
          {user && (
            <div className="border-t border-border p-4 flex items-center gap-3">
              <Input
                placeholder="Добавьте комментарий..."
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSendComment()}
                className="flex-1 border-0 bg-transparent focus-visible:ring-0 px-0"
              />
              <Button
                variant="ghost"
                size="sm"
                onClick={handleSendComment}
                disabled={!commentText.trim()}
                className="text-primary font-semibold"
              >
                Отправить
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
