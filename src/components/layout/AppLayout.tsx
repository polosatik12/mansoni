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
        "h-full flex flex-col safe-area-top safe-area-left safe-area-right",
        isReelsPage 
          ? "bg-black" 
          : "bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/20 dark:bg-background dark:from-background dark:via-background dark:to-background"
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
      <BottomNav hidden={shouldHideBottomNav} />
      {/* Call UI is now handled globally by GlobalCallOverlay in App.tsx */}
    </div>
  );
}
