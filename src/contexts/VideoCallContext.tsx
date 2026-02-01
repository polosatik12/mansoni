import { createContext, useContext, ReactNode, useState, useCallback, useEffect } from "react";
import { useVideoCall, type VideoCall, type VideoCallStatus } from "@/hooks/useVideoCall";
import { useIncomingCalls } from "@/hooks/useIncomingCalls";
import { useAuth } from "@/hooks/useAuth";

interface VideoCallContextType {
  // State
  status: VideoCallStatus;
  currentCall: VideoCall | null;
  incomingCall: VideoCall | null;
  localStream: MediaStream | null;
  remoteStream: MediaStream | null;
  isMuted: boolean;
  isVideoOff: boolean;
  connectionState: string;
  
  // Actions
  startCall: (calleeId: string, conversationId: string | null, callType: "video" | "audio") => Promise<VideoCall | null>;
  answerCall: (call: VideoCall) => Promise<void>;
  declineCall: () => Promise<void>;
  endCall: () => Promise<void>;
  toggleMute: () => void;
  toggleVideo: () => void;
  retryConnection: () => Promise<void>;
}

const VideoCallContext = createContext<VideoCallContextType | null>(null);

export function VideoCallProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [pendingIncomingCall, setPendingIncomingCall] = useState<VideoCall | null>(null);

  const {
    status,
    currentCall,
    localStream,
    remoteStream,
    isMuted,
    isVideoOff,
    connectionState,
    startCall: startVideoCall,
    answerCall: answerVideoCall,
    endCall: endVideoCall,
    toggleMute,
    toggleVideo,
    retryWithFreshCredentials,
  } = useVideoCall({
    onCallEnded: (call) => {
      console.log("[VideoCallContext] Call ended:", call.id.slice(0, 8));
      setPendingIncomingCall(null);
    },
  });

  const { incomingCall: detectedIncomingCall, clearIncomingCall } = useIncomingCalls({
    onIncomingCall: (call) => {
      // Don't show incoming call if we're already in a call
      if (status !== "idle") {
        console.log("[VideoCallContext] Already in call, ignoring incoming");
        return;
      }
      setPendingIncomingCall(call);
    },
  });

  // Sync incoming call state
  const incomingCall = status === "idle" ? (pendingIncomingCall || detectedIncomingCall) : null;

  const answerCall = useCallback(async (call: VideoCall) => {
    setPendingIncomingCall(null);
    clearIncomingCall();
    await answerVideoCall(call);
  }, [answerVideoCall, clearIncomingCall]);

  const declineCall = useCallback(async () => {
    if (incomingCall) {
      // We don't use the hook's endCall since we haven't answered yet
      // Just update the DB directly
      const { supabase } = await import("@/integrations/supabase/client");
      await supabase
        .from("video_calls")
        .update({
          status: "declined",
          ended_at: new Date().toISOString(),
        })
        .eq("id", incomingCall.id);
      
      setPendingIncomingCall(null);
      clearIncomingCall();
    }
  }, [incomingCall, clearIncomingCall]);

  const endCall = useCallback(async () => {
    if (currentCall) {
      await endVideoCall("ended");
    } else if (incomingCall) {
      await declineCall();
    }
  }, [currentCall, incomingCall, endVideoCall, declineCall]);

  const startCall = useCallback(async (
    calleeId: string,
    conversationId: string | null,
    callType: "video" | "audio"
  ) => {
    if (!user) return null;
    return startVideoCall(calleeId, conversationId, callType);
  }, [user, startVideoCall]);

  const retryConnection = useCallback(async () => {
    await retryWithFreshCredentials();
  }, [retryWithFreshCredentials]);

  const value: VideoCallContextType = {
    status,
    currentCall,
    incomingCall,
    localStream,
    remoteStream,
    isMuted,
    isVideoOff,
    connectionState,
    startCall,
    answerCall,
    declineCall,
    endCall,
    toggleMute,
    toggleVideo,
    retryConnection,
  };

  return (
    <VideoCallContext.Provider value={value}>
      {children}
    </VideoCallContext.Provider>
  );
}

export function useVideoCallContext() {
  const context = useContext(VideoCallContext);
  if (!context) {
    throw new Error("useVideoCallContext must be used within VideoCallProvider");
  }
  return context;
}

// Re-export types
export type { VideoCall, VideoCallStatus };
