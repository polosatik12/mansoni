import { useState, useRef, useEffect, useCallback } from "react";
import { X, RefreshCw } from "lucide-react";
import { toast } from "sonner";

interface VideoCircleRecorderProps {
  onRecord: (videoBlob: Blob, duration: number) => void;
  onCancel: () => void;
  autoRecord?: boolean;
}

const MAX_DURATION = 60;

export function VideoCircleRecorder({ onRecord, onCancel }: VideoCircleRecorderProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);
  const startTimeRef = useRef<number>(0);
  const rafRef = useRef<number>(0);

  const [isRecording, setIsRecording] = useState(false);
  const [elapsedMs, setElapsedMs] = useState(0);
  const [hasPermission, setHasPermission] = useState(false);
  const [facingMode, setFacingMode] = useState<"user" | "environment">("user");
  const [isLocked, setIsLocked] = useState(false);

  // Swipe-up lock tracking
  const touchStartY = useRef(0);
  const lockThreshold = 80;

  const elapsedSec = Math.floor(elapsedMs / 1000);
  const remaining = MAX_DURATION - elapsedSec;
  const progress = elapsedMs / (MAX_DURATION * 1000);

  const formatCountdown = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m}:${s.toString().padStart(2, "0")}`;
  };

  // --- Camera ---
  const startCamera = useCallback(async (facing: "user" | "environment") => {
    try {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop());
      }
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: facing, width: { ideal: 480 }, height: { ideal: 480 } },
        audio: true,
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play().catch(() => {});
      }
      setHasPermission(true);
    } catch (err) {
      console.error("Camera error:", err);
      toast.error("Не удалось получить доступ к камере");
      setHasPermission(false);
    }
  }, []);

  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
  }, []);

  useEffect(() => {
    startCamera(facingMode);
    return () => {
      stopCamera();
      cancelAnimationFrame(rafRef.current);
    };
  }, [facingMode, startCamera, stopCamera]);

  // --- Recording timer via rAF for smooth progress ---
  const updateTimer = useCallback(() => {
    if (!startTimeRef.current) return;
    const now = performance.now();
    const elapsed = now - startTimeRef.current;
    if (elapsed >= MAX_DURATION * 1000) {
      setElapsedMs(MAX_DURATION * 1000);
      // Auto-stop at max
      stopRecordingAndSend();
      return;
    }
    setElapsedMs(elapsed);
    rafRef.current = requestAnimationFrame(updateTimer);
  }, []);

  // --- Start/Stop recording ---
  const startRecording = useCallback(() => {
    if (!streamRef.current) return;
    try {
      chunksRef.current = [];
      const candidates = ["video/webm;codecs=vp9", "video/webm;codecs=vp8", "video/webm", "video/mp4"];
      let mimeType = "";
      for (const c of candidates) {
        if (MediaRecorder.isTypeSupported(c)) { mimeType = c; break; }
      }
      const opts: MediaRecorderOptions = mimeType ? { mimeType } : {};
      const mr = new MediaRecorder(streamRef.current, opts);
      const actualMime = mr.mimeType || mimeType || "video/webm";

      mr.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };

      mr.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: actualMime });
        const dur = Math.max(1, Math.floor(elapsedMs / 1000));
        onRecord(blob, dur);
      };

      mediaRecorderRef.current = mr;
      mr.start();
      startTimeRef.current = performance.now();
      setIsRecording(true);
      setElapsedMs(0);
      rafRef.current = requestAnimationFrame(updateTimer);
    } catch (err) {
      console.error("Recording error:", err);
      toast.error("Не удалось начать запись");
    }
  }, [updateTimer, onRecord, elapsedMs]);

  const stopRecordingAndSend = useCallback(() => {
    cancelAnimationFrame(rafRef.current);
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
      mediaRecorderRef.current.stop();
    }
    setIsRecording(false);
    stopCamera();
  }, [stopCamera]);

  const cancelRecording = useCallback(() => {
    cancelAnimationFrame(rafRef.current);
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
      mediaRecorderRef.current.ondataavailable = null;
      mediaRecorderRef.current.onstop = null;
      mediaRecorderRef.current.stop();
    }
    stopCamera();
    onCancel();
  }, [stopCamera, onCancel]);

  const switchCamera = useCallback(() => {
    setFacingMode((p) => (p === "user" ? "environment" : "user"));
  }, []);

  // Auto-start recording once camera is ready
  useEffect(() => {
    if (hasPermission && !isRecording && streamRef.current) {
      const t = setTimeout(startRecording, 300);
      return () => clearTimeout(t);
    }
  }, [hasPermission]);

  // --- Touch handlers for swipe-up lock ---
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    touchStartY.current = e.touches[0].clientY;
  }, []);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (isLocked || !isRecording) return;
    const dy = touchStartY.current - e.touches[0].clientY;
    if (dy > lockThreshold) {
      setIsLocked(true);
    }
  }, [isLocked, isRecording]);

  // Circle radius for SVG progress
  const circleSize = 240;
  const r = (circleSize - 8) / 2;
  const circumference = 2 * Math.PI * r;

  return (
    <div
      className="fixed inset-0 z-[300] flex flex-col bg-black/95"
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
    >
      {/* Top bar: timer + cancel */}
      <div className="flex-shrink-0 flex items-center justify-between px-4 pt-4 safe-area-top">
        <button onClick={cancelRecording} className="p-2 text-white/70">
          <X className="w-6 h-6" />
        </button>

        {isRecording && (
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
            <span className="text-white font-mono text-lg font-semibold tabular-nums drop-shadow-lg">
              {formatCountdown(remaining)}
            </span>
          </div>
        )}

        <button onClick={switchCamera} className="p-2 text-white/70">
          <RefreshCw className="w-5 h-5" />
        </button>
      </div>

      {/* Center: video circle with progress ring */}
      <div className="flex-1 flex items-center justify-center">
        <div className="relative" style={{ width: circleSize, height: circleSize }}>
          {/* Progress ring */}
          {isRecording && (
            <svg
              className="absolute inset-0 -rotate-90"
              width={circleSize}
              height={circleSize}
            >
              <circle
                cx={circleSize / 2}
                cy={circleSize / 2}
                r={r}
                fill="none"
                stroke="rgba(255,255,255,0.1)"
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
                className="transition-none"
              />
            </svg>
          )}

          {/* Video circle */}
          <div
            className="absolute inset-1 rounded-full overflow-hidden bg-black"
            style={{ clipPath: "circle(50%)" }}
          >
            {hasPermission ? (
              <video
                ref={videoRef}
                autoPlay
                muted
                playsInline
                onLoadedMetadata={(e) => {
                  (e.target as HTMLVideoElement).play().catch(() => {});
                }}
                className={`w-full h-full object-cover ${facingMode === "user" ? "scale-x-[-1]" : ""}`}
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <p className="text-white/50 text-sm text-center px-6">
                  Разрешите доступ к камере
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Bottom controls */}
      <div className="flex-shrink-0 pb-10 px-6 safe-area-bottom">
        {isLocked ? (
          /* Locked mode: cancel + stop buttons */
          <div className="flex items-center justify-center gap-8">
            <button
              onClick={cancelRecording}
              className="w-14 h-14 rounded-full bg-white/10 backdrop-blur-sm flex items-center justify-center"
            >
              <X className="w-6 h-6 text-white" />
            </button>
            <button
              onClick={stopRecordingAndSend}
              className="w-16 h-16 rounded-full bg-[#3390ec] flex items-center justify-center shadow-lg"
            >
              <div className="w-6 h-6 rounded-sm bg-white" />
            </button>
          </div>
        ) : isRecording ? (
          /* Recording (not locked): swipe up hint + release-to-send */
          <div className="flex flex-col items-center gap-3">
            <div className="flex items-center gap-1 text-white/40 text-xs animate-bounce">
              <span>↑</span>
              <span>Свайп вверх для блокировки</span>
            </div>
            <button
              onClick={stopRecordingAndSend}
              className="w-16 h-16 rounded-full bg-[#3390ec] flex items-center justify-center shadow-lg"
            >
              <div className="w-6 h-6 rounded-sm bg-white" />
            </button>
          </div>
        ) : (
          /* Not recording yet - waiting */
          <div className="flex items-center justify-center">
            <div className="w-16 h-16 rounded-full border-2 border-white/20 flex items-center justify-center">
              <div className="w-12 h-12 rounded-full bg-red-500 animate-pulse" />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
