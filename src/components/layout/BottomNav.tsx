import { Home, MessageCircle, Search, Heart, FileText, Headphones, User, LucideIcon, Play } from "lucide-react";
import { NavLink, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import { useUnreadChats } from "@/hooks/useUnreadChats";

interface NavItem {
  to: string;
  icon: LucideIcon;
  label: string;
  hasBadge?: boolean;
  isAction?: boolean;
}

// Default nav items (main pages)
const defaultNavItems: NavItem[] = [
  { to: "/", icon: Home, label: "Главная" },
  { to: "/search", icon: Search, label: "Поиск" },
  { to: "/reels", icon: Play, label: "Reels" },
  { to: "/chats", icon: MessageCircle, label: "Чаты", hasBadge: true },
  { to: "/profile", icon: User, label: "Профиль" },
];

// Real estate service nav items
const realEstateNavItems: NavItem[] = [
  { to: "/", icon: Home, label: "Главная" },
  { to: "/chats", icon: MessageCircle, label: "Чаты", hasBadge: true },
  { to: "#search", icon: Search, label: "Поиск", isAction: true },
  { to: "#favorites", icon: Heart, label: "Избранное", isAction: true },
];

// Insurance service nav items
const insuranceNavItems: NavItem[] = [
  { to: "/", icon: Home, label: "Главная" },
  { to: "/chats", icon: MessageCircle, label: "Чаты", hasBadge: true },
  { to: "/insurance/policies", icon: FileText, label: "Полисы" },
];

export function BottomNav() {
  const location = useLocation();
  const { unreadCount } = useUnreadChats();
  
  // Determine which nav items to show based on route
  const getNavItems = (): NavItem[] => {
    if (location.pathname.startsWith("/realestate")) {
      return realEstateNavItems;
    }
    if (location.pathname.startsWith("/insurance")) {
      return insuranceNavItems;
    }
    return defaultNavItems;
  };

  const navItems = getNavItems();

  const isReelsPage = location.pathname === "/reels";

  return (
    <nav 
      className={cn(
        "fixed-nav fixed bottom-0 left-0 right-0 z-[100] safe-area-bottom",
        isReelsPage 
          ? "bg-black/80 backdrop-blur-md border-t border-white/10" 
          : "bg-card border-t border-border"
      )}
      style={{
        // Inline styles for maximum stability
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        transform: 'translate3d(0, 0, 0)',
        WebkitTransform: 'translate3d(0, 0, 0)',
      }}
    >
      <div className="flex items-center justify-around h-16 max-w-lg mx-auto pb-[env(safe-area-inset-bottom)]">
        {navItems.map((item) => {
          // For action items (not real routes), use button
          if (item.isAction) {
            return (
              <button
                key={item.to}
                className={cn(
                  "flex flex-col items-center justify-center gap-1 w-16 h-full transition-colors",
                  isReelsPage ? "text-white/60 hover:text-white" : "text-muted-foreground hover:text-primary"
                )}
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
                  isReelsPage
                    ? isActive ? "text-white" : "text-white/60"
                    : isActive ? "text-primary" : "text-muted-foreground"
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
                    {item.hasBadge && unreadCount > 0 && (
                      <span className="absolute -top-1.5 -right-2 bg-primary text-primary-foreground text-[10px] font-semibold rounded-full min-w-[18px] h-[18px] flex items-center justify-center px-1">
                        {unreadCount > 9 ? "9+" : unreadCount}
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
