import { useState, useRef, useCallback, useEffect } from "react";
import { Play, Volume2 } from "lucide-react";
import { VideoNoteFullscreen } from "./VideoNoteFullscreen";
import { AnimatePresence } from "framer-motion";

interface VideoCircleMessageProps {
  videoUrl: string;
  duration: string;
  isOwn: boolean;
}

export function VideoCircleMessage({ videoUrl, duration, isOwn }: VideoCircleMessageProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [hasPlayed, setHasPlayed] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [videoDuration, setVideoDuration] = useState(0);
  const [showFullscreen, setShowFullscreen] = useState(false);
  const [isVisible, setIsVisible] = useState(false);

  const progress = videoDuration > 0 ? currentTime / videoDuration : 0;

  // Circle dimensions
  const size = 200; // ~75dp on mobile
  const strokeWidth = 3;
  const r = (size - strokeWidth * 2) / 2;
  const circumference = 2 * Math.PI * r;

  // IntersectionObserver for autoplay
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsVisible(entry.isIntersecting);
      },
      { threshold: 0.3 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  // Autoplay muted when visible (only once)
  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;

    if (isVisible && !hasPlayed) {
      v.muted = true;
      v.currentTime = 0;
      v.play()
        .then(() => setIsPlaying(true))
        .catch(() => {
          // Can't autoplay — show play button
          setIsPlaying(false);
        });
    } else if (!isVisible && isPlaying) {
      // Don't pause while partially visible — threshold handles this
    }
  }, [isVisible, hasPlayed]);

  // Force thumbnail on iOS
  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;
    v.load();
    const handleMeta = () => {
      if (v.currentTime === 0) v.currentTime = 0.1;
    };
    v.addEventListener("loadeddata", handleMeta, { once: true });
    return () => v.removeEventListener("loadeddata", handleMeta);
  }, [videoUrl]);

  const handleTimeUpdate = () => {
    if (videoRef.current) {
      setCurrentTime(videoRef.current.currentTime);
      if (!videoDuration && videoRef.current.duration && isFinite(videoRef.current.duration)) {
        setVideoDuration(videoRef.current.duration);
      }
    }
  };

  const handleLoadedMetadata = () => {
    if (videoRef.current && isFinite(videoRef.current.duration)) {
      setVideoDuration(videoRef.current.duration);
    }
  };

  const handleEnded = () => {
    setIsPlaying(false);
    setHasPlayed(true);
    // Freeze on last frame (don't reset to 0)
  };

  const handleTap = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    e.stopPropagation();
    e.preventDefault();

    if (!hasPlayed && !isPlaying) {
      // Manual play if autoplay failed
      const v = videoRef.current;
      if (v) {
        v.muted = true;
        v.play()
          .then(() => setIsPlaying(true))
          .catch(() => {});
      }
      return;
    }

    // Open fullscreen viewer
    if (videoRef.current) {
      videoRef.current.pause();
      setIsPlaying(false);
    }
    setShowFullscreen(true);
  }, [hasPlayed, isPlaying]);

  const handleFullscreenClose = useCallback(() => {
    setShowFullscreen(false);
  }, []);

  const formatTime = (seconds: number) => {
    if (!isFinite(seconds) || seconds <= 0) return duration && duration !== "0" ? `0:${duration.padStart(2, "0")}` : "0:00";
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
    return `${m}:${s.toString().padStart(2, "0")}`;
  };

  const displayDuration = videoDuration > 0
    ? formatTime(videoDuration)
    : duration && duration !== "0"
      ? `0:${duration.padStart(2, "0")}`
      : "0:00";

  return (
    <>
      <div
        ref={containerRef}
        className="relative group cursor-pointer select-none"
        onClick={handleTap}
        style={{ width: size, height: size }}
      >
        {/* Progress ring */}
        <svg
          className="absolute inset-0 -rotate-90 pointer-events-none"
          width={size}
          height={size}
        >
          {/* Background circle */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={r}
            fill="none"
            stroke="rgba(255,255,255,0.15)"
            strokeWidth={strokeWidth}
          />
          {/* Progress */}
          {isPlaying && (
            <circle
              cx={size / 2}
              cy={size / 2}
              r={r}
              fill="none"
              stroke="#3390ec"
              strokeWidth={strokeWidth}
              strokeDasharray={circumference}
              strokeDashoffset={circumference * (1 - progress)}
              strokeLinecap="round"
            />
          )}
        </svg>

        {/* Video circle */}
        <div
          className="absolute rounded-full overflow-hidden bg-black"
          style={{
            top: strokeWidth,
            left: strokeWidth,
            right: strokeWidth,
            bottom: strokeWidth,
            clipPath: "circle(50%)",
          }}
        >
          <video
            ref={videoRef}
            src={videoUrl}
            className="w-full h-full object-cover"
            playsInline
            preload="auto"
            crossOrigin="anonymous"
            onTimeUpdate={handleTimeUpdate}
            onLoadedMetadata={handleLoadedMetadata}
            onEnded={handleEnded}
          />
        </div>

        {/* Play button overlay — show when not playing and not auto-played yet */}
        {!isPlaying && !hasPlayed && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="w-12 h-12 rounded-full bg-black/50 backdrop-blur-sm flex items-center justify-center">
              <Play className="w-6 h-6 text-white fill-white ml-0.5" />
            </div>
          </div>
        )}

        {/* "Viewed" indicator after playback */}
        {hasPlayed && !isPlaying && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="w-10 h-10 rounded-full bg-black/30 backdrop-blur-sm flex items-center justify-center">
              <Volume2 className="w-5 h-5 text-white/80" />
            </div>
          </div>
        )}

        {/* Duration label */}
        <div className="absolute bottom-1.5 left-1/2 -translate-x-1/2 px-2.5 py-0.5 rounded-full bg-black/60 backdrop-blur-sm">
          <span className="text-[11px] text-white font-medium tabular-nums">
            {isPlaying ? formatTime(currentTime) : displayDuration}
          </span>
        </div>
      </div>

      {/* Fullscreen player */}
      <AnimatePresence>
        {showFullscreen && (
          <VideoNoteFullscreen videoUrl={videoUrl} onClose={handleFullscreenClose} />
        )}
      </AnimatePresence>
    </>
  );
}
