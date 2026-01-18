import { X, Moon, Sun, Bell, Lock, HelpCircle, Info, LogOut, ChevronRight, User, Shield, Heart, Archive, Clock, Bookmark } from "lucide-react";
import { useTheme } from "next-themes";
import { cn } from "@/lib/utils";

interface SettingsDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

const settingsGroups = [
  {
    title: "Аккаунт",
    items: [
      { id: "profile", label: "Редактировать профиль", icon: User },
      { id: "saved", label: "Сохранённое", icon: Bookmark },
      { id: "archive", label: "Архив", icon: Archive },
      { id: "activity", label: "Ваша активность", icon: Clock },
    ]
  },
  {
    title: "Настройки",
    items: [
      { id: "notifications", label: "Уведомления", icon: Bell },
      { id: "privacy", label: "Конфиденциальность", icon: Lock },
      { id: "security", label: "Безопасность", icon: Shield },
    ]
  },
  {
    title: "Поддержка",
    items: [
      { id: "help", label: "Помощь", icon: HelpCircle },
      { id: "about", label: "О приложении", icon: Info },
    ]
  },
];

export function SettingsDrawer({ isOpen, onClose }: SettingsDrawerProps) {
  const { theme, setTheme } = useTheme();

  return (
    <>
      {/* Backdrop */}
      <div 
        className={cn(
          "fixed inset-0 z-[80] bg-black/50 backdrop-blur-sm transition-opacity duration-300",
          isOpen ? "opacity-100" : "opacity-0 pointer-events-none"
        )}
        onClick={onClose}
      />
      
      {/* Drawer */}
      <div 
        className={cn(
          "fixed top-0 left-0 bottom-0 z-[81] w-[85%] max-w-[320px] bg-card shadow-2xl transition-transform duration-300 ease-out",
          isOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="flex flex-col h-full safe-area-top safe-area-bottom">
          {/* Header */}
          <div className="flex items-center justify-between px-5 py-4 border-b border-border">
            <h2 className="text-xl font-semibold">Настройки</h2>
            <button 
              onClick={onClose}
              className="w-9 h-9 rounded-full bg-muted flex items-center justify-center"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto native-scroll">
            {/* Theme Toggle */}
            <div className="px-5 py-4 border-b border-border">
              <p className="text-sm text-muted-foreground mb-3">Тема оформления</p>
              <div className="flex gap-2">
                <button
                  onClick={() => setTheme("light")}
                  className={cn(
                    "flex-1 flex items-center justify-center gap-2 py-3 rounded-xl transition-all",
                    theme === "light" 
                      ? "bg-primary text-primary-foreground" 
                      : "bg-muted text-foreground"
                  )}
                >
                  <Sun className="w-5 h-5" />
                  <span className="font-medium">Светлая</span>
                </button>
                <button
                  onClick={() => setTheme("dark")}
                  className={cn(
                    "flex-1 flex items-center justify-center gap-2 py-3 rounded-xl transition-all",
                    theme === "dark" 
                      ? "bg-primary text-primary-foreground" 
                      : "bg-muted text-foreground"
                  )}
                >
                  <Moon className="w-5 h-5" />
                  <span className="font-medium">Тёмная</span>
                </button>
              </div>
            </div>

            {/* Settings Groups */}
            {settingsGroups.map((group) => (
              <div key={group.title} className="border-b border-border">
                <p className="px-5 pt-4 pb-2 text-sm text-muted-foreground">{group.title}</p>
                {group.items.map((item) => {
                  const Icon = item.icon;
                  return (
                    <button
                      key={item.id}
                      className="w-full flex items-center gap-4 px-5 py-3.5 active:bg-muted/50 transition-colors"
                    >
                      <Icon className="w-5 h-5 text-muted-foreground" />
                      <span className="flex-1 text-left">{item.label}</span>
                      <ChevronRight className="w-5 h-5 text-muted-foreground" />
                    </button>
                  );
                })}
              </div>
            ))}
          </div>

          {/* Logout */}
          <div className="px-5 py-4 border-t border-border">
            <button className="w-full flex items-center gap-4 px-4 py-3 rounded-xl bg-destructive/10 text-destructive active:opacity-70 transition-opacity">
              <LogOut className="w-5 h-5" />
              <span className="font-medium">Выйти</span>
            </button>
          </div>
        </div>
      </div>
    </>
  );
}