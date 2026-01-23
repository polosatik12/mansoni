import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
  Heart,
  MessageCircle,
  Send,
  Bookmark,
  Music2,
  Play,
  ChevronUp,
  ChevronDown,
  User,
  Loader2,
  Plus,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useReels } from "@/hooks/useReels";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { CreateReelSheet } from "@/components/reels/CreateReelSheet";
import { Button } from "@/components/ui/button";

function formatNumber(num: number): string {
  if (num >= 1000000) {
    return (num / 1000000).toFixed(1).replace(/\.0$/, "") + "M";
  }
  if (num >= 1000) {
    return (num / 1000).toFixed(1).replace(/\.0$/, "") + "K";
  }
  return num.toString();
}


export function ReelsPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { reels, loading, toggleLike, recordView } = useReels();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [showCreateSheet, setShowCreateSheet] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const viewedReels = useRef<Set<string>>(new Set());

  const currentReel = reels[currentIndex];

  // Record view when reel changes
  useEffect(() => {
    if (currentReel && !viewedReels.current.has(currentReel.id)) {
      viewedReels.current.add(currentReel.id);
      recordView(currentReel.id);
    }
  }, [currentReel, recordView]);

  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchStart(e.touches[0].clientY);
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStart === null) return;

    const diff = touchStart - e.changedTouches[0].clientY;
    const threshold = 50;

    if (diff > threshold && currentIndex < reels.length - 1) {
      setCurrentIndex(currentIndex + 1);
    } else if (diff < -threshold && currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
    }

    setTouchStart(null);
  };

  const handleLike = useCallback(() => {
    if (!user) {
      toast.error("Войдите, чтобы поставить лайк");
      navigate("/auth");
      return;
    }
    if (currentReel) {
      toggleLike(currentReel.id);
    }
  }, [user, currentReel, toggleLike, navigate]);

  const togglePlay = () => {
    setIsPlaying(!isPlaying);
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
      }
    }
  };

  if (loading) {
    return (
      <div className="min-h-[calc(100vh-4rem)] bg-black flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-white" />
      </div>
    );
  }

  if (reels.length === 0) {
    return (
      <div className="min-h-[calc(100vh-4rem)] bg-black flex flex-col items-center justify-center text-white">
        <Play className="w-16 h-16 mb-4 opacity-40" />
        <h2 className="text-lg font-semibold mb-2">Нет Reels</h2>
        <p className="text-white/60 text-center px-8 mb-6">
          Пока нет видео для просмотра. Будьте первым!
        </p>
        {user && (
          <Button
            onClick={() => setShowCreateSheet(true)}
            className="gap-2"
          >
            <Plus className="w-4 h-4" />
            Создать Reel
          </Button>
        )}
        <CreateReelSheet open={showCreateSheet} onOpenChange={setShowCreateSheet} />
      </div>
    );
  }

  return (
    <div
      className="relative h-[calc(100vh-4rem)] bg-black overflow-hidden"
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      {/* Video/Image Background */}
      <div className="absolute inset-0" onClick={togglePlay}>
        {currentReel.video_url.includes(".mp4") ||
        currentReel.video_url.includes("video") ? (
          <video
            ref={videoRef}
            src={currentReel.video_url}
            className="w-full h-full object-cover"
            loop
            autoPlay={isPlaying}
            muted
            playsInline
          />
        ) : (
          <img
            src={currentReel.video_url}
            alt=""
            className="w-full h-full object-cover"
          />
        )}

        {/* Play/Pause indicator */}
        {!isPlaying && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-20 h-20 rounded-full bg-black/40 flex items-center justify-center">
              <Play className="w-10 h-10 text-white fill-white ml-1" />
            </div>
          </div>
        )}
      </div>

      {/* Gradient overlays */}
      <div className="absolute inset-x-0 top-0 h-32 bg-gradient-to-b from-black/60 to-transparent pointer-events-none" />
      <div className="absolute inset-x-0 bottom-0 h-48 bg-gradient-to-t from-black/80 to-transparent pointer-events-none" />


      {/* Right sidebar actions */}
      <div className="absolute right-3 bottom-20 flex flex-col items-center gap-4">
        {/* Like */}
        <button className="flex flex-col items-center gap-1" onClick={handleLike}>
          <div
            className={cn(
              "w-12 h-12 rounded-full flex items-center justify-center transition-colors",
              currentReel.isLiked ? "bg-destructive/20" : "bg-white/10"
            )}
          >
            <Heart
              className={cn(
                "w-7 h-7 transition-colors",
                currentReel.isLiked ? "text-destructive fill-destructive" : "text-white"
              )}
            />
          </div>
          <span className="text-white text-xs font-medium">
            {formatNumber(currentReel.likes_count)}
          </span>
        </button>

        {/* Comments */}
        <button className="flex flex-col items-center gap-1">
          <div className="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center">
            <MessageCircle className="w-7 h-7 text-white" />
          </div>
          <span className="text-white text-xs font-medium">
            {formatNumber(currentReel.comments_count)}
          </span>
        </button>

        {/* Share */}
        <button className="flex flex-col items-center gap-1">
          <div className="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center">
            <Send className="w-6 h-6 text-white" />
          </div>
          <span className="text-white text-xs font-medium">Отправить</span>
        </button>

        {/* Save */}
        <button className="flex flex-col items-center gap-1">
          <div className="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center">
            <Bookmark className="w-6 h-6 text-white" />
          </div>
        </button>

        {/* Author avatar */}
        <button
          className="relative"
          onClick={() => {
            if (currentReel.author?.display_name) {
              navigate(`/user/${currentReel.author.display_name}`);
            }
          }}
        >
          <Avatar className="w-11 h-11 border-2 border-white">
            <AvatarImage src={currentReel.author?.avatar_url || undefined} />
            <AvatarFallback className="bg-muted">
              <User className="w-5 h-5" />
            </AvatarFallback>
          </Avatar>
          <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-5 h-5 rounded-full bg-primary flex items-center justify-center">
            <span className="text-primary-foreground text-xs font-bold">+</span>
          </div>
        </button>
      </div>

      {/* Bottom info */}
      <div className="absolute left-4 right-20 bottom-16">
        <div className="flex items-center gap-2 mb-2">
          <span className="text-white font-semibold">
            @{currentReel.author?.display_name || "user"}
          </span>
        </div>
        {currentReel.description && (
          <p className="text-white/90 text-sm line-clamp-2 mb-3">
            {currentReel.description}
          </p>
        )}
        {currentReel.music_title && (
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center animate-spin-slow">
              <Music2 className="w-4 h-4 text-white" />
            </div>
            <span className="text-white/80 text-sm">{currentReel.music_title}</span>
          </div>
        )}
      </div>

      {/* Navigation arrows */}
      <div className="absolute right-4 top-1/2 -translate-y-1/2 flex flex-col gap-2">
        <button
          className={cn(
            "w-10 h-10 rounded-full bg-white/10 flex items-center justify-center transition-opacity",
            currentIndex === 0 ? "opacity-30" : "opacity-100"
          )}
          onClick={() => currentIndex > 0 && setCurrentIndex(currentIndex - 1)}
          disabled={currentIndex === 0}
        >
          <ChevronUp className="w-6 h-6 text-white" />
        </button>
        <button
          className={cn(
            "w-10 h-10 rounded-full bg-white/10 flex items-center justify-center transition-opacity",
            currentIndex === reels.length - 1 ? "opacity-30" : "opacity-100"
          )}
          onClick={() =>
            currentIndex < reels.length - 1 && setCurrentIndex(currentIndex + 1)
          }
          disabled={currentIndex === reels.length - 1}
        >
          <ChevronDown className="w-6 h-6 text-white" />
        </button>
      </div>

      <CreateReelSheet open={showCreateSheet} onOpenChange={setShowCreateSheet} />
    </div>
  );
}
