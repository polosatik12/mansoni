import { useState, useRef, useCallback, useEffect } from "react";
import { X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface VideoNoteFullscreenProps {
  videoUrl: string;
  onClose: () => void;
}

export function VideoNoteFullscreen({ videoUrl, onClose }: VideoNoteFullscreenProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [showControls, setShowControls] = useState(true);
  const controlsTimer = useRef<NodeJS.Timeout>();

  // Seek indicator
  const [seekIndicator, setSeekIndicator] = useState<{ side: "left" | "right"; seconds: number } | null>(null);
  const seekIndicatorTimer = useRef<NodeJS.Timeout>();

  const progress = duration > 0 ? currentTime / duration : 0;

  // Auto-hide controls
  const resetControlsTimer = useCallback(() => {
    setShowControls(true);
    if (controlsTimer.current) clearTimeout(controlsTimer.current);
    controlsTimer.current = setTimeout(() => setShowControls(false), 3000);
  }, []);

  useEffect(() => {
    resetControlsTimer();
    return () => {
      if (controlsTimer.current) clearTimeout(controlsTimer.current);
      if (seekIndicatorTimer.current) clearTimeout(seekIndicatorTimer.current);
    };
  }, [resetControlsTimer]);

  // Start playback with sound
  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;
    v.currentTime = 0;
    v.muted = false;
    v.play().catch(() => {
      // Fallback muted
      v.muted = true;
      v.play().catch(() => {});
    });
  }, [videoUrl]);

  const handleTimeUpdate = () => {
    if (videoRef.current) {
      setCurrentTime(videoRef.current.currentTime);
    }
  };

  const handleLoadedMetadata = () => {
    if (videoRef.current && isFinite(videoRef.current.duration)) {
      setDuration(videoRef.current.duration);
    }
  };

  // Double-tap to seek
  const lastTapRef = useRef<{ time: number; x: number }>({ time: 0, x: 0 });

  const handleTap = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    const clientX = "touches" in e ? e.changedTouches[0].clientX : e.clientX;
    const now = Date.now();
    const dt = now - lastTapRef.current.time;

    if (dt < 300) {
      // Double tap
      const v = videoRef.current;
      if (!v) return;
      const isLeft = clientX < window.innerWidth / 2;
      const seekAmount = 10;

      if (isLeft) {
        v.currentTime = Math.max(0, v.currentTime - seekAmount);
        showSeekIndicator("left", seekAmount);
      } else {
        v.currentTime = Math.min(v.duration || 0, v.currentTime + seekAmount);
        showSeekIndicator("right", seekAmount);
      }
    } else {
      resetControlsTimer();
    }

    lastTapRef.current = { time: now, x: clientX };
  }, [resetControlsTimer]);

  const showSeekIndicator = (side: "left" | "right", seconds: number) => {
    setSeekIndicator({ side, seconds });
    if (seekIndicatorTimer.current) clearTimeout(seekIndicatorTimer.current);
    seekIndicatorTimer.current = setTimeout(() => setSeekIndicator(null), 600);
  };

  // Timeline scrub
  const timelineRef = useRef<HTMLDivElement>(null);
  const handleTimelineScrub = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    const el = timelineRef.current;
    const v = videoRef.current;
    if (!el || !v) return;
    const rect = el.getBoundingClientRect();
    const clientX = "touches" in e ? e.touches[0].clientX : e.clientX;
    const pct = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
    v.currentTime = pct * (v.duration || 0);
  }, []);

  const formatTime = (s: number) => {
    if (!isFinite(s)) return "0:00";
    const m = Math.floor(s / 60);
    const sec = Math.floor(s % 60);
    return `${m}:${sec.toString().padStart(2, "0")}`;
  };

  // Circle progress ring
  const circleSize = Math.min(window.innerWidth - 40, 320);
  const r = (circleSize - 8) / 2;
  const circumference = 2 * Math.PI * r;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[400] bg-black flex flex-col items-center justify-center"
      onClick={handleTap}
    >
      {/* Close button */}
      <AnimatePresence>
        {showControls && (
          <motion.button
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={(e) => { e.stopPropagation(); onClose(); }}
            className="absolute top-4 left-4 safe-area-top p-2 text-white/80 z-10"
          >
            <X className="w-6 h-6" />
          </motion.button>
        )}
      </AnimatePresence>

      {/* Seek indicators */}
      <AnimatePresence>
        {seekIndicator && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            className={`absolute top-1/2 -translate-y-1/2 z-20 ${
              seekIndicator.side === "left" ? "left-8" : "right-8"
            }`}
          >
            <div className="bg-white/20 backdrop-blur-sm rounded-full px-4 py-2 text-white text-sm font-medium">
              {seekIndicator.side === "left" ? "−" : "+"}{seekIndicator.seconds}с
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Video in circle with progress ring */}
      <div className="relative" style={{ width: circleSize, height: circleSize }}>
        <svg className="absolute inset-0 -rotate-90" width={circleSize} height={circleSize}>
          <circle
            cx={circleSize / 2}
            cy={circleSize / 2}
            r={r}
            fill="none"
            stroke="rgba(255,255,255,0.15)"
            strokeWidth="4"
          />
          <circle
            cx={circleSize / 2}
            cy={circleSize / 2}
            r={r}
            fill="none"
            stroke="#3390ec"
            strokeWidth="4"
            strokeDasharray={circumference}
            strokeDashoffset={circumference * (1 - progress)}
            strokeLinecap="round"
          />
        </svg>

        <div className="absolute inset-1 rounded-full overflow-hidden" style={{ clipPath: "circle(50%)" }}>
          <video
            ref={videoRef}
            src={videoUrl}
            className="w-full h-full object-cover"
            playsInline
            onTimeUpdate={handleTimeUpdate}
            onLoadedMetadata={handleLoadedMetadata}
            onEnded={() => {
              if (videoRef.current) videoRef.current.currentTime = 0;
            }}
            crossOrigin="anonymous"
          />
        </div>
      </div>

      {/* Timeline scrubber */}
      <AnimatePresence>
        {showControls && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className="absolute bottom-20 safe-area-bottom left-6 right-6 z-10"
          >
            <div className="flex items-center gap-3">
              <span className="text-white/60 text-xs font-mono tabular-nums w-8 text-right">
                {formatTime(currentTime)}
              </span>
              <div
                ref={timelineRef}
                className="flex-1 h-8 flex items-center cursor-pointer"
                onClick={(e) => { e.stopPropagation(); handleTimelineScrub(e); }}
                onTouchMove={(e) => { handleTimelineScrub(e); }}
              >
                <div className="w-full h-1 bg-white/20 rounded-full relative">
                  <div
                    className="absolute left-0 top-0 h-full bg-[#3390ec] rounded-full"
                    style={{ width: `${progress * 100}%` }}
                  />
                  <div
                    className="absolute top-1/2 -translate-y-1/2 w-3 h-3 bg-white rounded-full shadow-lg"
                    style={{ left: `calc(${progress * 100}% - 6px)` }}
                  />
                </div>
              </div>
              <span className="text-white/60 text-xs font-mono tabular-nums w-8">
                {formatTime(duration)}
              </span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
