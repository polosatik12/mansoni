import { useState, useEffect, forwardRef } from "react";
import { Home, MessageCircle, Search, Heart, FileText, User, LucideIcon, Play } from "lucide-react";
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

export const BottomNav = forwardRef<HTMLElement, {}>(function BottomNav(_, ref) {
  const location = useLocation();
  const { unreadCount } = useUnreadChats();
  const [keyboardOpen, setKeyboardOpen] = useState(false);
  
  // iOS Safari keyboard detection using visualViewport API
  useEffect(() => {
    const viewport = window.visualViewport;
    if (!viewport) return;
    
    const onResize = () => {
      // Keyboard is considered open if viewport height is less than 75% of window height
      const isKeyboardOpen = viewport.height < window.innerHeight * 0.75;
      setKeyboardOpen(isKeyboardOpen);
    };
    
    viewport.addEventListener('resize', onResize);
    viewport.addEventListener('scroll', onResize);
    
    return () => {
      viewport.removeEventListener('resize', onResize);
      viewport.removeEventListener('scroll', onResize);
    };
  }, []);
  
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
      ref={ref as React.Ref<HTMLElement>}
      className={cn(
        "fixed bottom-0 left-0 right-0 z-[100]",
        "touch-none select-none",
        isReelsPage 
          ? "bg-black/80 backdrop-blur-md border-t border-white/10" 
          : "bg-card border-t border-border",
        keyboardOpen && "pointer-events-none"
      )}
      style={{
        // Inline styles for maximum stability on all iPhones (11-17 Pro Max)
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        // Use padding-bottom for safe area instead of height adjustment
        paddingBottom: 'env(safe-area-inset-bottom, 0px)',
        // GPU acceleration for smooth animations
        transform: keyboardOpen ? 'translate3d(0, 100%, 0)' : 'translate3d(0, 0, 0)',
        WebkitTransform: keyboardOpen ? 'translate3d(0, 100%, 0)' : 'translate3d(0, 0, 0)',
        transition: 'transform 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
        WebkitTransition: '-webkit-transform 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
        // Prevent layout shift
        willChange: 'transform',
        WebkitBackfaceVisibility: 'hidden',
        backfaceVisibility: 'hidden',
        // Ensure proper stacking
        isolation: 'isolate',
      }}
    >
      {/* 
        Inner container with fixed height - optimized for all iPhone models:
        - iPhone 11/12/13/14/15/16/17: 390-430pt width
        - iPhone Pro Max models: 428-440pt width  
        - All have ~34pt safe area at bottom
      */}
      <div 
        className="flex items-center justify-around max-w-lg mx-auto"
        style={{
          // Fixed height for nav content (excluding safe area)
          height: '50px',
          // Ensure touch targets are large enough (44pt minimum for iOS)
          minHeight: '50px',
        }}
      >
        {navItems.map((item) => {
          // For action items (not real routes), use button
          if (item.isAction) {
            return (
              <button
                key={item.to}
                className={cn(
                  "flex flex-col items-center justify-center flex-1 h-full",
                  "transition-colors duration-150",
                  "active:opacity-70",
                  // Minimum touch target size for iOS (44x44pt)
                  "min-w-[44px] min-h-[44px]",
                  isReelsPage 
                    ? "text-white/60 hover:text-white" 
                    : "text-muted-foreground hover:text-foreground"
                )}
                style={{ 
                  WebkitTapHighlightColor: 'transparent',
                  touchAction: 'manipulation',
                }}
              >
                <div className="relative flex items-center justify-center">
                  <item.icon className="w-[22px] h-[22px]" strokeWidth={1.8} />
                </div>
                <span className="text-[10px] font-medium mt-0.5 leading-tight">
                  {item.label}
                </span>
              </button>
            );
          }

          return (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                cn(
                  "flex flex-col items-center justify-center flex-1 h-full",
                  "transition-colors duration-150",
                  "active:opacity-70",
                  // Minimum touch target size for iOS (44x44pt)
                  "min-w-[44px] min-h-[44px]",
                  isReelsPage
                    ? isActive ? "text-white" : "text-white/60"
                    : isActive ? "text-primary" : "text-muted-foreground"
                )
              }
              style={{ 
                WebkitTapHighlightColor: 'transparent',
                touchAction: 'manipulation',
              }}
            >
              {({ isActive }) => (
                <>
                  <div className="relative flex items-center justify-center">
                    <item.icon
                      className={cn(
                        "w-[22px] h-[22px] transition-all duration-150",
                        isActive && "stroke-[2.2px]"
                      )}
                      strokeWidth={isActive ? 2.2 : 1.8}
                    />
                    {item.hasBadge && unreadCount > 0 && (
                      <span 
                        className={cn(
                          "absolute -top-1 -right-2.5",
                          "bg-primary text-primary-foreground",
                          "text-[10px] font-semibold leading-none",
                          "rounded-full min-w-[16px] h-[16px]",
                          "flex items-center justify-center px-1"
                        )}
                      >
                        {unreadCount > 9 ? "9+" : unreadCount}
                      </span>
                    )}
                  </div>
                  <span className="text-[10px] font-medium mt-0.5 leading-tight">
                    {item.label}
                  </span>
                </>
              )}
            </NavLink>
          );
        })}
      </div>
    </nav>
  );
});

BottomNav.displayName = "BottomNav";
