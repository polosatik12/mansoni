import { Outlet, useLocation } from "react-router-dom";
import { BottomNav } from "./BottomNav";
import { Phone, Heart, Map, SlidersHorizontal, Calculator, MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

// Service routes and their action buttons
const serviceActions: Record<string, React.ReactNode> = {
  "/realestate": (
    <>
      <Button size="sm" variant="ghost" className="flex flex-col items-center gap-0.5 h-auto py-2 px-3">
        <Heart className="w-5 h-5" />
        <span className="text-[10px]">Избранное</span>
      </Button>
      <Button size="sm" variant="ghost" className="flex flex-col items-center gap-0.5 h-auto py-2 px-3">
        <Map className="w-5 h-5" />
        <span className="text-[10px]">Карта</span>
      </Button>
    </>
  ),
  "/insurance": (
    <>
      <Button size="sm" variant="ghost" className="flex flex-col items-center gap-0.5 h-auto py-2 px-3">
        <Calculator className="w-5 h-5" />
        <span className="text-[10px]">Расчёт</span>
      </Button>
      <Button size="sm" variant="ghost" className="flex flex-col items-center gap-0.5 h-auto py-2 px-3">
        <MessageCircle className="w-5 h-5" />
        <span className="text-[10px]">Помощь</span>
      </Button>
    </>
  ),
};

export function AppLayout() {
  const location = useLocation();
  
  // Find matching service actions
  const matchedServiceKey = Object.keys(serviceActions).find(route => 
    location.pathname.startsWith(route)
  );
  const currentServiceActions = matchedServiceKey ? serviceActions[matchedServiceKey] : undefined;

  return (
    <div className="min-h-screen bg-background safe-area-top safe-area-left safe-area-right">
      <main className="pb-24 max-w-lg mx-auto native-scroll">
        <Outlet />
      </main>
      <BottomNav serviceActions={currentServiceActions} />
    </div>
  );
}
