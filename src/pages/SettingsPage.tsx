import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { X, Moon, Sun, Bell, Lock, HelpCircle, Info, LogOut, ChevronRight, ChevronLeft, User, Shield, Heart, Archive, Clock, Bookmark, Eye, UserX, MessageCircle, AtSign, Share2, Users, Globe, Smartphone, Key, Mail, Phone, Database, Trash2, Download, FileText, AlertCircle, Loader2 } from "lucide-react";
import { useTheme } from "next-themes";
import { cn } from "@/lib/utils";
import { Switch } from "@/components/ui/switch";
import { supabase } from "@/integrations/supabase/client";
import { BrandBackground } from "@/components/ui/brand-background";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

type Screen = "main" | "saved" | "archive" | "activity" | "activity-likes" | "activity-comments" | "activity-reposts" | "activity-time" | "notifications" | "privacy" | "security" | "help" | "about";

interface LikedPost {
  id: string;
  post_id: string;
  created_at: string;
  post?: { content: string | null; author_id: string };
  profile?: { display_name: string | null; avatar_url: string | null };
}

interface UserComment {
  id: string;
  content: string;
  created_at: string;
  post_id: string;
}

// Session time tracking
const SESSION_KEY = "maisoni_session_start";
const TOTAL_TIME_KEY = "maisoni_total_time";

function getSessionTime(): number {
  const start = localStorage.getItem(SESSION_KEY);
  if (!start) {
    localStorage.setItem(SESSION_KEY, Date.now().toString());
    return 0;
  }
  return Date.now() - parseInt(start);
}

function getTotalTime(): number {
  return parseInt(localStorage.getItem(TOTAL_TIME_KEY) || "0") + getSessionTime();
}

function formatDuration(ms: number): string {
  const totalMinutes = Math.floor(ms / 60000);
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  if (hours > 0) return `${hours}ч ${minutes}м`;
  return `${minutes}м`;
}

// Initialize session on load
if (!localStorage.getItem(SESSION_KEY)) {
  localStorage.setItem(SESSION_KEY, Date.now().toString());
}
// Save accumulated time on unload
window.addEventListener("beforeunload", () => {
  const prev = parseInt(localStorage.getItem(TOTAL_TIME_KEY) || "0");
  const session = getSessionTime();
  localStorage.setItem(TOTAL_TIME_KEY, (prev + session).toString());
  localStorage.setItem(SESSION_KEY, Date.now().toString());
});

export function SettingsPage() {
  const navigate = useNavigate();
  const { theme, setTheme } = useTheme();
  const { user } = useAuth();
  const [currentScreen, setCurrentScreen] = useState<Screen>("main");
  const [likedPosts, setLikedPosts] = useState<LikedPost[]>([]);
  const [comments, setComments] = useState<UserComment[]>([]);
  const [loadingData, setLoadingData] = useState(false);
  const [sessionTime, setSessionTime] = useState(formatDuration(getTotalTime()));

  // Update time every minute
  useEffect(() => {
    const interval = setInterval(() => {
      setSessionTime(formatDuration(getTotalTime()));
    }, 60000);
    return () => clearInterval(interval);
  }, []);

  const fetchLikedPosts = useCallback(async () => {
    if (!user) return;
    setLoadingData(true);
    try {
      const { data } = await supabase
        .from("post_likes")
        .select("id, post_id, created_at")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(50);

      if (data && data.length > 0) {
        const postIds = data.map(d => d.post_id);
        const { data: posts } = await supabase
          .from("posts")
          .select("id, content, author_id")
          .in("id", postIds);

        const authorIds = [...new Set((posts || []).map(p => p.author_id))];
        const { data: profiles } = await supabase
          .from("profiles")
          .select("user_id, display_name, avatar_url")
          .in("user_id", authorIds);

        const postsMap = new Map((posts || []).map(p => [p.id, p]));
        const profilesMap = new Map((profiles || []).map(p => [p.user_id, p]));

        setLikedPosts(data.map(d => {
          const post = postsMap.get(d.post_id);
          return {
            ...d,
            post: post ? { content: post.content, author_id: post.author_id } : undefined,
            profile: post ? profilesMap.get(post.author_id) || undefined : undefined,
          };
        }));
      } else {
        setLikedPosts([]);
      }
    } catch (e) {
      console.error("Error fetching likes:", e);
    } finally {
      setLoadingData(false);
    }
  }, [user]);

  const fetchComments = useCallback(async () => {
    if (!user) return;
    setLoadingData(true);
    try {
      const { data } = await supabase
        .from("comments")
        .select("id, content, created_at, post_id")
        .eq("author_id", user.id)
        .order("created_at", { ascending: false })
        .limit(50);
      setComments(data || []);
    } catch (e) {
      console.error("Error fetching comments:", e);
    } finally {
      setLoadingData(false);
    }
  }, [user]);

  const handleDownloadData = useCallback(async () => {
    if (!user) return;
    setLoadingData(true);
    try {
      const [profileRes, postsRes, commentsRes, likesRes] = await Promise.all([
        supabase.from("profiles").select("*").eq("user_id", user.id).maybeSingle(),
        supabase.from("posts").select("id, content, created_at, likes_count, comments_count").eq("author_id", user.id),
        supabase.from("comments").select("id, content, created_at, post_id").eq("author_id", user.id),
        supabase.from("post_likes").select("post_id, created_at").eq("user_id", user.id),
      ]);

      const exportData = {
        exported_at: new Date().toISOString(),
        profile: profileRes.data,
        posts: postsRes.data || [],
        comments: commentsRes.data || [],
        likes: likesRes.data || [],
      };

      const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `maisoni-data-${new Date().toISOString().slice(0, 10)}.json`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success("Данные скачаны");
    } catch (e) {
      console.error("Error downloading data:", e);
      toast.error("Ошибка при скачивании данных");
    } finally {
      setLoadingData(false);
    }
  }, [user]);

  useEffect(() => {
    if (currentScreen === "activity-likes") fetchLikedPosts();
    if (currentScreen === "activity-comments") fetchComments();
  }, [currentScreen, fetchLikedPosts, fetchComments]);

  const handleBack = () => {
    if (currentScreen === "main") {
      navigate(-1);
    } else if (currentScreen.startsWith("activity-")) {
      setCurrentScreen("activity");
    } else {
      setCurrentScreen("main");
    }
  };

  const handleLogout = async () => {
    const prev = parseInt(localStorage.getItem(TOTAL_TIME_KEY) || "0");
    localStorage.setItem(TOTAL_TIME_KEY, (prev + getSessionTime()).toString());
    localStorage.setItem(SESSION_KEY, Date.now().toString());
    await supabase.auth.signOut();
    navigate('/auth');
  };

  const renderHeader = (title: string, showBack: boolean = true) => (
    <div className="flex items-center gap-3 px-5 py-4">
      {showBack && (
        <button 
          onClick={handleBack}
          className="w-10 h-10 rounded-full bg-white/10 backdrop-blur-xl border border-white/20 flex items-center justify-center hover:bg-white/20 transition-colors"
        >
          <ChevronLeft className="w-5 h-5 text-white" />
        </button>
      )}
      <h2 className="text-xl font-semibold flex-1 text-white">{title}</h2>
      {currentScreen === "main" && (
        <button 
          onClick={() => navigate(-1)}
          className="w-10 h-10 rounded-full bg-white/10 backdrop-blur-xl border border-white/20 flex items-center justify-center hover:bg-white/20 transition-colors"
        >
          <X className="w-5 h-5 text-white" />
        </button>
      )}
    </div>
  );

  const renderMenuItem = (icon: React.ReactNode, label: string, onClick?: () => void, value?: string) => (
    <button
      onClick={onClick}
      className="w-full flex items-center gap-4 px-5 py-3.5 hover:bg-white/5 active:bg-white/10 transition-colors"
    >
      {icon}
      <span className="flex-1 text-left text-white">{label}</span>
      {value && <span className="text-sm text-white/60">{value}</span>}
      <ChevronRight className="w-5 h-5 text-white/40" />
    </button>
  );

  const renderToggleItem = (icon: React.ReactNode, label: string, description: string, checked: boolean, onCheckedChange: (val: boolean) => void) => (
    <div className="flex items-start gap-4 px-5 py-3.5">
      <div className="mt-0.5">{icon}</div>
      <div className="flex-1">
        <p className="font-medium text-white">{label}</p>
        <p className="text-sm text-white/60">{description}</p>
      </div>
      <Switch checked={checked} onCheckedChange={onCheckedChange} />
    </div>
  );

  const renderLoading = () => (
    <div className="flex items-center justify-center py-12">
      <Loader2 className="w-6 h-6 animate-spin text-white/60" />
    </div>
  );

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString("ru-RU", { day: "numeric", month: "short", year: "numeric" });
  };

  const renderScreen = () => {
    switch (currentScreen) {
      case "saved":
        return (
          <>
            {renderHeader("Сохранённое")}
            <div className="flex-1 overflow-y-auto native-scroll">
              <div className="mx-4 bg-white/10 backdrop-blur-xl rounded-2xl border border-white/20 overflow-hidden">
                {renderMenuItem(<Bookmark className="w-5 h-5 text-white/60" />, "Все публикации", () => navigate("/profile?tab=saved"))}
                {renderMenuItem(<Heart className="w-5 h-5 text-white/60" />, "Понравившиеся", () => setCurrentScreen("activity-likes"))}
              </div>
              <p className="p-5 text-center text-white/60 text-sm">
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
              <div className="mx-4 bg-white/10 backdrop-blur-xl rounded-2xl border border-white/20 overflow-hidden">
                {renderMenuItem(<Archive className="w-5 h-5 text-white/60" />, "Архив историй")}
                {renderMenuItem(<Archive className="w-5 h-5 text-white/60" />, "Архив публикаций")}
                {renderMenuItem(<Archive className="w-5 h-5 text-white/60" />, "Архив прямых эфиров")}
              </div>
            </div>
          </>
        );

      case "activity":
        return (
          <>
            {renderHeader("Ваша активность")}
            <div className="flex-1 overflow-y-auto native-scroll">
              <div className="mx-4 bg-white/10 backdrop-blur-xl rounded-2xl border border-white/20 overflow-hidden">
                {renderMenuItem(<Clock className="w-5 h-5 text-white/60" />, "Время в приложении", () => setCurrentScreen("activity-time"), sessionTime)}
                {renderMenuItem(<Heart className="w-5 h-5 text-white/60" />, "Лайки", () => setCurrentScreen("activity-likes"))}
                {renderMenuItem(<MessageCircle className="w-5 h-5 text-white/60" />, "Комментарии", () => setCurrentScreen("activity-comments"))}
                {renderMenuItem(<Share2 className="w-5 h-5 text-white/60" />, "Репосты", () => setCurrentScreen("activity-reposts"))}
                {renderMenuItem(<Download className="w-5 h-5 text-white/60" />, "Скачать данные", () => handleDownloadData())}
              </div>
            </div>
          </>
        );

      case "activity-time":
        return (
          <>
            {renderHeader("Время в приложении")}
            <div className="flex-1 overflow-y-auto native-scroll">
              <div className="mx-4 mt-4 flex flex-col items-center">
                <div className="w-32 h-32 rounded-full bg-white/10 backdrop-blur-xl border border-white/20 flex items-center justify-center mb-6">
                  <div className="text-center">
                    <Clock className="w-8 h-8 text-white/60 mx-auto mb-2" />
                    <span className="text-2xl font-bold text-white">{sessionTime}</span>
                  </div>
                </div>
                <p className="text-white/60 text-sm text-center px-8">
                  Общее время, проведённое в приложении за все сессии
                </p>
              </div>
              <div className="mx-4 mt-6 bg-white/10 backdrop-blur-xl rounded-2xl border border-white/20 overflow-hidden">
                <div className="px-5 py-3.5">
                  <p className="text-white font-medium">Текущая сессия</p>
                  <p className="text-white/60 text-sm">{formatDuration(getSessionTime())}</p>
                </div>
              </div>
            </div>
          </>
        );

      case "activity-likes":
        return (
          <>
            {renderHeader("Лайки")}
            <div className="flex-1 overflow-y-auto native-scroll">
              {loadingData ? renderLoading() : likedPosts.length === 0 ? (
                <div className="px-8 py-12 text-center">
                  <Heart className="w-12 h-12 text-white/20 mx-auto mb-3" />
                  <p className="text-white/60">У вас пока нет лайков</p>
                </div>
              ) : (
                <div className="mx-4 bg-white/10 backdrop-blur-xl rounded-2xl border border-white/20 overflow-hidden divide-y divide-white/10">
                  {likedPosts.map((like) => (
                    <button
                      key={like.id}
                      onClick={() => navigate(`/post/${like.post_id}`)}
                      className="w-full flex items-start gap-3 px-5 py-3.5 hover:bg-white/5 transition-colors text-left"
                    >
                      <Heart className="w-5 h-5 text-red-400 mt-0.5 shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-white text-sm font-medium truncate">
                          {like.profile?.display_name || "Пользователь"}
                        </p>
                        <p className="text-white/60 text-xs truncate">
                          {like.post?.content?.slice(0, 80) || "Публикация"}
                        </p>
                        <p className="text-white/40 text-xs mt-1">{formatDate(like.created_at)}</p>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </>
        );

      case "activity-comments":
        return (
          <>
            {renderHeader("Комментарии")}
            <div className="flex-1 overflow-y-auto native-scroll">
              {loadingData ? renderLoading() : comments.length === 0 ? (
                <div className="px-8 py-12 text-center">
                  <MessageCircle className="w-12 h-12 text-white/20 mx-auto mb-3" />
                  <p className="text-white/60">У вас пока нет комментариев</p>
                </div>
              ) : (
                <div className="mx-4 bg-white/10 backdrop-blur-xl rounded-2xl border border-white/20 overflow-hidden divide-y divide-white/10">
                  {comments.map((comment) => (
                    <button
                      key={comment.id}
                      onClick={() => navigate(`/post/${comment.post_id}`)}
                      className="w-full flex items-start gap-3 px-5 py-3.5 hover:bg-white/5 transition-colors text-left"
                    >
                      <MessageCircle className="w-5 h-5 text-white/60 mt-0.5 shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-white text-sm truncate">{comment.content}</p>
                        <p className="text-white/40 text-xs mt-1">{formatDate(comment.created_at)}</p>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </>
        );

      case "activity-reposts":
        return (
          <>
            {renderHeader("Репосты")}
            <div className="flex-1 overflow-y-auto native-scroll">
              <div className="px-8 py-12 text-center">
                <Share2 className="w-12 h-12 text-white/20 mx-auto mb-3" />
                <p className="text-white/60">У вас пока нет репостов</p>
              </div>
            </div>
          </>
        );

      case "notifications":
        return (
          <>
            {renderHeader("Уведомления")}
            <div className="flex-1 overflow-y-auto native-scroll">
              <div className="mx-4 bg-white/10 backdrop-blur-xl rounded-2xl border border-white/20 overflow-hidden">
                {renderToggleItem(
                  <Bell className="w-5 h-5 text-white/60" />,
                  "Push-уведомления",
                  "Получать уведомления на устройство",
                  true,
                  () => {}
                )}
                {renderToggleItem(
                  <Heart className="w-5 h-5 text-white/60" />,
                  "Лайки",
                  "Уведомлять о новых лайках",
                  true,
                  () => {}
                )}
                {renderToggleItem(
                  <MessageCircle className="w-5 h-5 text-white/60" />,
                  "Комментарии",
                  "Уведомлять о новых комментариях",
                  true,
                  () => {}
                )}
                {renderToggleItem(
                  <Users className="w-5 h-5 text-white/60" />,
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
              <div className="mx-4 bg-white/10 backdrop-blur-xl rounded-2xl border border-white/20 overflow-hidden">
                {renderToggleItem(
                  <Lock className="w-5 h-5 text-white/60" />,
                  "Закрытый аккаунт",
                  "Только подписчики видят ваши публикации",
                  false,
                  () => {}
                )}
                {renderToggleItem(
                  <Eye className="w-5 h-5 text-white/60" />,
                  "Статус активности",
                  "Показывать когда вы были онлайн",
                  true,
                  () => {}
                )}
              </div>
              <div className="mx-4 mt-3 bg-white/10 backdrop-blur-xl rounded-2xl border border-white/20 overflow-hidden">
                {renderMenuItem(<Users className="w-5 h-5 text-white/60" />, "Близкие друзья")}
                {renderMenuItem(<UserX className="w-5 h-5 text-white/60" />, "Заблокированные")}
                {renderMenuItem(<MessageCircle className="w-5 h-5 text-white/60" />, "Управление сообщениями")}
              </div>
            </div>
          </>
        );

      case "security":
        return (
          <>
            {renderHeader("Безопасность")}
            <div className="flex-1 overflow-y-auto native-scroll">
              <div className="mx-4 bg-white/10 backdrop-blur-xl rounded-2xl border border-white/20 overflow-hidden">
                {renderMenuItem(<Key className="w-5 h-5 text-white/60" />, "Пароль", undefined, "Изменить")}
                {renderToggleItem(
                  <Shield className="w-5 h-5 text-white/60" />,
                  "Двухфакторная аутентификация",
                  "Дополнительная защита аккаунта",
                  false,
                  () => {}
                )}
              </div>
              <div className="mx-4 mt-3 bg-white/10 backdrop-blur-xl rounded-2xl border border-white/20 overflow-hidden">
                {renderMenuItem(<Smartphone className="w-5 h-5 text-white/60" />, "Активные сеансы")}
                {renderMenuItem(<Mail className="w-5 h-5 text-white/60" />, "Письма от нас")}
                {renderMenuItem(<Database className="w-5 h-5 text-white/60" />, "Данные аккаунта")}
              </div>
            </div>
          </>
        );

      case "help":
        return (
          <>
            {renderHeader("Помощь")}
            <div className="flex-1 overflow-y-auto native-scroll">
              <div className="mx-4 bg-white/10 backdrop-blur-xl rounded-2xl border border-white/20 overflow-hidden">
                {renderMenuItem(<HelpCircle className="w-5 h-5 text-white/60" />, "Справочный центр")}
                {renderMenuItem(<AlertCircle className="w-5 h-5 text-white/60" />, "Сообщить о проблеме")}
                {renderMenuItem(<FileText className="w-5 h-5 text-white/60" />, "Условия использования")}
                {renderMenuItem(<Lock className="w-5 h-5 text-white/60" />, "Политика конфиденциальности")}
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
                <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-violet-500 to-fuchsia-500 flex items-center justify-center mb-4 shadow-lg">
                  <span className="text-3xl text-white font-bold">M</span>
                </div>
                <h3 className="text-xl font-semibold text-white">Maisoni</h3>
                <p className="text-sm text-white/60">Версия 1.0.0</p>
              </div>
              <div className="mx-4 bg-white/10 backdrop-blur-xl rounded-2xl border border-white/20 overflow-hidden">
                {renderMenuItem(<FileText className="w-5 h-5 text-white/60" />, "Лицензии открытого ПО")}
                {renderMenuItem(<Info className="w-5 h-5 text-white/60" />, "Информация о разработчике")}
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
                <p className="text-sm text-white/60 mb-3 px-1">Тема оформления</p>
                <div className="flex gap-2">
                  <button
                    onClick={() => setTheme("light")}
                    className={cn(
                      "flex-1 flex items-center justify-center gap-2 py-3 rounded-xl transition-all border",
                      theme === "light" 
                        ? "bg-white/20 border-white/40 text-white" 
                        : "bg-white/5 border-white/10 text-white/70"
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
                        ? "bg-white/20 border-white/40 text-white" 
                        : "bg-white/5 border-white/10 text-white/70"
                    )}
                  >
                    <Moon className="w-5 h-5" />
                    <span className="font-medium">Тёмная</span>
                  </button>
                </div>
              </div>

              {/* Account */}
              <div className="px-4 mb-3">
                <p className="text-sm text-white/60 mb-2 px-1">Аккаунт</p>
                <div className="bg-white/10 backdrop-blur-xl rounded-2xl border border-white/20 overflow-hidden">
                  {renderMenuItem(<Bookmark className="w-5 h-5 text-white/60" />, "Сохранённое", () => navigate("/profile?tab=saved"))}
                  {renderMenuItem(<Archive className="w-5 h-5 text-white/60" />, "Архив", () => setCurrentScreen("archive"))}
                  {renderMenuItem(<Clock className="w-5 h-5 text-white/60" />, "Ваша активность", () => setCurrentScreen("activity"))}
                </div>
              </div>

              {/* Settings */}
              <div className="px-4 mb-3">
                <p className="text-sm text-white/60 mb-2 px-1">Настройки</p>
                <div className="bg-white/10 backdrop-blur-xl rounded-2xl border border-white/20 overflow-hidden">
                  {renderMenuItem(<Bell className="w-5 h-5 text-white/60" />, "Уведомления", () => setCurrentScreen("notifications"))}
                  {renderMenuItem(<Lock className="w-5 h-5 text-white/60" />, "Конфиденциальность", () => setCurrentScreen("privacy"))}
                  {renderMenuItem(<Shield className="w-5 h-5 text-white/60" />, "Безопасность", () => setCurrentScreen("security"))}
                </div>
              </div>

              {/* Support */}
              <div className="px-4 mb-3">
                <p className="text-sm text-white/60 mb-2 px-1">Поддержка</p>
                <div className="bg-white/10 backdrop-blur-xl rounded-2xl border border-white/20 overflow-hidden">
                  {renderMenuItem(<HelpCircle className="w-5 h-5 text-white/60" />, "Помощь", () => setCurrentScreen("help"))}
                  {renderMenuItem(<Info className="w-5 h-5 text-white/60" />, "О приложении", () => setCurrentScreen("about"))}
                </div>
              </div>

              {/* Logout */}
              <div className="px-4 mt-6 pb-24">
                <button 
                  onClick={handleLogout}
                  className="w-full flex items-center justify-center gap-3 px-4 py-3.5 rounded-2xl bg-red-500/20 border border-red-500/30 text-red-400 hover:bg-red-500/30 transition-colors"
                >
                  <LogOut className="w-5 h-5" />
                  <span className="font-medium">Выйти</span>
                </button>
              </div>
            </div>
          </>
        );
    }
  };

  return (
    <div className="h-[100dvh] relative overflow-hidden">
      <BrandBackground />

      {/* Content */}
      <div className="relative z-10 h-full flex flex-col safe-area-top safe-area-bottom">
        {renderScreen()}
      </div>
    </div>
  );
}