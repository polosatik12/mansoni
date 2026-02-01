import { useState, useEffect, useRef } from "react";
import {
  ChevronLeft,
  Volume2,
  Video,
  VideoOff,
  Mic,
  MicOff,
  X,
  RefreshCw,
} from "lucide-react";
import type { VideoCall, VideoCallStatus } from "@/contexts/VideoCallContext";
import { useAuth } from "@/hooks/useAuth";

interface VideoCallScreenProps {
  call: VideoCall;
  status: VideoCallStatus;
  localStream: MediaStream | null;
  remoteStream: MediaStream | null;
  isMuted: boolean;
  isVideoOff: boolean;
  connectionState: string;
  onEnd: () => void;
  onToggleMute: () => void;
  onToggleVideo: () => void;
  onRetry: () => void;
}

export function VideoCallScreen({
  call,
  status,
  localStream,
  remoteStream,
  isMuted,
  isVideoOff,
  connectionState,
  onEnd,
  onToggleMute,
  onToggleVideo,
  onRetry,
}: VideoCallScreenProps) {
  const { user } = useAuth();
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const [callDuration, setCallDuration] = useState(0);
  const [isSpeakerOn, setIsSpeakerOn] = useState(true);

  const isInitiator = call.caller_id === user?.id;
  const otherProfile = isInitiator ? call.callee_profile : call.caller_profile;
  const otherName = otherProfile?.display_name || "Собеседник";
  const otherAvatar = otherProfile?.avatar_url;
  const isVideoCall = call.call_type === "video";
  const isConnected = status === "connected" && connectionState === "connected";

  // Attach local stream
  useEffect(() => {
    if (localVideoRef.current && localStream) {
      localVideoRef.current.srcObject = localStream;
    }
  }, [localStream]);

  // Attach remote stream
  useEffect(() => {
    if (remoteVideoRef.current && remoteStream) {
      remoteVideoRef.current.srcObject = remoteStream;
    }
  }, [remoteStream]);

  // Call duration timer
  useEffect(() => {
    if (!isConnected) return;

    const interval = setInterval(() => {
      setCallDuration((prev) => prev + 1);
    }, 1000);

    return () => clearInterval(interval);
  }, [isConnected]);

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  const getInitials = (name: string) => {
    const parts = name.trim().split(" ");
    if (parts.length >= 2) {
      return parts[0].charAt(0).toUpperCase() + parts[1].charAt(0).toUpperCase();
    }
    return name.charAt(0).toUpperCase();
  };

  const getStatusText = (): string => {
    if (connectionState === "failed") {
      return "Ошибка соединения";
    }

    if (isConnected) {
      return formatDuration(callDuration);
    }

    switch (status) {
      case "calling":
        return "Вызов";
      case "ringing":
        return "Звонок";
      default:
        break;
    }

    switch (connectionState) {
      case "connecting":
        return "Подключение";
      case "new":
        return "Инициализация";
      default:
        return "Соединение";
    }
  };

  const showWaitingUI = status !== "connected" || connectionState !== "connected";
  const showRetryButton = connectionState === "failed";

  // Video call with active connection
  if (isVideoCall && isConnected && !isVideoOff && remoteStream) {
    return (
      <div className="fixed inset-0 bg-black z-[100] flex flex-col">
        {/* Remote video (full screen) */}
        <video
          ref={remoteVideoRef}
          autoPlay
          playsInline
          className="absolute inset-0 w-full h-full object-cover"
        />

        {/* Local video (small overlay) */}
        {localStream && (
          <video
            ref={localVideoRef}
            autoPlay
            playsInline
            muted
            className="absolute top-20 right-4 w-32 h-44 object-cover rounded-2xl border-2 border-white/30 z-10 scale-x-[-1]"
          />
        )}

        {/* Top bar */}
        <div className="absolute top-0 left-0 right-0 p-4 pt-12 safe-area-top z-20 bg-gradient-to-b from-black/50 to-transparent">
          <button onClick={onEnd} className="flex items-center text-white">
            <ChevronLeft className="w-6 h-6" />
            <span className="text-lg">Назад</span>
          </button>
        </div>

        {/* Bottom controls */}
        <div className="absolute bottom-0 left-0 right-0 p-6 pb-10 safe-area-bottom z-20 bg-gradient-to-t from-black/50 to-transparent">
          <div className="flex items-center justify-around">
            <ControlButton
              icon={<Volume2 className="w-6 h-6" />}
              label="динамик"
              isActive={isSpeakerOn}
              onClick={() => setIsSpeakerOn(!isSpeakerOn)}
            />
            <ControlButton
              icon={isVideoOff ? <VideoOff className="w-6 h-6" /> : <Video className="w-6 h-6" />}
              label="видео"
              isActive={!isVideoOff}
              onClick={onToggleVideo}
            />
            <ControlButton
              icon={isMuted ? <MicOff className="w-6 h-6" /> : <Mic className="w-6 h-6" />}
              label="убрать звук"
              isActive={!isMuted}
              onClick={onToggleMute}
            />
            <ControlButton
              icon={<X className="w-6 h-6" />}
              label="завершить"
              isEndButton
              onClick={onEnd}
            />
          </div>
        </div>
      </div>
    );
  }

  // Audio call or waiting state
  return (
    <div className="fixed inset-0 bg-gradient-to-b from-purple-600 via-purple-500 to-blue-400 z-[100] flex flex-col">
      {/* Top bar */}
      <div className="p-4 pt-12 safe-area-top">
        <button onClick={onEnd} className="flex items-center text-white">
          <ChevronLeft className="w-6 h-6" />
          <span className="text-lg">Назад</span>
        </button>
      </div>

      {/* Main content */}
      <div className="flex-1 flex flex-col items-center justify-center -mt-16">
        {/* Avatar */}
        <div className="relative">
          <div className="absolute -inset-4 rounded-full bg-white/10 blur-xl" />
          {showWaitingUI && (
            <>
              <div
                className="absolute inset-0 w-40 h-40 rounded-full border-4 border-white/20 animate-ping"
                style={{ animationDuration: "2s" }}
              />
              <div className="absolute inset-0 w-40 h-40 rounded-full border-2 border-white/30" />
            </>
          )}
          <div className="relative w-40 h-40 rounded-full border-4 border-white/30 overflow-hidden bg-gradient-to-br from-orange-400 to-orange-500 flex items-center justify-center">
            {otherAvatar ? (
              <img src={otherAvatar} alt={otherName} className="w-full h-full object-cover" />
            ) : (
              <span className="text-5xl text-white font-bold">{getInitials(otherName)}</span>
            )}
          </div>
        </div>

        {/* Name */}
        <h2 className="text-3xl font-semibold text-white mt-8 mb-3">{otherName}</h2>

        {/* Status */}
        <div className="flex items-center h-7">
          <span className="text-white/80 text-lg">{getStatusText()}</span>
          {showWaitingUI && !showRetryButton && (
            <span className="flex ml-0.5">
              <span className="animate-bounce text-white/80 text-lg" style={{ animationDelay: "0ms", animationDuration: "1s" }}>.</span>
              <span className="animate-bounce text-white/80 text-lg" style={{ animationDelay: "200ms", animationDuration: "1s" }}>.</span>
              <span className="animate-bounce text-white/80 text-lg" style={{ animationDelay: "400ms", animationDuration: "1s" }}>.</span>
            </span>
          )}
        </div>

        {/* Retry button */}
        {showRetryButton && (
          <div className="mt-6 flex flex-col items-center gap-3">
            <p className="text-white/70 text-sm text-center max-w-[280px]">
              Проверьте интернет или настройки firewall
            </p>
            <button
              onClick={onRetry}
              className="flex items-center gap-2 px-6 py-3 rounded-full bg-white/20 backdrop-blur-sm text-white hover:bg-white/30 transition-colors"
            >
              <RefreshCw className="w-5 h-5" />
              <span>Повторить</span>
            </button>
          </div>
        )}
      </div>

      {/* Audio element for audio calls */}
      {!isVideoCall && remoteStream && (
        <audio ref={remoteVideoRef as any} autoPlay playsInline />
      )}

      {/* Bottom controls */}
      <div className="p-6 pb-10 safe-area-bottom">
        <div className="flex items-center justify-around">
          <ControlButton
            icon={<Volume2 className="w-6 h-6" />}
            label="динамик"
            isActive={isSpeakerOn}
            onClick={() => setIsSpeakerOn(!isSpeakerOn)}
          />
          <ControlButton
            icon={isVideoOff ? <VideoOff className="w-6 h-6" /> : <Video className="w-6 h-6" />}
            label="видео"
            isActive={!isVideoOff}
            onClick={onToggleVideo}
          />
          <ControlButton
            icon={isMuted ? <MicOff className="w-6 h-6" /> : <Mic className="w-6 h-6" />}
            label="убрать звук"
            isActive={!isMuted}
            onClick={onToggleMute}
          />
          <ControlButton
            icon={<X className="w-6 h-6" />}
            label="завершить"
            isEndButton
            onClick={onEnd}
          />
        </div>
      </div>
    </div>
  );
}

interface ControlButtonProps {
  icon: React.ReactNode;
  label: string;
  isActive?: boolean;
  isEndButton?: boolean;
  onClick: () => void;
}

const ControlButton = ({
  icon,
  label,
  isActive = true,
  isEndButton = false,
  onClick,
}: ControlButtonProps) => (
  <div className="flex flex-col items-center gap-2">
    <button
      onClick={onClick}
      className={`w-14 h-14 rounded-full flex items-center justify-center transition-colors ${
        isEndButton
          ? "bg-red-500 text-white"
          : isActive
            ? "bg-white/20 backdrop-blur-sm text-white"
            : "bg-white text-gray-800"
      }`}
    >
      {icon}
    </button>
    <span className="text-white/80 text-xs">{label}</span>
  </div>
);
