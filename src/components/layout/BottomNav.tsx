import { Home, Grid3X3, MessageCircle, Search, Heart, LucideIcon } from "lucide-react";
import { NavLink, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";

interface NavItem {
  to: string;
  icon: LucideIcon;
  label: string;
  badge?: number;
  isAction?: boolean;
}

// Default nav items (main pages)
const defaultNavItems: NavItem[] = [
  { to: "/", icon: Home, label: "Главная" },
  { to: "/search", icon: Search, label: "Поиск" },
  { to: "/modules", icon: Grid3X3, label: "Сервисы" },
  { to: "/chats", icon: MessageCircle, label: "Чаты", badge: 5 },
];

// Service nav items (when inside a service like realestate, insurance)
const serviceNavItems: NavItem[] = [
  { to: "/", icon: Home, label: "Главная" },
  { to: "/modules", icon: Grid3X3, label: "Сервисы" },
  { to: "/chats", icon: MessageCircle, label: "Чаты", badge: 5 },
  { to: "#search", icon: Search, label: "Поиск", isAction: true },
  { to: "#favorites", icon: Heart, label: "Избранное", isAction: true },
];

// Service routes that trigger service mode
const serviceRoutes = ["/realestate", "/insurance"];

export function BottomNav() {
  const location = useLocation();
  
  // Check if we're in a service page
  const isServicePage = serviceRoutes.some(route => 
    location.pathname.startsWith(route)
  );

  const navItems = isServicePage ? serviceNavItems : defaultNavItems;

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-card border-t border-border safe-area-bottom">
      <div className="flex items-center justify-around h-16 max-w-lg mx-auto pb-[env(safe-area-inset-bottom)]">
        {navItems.map((item) => {
          // For action items (not real routes), use button
          if (item.isAction) {
            return (
              <button
                key={item.to}
                className="flex flex-col items-center justify-center gap-1 w-16 h-full transition-colors text-muted-foreground hover:text-primary"
              >
                <div className="relative">
                  <item.icon className="w-6 h-6" />
                </div>
                <span className="text-[11px] font-medium">{item.label}</span>
              </button>
            );
          }

          return (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                cn(
                  "flex flex-col items-center justify-center gap-1 w-16 h-full transition-colors",
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
                  <span className="text-[11px] font-medium">{item.label}</span>
                </>
              )}
            </NavLink>
          );
        })}
      </div>
    </nav>
  );
}
