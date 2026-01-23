import { useState, useEffect, useRef } from "react";
import {
  ChevronLeft,
  Volume2,
  Video,
  VideoOff,
  Mic,
  MicOff,
  X,
} from "lucide-react";
import { useWebRTC } from "@/hooks/useWebRTC";
import type { Call } from "@/hooks/useCalls";

interface CallScreenProps {
  call: Call;
  isInitiator: boolean;
  onEnd: () => void;
  onMinimize?: () => void;
}

export function CallScreen({ call, isInitiator, onEnd }: CallScreenProps) {
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const [callDuration, setCallDuration] = useState(0);
  const [connectionState, setConnectionState] = useState<string>("connecting");
  const [webrtcStarted, setWebrtcStarted] = useState(false);
  const [isSpeakerOn, setIsSpeakerOn] = useState(true);

  const otherUser = isInitiator ? call.callee_profile : call.caller_profile;
  const otherName = otherUser?.display_name || "Собеседник";
  const otherAvatar = otherUser?.avatar_url;
  const isVideoCall = call.call_type === "video";
  const isCallActive = call.status === "active";

  const {
    localStream,
    remoteStream,
    isConnected,
    isMuted,
    isVideoOff,
    startCall,
    endCall,
    toggleMute,
    toggleVideo,
  } = useWebRTC({
    callId: call.id,
    callType: call.call_type,
    isInitiator,
    onConnectionStateChange: (state) => setConnectionState(state),
  });

  // Start WebRTC only when call becomes active
  useEffect(() => {
    if (isCallActive && !webrtcStarted) {
      setWebrtcStarted(true);
      const timer = setTimeout(() => {
        startCall();
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [isCallActive, webrtcStarted, startCall]);

  // Attach streams to video elements
  useEffect(() => {
    if (localVideoRef.current && localStream) {
      localVideoRef.current.srcObject = localStream;
    }
  }, [localStream]);

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

  const getStatusText = () => {
    if (call.status === "calling") {
      return "Запрос";
    }
    if (call.status === "ringing") {
      return "Звонок";
    }
    if (connectionState === "connected" || isConnected) {
      return formatDuration(callDuration);
    }
    return "Соединение";
  };

  const handleEndCall = () => {
    endCall();
    onEnd();
  };

  const toggleSpeaker = () => {
    setIsSpeakerOn(!isSpeakerOn);
  };

  const showWaitingUI = !isConnected || call.status !== "active";

  // Video call with active connection - show video streams
  if (isVideoCall && isConnected && !isVideoOff) {
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
        <video
          ref={localVideoRef}
          autoPlay
          playsInline
          muted
          className="absolute top-20 right-4 w-32 h-44 object-cover rounded-2xl border-2 border-white/30 z-10 scale-x-[-1]"
        />

        {/* Top bar */}
        <div className="absolute top-0 left-0 right-0 p-4 pt-12 safe-area-top z-20 bg-gradient-to-b from-black/50 to-transparent">
          <button onClick={handleEndCall} className="flex items-center text-white">
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
              onClick={toggleSpeaker}
            />
            <ControlButton
              icon={isVideoOff ? <VideoOff className="w-6 h-6" /> : <Video className="w-6 h-6" />}
              label="видео"
              isActive={!isVideoOff}
              onClick={toggleVideo}
            />
            <ControlButton
              icon={isMuted ? <MicOff className="w-6 h-6" /> : <Mic className="w-6 h-6" />}
              label="убрать звук"
              isActive={!isMuted}
              onClick={toggleMute}
            />
            <ControlButton
              icon={<X className="w-6 h-6" />}
              label="завершить"
              isEndButton
              onClick={handleEndCall}
            />
          </div>
        </div>
      </div>
    );
  }

  // Audio call or waiting state - show gradient UI (Telegram style)
  return (
    <div className="fixed inset-0 bg-gradient-to-b from-purple-600 via-purple-500 to-blue-400 z-[100] flex flex-col">
      {/* Top bar with back button */}
      <div className="p-4 pt-12 safe-area-top">
        <button onClick={handleEndCall} className="flex items-center text-white">
          <ChevronLeft className="w-6 h-6" />
          <span className="text-lg">Назад</span>
        </button>
      </div>

      {/* Main content */}
      <div className="flex-1 flex flex-col items-center justify-center -mt-16">
        {/* Avatar with glow effect */}
        <div className="relative">
          {/* Outer glow */}
          <div className="absolute -inset-4 rounded-full bg-white/10 blur-xl" />

          {/* Pulsing ring animation when not connected */}
          {showWaitingUI && (
            <>
              <div
                className="absolute inset-0 w-40 h-40 rounded-full border-4 border-white/20 animate-ping"
                style={{ animationDuration: "2s" }}
              />
              <div className="absolute inset-0 w-40 h-40 rounded-full border-2 border-white/30" />
            </>
          )}

          {/* Avatar container */}
          <div className="relative w-40 h-40 rounded-full border-4 border-white/30 overflow-hidden bg-gradient-to-br from-orange-400 to-orange-500 flex items-center justify-center">
            {otherAvatar ? (
              <img
                src={otherAvatar}
                alt={otherName}
                className="w-full h-full object-cover"
              />
            ) : (
              <span className="text-5xl text-white font-bold">
                {getInitials(otherName)}
              </span>
            )}
          </div>
        </div>

        {/* Name */}
        <h2 className="text-3xl font-semibold text-white mt-8 mb-3">{otherName}</h2>

        {/* Status with animated dots */}
        <div className="flex items-center h-7">
          <span className="text-white/80 text-lg">{getStatusText()}</span>
          {showWaitingUI && (
            <span className="flex ml-0.5">
              <span
                className="animate-bounce text-white/80 text-lg"
                style={{ animationDelay: "0ms", animationDuration: "1s" }}
              >
                .
              </span>
              <span
                className="animate-bounce text-white/80 text-lg"
                style={{ animationDelay: "200ms", animationDuration: "1s" }}
              >
                .
              </span>
              <span
                className="animate-bounce text-white/80 text-lg"
                style={{ animationDelay: "400ms", animationDuration: "1s" }}
              >
                .
              </span>
            </span>
          )}
        </div>
      </div>

      {/* Hidden audio element for remote stream in audio calls */}
      {!isVideoCall && <audio ref={remoteVideoRef as any} autoPlay playsInline />}

      {/* Bottom controls */}
      <div className="p-6 pb-10 safe-area-bottom">
        <div className="flex items-center justify-around">
          <ControlButton
            icon={<Volume2 className="w-6 h-6" />}
            label="динамик"
            isActive={isSpeakerOn}
            onClick={toggleSpeaker}
          />
          <ControlButton
            icon={isVideoOff ? <VideoOff className="w-6 h-6" /> : <Video className="w-6 h-6" />}
            label="видео"
            isActive={!isVideoOff}
            onClick={toggleVideo}
          />
          <ControlButton
            icon={isMuted ? <MicOff className="w-6 h-6" /> : <Mic className="w-6 h-6" />}
            label="убрать звук"
            isActive={!isMuted}
            onClick={toggleMute}
          />
          <ControlButton
            icon={<X className="w-6 h-6" />}
            label="завершить"
            isEndButton
            onClick={handleEndCall}
          />
        </div>
      </div>
    </div>
  );
}

// Control button component
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
