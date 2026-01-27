import { useRef } from "react";
import { Outlet, useLocation } from "react-router-dom";
import { BottomNav } from "./BottomNav";
import { ScrollContainerProvider } from "@/contexts/ScrollContainerContext";
import { useChatOpen } from "@/contexts/ChatOpenContext";
import { useCallsContext } from "@/contexts/CallsContext";
import { useAuth } from "@/hooks/useAuth";
import { IncomingCallSheet } from "@/components/chat/IncomingCallSheet";
import { CallScreen } from "@/components/chat/CallScreen";
import { cn } from "@/lib/utils";

export function AppLayout() {
  const mainRef = useRef<HTMLElement>(null);
  const location = useLocation();
  const { isChatOpen } = useChatOpen();
  const { user } = useAuth();
  const isReelsPage = location.pathname === "/reels";
  
  const { activeCall, incomingCall, acceptCall, declineCall, endCall } = useCallsContext();

  const handleAcceptCall = async () => {
    if (incomingCall) {
      await acceptCall(incomingCall.id);
    }
  };

  const handleDeclineCall = async () => {
    if (incomingCall) {
      await declineCall(incomingCall.id);
    }
  };

  const handleEndCall = async () => {
    if (activeCall) {
      await endCall(activeCall.id);
    }
  };

  // Determine if current user is the call initiator
  const isCallInitiator = activeCall ? activeCall.caller_id === user?.id : false;

  return (
    <div 
      className="h-full flex flex-col bg-background safe-area-top safe-area-left safe-area-right"
      style={{ 
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      <ScrollContainerProvider value={mainRef}>
        <main 
          ref={mainRef}
          className={cn(
            "flex-1 overflow-y-auto overflow-x-hidden max-w-lg mx-auto w-full native-scroll",
            !isReelsPage && "pb-20"
          )}
          style={{
            WebkitOverflowScrolling: 'touch',
            overscrollBehavior: 'contain',
            touchAction: 'pan-y',
            isolation: 'isolate',
          }}
        >
          <Outlet />
        </main>
      </ScrollContainerProvider>
      <BottomNav hidden={isChatOpen} />

      {/* Global Incoming Call Handler - shows on any page */}
      {incomingCall && !activeCall && (
        <IncomingCallSheet
          call={incomingCall}
          onAccept={handleAcceptCall}
          onDecline={handleDeclineCall}
        />
      )}

      {/* Global Active Call Handler - shows on any page when call is active */}
      {activeCall && ["calling", "ringing", "active"].includes(activeCall.status) && (
        <CallScreen
          call={activeCall}
          isInitiator={isCallInitiator}
          onEnd={handleEndCall}
        />
      )}
    </div>
  );
}
