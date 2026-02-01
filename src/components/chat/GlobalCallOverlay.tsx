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

  console.log("[GlobalCallOverlay] Render:", { status, hasCurrentCall: !!currentCall, hasIncomingCall: !!incomingCall });

  // Show incoming call sheet for unanswered incoming calls
  if (incomingCall && status === "idle") {
    console.log("[GlobalCallOverlay] Showing incoming call sheet");
    return (
      <IncomingVideoCallSheet
        call={incomingCall}
        onAccept={() => answerCall(incomingCall)}
        onDecline={declineCall}
      />
    );
  }

  // Show active call screen for ANY non-idle status (calling, ringing, connected)
  // Even if currentCall is temporarily null during state transitions
  if (status !== "idle") {
    console.log("[GlobalCallOverlay] Showing call screen, status:", status);
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
