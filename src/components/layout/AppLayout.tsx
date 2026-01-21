import { Outlet } from "react-router-dom";
import { BottomNav } from "./BottomNav";

export function AppLayout() {
  return (
    <div className="h-full flex flex-col bg-background safe-area-top safe-area-left safe-area-right">
      <main className="flex-1 overflow-y-auto overflow-x-hidden pb-20 max-w-lg mx-auto w-full native-scroll">
        <Outlet />
      </main>
      <BottomNav />
    </div>
  );
}
