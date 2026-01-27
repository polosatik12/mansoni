import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
  Heart,
  MessageCircle,
  Send,
  Bookmark,
  Music2,
  Play,
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
import { ReelCommentsSheet } from "@/components/reels/ReelCommentsSheet";
import { ReelShareSheet } from "@/components/reels/ReelShareSheet";
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
  const { reels, loading, toggleLike, recordView, refetch } = useReels();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);
  const [showCreateSheet, setShowCreateSheet] = useState(false);
  const [commentsReelId, setCommentsReelId] = useState<string | null>(null);
  const [shareReelId, setShareReelId] = useState<string | null>(null);
  
  // Instagram-style swipe animation states
  const [dragOffset, setDragOffset] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [isTransitioning, setIsTransitioning] = useState(false);
  
  const containerRef = useRef<HTMLDivElement>(null);
  const videoRefs = useRef<Map<number, HTMLVideoElement>>(new Map());
  const viewedReels = useRef<Set<string>>(new Set());
  const rafRef = useRef<number>(0);
  
  // Touch tracking
  const touchStartY = useRef(0);
  const touchStartTime = useRef(0);
  const lastTouchY = useRef(0);
  const velocityRef = useRef(0);
  const lastMoveTime = useRef(0);

  const currentReel = reels[currentIndex];

  // Record view when reel changes
  useEffect(() => {
    if (currentReel && !viewedReels.current.has(currentReel.id)) {
      viewedReels.current.add(currentReel.id);
      recordView(currentReel.id);
    }
  }, [currentReel, recordView]);

  // Handle video play/pause based on current index
  useEffect(() => {
    videoRefs.current.forEach((video, index) => {
      if (index === currentIndex && isPlaying && !isDragging) {
        video.play().catch(() => {});
      } else {
        video.pause();
      }
    });
  }, [currentIndex, isPlaying, isDragging]);

  // Navigate to specific reel with animation
  const goToReel = useCallback((newIndex: number) => {
    if (newIndex < 0 || newIndex >= reels.length || newIndex === currentIndex) {
      // Quick snap back
      setIsTransitioning(true);
      setDragOffset(0);
      requestAnimationFrame(() => {
        setTimeout(() => setIsTransitioning(false), 200);
      });
      return;
    }
    
    setIsTransitioning(true);
    setCurrentIndex(newIndex);
    setDragOffset(0);
    setIsPlaying(true);
    
    // Faster transition cleanup
    requestAnimationFrame(() => {
      setTimeout(() => {
        setIsTransitioning(false);
      }, 250);
    });
  }, [currentIndex, reels.length]);

  // Touch handlers for Instagram-style swipe
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    if (isTransitioning) return;
    
    // Cancel any pending animation frame
    if (rafRef.current) {
      cancelAnimationFrame(rafRef.current);
    }
    
    touchStartY.current = e.touches[0].clientY;
    lastTouchY.current = e.touches[0].clientY;
    touchStartTime.current = Date.now();
    lastMoveTime.current = Date.now();
    velocityRef.current = 0;
    setIsDragging(true);
  }, [isTransitioning]);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (!isDragging || isTransitioning) return;
    
    const currentY = e.touches[0].clientY;
    const deltaY = currentY - touchStartY.current;
    const now = Date.now();
    const timeDelta = now - lastMoveTime.current;
    
    // Calculate velocity for momentum
    if (timeDelta > 0) {
      const moveDelta = currentY - lastTouchY.current;
      velocityRef.current = moveDelta / timeDelta;
    }
    
    lastTouchY.current = currentY;
    lastMoveTime.current = now;
    
    // Add resistance at boundaries
    const isAtStart = currentIndex === 0 && deltaY > 0;
    const isAtEnd = currentIndex === reels.length - 1 && deltaY < 0;
    
    // Use RAF for smoother updates
    rafRef.current = requestAnimationFrame(() => {
      if (isAtStart || isAtEnd) {
        setDragOffset(deltaY * 0.25); // Rubber band effect
      } else {
        setDragOffset(deltaY);
      }
    });
  }, [isDragging, isTransitioning, currentIndex, reels.length]);

  const handleTouchEnd = useCallback(() => {
    if (!isDragging) return;
    setIsDragging(false);
    
    // Cancel pending RAF
    if (rafRef.current) {
      cancelAnimationFrame(rafRef.current);
    }
    
    const screenHeight = window.innerHeight - 64;
    const threshold = screenHeight * 0.1; // 10% threshold for easier swipe
    const absVelocity = Math.abs(velocityRef.current);
    
    // Use velocity for momentum-based navigation
    const shouldNavigate = Math.abs(dragOffset) > threshold || absVelocity > 0.3;
    
    if (shouldNavigate) {
      const direction = dragOffset < 0 || velocityRef.current < -0.3 ? 1 : -1;
      
      if (direction > 0 && currentIndex < reels.length - 1) {
        goToReel(currentIndex + 1);
      } else if (direction < 0 && currentIndex > 0) {
        goToReel(currentIndex - 1);
      } else {
        // Snap back
        setIsTransitioning(true);
        setDragOffset(0);
        setTimeout(() => setIsTransitioning(false), 180);
      }
    } else {
      // Snap back quickly
      setIsTransitioning(true);
      setDragOffset(0);
      setTimeout(() => setIsTransitioning(false), 180);
    }
  }, [isDragging, dragOffset, currentIndex, reels.length, goToReel]);

  const handleLike = useCallback((reelId: string) => {
    if (!user) {
      toast.error("Войдите, чтобы поставить лайк");
      navigate("/auth");
      return;
    }
    toggleLike(reelId);
  }, [user, toggleLike, navigate]);

  const togglePlay = () => {
    setIsPlaying(!isPlaying);
  };

  // Double tap to like
  const lastTap = useRef<number>(0);
  const [showHeartAnimation, setShowHeartAnimation] = useState(false);
  
  const handleDoubleTap = useCallback((reelId: string, isLiked: boolean) => {
    const now = Date.now();
    if (now - lastTap.current < 300) {
      if (!isLiked) {
        handleLike(reelId);
      }
      // Show heart animation
      setShowHeartAnimation(true);
      setTimeout(() => setShowHeartAnimation(false), 1000);
    } else {
      togglePlay();
    }
    lastTap.current = now;
  }, [handleLike]);

  // Calculate transforms for each reel - simplified for performance
  const getReelStyle = (index: number) => {
    const screenHeight = window.innerHeight - 64;
    const baseOffset = (index - currentIndex) * screenHeight;
    const totalOffset = baseOffset + dragOffset;
    
    const distance = index - currentIndex;
    const isCurrent = distance === 0;
    const isAdjacent = Math.abs(distance) === 1;
    
    // Simplified: no scale effects, just smooth translation
    const zIndex = isCurrent ? 20 : isAdjacent ? 15 : 5;
    const opacity = isCurrent ? 1 : isAdjacent ? 1 : 0;
    
    return {
      transform: `translate3d(0, ${totalOffset}px, 0)`,
      opacity,
      zIndex,
      transition: isTransitioning 
        ? 'transform 0.2s cubic-bezier(0.25, 0.1, 0.25, 1)' 
        : 'none',
      willChange: 'transform',
      backfaceVisibility: 'hidden' as const,
      WebkitBackfaceVisibility: 'hidden' as const,
    };
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
      ref={containerRef}
      className="h-[calc(100vh-4rem)] bg-black overflow-hidden relative touch-none"
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {/* Render only visible reels for performance */}
      {reels.map((reel, index) => {
        // Only render current and adjacent reels
        if (Math.abs(index - currentIndex) > 1) return null;
        
        return (
          <div
            key={reel.id}
            className="absolute inset-0 w-full h-full"
            style={getReelStyle(index)}
            onClick={() => handleDoubleTap(reel.id, reel.isLiked || false)}
          >
            {/* Video/Image Background */}
            <div className="absolute inset-0 rounded-lg overflow-hidden">
              {reel.video_url.includes(".mp4") || reel.video_url.includes("video") ? (
                <video
                  ref={(el) => {
                    if (el) videoRefs.current.set(index, el);
                  }}
                  src={reel.video_url}
                  className="w-full h-full object-cover"
                  loop
                  muted
                  playsInline
                  preload="auto"
                />
              ) : (
                <img
                  src={reel.video_url}
                  alt=""
                  className="w-full h-full object-cover"
                />
              )}

              {/* Play/Pause indicator */}
              {index === currentIndex && !isPlaying && !isDragging && (
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <div className="w-20 h-20 rounded-full bg-black/40 backdrop-blur-sm flex items-center justify-center animate-scale-in">
                    <Play className="w-10 h-10 text-white fill-white ml-1" />
                  </div>
                </div>
              )}
              
              {/* Double tap heart animation */}
              {index === currentIndex && showHeartAnimation && (
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <Heart 
                    className="w-28 h-28 text-white fill-white animate-[heartBurst_1s_ease-out_forwards]" 
                    style={{
                      filter: 'drop-shadow(0 0 20px rgba(255,255,255,0.5))',
                    }}
                  />
                </div>
              )}
            </div>

            {/* Gradient overlays */}
            <div className="absolute inset-x-0 top-0 h-32 bg-gradient-to-b from-black/60 to-transparent pointer-events-none" />
            <div className="absolute inset-x-0 bottom-0 h-48 bg-gradient-to-t from-black/80 to-transparent pointer-events-none" />

            {/* Right sidebar actions */}
            <div className="absolute right-3 bottom-8 flex flex-col items-center gap-4 z-10">
              {/* Like */}
              <button 
                className="flex flex-col items-center gap-1" 
                onClick={(e) => { e.stopPropagation(); handleLike(reel.id); }}
              >
                <div
                  className={cn(
                    "w-12 h-12 rounded-full flex items-center justify-center transition-all duration-200",
                    reel.isLiked ? "bg-destructive/20 scale-110" : "bg-white/10 backdrop-blur-sm"
                  )}
                >
                  <Heart
                    className={cn(
                      "w-7 h-7 transition-all duration-200",
                      reel.isLiked ? "text-destructive fill-destructive scale-110" : "text-white"
                    )}
                  />
                </div>
                <span className="text-white text-xs font-medium">
                  {reel.likes_count > 0 ? formatNumber(reel.likes_count) : ""}
                </span>
              </button>

              {/* Comments */}
              <button 
                className="flex flex-col items-center gap-1" 
                onClick={(e) => { 
                  e.stopPropagation(); 
                  setCommentsReelId(reel.id);
                }}
              >
                <div className="w-12 h-12 rounded-full bg-white/10 backdrop-blur-sm flex items-center justify-center">
                  <MessageCircle className="w-7 h-7 text-white" />
                </div>
                <span className="text-white text-xs font-medium">
                  {reel.comments_count > 0 ? formatNumber(reel.comments_count) : ""}
                </span>
              </button>

              {/* Share */}
              <button 
                className="flex flex-col items-center gap-1" 
                onClick={(e) => { 
                  e.stopPropagation(); 
                  if (!user) {
                    toast.error("Войдите, чтобы поделиться");
                    navigate("/auth");
                    return;
                  }
                  setShareReelId(reel.id);
                }}
              >
                <div className="w-12 h-12 rounded-full bg-white/10 backdrop-blur-sm flex items-center justify-center">
                  <Send className="w-6 h-6 text-white" />
                </div>
                <span className="text-white text-xs font-medium">Отправить</span>
              </button>

              {/* Save */}
              <button className="flex flex-col items-center gap-1" onClick={(e) => e.stopPropagation()}>
                <div className="w-12 h-12 rounded-full bg-white/10 backdrop-blur-sm flex items-center justify-center">
                  <Bookmark className="w-6 h-6 text-white" />
                </div>
              </button>

              {/* Author avatar */}
              <button
                className="relative"
                onClick={(e) => {
                  e.stopPropagation();
                  if (reel.author?.display_name) {
                    navigate(`/user/${reel.author.display_name}`);
                  }
                }}
              >
                <Avatar className="w-11 h-11 border-2 border-white">
                  <AvatarImage src={reel.author?.avatar_url || undefined} />
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
            <div className="absolute left-4 right-20 bottom-4 z-10">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-white font-semibold">
                  @{reel.author?.display_name || "user"}
                </span>
              </div>
              {reel.description && (
                <p className="text-white/90 text-sm line-clamp-2 mb-3">
                  {reel.description}
                </p>
              )}
              {reel.music_title && (
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center animate-spin-slow">
                    <Music2 className="w-4 h-4 text-white" />
                  </div>
                  <span className="text-white/80 text-sm">{reel.music_title}</span>
                </div>
              )}
            </div>
          </div>
        );
      })}

      {/* Progress indicator dots */}
      <div className="absolute top-3 left-1/2 -translate-x-1/2 flex gap-1.5 z-20">
        {reels.slice(0, Math.min(5, reels.length)).map((_, index) => (
          <div 
            key={index}
            className={cn(
              "w-1.5 h-1.5 rounded-full transition-all duration-300",
              index === currentIndex % 5 
                ? "bg-white w-4" 
                : "bg-white/40"
            )}
          />
        ))}
      </div>

      <CreateReelSheet open={showCreateSheet} onOpenChange={setShowCreateSheet} />
      
      {/* Share Sheet */}
      <ReelShareSheet
        isOpen={!!shareReelId}
        onClose={() => setShareReelId(null)}
        reelId={shareReelId || ""}
      />

      {commentsReelId && (
        <ReelCommentsSheet
          isOpen={!!commentsReelId}
          onClose={() => {
            setCommentsReelId(null);
            refetch();
          }}
          reelId={commentsReelId}
          commentsCount={reels.find(r => r.id === commentsReelId)?.comments_count || 0}
        />
      )}

      {/* Keyframes for heart animation */}
      <style>{`
        @keyframes heartBurst {
          0% {
            transform: scale(0);
            opacity: 1;
          }
          50% {
            transform: scale(1.2);
            opacity: 1;
          }
          100% {
            transform: scale(1);
            opacity: 0;
          }
        }
      `}</style>
    </div>
  );
}
