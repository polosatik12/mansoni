import { Heart, MessageCircle, Send, Bookmark, MoreHorizontal, BadgeCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { cn } from "@/lib/utils";

interface PostCardProps {
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
  timeAgo: string;
  isRecommended?: boolean;
}

export function PostCard({
  author,
  content,
  image,
  images,
  likes,
  comments,
  shares,
  saves = 0,
  timeAgo,
  isRecommended = false,
}: PostCardProps) {
  const [liked, setLiked] = useState(false);
  const [saved, setSaved] = useState(false);
  const [likeCount, setLikeCount] = useState(likes);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [expanded, setExpanded] = useState(false);

  const allImages = images || (image ? [image] : []);
  const hasMultipleImages = allImages.length > 1;

  const handleLike = () => {
    setLiked(!liked);
    setLikeCount(liked ? likeCount - 1 : likeCount + 1);
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

  return (
    <div className="bg-card border-b border-border">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3">
        <div className="flex items-center gap-3">
          <div className="relative">
            <img
              src={author.avatar}
              alt={author.name}
              className="w-10 h-10 rounded-full object-cover ring-2 ring-primary/20"
            />
            {author.verified && (
              <div className="absolute -bottom-0.5 -right-0.5 w-4 h-4 bg-primary rounded-full flex items-center justify-center">
                <BadgeCheck className="w-3 h-3 text-primary-foreground" />
              </div>
            )}
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-semibold text-foreground text-sm">{author.username}</span>
            </div>
            {isRecommended && (
              <p className="text-xs text-muted-foreground">Рекомендации для вас</p>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button 
            variant="default" 
            size="sm" 
            className="rounded-lg text-xs font-semibold h-8 px-4"
          >
            Подписаться
          </Button>
          <Button variant="ghost" size="icon" className="text-muted-foreground h-8 w-8">
            <MoreHorizontal className="w-5 h-5" />
          </Button>
        </div>
      </div>

      {/* Image Carousel */}
      {allImages.length > 0 && (
        <div className="relative aspect-square">
          <img
            src={allImages[currentImageIndex]}
            alt="Post image"
            className="w-full h-full object-cover"
          />
          
          {/* Image counter */}
          {hasMultipleImages && (
            <div className="absolute top-3 right-3 bg-black/60 text-white text-xs font-medium px-2 py-1 rounded-full">
              {currentImageIndex + 1}/{allImages.length}
            </div>
          )}

          {/* Navigation arrows */}
          {hasMultipleImages && currentImageIndex > 0 && (
            <button
              onClick={() => setCurrentImageIndex(currentImageIndex - 1)}
              className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 bg-white/90 rounded-full flex items-center justify-center shadow-lg"
            >
              <span className="text-black font-bold">‹</span>
            </button>
          )}
          {hasMultipleImages && currentImageIndex < allImages.length - 1 && (
            <button
              onClick={() => setCurrentImageIndex(currentImageIndex + 1)}
              className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 bg-white/90 rounded-full flex items-center justify-center shadow-lg"
            >
              <span className="text-black font-bold">›</span>
            </button>
          )}

          {/* Dots indicator */}
          {hasMultipleImages && (
            <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex items-center gap-1">
              {allImages.map((_, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentImageIndex(index)}
                  className={cn(
                    "w-1.5 h-1.5 rounded-full transition-all",
                    index === currentImageIndex 
                      ? "bg-primary w-2" 
                      : "bg-white/60"
                  )}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {/* Actions */}
      <div className="px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={handleLike}
            className={cn(
              "flex items-center gap-1.5 transition-colors",
              liked ? "text-destructive" : "text-foreground"
            )}
          >
            <Heart className={cn("w-6 h-6", liked && "fill-current")} />
          </button>
          <button className="flex items-center gap-1.5 text-foreground">
            <MessageCircle className="w-6 h-6" />
          </button>
          <button className="flex items-center gap-1.5 text-foreground">
            <Send className="w-6 h-6" />
          </button>
        </div>
        <button
          onClick={() => setSaved(!saved)}
          className="text-foreground"
        >
          <Bookmark className={cn("w-6 h-6", saved && "fill-current")} />
        </button>
      </div>

      {/* Stats */}
      <div className="px-4 flex items-center gap-4 text-sm">
        <span className="flex items-center gap-1">
          <Heart className="w-4 h-4" />
          <span className="font-medium">{formatNumber(likeCount)}</span>
        </span>
        <span className="flex items-center gap-1">
          <MessageCircle className="w-4 h-4" />
          <span>{formatNumber(comments)}</span>
        </span>
        <span className="flex items-center gap-1">
          <Send className="w-4 h-4" />
          <span>{formatNumber(shares)}</span>
        </span>
        <span className="flex items-center gap-1">
          <Bookmark className="w-4 h-4" />
          <span>{formatNumber(saves)}</span>
        </span>
      </div>

      {/* Caption */}
      <div className="px-4 py-2">
        <p className="text-sm">
          <span className="font-semibold">{author.username}</span>{" "}
          <span className="text-foreground">{truncatedContent}</span>
          {content.length > 100 && !expanded && (
            <button 
              onClick={() => setExpanded(true)}
              className="text-muted-foreground ml-1"
            >
              ещё
            </button>
          )}
        </p>
      </div>

      {/* Time & Translation */}
      <div className="px-4 pb-3 flex items-center gap-2 text-xs text-muted-foreground">
        <span>{timeAgo}</span>
        <span>·</span>
        <button className="hover:text-foreground transition-colors">
          Показать перевод
        </button>
      </div>
    </div>
  );
}
