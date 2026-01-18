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
  likes: number;
  comments: number;
  shares: number;
  timeAgo: string;
}

export function PostCard({
  author,
  content,
  image,
  likes,
  comments,
  shares,
  timeAgo,
}: PostCardProps) {
  const [liked, setLiked] = useState(false);
  const [saved, setSaved] = useState(false);
  const [likeCount, setLikeCount] = useState(likes);

  const handleLike = () => {
    setLiked(!liked);
    setLikeCount(liked ? likeCount - 1 : likeCount + 1);
  };

  const formatNumber = (num: number) => {
    if (num >= 1000) {
      return (num / 1000).toFixed(1) + "K";
    }
    return num.toString();
  };

  return (
    <div className="bg-card border border-border rounded-2xl overflow-hidden mx-4 mb-4 shadow-sm">
      {/* Header */}
      <div className="flex items-center justify-between p-4">
        <div className="flex items-center gap-3">
          <img
            src={author.avatar}
            alt={author.name}
            className="w-11 h-11 rounded-full object-cover"
          />
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-semibold text-foreground">{author.name}</span>
              {author.verified && (
                <BadgeCheck className="w-4 h-4 text-primary fill-primary stroke-primary-foreground" />
              )}
            </div>
            <p className="text-sm text-muted-foreground">
              @{author.username} · {timeAgo}
            </p>
          </div>
        </div>
        <Button variant="ghost" size="icon" className="text-muted-foreground">
          <MoreHorizontal className="w-5 h-5" />
        </Button>
      </div>

      {/* Image */}
      {image && (
        <div className="aspect-[4/3] relative">
          <img
            src={image}
            alt="Post image"
            className="w-full h-full object-cover"
          />
        </div>
      )}

      {/* Content */}
      <div className="p-4">
        <p className="text-foreground text-[15px] leading-relaxed">{content}</p>
      </div>

      {/* Actions */}
      <div className="px-4 pb-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={handleLike}
            className={cn(
              "flex items-center gap-1.5 transition-colors",
              liked ? "text-destructive" : "text-muted-foreground hover:text-destructive"
            )}
          >
            <Heart className={cn("w-5 h-5", liked && "fill-current")} />
            <span className="text-sm font-medium">{formatNumber(likeCount)}</span>
          </button>
          <button className="flex items-center gap-1.5 text-muted-foreground hover:text-foreground transition-colors">
            <MessageCircle className="w-5 h-5" />
            <span className="text-sm font-medium">{formatNumber(comments)}</span>
          </button>
          <button className="flex items-center gap-1.5 text-muted-foreground hover:text-foreground transition-colors">
            <Send className="w-5 h-5" />
            <span className="text-sm font-medium">{formatNumber(shares)}</span>
          </button>
        </div>
        <button
          onClick={() => setSaved(!saved)}
          className={cn(
            "transition-colors",
            saved ? "text-foreground" : "text-muted-foreground hover:text-foreground"
          )}
        >
          <Bookmark className={cn("w-5 h-5", saved && "fill-current")} />
        </button>
      </div>
    </div>
  );
}
