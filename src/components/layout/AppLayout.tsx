import { Outlet } from "react-router-dom";
import { BottomNav } from "./BottomNav";
import { AppHeader } from "./AppHeader";

export function AppLayout() {
  return (
    <div className="min-h-screen bg-background safe-area-top safe-area-left safe-area-right">
      <AppHeader showLogo={false} />
      <main className="pb-24 max-w-lg mx-auto native-scroll">
        <Outlet />
      </main>
      <BottomNav />
    </div>
  );
}
