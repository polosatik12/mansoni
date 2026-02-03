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
        <div className="absolute inset-0 dark:hidden overflow-hidden pointer-events-none">
          {/* Base gradient */}
          <div className="absolute inset-0 bg-gradient-to-b from-violet-100/80 via-fuchsia-50/50 to-rose-50/30" />
          
          {/* Aurora orbs */}
          <div 
            className="absolute -top-32 -left-32 w-96 h-96 rounded-full opacity-60 blur-3xl"
            style={{ background: 'radial-gradient(circle, rgba(167, 139, 250, 0.4) 0%, transparent 70%)' }}
          />
          <div 
            className="absolute top-1/4 -right-32 w-80 h-80 rounded-full opacity-50 blur-3xl"
            style={{ background: 'radial-gradient(circle, rgba(236, 72, 153, 0.3) 0%, transparent 70%)' }}
          />
          <div 
            className="absolute bottom-1/3 left-1/4 w-72 h-72 rounded-full opacity-40 blur-3xl"
            style={{ background: 'radial-gradient(circle, rgba(139, 92, 246, 0.35) 0%, transparent 70%)' }}
          />
          <div 
            className="absolute -bottom-20 right-1/3 w-96 h-96 rounded-full opacity-30 blur-3xl"
            style={{ background: 'radial-gradient(circle, rgba(251, 146, 60, 0.25) 0%, transparent 70%)' }}
          />
          
          {/* Subtle noise texture overlay */}
          <div className="absolute inset-0 opacity-[0.015]" style={{ 
            backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
          }} />
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
