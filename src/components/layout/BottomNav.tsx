import { Home, Grid3X3, MessageCircle } from "lucide-react";
import { NavLink, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import { ReactNode } from "react";

// Core nav items that always show
const coreNavItems = [
  { to: "/", icon: Home, label: "Главная" },
  { to: "/modules", icon: Grid3X3, label: "Сервисы" },
  { to: "/chats", icon: MessageCircle, label: "Чаты", badge: 5 },
];

// Service routes that trigger compact mode
const serviceRoutes = ["/realestate", "/insurance"];

interface BottomNavProps {
  serviceActions?: ReactNode;
}

export function BottomNav({ serviceActions }: BottomNavProps) {
  const location = useLocation();
  
  // Check if we're in a service page
  const isServicePage = serviceRoutes.some(route => 
    location.pathname.startsWith(route)
  );

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-card border-t border-border safe-area-bottom">
      <div className="flex items-center h-16 max-w-lg mx-auto pb-[env(safe-area-inset-bottom)]">
        {/* Core nav - left aligned when in service, centered otherwise */}
        <div className={cn(
          "flex items-center",
          isServicePage ? "justify-start pl-2" : "flex-1 justify-around"
        )}>
          {coreNavItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                cn(
                  "flex flex-col items-center justify-center gap-1 h-full transition-colors",
                  isServicePage ? "w-14 px-1" : "w-16",
                  isActive ? "text-primary" : "text-muted-foreground"
                )
              }
            >
              {({ isActive }) => (
                <>
                  <div className="relative">
                    <item.icon
                      className={cn(
                        "w-6 h-6 transition-all",
                        isActive && "stroke-[2.5px]"
                      )}
                    />
                    {item.badge && (
                      <span className="absolute -top-1.5 -right-2 bg-primary text-primary-foreground text-[10px] font-semibold rounded-full min-w-[18px] h-[18px] flex items-center justify-center px-1">
                        {item.badge}
                      </span>
                    )}
                  </div>
                  <span className="text-[10px] font-medium">{item.label}</span>
                </>
              )}
            </NavLink>
          ))}
        </div>

        {/* Service actions - right side, only shows in service pages */}
        {isServicePage && (
          <div className="flex-1 flex items-center justify-end pr-3 gap-2">
            {serviceActions}
          </div>
        )}
      </div>
    </nav>
  );
}
