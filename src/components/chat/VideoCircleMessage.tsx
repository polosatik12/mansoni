import { useState, useRef, useEffect } from "react";
import { Play, Pause } from "lucide-react";

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
  const [hasLoaded, setHasLoaded] = useState(false);

  // Preload video metadata to get a thumbnail frame
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    
    const handleLoaded = () => {
      setVideoDuration(video.duration || 0);
      setHasLoaded(true);
      // Seek to 0.1s to show a thumbnail frame on iOS
      if (video.currentTime === 0) {
        video.currentTime = 0.1;
      }
    };

    video.addEventListener("loadeddata", handleLoaded);
    // Force load
    video.load();

    return () => {
      video.removeEventListener("loadeddata", handleLoaded);
    };
  }, [videoUrl]);

  const togglePlay = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!videoRef.current) return;
    
    if (isPlaying) {
      videoRef.current.pause();
      setIsPlaying(false);
    } else {
      videoRef.current.play().then(() => {
        setIsPlaying(true);
      }).catch(() => {
        setIsPlaying(false);
      });
    }
  };

  const handleTimeUpdate = () => {
    if (videoRef.current) {
      setCurrentTime(videoRef.current.currentTime);
      if (!videoDuration && videoRef.current.duration) {
        setVideoDuration(videoRef.current.duration);
      }
    }
  };

  const handleEnded = () => {
    setIsPlaying(false);
    setCurrentTime(0);
    if (videoRef.current) {
      videoRef.current.currentTime = 0.1;
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const progress = videoDuration > 0 ? (currentTime / videoDuration) * 100 : 0;

  return (
    <div className="relative group cursor-pointer" onClick={togglePlay}>
      {/* Circular video */}
      <div className={`w-48 h-48 rounded-full overflow-hidden border-2 ${
        isOwn ? "border-primary" : "border-muted-foreground/30"
      } bg-black/50`}>
        <video
          ref={videoRef}
          src={videoUrl}
          className="w-full h-full object-cover"
          onTimeUpdate={handleTimeUpdate}
          onEnded={handleEnded}
          playsInline
          preload="auto"
          muted={false}
        />
      </div>

      {/* Progress ring */}
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

      {/* Play/Pause overlay */}
      {!isPlaying && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/30 rounded-full">
          <div className="w-12 h-12 rounded-full bg-white/90 flex items-center justify-center">
            <Play className="w-6 h-6 text-black fill-black ml-1" />
          </div>
        </div>
      )}

      {/* Duration label */}
      <div className={`absolute bottom-2 left-1/2 -translate-x-1/2 px-2 py-0.5 rounded-full text-xs ${
        isOwn ? "bg-primary text-primary-foreground" : "bg-muted text-foreground"
      }`}>
        {isPlaying ? formatTime(currentTime) : (videoDuration > 0 ? formatTime(videoDuration) : duration)}
      </div>
    </div>
  );
}
