import { Heart, MessageCircle, Send, Bookmark, MoreHorizontal, Users } from "lucide-react";
import { GradientAvatar } from "@/components/ui/gradient-avatar";
import { Button } from "@/components/ui/button";
import { useState, useRef } from "react";
import { cn } from "@/lib/utils";
import { useNavigate } from "react-router-dom";
import { CommentsSheet } from "./CommentsSheet";
import { ShareSheet } from "./ShareSheet";
import { PostOptionsSheet } from "./PostOptionsSheet";
import { usePostActions } from "@/hooks/usePosts";
import { useSavedPosts } from "@/hooks/useSavedPosts";
import { VerifiedBadge } from "@/components/ui/verified-badge";

interface PostCardProps {
  id?: string;
  authorId?: string;
  author: {
    name: string;
    username: string;
    avatar: string;
    verified?: boolean;
  };
  content: string;
  image?: string;
  images?: string[];
  likes: number;
  comments: number;
  shares: number;
  saves?: number;
  mentions?: { user_id: string; display_name: string }[];
  timeAgo: string;
  isRecommended?: boolean;
  isLiked?: boolean;
  onLikeChange?: (postId: string, liked: boolean) => void;
  onDeleted?: (postId: string) => void;
}

export function PostCard({
  id,
  authorId,
  author,
  content,
  image,
  images,
  likes,
  comments,
  shares,
  saves = 0,
  mentions,
  timeAgo,
  isRecommended = false,
  isLiked = false,
  onLikeChange,
  onDeleted,
}: PostCardProps) {
  const navigate = useNavigate();
  const { toggleLike } = usePostActions();
  const { isSaved, toggleSave } = useSavedPosts();
  const [liked, setLiked] = useState(isLiked);
  const [likeCount, setLikeCount] = useState(likes);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [expanded, setExpanded] = useState(false);
  const [showComments, setShowComments] = useState(false);
  const [showShare, setShowShare] = useState(false);
  const [showOptions, setShowOptions] = useState(false);
  const [likeAnimation, setLikeAnimation] = useState(false);
  const [floatingHearts, setFloatingHearts] = useState<{ id: number; x: number; y: number }[]>([]);
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);
  const heartIdRef = useRef(0);
  const optionsBtnRef = useRef<HTMLButtonElement>(null);
  
  
  const saved = id ? isSaved(id) : false;
  
  const handleSave = async () => {
    if (!id) return;
    try {
      await toggleSave(id);
    } catch (err) {
      console.error('Failed to toggle save:', err);
    }
  };


  const allImages = images || (image ? [image] : []);
  const hasMultipleImages = allImages.length > 1;
  const MIN_SWIPE_DISTANCE = 50;

  // Swipe handlers for image navigation
  const onTouchStart = (e: React.TouchEvent) => {
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientX);
  };

  const onTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const onTouchEnd = () => {
    if (!touchStart || !touchEnd) return;
    
    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > MIN_SWIPE_DISTANCE;
    const isRightSwipe = distance < -MIN_SWIPE_DISTANCE;

    if (isLeftSwipe && currentImageIndex < allImages.length - 1) {
      setCurrentImageIndex(currentImageIndex + 1);
    } else if (isRightSwipe && currentImageIndex > 0) {
      setCurrentImageIndex(currentImageIndex - 1);
    }
  };

  const handleLike = async () => {
    if (!liked) {
      setLikeAnimation(true);
      setTimeout(() => setLikeAnimation(false), 300);
    }
    
    const newLiked = !liked;
    setLiked(newLiked);
    setLikeCount(liked ? likeCount - 1 : likeCount + 1);
    
    if (id) {
      const { error } = await toggleLike(id, liked);
      if (error) {
        // Revert on error
        setLiked(!newLiked);
        setLikeCount(newLiked ? likeCount - 1 : likeCount + 1);
      } else {
        onLikeChange?.(id, newLiked);
      }
    }
  };

  const handleDoubleTap = (e: React.MouseEvent) => {
    if (!liked) {
      const rect = e.currentTarget.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      
      const newHeart = { id: heartIdRef.current++, x, y };
      setFloatingHearts(prev => [...prev, newHeart]);
      
      setTimeout(() => {
        setFloatingHearts(prev => prev.filter(h => h.id !== newHeart.id));
      }, 1000);
      
      setLiked(true);
      setLikeCount(likeCount + 1);
      setLikeAnimation(true);
      setTimeout(() => setLikeAnimation(false), 300);
    }
  };

  const formatNumber = (num: number) => {
    if (num >= 1000000) {
      return (num / 1000000).toFixed(1).replace(/\.0$/, '') + " млн";
    }
    if (num >= 1000) {
      return (num / 1000).toFixed(1).replace(/\.0$/, '') + " тыс.";
    }
    return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, " ");
  };

  const truncatedContent = content.length > 100 && !expanded 
    ? content.slice(0, 100) + "..." 
    : content;

  const goToProfile = () => {
    // Use authorId (user_id) for reliable navigation
    if (authorId) {
      navigate(`/user/${authorId}`);
    }
  };

  return (
    <div className="bg-white/5 backdrop-blur-sm border-b border-white/10">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3">
        <div className="flex items-center gap-3">
          <div className="relative cursor-pointer" onClick={goToProfile}>
            <GradientAvatar
              name={author.name}
              seed={authorId}
              avatarUrl={author.avatar || null}
              size="sm"
              className="ring-2 ring-white/20 border-0"
            />
            {author.verified && (
              <div className="absolute -bottom-0.5 -right-0.5 w-4 h-4 bg-primary rounded-full flex items-center justify-center">
                <VerifiedBadge size="xs" className="text-primary-foreground fill-primary-foreground stroke-primary" />
              </div>
            )}
          </div>
          <div>
            <div className="flex items-center gap-1">
              <span 
                className="font-semibold text-white text-sm cursor-pointer hover:underline"
                onClick={goToProfile}
              >
                {author.username}
              </span>
              {author.verified && <VerifiedBadge size="sm" />}
            </div>
            {isRecommended && (
              <p className="text-xs text-white/40">Рекомендации для вас</p>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button 
            ref={optionsBtnRef}
            variant="ghost" 
            size="icon" 
            className="text-white/50 h-8 w-8"
            onClick={() => setShowOptions(true)}
          >
            <MoreHorizontal className="w-5 h-5" />
          </Button>
        </div>
      </div>

      {/* Image Carousel */}
      {allImages.length > 0 && (
        <div 
          className="relative aspect-square cursor-pointer select-none overflow-hidden"
          onDoubleClick={handleDoubleTap}
          onTouchStart={onTouchStart}
          onTouchMove={onTouchMove}
          onTouchEnd={onTouchEnd}
        >
          {/* Sliding image track */}
          <div
            className="flex h-full transition-transform duration-300 ease-out"
            style={{ transform: `translateX(-${currentImageIndex * 100}%)` }}
          >
            {allImages.map((img, i) => (
              <img
                key={i}
                src={img}
                alt={`Post image ${i + 1}`}
                className="w-full h-full object-cover shrink-0"
                draggable={false}
              />
            ))}
          </div>
          
          {/* Floating hearts on double tap */}
          {floatingHearts.map((heart) => (
            <div
              key={heart.id}
              className="absolute pointer-events-none animate-float-heart"
              style={{ left: heart.x - 30, top: heart.y - 30 }}
            >
              <Heart className="w-16 h-16 text-destructive fill-current drop-shadow-lg" />
            </div>
          ))}
          
          {/* Image counter */}
          {hasMultipleImages && (
            <div className="absolute top-3 right-3 bg-black/60 backdrop-blur-sm text-white text-xs font-medium px-2.5 py-1 rounded-full border border-white/10">
              {currentImageIndex + 1}/{allImages.length}
            </div>
          )}

          {/* Dots indicator */}
          {hasMultipleImages && (
            <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex items-center gap-1.5 bg-black/30 backdrop-blur-sm rounded-full px-2.5 py-1.5">
              {allImages.map((_, index) => (
                <button
                  key={index}
                  onClick={(e) => { e.stopPropagation(); setCurrentImageIndex(index); }}
                  className={cn(
                    "rounded-full transition-all duration-300",
                    index === currentImageIndex 
                      ? "w-2 h-2 bg-white shadow-[0_0_6px_rgba(255,255,255,0.5)]" 
                      : "w-1.5 h-1.5 bg-white/50"
                  )}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {/* Caption */}
      <div className="px-4 py-2">
        <p className="text-sm">
          <span className="font-semibold text-white">{author.username}</span>{" "}
          <span className="text-white/80">{truncatedContent}</span>
          {content.length > 100 && !expanded && (
            <button 
              onClick={() => setExpanded(true)}
              className="text-white/50 ml-1"
            >
              ещё
            </button>
          )}
        </p>
      </div>

      {/* Mentions */}
      {mentions && mentions.length > 0 && (
        <div className="px-4 pb-1 flex items-center gap-1.5 flex-wrap">
          <Users className="w-3.5 h-3.5 text-blue-400" />
          {mentions.map((m, i) => (
            <button
              key={m.user_id}
              onClick={() => navigate(`/user/${m.user_id}`)}
              className="text-xs text-blue-400 font-medium hover:underline"
            >
              @{m.display_name}{i < mentions.length - 1 ? "," : ""}
            </button>
          ))}
        </div>
      )}

      {/* Actions with Stats */}
      <div className="px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-5">
          <button
            onClick={handleLike}
            className={cn(
              "flex items-center gap-1.5 transition-all",
              liked ? "text-destructive" : "text-white/90"
            )}
          >
            <Heart 
              className={cn(
                "w-6 h-6 transition-transform",
                liked && "fill-current",
                likeAnimation && "animate-like-bounce"
              )} 
            />
            <span className="text-sm">{formatNumber(likeCount)}</span>
          </button>
          <button 
            className="flex items-center gap-1.5 text-white/90"
            onClick={() => setShowComments(true)}
          >
            <MessageCircle className="w-6 h-6" />
            <span className="text-sm">{formatNumber(comments)}</span>
          </button>
          <button 
            className="flex items-center gap-1.5 text-white/90"
            onClick={() => setShowShare(true)}
          >
            <Send className="w-6 h-6" />
          </button>
        </div>
        <div className="flex items-center gap-4">
          <button
            onClick={handleSave}
            className={cn(
              "transition-colors",
              saved ? "text-primary" : "text-white/90"
            )}
          >
            <Bookmark className={cn("w-6 h-6", saved && "fill-current")} />
          </button>
        </div>
      </div>

      {/* Time */}
      <div className="px-4 pb-3 text-xs text-white/40">
        <span>{timeAgo}</span>
      </div>

      {/* Comments Sheet */}
      {id && (
        <>
          <CommentsSheet
            isOpen={showComments}
            onClose={() => setShowComments(false)}
            postId={id}
            commentsCount={comments}
          />
          <ShareSheet
            isOpen={showShare}
            onClose={() => setShowShare(false)}
            postId={id}
            postContent={content}
            postImage={allImages[0]}
          />
          {authorId && (
            <PostOptionsSheet
              isOpen={showOptions}
              onClose={() => setShowOptions(false)}
              postId={id}
              authorId={authorId}
              authorUsername={author.username}
              anchorRef={optionsBtnRef}
              onDeleted={() => onDeleted?.(id)}
            />
          )}
        </>
      )}
    </div>
  );
}
