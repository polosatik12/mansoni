import { useRef } from "react";
import { Outlet, useLocation } from "react-router-dom";
import { BottomNav } from "./BottomNav";
import { ScrollContainerProvider } from "@/contexts/ScrollContainerContext";
import { useChatOpen } from "@/contexts/ChatOpenContext";
import { cn } from "@/lib/utils";

export function AppLayout() {
  const mainRef = useRef<HTMLElement>(null);
  const location = useLocation();
  const { isChatOpen } = useChatOpen();
  const isReelsPage = location.pathname === "/reels";

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
            // Prevent scroll from affecting fixed elements
            WebkitOverflowScrolling: 'touch',
            overscrollBehavior: 'contain',
            // iOS Safari: isolate scroll context from nav
            touchAction: 'pan-y',
            // Prevent rubber-band effect from reaching nav
            isolation: 'isolate',
          }}
        >
          <Outlet />
        </main>
      </ScrollContainerProvider>
      {!isChatOpen && <BottomNav />}
    </div>
  );
}
