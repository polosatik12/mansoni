import { useState, useRef, useCallback } from "react";
import { Play } from "lucide-react";

interface VideoCircleMessageProps {
  videoUrl: string;
  duration: string;
  isOwn: boolean;
}

export function VideoCircleMessage({ videoUrl, duration, isOwn }: VideoCircleMessageProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [videoDuration, setVideoDuration] = useState(0);

  const togglePlay = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    e.stopPropagation();
    e.preventDefault();
    const video = videoRef.current;
    if (!video) return;

    if (isPlaying) {
      video.pause();
      setIsPlaying(false);
    } else {
      // On iOS, video must be unmuted after user gesture and played via promise
      video.muted = false;
      video.play().then(() => {
        setIsPlaying(true);
      }).catch((err) => {
        console.warn("Video play failed, trying muted:", err);
        // Fallback: play muted (iOS autoplay policy)
        video.muted = true;
        video.play().then(() => setIsPlaying(true)).catch(() => setIsPlaying(false));
      });
    }
  }, [isPlaying]);

  const handleTimeUpdate = () => {
    if (videoRef.current) {
      setCurrentTime(videoRef.current.currentTime);
      if (!videoDuration && videoRef.current.duration && isFinite(videoRef.current.duration)) {
        setVideoDuration(videoRef.current.duration);
      }
    }
  };

  const handleLoadedMetadata = () => {
    if (videoRef.current && videoRef.current.duration && isFinite(videoRef.current.duration)) {
      setVideoDuration(videoRef.current.duration);
    }
  };

  const handleEnded = () => {
    setIsPlaying(false);
    setCurrentTime(0);
    if (videoRef.current) {
      videoRef.current.currentTime = 0;
    }
  };

  const formatTime = (seconds: number) => {
    if (!seconds || !isFinite(seconds)) return duration || "0:00";
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const progress = videoDuration > 0 ? (currentTime / videoDuration) * 100 : 0;

  // Build a display duration: prefer detected duration, fall back to prop
  const displayDuration = videoDuration > 0 ? formatTime(videoDuration) : (duration && duration !== "0" ? `0:${duration.padStart(2, "0")}` : "0:00");

  return (
    <div className="relative group cursor-pointer" onClick={togglePlay}>
      {/* Circular video */}
      <div className={`w-48 h-48 rounded-full overflow-hidden border-2 ${
        isOwn ? "border-primary" : "border-muted-foreground/30"
      } bg-black`}>
        <video
          ref={videoRef}
          src={videoUrl}
          className="w-full h-full object-cover"
          onTimeUpdate={handleTimeUpdate}
          onLoadedMetadata={handleLoadedMetadata}
          onEnded={handleEnded}
          playsInline
          preload="metadata"
          crossOrigin="anonymous"
        />
      </div>

      {/* Progress ring */}
      {isPlaying && progress > 0 && (
        <svg className="absolute inset-0 w-48 h-48 -rotate-90 pointer-events-none">
          <circle
            cx="96"
            cy="96"
            r="94"
            fill="none"
            stroke="currentColor"
            strokeWidth="3"
            className={isOwn ? "text-primary" : "text-muted-foreground/50"}
            strokeDasharray={`${progress * 5.906} 590.6`}
            strokeLinecap="round"
          />
        </svg>
      )}

      {/* Play overlay - always show when not playing */}
      {!isPlaying && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/20 rounded-full">
          <div className="w-12 h-12 rounded-full bg-white/90 flex items-center justify-center shadow-lg">
            <Play className="w-6 h-6 text-black fill-black ml-0.5" />
          </div>
        </div>
      )}

      {/* Duration label */}
      <div className={`absolute bottom-2 left-1/2 -translate-x-1/2 px-2 py-0.5 rounded-full text-xs font-medium ${
        isOwn ? "bg-primary text-primary-foreground" : "bg-muted text-foreground"
      }`}>
        {isPlaying ? formatTime(currentTime) : displayDuration}
      </div>
    </div>
  );
}
