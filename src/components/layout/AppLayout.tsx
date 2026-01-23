import { useRef, useState } from "react";
import { Outlet, useLocation, useNavigate } from "react-router-dom";
import { BottomNav } from "./BottomNav";
import { ScrollContainerProvider } from "@/contexts/ScrollContainerContext";
import { useChatOpen } from "@/contexts/ChatOpenContext";
import { useCalls } from "@/hooks/useCalls";
import { IncomingCallSheet } from "@/components/chat/IncomingCallSheet";
import { CallScreen } from "@/components/chat/CallScreen";
import { cn } from "@/lib/utils";

export function AppLayout() {
  const mainRef = useRef<HTMLElement>(null);
  const location = useLocation();
  const navigate = useNavigate();
  const { isChatOpen } = useChatOpen();
  const isReelsPage = location.pathname === "/reels";
  
  const { activeCall, incomingCall, acceptCall, declineCall, endCall } = useCalls();
  const [isCallInitiator, setIsCallInitiator] = useState(false);

  const handleAcceptCall = async () => {
    if (incomingCall) {
      setIsCallInitiator(false);
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
      {!isChatOpen && <BottomNav />}

      {/* Global Incoming Call Handler - shows on any page */}
      {incomingCall && !activeCall && (
        <IncomingCallSheet
          call={incomingCall}
          onAccept={handleAcceptCall}
          onDecline={handleDeclineCall}
        />
      )}

      {/* Global Active Call Handler - shows on any page when call is active but not in chat */}
      {activeCall && !isChatOpen && ["calling", "ringing", "active"].includes(activeCall.status) && (
        <CallScreen
          call={activeCall}
          isInitiator={isCallInitiator}
          onEnd={handleEndCall}
        />
      )}
    </div>
  );
}
