import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
  Heart,
  MessageCircle,
  Send,
  Bookmark,
  Play,
  User,
  Loader2,
  Plus,
  Volume2,
  VolumeX,
  BookmarkCheck,
  UserPlus,
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
import { VerifiedBadge } from "@/components/ui/verified-badge";

function formatCount(num: number): string {
  if (num >= 1000000) return (num / 1000000).toFixed(1).replace(/\.0$/, "") + "M";
  if (num >= 1000) return (num / 1000).toFixed(1).replace(/\.0$/, "") + "K";
  return num.toString();
}

type FeedTab = "foryou" | "following";

export function ReelsPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { reels, loading, toggleLike, recordView, refetch } = useReels();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isMuted, setIsMuted] = useState(true);
  const [isPaused, setIsPaused] = useState(false);
  const [showCreateSheet, setShowCreateSheet] = useState(false);
  const [commentsReelId, setCommentsReelId] = useState<string | null>(null);
  const [shareReelId, setShareReelId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<FeedTab>("foryou");
  const [savedReels, setSavedReels] = useState<Set<string>>(new Set());
  const [videoProgress, setVideoProgress] = useState(0);

  const containerRef = useRef<HTMLDivElement>(null);
  const videoRefs = useRef<Map<number, HTMLVideoElement>>(new Map());
  const viewedReels = useRef<Set<string>>(new Set());
  const progressAnimRef = useRef<number>(0);

  // Double-tap
  const lastTapTime = useRef(0);
  const lastTapPos = useRef({ x: 0, y: 0 });
  const [heartAnimPos, setHeartAnimPos] = useState<{ x: number; y: number } | null>(null);
  const [showMuteIndicator, setShowMuteIndicator] = useState(false);
  const longPressTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isLongPressing = useRef(false);

  const currentReel = reels[currentIndex];

  // Record view
  useEffect(() => {
    if (currentReel && !viewedReels.current.has(currentReel.id)) {
      viewedReels.current.add(currentReel.id);
      recordView(currentReel.id);
    }
  }, [currentReel, recordView]);

  // Play/pause current video and preload adjacent
  useEffect(() => {
    videoRefs.current.forEach((video, index) => {
      if (index === currentIndex) {
        video.muted = isMuted;
        if (!isPaused) {
          video.play().catch(() => {});
        } else {
          video.pause();
        }
      } else {
        video.pause();
        video.currentTime = 0;
      }
    });
  }, [currentIndex, isPaused, isMuted]);

  // Progress bar
  useEffect(() => {
    const updateProgress = () => {
      const video = videoRefs.current.get(currentIndex);
      if (video && video.duration) {
        setVideoProgress((video.currentTime / video.duration) * 100);
      }
      progressAnimRef.current = requestAnimationFrame(updateProgress);
    };
    progressAnimRef.current = requestAnimationFrame(updateProgress);
    return () => cancelAnimationFrame(progressAnimRef.current);
  }, [currentIndex]);

  // Scroll handler
  const handleScroll = useCallback(() => {
    if (!containerRef.current) return;
    const container = containerRef.current;
    const scrollTop = container.scrollTop;
    const itemHeight = container.clientHeight;
    const newIndex = Math.round(scrollTop / itemHeight);
    if (newIndex !== currentIndex && newIndex >= 0 && newIndex < reels.length) {
      setCurrentIndex(newIndex);
      setIsPaused(false);
      setVideoProgress(0);
    }
  }, [currentIndex, reels.length]);

  const handleLike = useCallback((reelId: string) => {
    if (!user) {
      toast.error("Войдите, чтобы поставить лайк");
      navigate("/auth");
      return;
    }
    toggleLike(reelId);
  }, [user, toggleLike, navigate]);

  const handleSave = useCallback((reelId: string) => {
    if (!user) {
      toast.error("Войдите, чтобы сохранить");
      navigate("/auth");
      return;
    }
    setSavedReels(prev => {
      const next = new Set(prev);
      if (next.has(reelId)) {
        next.delete(reelId);
        toast("Убрано из сохранённого");
      } else {
        next.add(reelId);
        toast("Сохранено");
      }
      return next;
    });
  }, [user, navigate]);

  // Handle tap (single = toggle mute, double = like)
  const handleTap = useCallback((e: React.MouseEvent, reel: typeof reels[0]) => {
    if (isLongPressing.current) return;
    const now = Date.now();
    const x = e.clientX;
    const y = e.clientY;

    if (now - lastTapTime.current < 300) {
      // Double tap → like
      if (!reel.isLiked) handleLike(reel.id);
      setHeartAnimPos({ x, y });
      setTimeout(() => setHeartAnimPos(null), 900);
      lastTapTime.current = 0;
    } else {
      // Single tap → toggle mute
      lastTapTime.current = now;
      lastTapPos.current = { x, y };
      setTimeout(() => {
        if (lastTapTime.current === now) {
          setIsMuted(prev => !prev);
          setShowMuteIndicator(true);
          setTimeout(() => setShowMuteIndicator(false), 800);
        }
      }, 300);
    }
  }, [handleLike]);

  // Long press → pause, release → resume
  const handleTouchStart = useCallback(() => {
    isLongPressing.current = false;
    longPressTimer.current = setTimeout(() => {
      isLongPressing.current = true;
      setIsPaused(true);
    }, 400);
  }, []);

  const handleTouchEnd = useCallback(() => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
    if (isLongPressing.current) {
      setIsPaused(false);
      isLongPressing.current = false;
    }
  }, []);

  if (loading) {
    return (
      <div className="h-[100dvh] bg-black flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-white" />
      </div>
    );
  }

  if (reels.length === 0) {
    return (
      <div className="h-[100dvh] bg-black flex flex-col items-center justify-center text-white px-8">
        <Play className="w-16 h-16 mb-4 opacity-40" />
        <h2 className="text-xl font-bold mb-2">Reels</h2>
        <p className="text-white/60 text-center mb-6">
          Пока нет видео. Будьте первым!
        </p>
        {user && (
          <Button onClick={() => setShowCreateSheet(true)} className="gap-2 rounded-full px-6">
            <Plus className="w-4 h-4" />
            Создать Reel
          </Button>
        )}
        <CreateReelSheet open={showCreateSheet} onOpenChange={setShowCreateSheet} />
      </div>
    );
  }

  return (
    <div className="relative h-[100dvh] bg-black overflow-hidden">
      {/* Top header: tabs + create — glass style */}
      <div className="absolute top-0 inset-x-0 z-30 safe-area-top">
        <div className="flex flex-col items-center pt-1.5 pb-0.5">
          <h1 className="text-white font-bold text-[15px] mb-1">Reels</h1>
          <div className="flex items-center gap-5">
            {(["foryou", "following"] as const).map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={cn(
                  "text-sm font-bold pb-0.5 border-b-2 transition-all",
                  activeTab === tab
                    ? "text-white border-white"
                    : "text-white/50 border-transparent"
                )}
              >
                {tab === "foryou" ? "Для тебя" : "Подписки"}
              </button>
            ))}
          </div>
        </div>
        {user && (
          <button
            onClick={() => setShowCreateSheet(true)}
            className="absolute right-4 top-1.5 w-8 h-8 rounded-full bg-white/15 backdrop-blur-md flex items-center justify-center"
          >
            <Plus className="w-4.5 h-4.5 text-white" />
          </button>
        )}
      </div>

      {/* Reels scroll container */}
      <div
        ref={containerRef}
        className="h-[100dvh] overflow-y-scroll overflow-x-hidden snap-y snap-mandatory"
        onScroll={handleScroll}
        style={{
          WebkitOverflowScrolling: "touch",
          scrollbarWidth: "none",
        }}
      >
        {reels.map((reel, index) => {
          const isActive = index === currentIndex;
          const isSaved = savedReels.has(reel.id);

          return (
            <div
              key={reel.id}
              className="relative w-full h-[100dvh] flex-shrink-0 snap-start snap-always"
              onClick={(e) => handleTap(e, reel)}
              onTouchStart={handleTouchStart}
              onTouchEnd={handleTouchEnd}
              onMouseDown={handleTouchStart}
              onMouseUp={handleTouchEnd}
            >
              {/* Video */}
              <div className="absolute inset-0 bg-black">
                {reel.video_url.includes(".mp4") || reel.video_url.includes("video") ? (
                  <video
                    ref={(el) => { if (el) videoRefs.current.set(index, el); }}
                    src={reel.video_url}
                    className="w-full h-full object-cover"
                    loop
                    muted={isMuted}
                    playsInline
                    preload={Math.abs(index - currentIndex) <= 1 ? "auto" : "none"}
                    poster={reel.thumbnail_url || undefined}
                  />
                ) : (
                  <img
                    src={reel.video_url}
                    alt=""
                    className="w-full h-full object-cover"
                  />
                )}
              </div>

              {/* Gradient overlays */}
              <div className="absolute inset-x-0 top-0 h-40 bg-gradient-to-b from-black/70 via-black/30 to-transparent pointer-events-none" />
              <div className="absolute inset-x-0 bottom-0 h-56 bg-gradient-to-t from-black/80 via-black/40 to-transparent pointer-events-none" />

              {/* Mute/Unmute indicator */}
              {isActive && showMuteIndicator && (
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-20">
                  <div className="w-20 h-20 rounded-full bg-black/40 backdrop-blur-sm flex items-center justify-center animate-[fadeInScale_0.2s_ease-out]">
                    {isMuted ? (
                      <VolumeX className="w-10 h-10 text-white" />
                    ) : (
                      <Volume2 className="w-10 h-10 text-white" />
                    )}
                  </div>
                </div>
              )}

              {/* Double-tap heart */}
              {isActive && heartAnimPos && (
                <div
                  className="fixed z-50 pointer-events-none"
                  style={{ left: heartAnimPos.x - 32, top: heartAnimPos.y - 32 }}
                >
                  <Heart
                    className="w-16 h-16 text-red-500 fill-red-500 animate-[heartPop_0.9s_ease-out_forwards]"
                    style={{ filter: "drop-shadow(0 0 20px rgba(239,68,68,0.7))" }}
                  />
                </div>
              )}

              {/* Right sidebar actions */}
              <div className="absolute right-3 bottom-[140px] flex flex-col items-center gap-5 z-20">
                {/* Author avatar */}
                <button
                  className="relative mb-2"
                  onClick={(e) => {
                    e.stopPropagation();
                    if (reel.author_id) navigate(`/user/${reel.author_id}`);
                  }}
                >
                  <Avatar className="w-12 h-12 border-2 border-white shadow-lg">
                    <AvatarImage src={reel.author?.avatar_url || undefined} />
                    <AvatarFallback className="bg-neutral-800 text-white">
                      <User className="w-5 h-5" />
                    </AvatarFallback>
                  </Avatar>
                  {user && reel.author_id !== user.id && (
                    <div className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-6 h-6 rounded-full bg-primary flex items-center justify-center border-2 border-black">
                      <Plus className="w-3.5 h-3.5 text-primary-foreground" strokeWidth={3} />
                    </div>
                  )}
                </button>

                {/* Like */}
                <button
                  className="flex flex-col items-center gap-1"
                  onClick={(e) => { e.stopPropagation(); handleLike(reel.id); }}
                >
                  <Heart
                    className={cn(
                      "w-7 h-7 transition-all duration-200",
                      reel.isLiked
                        ? "text-red-500 fill-red-500 scale-110"
                        : "text-white drop-shadow-lg"
                    )}
                  />
                  <span className="text-white text-[11px] font-semibold drop-shadow">
                    {reel.likes_count > 0 ? formatCount(reel.likes_count) : ""}
                  </span>
                </button>

                {/* Comments */}
                <button
                  className="flex flex-col items-center gap-1"
                  onClick={(e) => { e.stopPropagation(); setCommentsReelId(reel.id); }}
                >
                  <MessageCircle className="w-7 h-7 text-white drop-shadow-lg" />
                  <span className="text-white text-[11px] font-semibold drop-shadow">
                    {reel.comments_count > 0 ? formatCount(reel.comments_count) : ""}
                  </span>
                </button>

                {/* Share */}
                <button
                  className="flex flex-col items-center gap-1"
                  onClick={(e) => {
                    e.stopPropagation();
                    if (!user) { toast.error("Войдите"); navigate("/auth"); return; }
                    setShareReelId(reel.id);
                  }}
                >
                  <Send className="w-6 h-6 text-white drop-shadow-lg" />
                </button>

                {/* Bookmark */}
                <button
                  className="flex flex-col items-center gap-1"
                  onClick={(e) => { e.stopPropagation(); handleSave(reel.id); }}
                >
                  {isSaved ? (
                    <BookmarkCheck className="w-7 h-7 text-white fill-white drop-shadow-lg" />
                  ) : (
                    <Bookmark className="w-7 h-7 text-white drop-shadow-lg" />
                  )}
                </button>

                {/* Vinyl disc */}
                <div className={cn(
                  "w-11 h-11 rounded-full border-[3px] border-white/20 bg-black overflow-hidden",
                  isActive && !isPaused ? "animate-[spinSlow_4s_linear_infinite]" : ""
                )}>
                  <div className="w-full h-full rounded-full relative flex items-center justify-center">
                    {/* Vinyl grooves */}
                    <div className="absolute inset-0 rounded-full bg-gradient-to-br from-neutral-800 via-neutral-900 to-black" />
                    <div className="absolute inset-[3px] rounded-full border border-white/10" />
                    <div className="absolute inset-[6px] rounded-full border border-white/5" />
                    <div className="absolute inset-[9px] rounded-full border border-white/10" />
                    {/* Center label */}
                    <Avatar className="w-5 h-5 rounded-full relative z-10">
                      <AvatarImage src={reel.author?.avatar_url || undefined} className="rounded-full" />
                      <AvatarFallback className="bg-gradient-to-br from-primary to-accent rounded-full text-[8px] text-white">
                        ♪
                      </AvatarFallback>
                    </Avatar>
                  </div>
                </div>
              </div>

              {/* Bottom info */}
              <div className="absolute left-4 right-20 bottom-[90px] z-20">
                {/* Author */}
                <div className="flex items-center gap-2 mb-2">
                  <button
                    onClick={(e) => { e.stopPropagation(); if (reel.author_id) navigate(`/user/${reel.author_id}`); }}
                    className="flex items-center gap-2"
                  >
                    <span className="text-white font-bold text-[15px] drop-shadow-lg">
                      @{reel.author?.display_name || "user"}
                    </span>
                    {reel.author?.verified && <VerifiedBadge size="sm" />}
                  </button>
                </div>

                {/* Description with hashtags */}
                {reel.description && (
                  <p className="text-white/90 text-sm leading-relaxed line-clamp-2 drop-shadow mb-3">
                    {reel.description.split(/(#\w+)/g).map((part, i) =>
                      part.startsWith("#") ? (
                        <span key={i} className="text-white font-semibold">{part} </span>
                      ) : (
                        <span key={i}>{part}</span>
                      )
                    )}
                  </p>
                )}

                {/* Music */}
                {reel.music_title && (
                  <div className="flex items-center gap-2">
                    <span className="text-white/80 text-xs">♪</span>
                    <div className="overflow-hidden max-w-[200px]">
                      <span className="text-white/80 text-xs whitespace-nowrap inline-block animate-[marquee_8s_linear_infinite]">
                        {reel.music_title} • {reel.author?.display_name || "Original"}
                      </span>
                    </div>
                  </div>
                )}
              </div>

              {/* Progress bar with seek */}
              {isActive && (
                <div
                  className="absolute bottom-[72px] left-0 right-0 z-30 h-[14px] flex items-end cursor-pointer"
                  onClick={(e) => {
                    e.stopPropagation();
                    const video = videoRefs.current.get(currentIndex);
                    if (!video || !video.duration) return;
                    const rect = e.currentTarget.getBoundingClientRect();
                    const pct = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
                    video.currentTime = pct * video.duration;
                    setVideoProgress(pct * 100);
                  }}
                  onTouchMove={(e) => {
                    e.stopPropagation();
                    const video = videoRefs.current.get(currentIndex);
                    if (!video || !video.duration) return;
                    const touch = e.touches[0];
                    const rect = e.currentTarget.getBoundingClientRect();
                    const pct = Math.max(0, Math.min(1, (touch.clientX - rect.left) / rect.width));
                    video.currentTime = pct * video.duration;
                    setVideoProgress(pct * 100);
                  }}
                  onMouseDown={(e) => {
                    e.stopPropagation();
                    const bar = e.currentTarget;
                    const video = videoRefs.current.get(currentIndex);
                    if (!video || !video.duration) return;
                    const onMove = (ev: MouseEvent) => {
                      const rect = bar.getBoundingClientRect();
                      const pct = Math.max(0, Math.min(1, (ev.clientX - rect.left) / rect.width));
                      video.currentTime = pct * video.duration;
                      setVideoProgress(pct * 100);
                    };
                    const onUp = () => {
                      window.removeEventListener("mousemove", onMove);
                      window.removeEventListener("mouseup", onUp);
                    };
                    window.addEventListener("mousemove", onMove);
                    window.addEventListener("mouseup", onUp);
                  }}
                >
                  <div className="w-full h-[3px] bg-white/20 relative">
                    <div
                      className="h-full bg-white rounded-full transition-none"
                      style={{ width: `${videoProgress}%` }}
                    />
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Sheets */}
      <CreateReelSheet open={showCreateSheet} onOpenChange={setShowCreateSheet} />
      <ReelShareSheet isOpen={!!shareReelId} onClose={() => setShareReelId(null)} reelId={shareReelId || ""} />
      {commentsReelId && (
        <ReelCommentsSheet
          isOpen={!!commentsReelId}
          onClose={() => { setCommentsReelId(null); refetch(); }}
          reelId={commentsReelId}
          commentsCount={reels.find(r => r.id === commentsReelId)?.comments_count || 0}
        />
      )}

      {/* Animations */}
      <style>{`
        @keyframes heartPop {
          0% { transform: scale(0); opacity: 1; }
          15% { transform: scale(1.3); opacity: 1; }
          30% { transform: scale(0.95); opacity: 1; }
          45% { transform: scale(1.1); opacity: 1; }
          100% { transform: scale(1); opacity: 0; }
        }
        @keyframes fadeInScale {
          0% { transform: scale(0.5); opacity: 0; }
          100% { transform: scale(1); opacity: 1; }
        }
        @keyframes spinSlow {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        @keyframes marquee {
          0% { transform: translateX(0); }
          100% { transform: translateX(-100%); }
        }
      `}</style>
    </div>
  );
}
