import { useState, useEffect, useRef } from "react";
import {
  Phone,
  PhoneOff,
  Mic,
  MicOff,
  Video,
  VideoOff,
  SwitchCamera,
  Minimize2,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useWebRTC } from "@/hooks/useWebRTC";
import type { Call, CallType } from "@/hooks/useCalls";

interface CallScreenProps {
  call: Call;
  isInitiator: boolean;
  onEnd: () => void;
  onMinimize?: () => void;
}

export function CallScreen({ call, isInitiator, onEnd, onMinimize }: CallScreenProps) {
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const [callDuration, setCallDuration] = useState(0);
  const [connectionState, setConnectionState] = useState<string>("connecting");
  const [webrtcStarted, setWebrtcStarted] = useState(false);

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
    switchCamera,
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
      // Small delay to ensure both peers are ready
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

  // Call duration timer - only count when connected
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
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const handleEndCall = () => {
    endCall();
    onEnd();
  };

  const getStatusText = () => {
    // Show call status based on call.status first
    if (call.status === "calling") {
      return "Вызов...";
    }
    if (call.status === "ringing") {
      return "Звонок...";
    }
    
    // For active calls, show connection state
    switch (connectionState) {
      case "connecting":
        return "Подключение...";
      case "connected":
        return formatDuration(callDuration);
      case "disconnected":
        return "Отключено";
      case "failed":
        return "Ошибка соединения";
      default:
        return "Соединение...";
    }
  };

  return (
    <div className="fixed inset-0 bg-black z-[100] flex flex-col">
      {/* Video call layout */}
      {isVideoCall ? (
        <>
          {/* Remote video (full screen) */}
          <div className="absolute inset-0">
            {remoteStream ? (
              <video
                ref={remoteVideoRef}
                autoPlay
                playsInline
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-gradient-to-b from-gray-800 to-gray-900">
                {otherAvatar ? (
                  <img
                    src={otherAvatar}
                    alt={otherName}
                    className="w-32 h-32 rounded-full object-cover"
                  />
                ) : (
                  <div className="w-32 h-32 rounded-full bg-gray-600 flex items-center justify-center">
                    <span className="text-4xl text-white font-bold">
                      {otherName.charAt(0).toUpperCase()}
                    </span>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Local video (PiP) - only show when call is active */}
          {isCallActive && (
            <div className="absolute top-16 right-4 w-28 h-40 rounded-xl overflow-hidden shadow-lg border-2 border-white/20">
              {localStream && !isVideoOff ? (
                <video
                  ref={localVideoRef}
                  autoPlay
                  playsInline
                  muted
                  className="w-full h-full object-cover scale-x-[-1]"
                />
              ) : (
                <div className="w-full h-full bg-gray-700 flex items-center justify-center">
                  <VideoOff className="w-6 h-6 text-white/50" />
                </div>
              )}
            </div>
          )}
        </>
      ) : (
        /* Audio call layout */
        <div className="flex-1 flex flex-col items-center justify-center bg-gradient-to-b from-primary/80 to-primary">
          {/* Avatar */}
          <div className="w-32 h-32 rounded-full overflow-hidden border-4 border-white/30 mb-6">
            {otherAvatar ? (
              <img
                src={otherAvatar}
                alt={otherName}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full bg-white/20 flex items-center justify-center">
                <span className="text-4xl text-white font-bold">
                  {otherName.charAt(0).toUpperCase()}
                </span>
              </div>
            )}
          </div>

          <h2 className="text-2xl font-bold text-white mb-2">{otherName}</h2>
        </div>
      )}

      {/* Top bar */}
      <div className="absolute top-0 left-0 right-0 flex items-center justify-between p-4 safe-area-top">
        <div className="flex flex-col">
          {isVideoCall && (
            <span className="text-white font-medium">{otherName}</span>
          )}
          <span className="text-white/70 text-sm">{getStatusText()}</span>
        </div>

        {onMinimize && (
          <Button
            variant="ghost"
            size="icon"
            onClick={onMinimize}
            className="text-white hover:bg-white/20"
          >
            <Minimize2 className="w-5 h-5" />
          </Button>
        )}
      </div>

      {/* Controls */}
      <div className="absolute bottom-0 left-0 right-0 p-6 safe-area-bottom">
        <div className="flex items-center justify-center gap-4">
          {/* Show mute/video controls only when call is active */}
          {isCallActive && (
            <>
              {/* Mute */}
              <Button
                size="icon"
                onClick={toggleMute}
                className={`w-14 h-14 rounded-full ${
                  isMuted ? "bg-white text-black" : "bg-white/20 text-white"
                }`}
              >
                {isMuted ? <MicOff className="w-6 h-6" /> : <Mic className="w-6 h-6" />}
              </Button>

              {/* Video toggle (only for video calls) */}
              {isVideoCall && (
                <Button
                  size="icon"
                  onClick={toggleVideo}
                  className={`w-14 h-14 rounded-full ${
                    isVideoOff ? "bg-white text-black" : "bg-white/20 text-white"
                  }`}
                >
                  {isVideoOff ? (
                    <VideoOff className="w-6 h-6" />
                  ) : (
                    <Video className="w-6 h-6" />
                  )}
                </Button>
              )}

              {/* Switch camera (only for video calls) */}
              {isVideoCall && (
                <Button
                  size="icon"
                  onClick={switchCamera}
                  className="w-14 h-14 rounded-full bg-white/20 text-white"
                >
                  <SwitchCamera className="w-6 h-6" />
                </Button>
              )}
            </>
          )}

          {/* End/Cancel call button */}
          <Button
            size="icon"
            onClick={handleEndCall}
            className="w-14 h-14 rounded-full bg-destructive hover:bg-destructive/90"
          >
            {isCallActive ? (
              <PhoneOff className="w-6 h-6" />
            ) : (
              <X className="w-6 h-6" />
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
