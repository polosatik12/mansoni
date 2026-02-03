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
        "h-full flex flex-col safe-area-top safe-area-left safe-area-right relative",
        isReelsPage ? "bg-black" : "bg-background"
      )}
      style={{ 
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Apple-style aurora gradient background for light mode */}
      {!isReelsPage && (
        <div className="absolute inset-0 dark:hidden overflow-hidden pointer-events-none" style={{ zIndex: 0 }}>
          {/* Base gradient - more vibrant */}
          <div className="absolute inset-0 bg-gradient-to-br from-violet-200/90 via-fuchsia-100/70 to-orange-100/50" />
          
          {/* Aurora orbs - larger and more vibrant */}
          <div 
            className="absolute -top-20 -left-20 w-[500px] h-[500px] rounded-full blur-[100px]"
            style={{ background: 'radial-gradient(circle, rgba(167, 139, 250, 0.6) 0%, transparent 60%)' }}
          />
          <div 
            className="absolute top-40 -right-20 w-[400px] h-[400px] rounded-full blur-[80px]"
            style={{ background: 'radial-gradient(circle, rgba(236, 72, 153, 0.5) 0%, transparent 60%)' }}
          />
          <div 
            className="absolute top-[60%] left-10 w-[350px] h-[350px] rounded-full blur-[90px]"
            style={{ background: 'radial-gradient(circle, rgba(139, 92, 246, 0.55) 0%, transparent 60%)' }}
          />
          <div 
            className="absolute bottom-0 right-0 w-[450px] h-[450px] rounded-full blur-[100px]"
            style={{ background: 'radial-gradient(circle, rgba(251, 146, 60, 0.4) 0%, transparent 60%)' }}
          />
        </div>
      )}

      <ScrollContainerProvider value={mainRef}>
        <main 
          ref={mainRef}
          className={cn(
            "flex-1 overflow-y-auto overflow-x-hidden max-w-lg mx-auto w-full native-scroll relative z-10",
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
