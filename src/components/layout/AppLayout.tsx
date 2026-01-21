import { useRef } from "react";
import { Outlet } from "react-router-dom";
import { BottomNav } from "./BottomNav";
import { ScrollContainerProvider } from "@/contexts/ScrollContainerContext";

export function AppLayout() {
  const mainRef = useRef<HTMLElement>(null);

  return (
    <div className="h-full flex flex-col bg-background safe-area-top safe-area-left safe-area-right">
      <ScrollContainerProvider value={mainRef}>
        <main 
          ref={mainRef}
          className="flex-1 overflow-y-auto overflow-x-hidden pb-20 max-w-lg mx-auto w-full native-scroll"
        >
          <Outlet />
        </main>
      </ScrollContainerProvider>
      <BottomNav />
    </div>
  );
}
