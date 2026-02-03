import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { X, Moon, Sun, Bell, Lock, HelpCircle, Info, LogOut, ChevronRight, ChevronLeft, User, Shield, Heart, Archive, Clock, Bookmark, Eye, UserX, MessageCircle, AtSign, Share2, Users, Globe, Smartphone, Key, Mail, Phone, Database, Trash2, Download, FileText, AlertCircle } from "lucide-react";
import { useTheme } from "next-themes";
import { cn } from "@/lib/utils";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { SubtleGradientBackground } from "@/components/layout/SubtleGradientBackground";
import { supabase } from "@/integrations/supabase/client";

type Screen = "main" | "saved" | "archive" | "activity" | "notifications" | "privacy" | "security" | "help" | "about";

export function SettingsPage() {
  const navigate = useNavigate();
  const { theme, setTheme } = useTheme();
  const [currentScreen, setCurrentScreen] = useState<Screen>("main");

  const handleBack = () => {
    if (currentScreen === "main") {
      navigate(-1);
    } else {
      setCurrentScreen("main");
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/auth');
  };

  const renderHeader = (title: string, showBack: boolean = true) => (
    <div className="flex items-center gap-3 px-5 py-4">
      {showBack && (
        <button 
          onClick={handleBack}
          className="w-10 h-10 rounded-full bg-muted hover:bg-muted/80 flex items-center justify-center transition-colors"
        >
          <ChevronLeft className="w-5 h-5 text-foreground" />
        </button>
      )}
      <h2 className="text-xl font-semibold flex-1 text-foreground">{title}</h2>
      {currentScreen === "main" && (
        <button 
          onClick={() => navigate(-1)}
          className="w-10 h-10 rounded-full bg-muted hover:bg-muted/80 flex items-center justify-center transition-colors"
        >
          <X className="w-5 h-5 text-foreground" />
        </button>
      )}
    </div>
  );

  const renderMenuItem = (icon: React.ReactNode, label: string, onClick?: () => void, value?: string) => (
    <button
      onClick={onClick}
      className="w-full flex items-center gap-4 px-5 py-3.5 hover:bg-muted/50 active:bg-muted transition-colors"
    >
      {icon}
      <span className="flex-1 text-left text-foreground">{label}</span>
      {value && <span className="text-sm text-muted-foreground">{value}</span>}
      <ChevronRight className="w-5 h-5 text-muted-foreground" />
    </button>
  );

  const renderToggleItem = (icon: React.ReactNode, label: string, description: string, checked: boolean, onCheckedChange: (val: boolean) => void) => (
    <div className="flex items-start gap-4 px-5 py-3.5">
      <div className="mt-0.5">{icon}</div>
      <div className="flex-1">
        <p className="font-medium text-foreground">{label}</p>
        <p className="text-sm text-muted-foreground">{description}</p>
      </div>
      <Switch checked={checked} onCheckedChange={onCheckedChange} />
    </div>
  );

  const renderScreen = () => {
    switch (currentScreen) {
      case "saved":
        return (
          <>
            {renderHeader("Сохранённое")}
            <div className="flex-1 overflow-y-auto native-scroll">
              <div className="mx-4 bg-card rounded-2xl border border-border overflow-hidden">
                {renderMenuItem(<Bookmark className="w-5 h-5 text-muted-foreground" />, "Все публикации")}
                {renderMenuItem(<Heart className="w-5 h-5 text-muted-foreground" />, "Понравившиеся")}
              </div>
              <p className="p-5 text-center text-muted-foreground text-sm">
                Создавайте коллекции для сохранённых публикаций
              </p>
            </div>
          </>
        );

      case "archive":
        return (
          <>
            {renderHeader("Архив")}
            <div className="flex-1 overflow-y-auto native-scroll">
              <div className="mx-4 bg-card rounded-2xl border border-border overflow-hidden">
                {renderMenuItem(<Archive className="w-5 h-5 text-muted-foreground" />, "Архив историй")}
                {renderMenuItem(<Archive className="w-5 h-5 text-muted-foreground" />, "Архив публикаций")}
                {renderMenuItem(<Archive className="w-5 h-5 text-muted-foreground" />, "Архив прямых эфиров")}
              </div>
            </div>
          </>
        );

      case "activity":
        return (
          <>
            {renderHeader("Ваша активность")}
            <div className="flex-1 overflow-y-auto native-scroll">
              <div className="mx-4 bg-card rounded-2xl border border-border overflow-hidden">
                {renderMenuItem(<Clock className="w-5 h-5 text-muted-foreground" />, "Время в приложении", undefined, "1ч 23м")}
                {renderMenuItem(<Heart className="w-5 h-5 text-muted-foreground" />, "Лайки")}
                {renderMenuItem(<MessageCircle className="w-5 h-5 text-muted-foreground" />, "Комментарии")}
                {renderMenuItem(<Share2 className="w-5 h-5 text-muted-foreground" />, "Репосты")}
                {renderMenuItem(<Download className="w-5 h-5 text-muted-foreground" />, "Скачать данные")}
              </div>
            </div>
          </>
        );

      case "notifications":
        return (
          <>
            {renderHeader("Уведомления")}
            <div className="flex-1 overflow-y-auto native-scroll">
              <div className="mx-4 bg-card rounded-2xl border border-border overflow-hidden">
                {renderToggleItem(
                  <Bell className="w-5 h-5 text-muted-foreground" />,
                  "Push-уведомления",
                  "Получать уведомления на устройство",
                  true,
                  () => {}
                )}
                {renderToggleItem(
                  <Heart className="w-5 h-5 text-muted-foreground" />,
                  "Лайки",
                  "Уведомлять о новых лайках",
                  true,
                  () => {}
                )}
                {renderToggleItem(
                  <MessageCircle className="w-5 h-5 text-muted-foreground" />,
                  "Комментарии",
                  "Уведомлять о новых комментариях",
                  true,
                  () => {}
                )}
                {renderToggleItem(
                  <Users className="w-5 h-5 text-muted-foreground" />,
                  "Подписчики",
                  "Уведомлять о новых подписчиках",
                  true,
                  () => {}
                )}
              </div>
            </div>
          </>
        );

      case "privacy":
        return (
          <>
            {renderHeader("Конфиденциальность")}
            <div className="flex-1 overflow-y-auto native-scroll">
              <div className="mx-4 bg-card rounded-2xl border border-border overflow-hidden">
                {renderToggleItem(
                  <Lock className="w-5 h-5 text-muted-foreground" />,
                  "Закрытый аккаунт",
                  "Только подписчики видят ваши публикации",
                  false,
                  () => {}
                )}
                {renderToggleItem(
                  <Eye className="w-5 h-5 text-muted-foreground" />,
                  "Статус активности",
                  "Показывать когда вы были онлайн",
                  true,
                  () => {}
                )}
              </div>
              <div className="mx-4 mt-3 bg-card rounded-2xl border border-border overflow-hidden">
                {renderMenuItem(<Users className="w-5 h-5 text-muted-foreground" />, "Близкие друзья")}
                {renderMenuItem(<UserX className="w-5 h-5 text-muted-foreground" />, "Заблокированные")}
                {renderMenuItem(<MessageCircle className="w-5 h-5 text-muted-foreground" />, "Управление сообщениями")}
              </div>
            </div>
          </>
        );

      case "security":
        return (
          <>
            {renderHeader("Безопасность")}
            <div className="flex-1 overflow-y-auto native-scroll">
              <div className="mx-4 bg-card rounded-2xl border border-border overflow-hidden">
                {renderMenuItem(<Key className="w-5 h-5 text-muted-foreground" />, "Пароль", undefined, "Изменить")}
                {renderToggleItem(
                  <Shield className="w-5 h-5 text-muted-foreground" />,
                  "Двухфакторная аутентификация",
                  "Дополнительная защита аккаунта",
                  false,
                  () => {}
                )}
              </div>
              <div className="mx-4 mt-3 bg-card rounded-2xl border border-border overflow-hidden">
                {renderMenuItem(<Smartphone className="w-5 h-5 text-muted-foreground" />, "Активные сеансы")}
                {renderMenuItem(<Mail className="w-5 h-5 text-muted-foreground" />, "Письма от нас")}
                {renderMenuItem(<Database className="w-5 h-5 text-muted-foreground" />, "Данные аккаунта")}
              </div>
            </div>
          </>
        );

      case "help":
        return (
          <>
            {renderHeader("Помощь")}
            <div className="flex-1 overflow-y-auto native-scroll">
              <div className="mx-4 bg-card rounded-2xl border border-border overflow-hidden">
                {renderMenuItem(<HelpCircle className="w-5 h-5 text-muted-foreground" />, "Справочный центр")}
                {renderMenuItem(<AlertCircle className="w-5 h-5 text-muted-foreground" />, "Сообщить о проблеме")}
                {renderMenuItem(<FileText className="w-5 h-5 text-muted-foreground" />, "Условия использования")}
                {renderMenuItem(<Lock className="w-5 h-5 text-muted-foreground" />, "Политика конфиденциальности")}
              </div>
            </div>
          </>
        );

      case "about":
        return (
          <>
            {renderHeader("О приложении")}
            <div className="flex-1 overflow-y-auto native-scroll">
              <div className="p-8 flex flex-col items-center">
                <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center mb-4 shadow-lg">
                  <span className="text-3xl text-primary-foreground font-bold">M</span>
                </div>
                <h3 className="text-xl font-semibold text-foreground">Mansoni</h3>
                <p className="text-sm text-muted-foreground">Версия 1.0.0</p>
              </div>
              <div className="mx-4 bg-card rounded-2xl border border-border overflow-hidden">
                {renderMenuItem(<FileText className="w-5 h-5 text-muted-foreground" />, "Лицензии открытого ПО")}
                {renderMenuItem(<Info className="w-5 h-5 text-muted-foreground" />, "Информация о разработчике")}
              </div>
            </div>
          </>
        );

      default:
        return (
          <>
            {renderHeader("Настройки", false)}

            <div className="flex-1 overflow-y-auto native-scroll pb-8">
              {/* Theme Toggle */}
              <div className="px-4 py-4">
                <p className="text-sm text-muted-foreground mb-3 px-1">Тема оформления</p>
                <div className="flex gap-2">
                  <button
                    onClick={() => setTheme("light")}
                    className={cn(
                      "flex-1 flex items-center justify-center gap-2 py-3 rounded-xl transition-all border",
                      theme === "light" 
                        ? "bg-primary text-primary-foreground border-primary" 
                        : "bg-muted border-border text-muted-foreground"
                    )}
                  >
                    <Sun className="w-5 h-5" />
                    <span className="font-medium">Светлая</span>
                  </button>
                  <button
                    onClick={() => setTheme("dark")}
                    className={cn(
                      "flex-1 flex items-center justify-center gap-2 py-3 rounded-xl transition-all border",
                      theme === "dark" 
                        ? "bg-primary text-primary-foreground border-primary" 
                        : "bg-muted border-border text-muted-foreground"
                    )}
                  >
                    <Moon className="w-5 h-5" />
                    <span className="font-medium">Тёмная</span>
                  </button>
                </div>
              </div>

              {/* Account */}
              <div className="px-4 mb-3">
                <p className="text-sm text-muted-foreground mb-2 px-1">Аккаунт</p>
                <div className="bg-card rounded-2xl border border-border overflow-hidden">
                  {renderMenuItem(<Bookmark className="w-5 h-5 text-muted-foreground" />, "Сохранённое", () => setCurrentScreen("saved"))}
                  {renderMenuItem(<Archive className="w-5 h-5 text-muted-foreground" />, "Архив", () => setCurrentScreen("archive"))}
                  {renderMenuItem(<Clock className="w-5 h-5 text-muted-foreground" />, "Ваша активность", () => setCurrentScreen("activity"))}
                </div>
              </div>

              {/* Settings */}
              <div className="px-4 mb-3">
                <p className="text-sm text-muted-foreground mb-2 px-1">Настройки</p>
                <div className="bg-card rounded-2xl border border-border overflow-hidden">
                  {renderMenuItem(<Bell className="w-5 h-5 text-muted-foreground" />, "Уведомления", () => setCurrentScreen("notifications"))}
                  {renderMenuItem(<Lock className="w-5 h-5 text-muted-foreground" />, "Конфиденциальность", () => setCurrentScreen("privacy"))}
                  {renderMenuItem(<Shield className="w-5 h-5 text-muted-foreground" />, "Безопасность", () => setCurrentScreen("security"))}
                </div>
              </div>

              {/* Support */}
              <div className="px-4 mb-3">
                <p className="text-sm text-muted-foreground mb-2 px-1">Поддержка</p>
                <div className="bg-card rounded-2xl border border-border overflow-hidden">
                  {renderMenuItem(<HelpCircle className="w-5 h-5 text-muted-foreground" />, "Помощь", () => setCurrentScreen("help"))}
                  {renderMenuItem(<Info className="w-5 h-5 text-muted-foreground" />, "О приложении", () => setCurrentScreen("about"))}
                </div>
              </div>

              {/* Logout */}
              <div className="px-4 mt-6">
                <Button 
                  variant="destructive"
                  onClick={handleLogout}
                  className="w-full gap-3"
                >
                  <LogOut className="w-5 h-5" />
                  <span className="font-medium">Выйти</span>
                </Button>
              </div>
            </div>
          </>
        );
    }
  };

  return (
    <div className="min-h-screen relative overflow-hidden">
      <SubtleGradientBackground />

      {/* Content */}
      <div className="relative z-10 min-h-screen flex flex-col safe-area-top safe-area-bottom">
        {renderScreen()}
      </div>
    </div>
  );
}
