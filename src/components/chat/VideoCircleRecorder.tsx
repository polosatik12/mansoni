import { useState, useRef, useEffect } from "react";
import { X, Send, Circle } from "lucide-react";
import { Button } from "@/components/ui/button";

interface VideoCircleRecorderProps {
  onRecord: (videoBlob: Blob, duration: number) => void;
  onCancel: () => void;
}

export function VideoCircleRecorder({ onRecord, onCancel }: VideoCircleRecorderProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);
  
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [hasPermission, setHasPermission] = useState(false);
  const recordingInterval = useRef<NodeJS.Timeout | null>(null);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  useEffect(() => {
    startCamera();
    return () => {
      stopCamera();
      if (recordingInterval.current) {
        clearInterval(recordingInterval.current);
      }
    };
  }, []);

  useEffect(() => {
    if (isRecording) {
      recordingInterval.current = setInterval(() => {
        setRecordingTime((prev) => {
          if (prev >= 60) {
            stopRecording();
            return prev;
          }
          return prev + 1;
        });
      }, 1000);
    } else {
      if (recordingInterval.current) {
        clearInterval(recordingInterval.current);
      }
    }
    return () => {
      if (recordingInterval.current) {
        clearInterval(recordingInterval.current);
      }
    };
  }, [isRecording]);

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "user", width: 480, height: 480 },
        audio: true,
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
      setHasPermission(true);
    } catch (err) {
      console.error("Error accessing camera:", err);
      setHasPermission(false);
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
  };

  const startRecording = () => {
    if (!streamRef.current) return;

    chunksRef.current = [];
    const mediaRecorder = new MediaRecorder(streamRef.current, {
      mimeType: MediaRecorder.isTypeSupported("video/webm;codecs=vp9")
        ? "video/webm;codecs=vp9"
        : "video/webm",
    });

    mediaRecorder.ondataavailable = (e) => {
      if (e.data.size > 0) {
        chunksRef.current.push(e.data);
      }
    };

    mediaRecorder.onstop = () => {
      const blob = new Blob(chunksRef.current, { type: "video/webm" });
      onRecord(blob, recordingTime);
    };

    mediaRecorderRef.current = mediaRecorder;
    mediaRecorder.start();
    setIsRecording(true);
    setRecordingTime(0);
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
      mediaRecorderRef.current.stop();
    }
    setIsRecording(false);
    stopCamera();
  };

  const handleCancel = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
      mediaRecorderRef.current.stop();
    }
    stopCamera();
    onCancel();
  };

  return (
    <div className="fixed inset-0 bg-black/90 z-[70] flex flex-col items-center justify-center">
      {/* Close button */}
      <Button
        variant="ghost"
        size="icon"
        onClick={handleCancel}
        className="absolute top-4 left-4 text-white hover:bg-white/20"
      >
        <X className="w-6 h-6" />
      </Button>

      {/* Recording time */}
      {isRecording && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 flex items-center gap-2 bg-red-500/80 px-3 py-1 rounded-full">
          <div className="w-2 h-2 rounded-full bg-white animate-pulse" />
          <span className="text-white text-sm font-medium">{formatTime(recordingTime)}</span>
        </div>
      )}

      {/* Video preview - circular */}
      <div className="relative">
        <div className="w-64 h-64 rounded-full overflow-hidden border-4 border-primary shadow-2xl">
          <video
            ref={videoRef}
            autoPlay
            muted
            playsInline
            className="w-full h-full object-cover scale-x-[-1]"
          />
        </div>
        
        {/* Progress ring */}
        {isRecording && (
          <svg className="absolute inset-0 w-64 h-64 -rotate-90">
            <circle
              cx="128"
              cy="128"
              r="126"
              fill="none"
              stroke="currentColor"
              strokeWidth="4"
              className="text-primary"
              strokeDasharray={`${(recordingTime / 60) * 791.68} 791.68`}
              strokeLinecap="round"
            />
          </svg>
        )}
      </div>

      {/* Permission error */}
      {!hasPermission && (
        <p className="text-white/70 mt-4 text-center px-8">
          Разрешите доступ к камере для записи видео-кружка
        </p>
      )}

      {/* Controls */}
      <div className="mt-8 flex items-center gap-4">
        {!isRecording ? (
          <Button
            size="icon"
            className="w-16 h-16 rounded-full bg-primary hover:bg-primary/90"
            onClick={startRecording}
            disabled={!hasPermission}
          >
            <Circle className="w-8 h-8 fill-current" />
          </Button>
        ) : (
          <Button
            size="icon"
            className="w-16 h-16 rounded-full bg-primary hover:bg-primary/90"
            onClick={stopRecording}
          >
            <Send className="w-6 h-6" />
          </Button>
        )}
      </div>

      <p className="text-white/50 text-sm mt-4">
        {!isRecording ? "Нажмите для записи" : "Нажмите для отправки"}
      </p>
    </div>
  );
}
