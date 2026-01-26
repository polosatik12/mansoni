import { useState, useEffect, forwardRef, useRef, useCallback } from "react";
import { Home, Search, Heart, FileText, User, LucideIcon, Play, Plus, Check, ChevronDown } from "lucide-react";
import { NavLink, useLocation, useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";
import { useUnreadChats } from "@/hooks/useUnreadChats";
import ChatIcon from "@/assets/chat-icon.svg";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";

interface NavItem {
  to: string;
  icon?: LucideIcon;
  customIcon?: string;
  label: string;
  hasBadge?: boolean;
  isAction?: boolean;
  hasLongPress?: boolean;
  isCenter?: boolean;
}

interface Account {
  id: string;
  username: string;
  displayName: string;
  avatar: string;
  isActive: boolean;
}

const mockAccounts: Account[] = [
  {
    id: "1",
    username: "alex_ivanov",
    displayName: "Александр Иванов",
    avatar: "https://i.pravatar.cc/150?img=32",
    isActive: true,
  },
  {
    id: "2",
    username: "work_account",
    displayName: "Рабочий аккаунт",
    avatar: "https://i.pravatar.cc/150?img=12",
    isActive: false,
  },
];

// Default nav items (main pages) - Chat icon in center
const defaultNavItems: NavItem[] = [
  { to: "/", icon: Home, label: "Главная" },
  { to: "/search", icon: Search, label: "Поиск" },
  { to: "/chats", customIcon: ChatIcon, label: "Чаты", hasBadge: true, isCenter: true },
  { to: "/reels", icon: Play, label: "Reels" },
  { to: "/profile", icon: User, label: "Профиль", hasLongPress: true },
];

// Real estate service nav items
const realEstateNavItems: NavItem[] = [
  { to: "/", icon: Home, label: "Главная" },
  { to: "#search", icon: Search, label: "Поиск", isAction: true },
  { to: "/chats", customIcon: ChatIcon, label: "Чаты", hasBadge: true, isCenter: true },
  { to: "#favorites", icon: Heart, label: "Избранное", isAction: true },
];

// Insurance service nav items
const insuranceNavItems: NavItem[] = [
  { to: "/", icon: Home, label: "Главная" },
  { to: "/chats", customIcon: ChatIcon, label: "Чаты", hasBadge: true, isCenter: true },
  { to: "/insurance/policies", icon: FileText, label: "Полисы" },
];

export const BottomNav = forwardRef<HTMLElement, {}>(function BottomNav(_, ref) {
  const location = useLocation();
  const navigate = useNavigate();
  const { unreadCount } = useUnreadChats();
  const [keyboardOpen, setKeyboardOpen] = useState(false);
  const [accountSwitcherOpen, setAccountSwitcherOpen] = useState(false);
  const [accounts, setAccounts] = useState(mockAccounts);
  const longPressTimerRef = useRef<NodeJS.Timeout | null>(null);
  const isLongPressRef = useRef(false);
  
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

  const handleSwitchAccount = (accountId: string) => {
    setAccounts(prev =>
      prev.map(acc => ({
        ...acc,
        isActive: acc.id === accountId,
      }))
    );
    setAccountSwitcherOpen(false);
  };

  const handleAddAccount = () => {
    setAccountSwitcherOpen(false);
    navigate("/auth");
  };

  const handleTouchStart = useCallback((item: NavItem) => {
    if (!item.hasLongPress) return;
    
    isLongPressRef.current = false;
    longPressTimerRef.current = setTimeout(() => {
      isLongPressRef.current = true;
      setAccountSwitcherOpen(true);
    }, 500);
  }, []);

  const handleTouchEnd = useCallback((item: NavItem, e: React.TouchEvent | React.MouseEvent) => {
    if (!item.hasLongPress) return;
    
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }
    
    if (isLongPressRef.current) {
      e.preventDefault();
      isLongPressRef.current = false;
    }
  }, []);

  const handleContextMenu = useCallback((item: NavItem, e: React.MouseEvent) => {
    if (item.hasLongPress) {
      e.preventDefault();
      setAccountSwitcherOpen(true);
    }
  }, []);

  return (
    <>
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
          position: 'fixed',
          bottom: 0,
          left: 0,
          right: 0,
          paddingBottom: 'env(safe-area-inset-bottom, 0px)',
          transform: keyboardOpen ? 'translate3d(0, 100%, 0)' : 'translate3d(0, 0, 0)',
          WebkitTransform: keyboardOpen ? 'translate3d(0, 100%, 0)' : 'translate3d(0, 0, 0)',
          transition: 'transform 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
          WebkitTransition: '-webkit-transform 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
          willChange: 'transform',
          WebkitBackfaceVisibility: 'hidden',
          backfaceVisibility: 'hidden',
          isolation: 'isolate',
        }}
      >
        <div 
          className="flex items-center justify-around max-w-lg mx-auto"
          style={{
            height: '50px',
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
                onTouchStart={() => handleTouchStart(item)}
                onTouchEnd={(e) => handleTouchEnd(item, e)}
                onMouseDown={() => handleTouchStart(item)}
                onMouseUp={(e) => handleTouchEnd(item, e)}
                onMouseLeave={(e) => handleTouchEnd(item, e)}
                onContextMenu={(e) => handleContextMenu(item, e)}
                className={({ isActive }) =>
                  cn(
                    "flex flex-col items-center justify-center flex-1 h-full",
                    "transition-colors duration-150",
                    "active:opacity-70",
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
                      {item.customIcon ? (
                        <img 
                          src={item.customIcon} 
                          alt={item.label}
                          className={cn(
                            "w-7 h-7 transition-all duration-150",
                            isActive && "scale-110"
                          )}
                        />
                      ) : item.icon ? (
                        <item.icon
                          className={cn(
                            "w-[22px] h-[22px] transition-all duration-150",
                            isActive && "stroke-[2.2px]"
                          )}
                          strokeWidth={isActive ? 2.2 : 1.8}
                        />
                      ) : null}
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
                    {!item.isCenter && (
                      <span className="text-[10px] font-medium mt-0.5 leading-tight">
                        {item.label}
                      </span>
                    )}
                  </>
                )}
              </NavLink>
            );
          })}
        </div>
      </nav>

      {/* Account Switcher Drawer */}
      <Drawer open={accountSwitcherOpen} onOpenChange={setAccountSwitcherOpen}>
        <DrawerContent className="bg-card border-border">
          <DrawerHeader className="border-b border-border pb-4">
            <DrawerTitle className="text-center">Сменить аккаунт</DrawerTitle>
          </DrawerHeader>
          
          <div className="p-4 space-y-2">
            {accounts.map((account) => (
              <button
                key={account.id}
                onClick={() => handleSwitchAccount(account.id)}
                className={cn(
                  "w-full flex items-center gap-3 p-3 rounded-xl transition-colors",
                  account.isActive 
                    ? "bg-primary/10" 
                    : "hover:bg-muted"
                )}
              >
                <img
                  src={account.avatar}
                  alt={account.displayName}
                  className="w-12 h-12 rounded-full object-cover"
                />
                <div className="flex-1 text-left">
                  <p className="font-medium text-foreground">{account.username}</p>
                  <p className="text-sm text-muted-foreground">{account.displayName}</p>
                </div>
                {account.isActive && (
                  <Check className="w-5 h-5 text-primary" />
                )}
              </button>
            ))}
            
            {/* Add Account Button */}
            <button
              onClick={handleAddAccount}
              className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-muted transition-colors"
            >
              <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center">
                <Plus className="w-6 h-6 text-foreground" />
              </div>
              <p className="font-medium text-foreground">Добавить аккаунт</p>
            </button>
          </div>
          
          {/* Safe area padding */}
          <div className="h-6" />
        </DrawerContent>
      </Drawer>
    </>
  );
});

BottomNav.displayName = "BottomNav";
