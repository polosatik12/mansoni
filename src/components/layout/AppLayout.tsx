import { useRef } from "react";
import { Outlet, useLocation } from "react-router-dom";
import { BottomNav } from "./BottomNav";
import { ScrollContainerProvider } from "@/contexts/ScrollContainerContext";
import { useChatOpen } from "@/contexts/ChatOpenContext";
import { cn } from "@/lib/utils";

export function AppLayout() {
  const mainRef = useRef<HTMLElement>(null);
  const location = useLocation();
  const { shouldHideBottomNav } = useChatOpen();
  const isReelsPage = location.pathname === "/reels";

  return (
    <div 
      className={cn(
        "h-[100dvh] flex flex-col safe-area-left safe-area-right relative",
        isReelsPage ? "bg-black" : "bg-background safe-area-top"
      )}
      style={{ 
        position: 'relative',
        overflow: 'hidden',
      }}
    >

      <ScrollContainerProvider value={mainRef}>
        <main 
          ref={mainRef}
          className={cn(
            "flex-1 overflow-x-hidden w-full relative z-10",
            isReelsPage
              ? "overflow-hidden"
              : "overflow-y-auto native-scroll scrollbar-hide pb-20"
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
      <BottomNav hidden={shouldHideBottomNav} />
      {/* Call UI is now handled globally by GlobalCallOverlay in App.tsx */}
    </div>
  );
}
