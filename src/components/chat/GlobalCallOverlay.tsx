import { useVideoCallContext } from "@/contexts/VideoCallContext";
import { VideoCallScreen } from "./VideoCallScreen";
import { IncomingVideoCallSheet } from "./IncomingVideoCallSheet";

/**
 * Global overlay for video calls - renders call UI on top of everything
 */
export function GlobalCallOverlay() {
  const {
    status,
    currentCall,
    incomingCall,
    localStream,
    remoteStream,
    isMuted,
    isVideoOff,
    connectionState,
    answerCall,
    declineCall,
    endCall,
    toggleMute,
    toggleVideo,
    retryConnection,
  } = useVideoCallContext();

  // Show incoming call sheet
  if (incomingCall && status === "idle") {
    return (
      <IncomingVideoCallSheet
        call={incomingCall}
        onAccept={() => answerCall(incomingCall)}
        onDecline={declineCall}
      />
    );
  }

  // Show active call screen
  if (status !== "idle" && currentCall) {
    return (
      <VideoCallScreen
        call={currentCall}
        status={status}
        localStream={localStream}
        remoteStream={remoteStream}
        isMuted={isMuted}
        isVideoOff={isVideoOff}
        connectionState={connectionState}
        onEnd={endCall}
        onToggleMute={toggleMute}
        onToggleVideo={toggleVideo}
        onRetry={retryConnection}
      />
    );
  }

  return null;
}
