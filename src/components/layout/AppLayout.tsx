import { Outlet } from "react-router-dom";
import { BottomNav } from "./BottomNav";
import { AppHeader } from "./AppHeader";

export function AppLayout() {
  return (
    <div className="min-h-screen bg-background">
      <AppHeader />
      <main className="pb-20 max-w-lg mx-auto">
        <Outlet />
      </main>
      <BottomNav />
    </div>
  );
}
