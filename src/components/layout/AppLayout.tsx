import { Outlet } from "react-router-dom";
import { BottomNav } from "./BottomNav";

export function AppLayout() {
  return (
    <div className="min-h-screen bg-background safe-area-top safe-area-left safe-area-right">
      <main className="pb-24 max-w-lg mx-auto native-scroll">
        <Outlet />
      </main>
      <BottomNav />
    </div>
  );
}
