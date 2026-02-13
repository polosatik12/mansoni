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

type Screen =
  | "main" | "saved" | "archive" | "activity" | "notifications" | "privacy" | "security" | "help" | "about"
  | "activity-likes" | "activity-comments" | "activity-reposts" | "activity-time"
  | "archive-stories" | "archive-posts" | "archive-lives"
  | "close-friends" | "blocked-users" | "message-settings"
  | "change-password" | "active-sessions" | "email-settings" | "account-data"
  | "help-center" | "report-problem" | "terms" | "privacy-policy"
  | "licenses" | "developer-info";

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

interface BlockedUser {
  id: string;
  blocked_id: string;
  profile?: { display_name: string | null; avatar_url: string | null };
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

if (!localStorage.getItem(SESSION_KEY)) {
  localStorage.setItem(SESSION_KEY, Date.now().toString());
}
window.addEventListener("beforeunload", () => {
  const prev = parseInt(localStorage.getItem(TOTAL_TIME_KEY) || "0");
  const session = getSessionTime();
  localStorage.setItem(TOTAL_TIME_KEY, (prev + session).toString());
  localStorage.setItem(SESSION_KEY, Date.now().toString());
});

const PARENT_MAP: Record<string, Screen> = {
  "activity-likes": "activity",
  "activity-comments": "activity",
  "activity-reposts": "activity",
  "activity-time": "activity",
  "archive-stories": "archive",
  "archive-posts": "archive",
  "archive-lives": "archive",
  "close-friends": "privacy",
  "blocked-users": "privacy",
  "message-settings": "privacy",
  "change-password": "security",
  "active-sessions": "security",
  "email-settings": "security",
  "account-data": "security",
  "help-center": "help",
  "report-problem": "help",
  "terms": "help",
  "privacy-policy": "help",
  "licenses": "about",
  "developer-info": "about",
};

export function SettingsPage() {
  const navigate = useNavigate();
  const { theme, setTheme } = useTheme();
  const { user } = useAuth();
  const [currentScreen, setCurrentScreen] = useState<Screen>("main");
  const [likedPosts, setLikedPosts] = useState<LikedPost[]>([]);
  const [comments, setComments] = useState<UserComment[]>([]);
  const [blockedUsers, setBlockedUsers] = useState<BlockedUser[]>([]);
  const [loadingData, setLoadingData] = useState(false);
  const [sessionTime, setSessionTime] = useState(formatDuration(getTotalTime()));

  // Toggle states
  const [pushEnabled, setPushEnabled] = useState(true);
  const [likesNotif, setLikesNotif] = useState(true);
  const [commentsNotif, setCommentsNotif] = useState(true);
  const [followersNotif, setFollowersNotif] = useState(true);
  const [privateAccount, setPrivateAccount] = useState(false);
  const [activityStatus, setActivityStatus] = useState(true);
  const [twoFactor, setTwoFactor] = useState(false);
  const [emailNotifs, setEmailNotifs] = useState(true);
  const [promoEmails, setPromoEmails] = useState(false);
  const [messagePrivacy, setMessagePrivacy] = useState<"all" | "followers" | "none">("all");

  // Password
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [savingPassword, setSavingPassword] = useState(false);

  // Report
  const [reportText, setReportText] = useState("");

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
        const { data: posts } = await supabase.from("posts").select("id, content, author_id").in("id", postIds);
        const authorIds = [...new Set((posts || []).map(p => p.author_id))];
        const { data: profiles } = await supabase.from("profiles").select("user_id, display_name, avatar_url").in("user_id", authorIds);
        const postsMap = new Map((posts || []).map(p => [p.id, p]));
        const profilesMap = new Map((profiles || []).map(p => [p.user_id, p]));
        setLikedPosts(data.map(d => {
          const post = postsMap.get(d.post_id);
          return { ...d, post: post ? { content: post.content, author_id: post.author_id } : undefined, profile: post ? profilesMap.get(post.author_id) || undefined : undefined };
        }));
      } else {
        setLikedPosts([]);
      }
    } catch (e) { console.error("Error fetching likes:", e); }
    finally { setLoadingData(false); }
  }, [user]);

  const fetchComments = useCallback(async () => {
    if (!user) return;
    setLoadingData(true);
    try {
      const { data } = await supabase.from("comments").select("id, content, created_at, post_id").eq("author_id", user.id).order("created_at", { ascending: false }).limit(50);
      setComments(data || []);
    } catch (e) { console.error("Error fetching comments:", e); }
    finally { setLoadingData(false); }
  }, [user]);

  const fetchBlockedUsers = useCallback(async () => {
    if (!user) return;
    setLoadingData(true);
    try {
      const { data } = await supabase.from("blocked_users").select("id, blocked_id").eq("blocker_id", user.id);
      if (data && data.length > 0) {
        const ids = data.map(d => d.blocked_id);
        const { data: profiles } = await supabase.from("profiles").select("user_id, display_name, avatar_url").in("user_id", ids);
        const map = new Map((profiles || []).map(p => [p.user_id, p]));
        setBlockedUsers(data.map(d => ({ ...d, profile: map.get(d.blocked_id) || undefined })));
      } else {
        setBlockedUsers([]);
      }
    } catch (e) { console.error("Error fetching blocked users:", e); }
    finally { setLoadingData(false); }
  }, [user]);

  const handleUnblock = async (blockedId: string) => {
    if (!user) return;
    await supabase.from("blocked_users").delete().eq("blocker_id", user.id).eq("blocked_id", blockedId);
    setBlockedUsers(prev => prev.filter(b => b.blocked_id !== blockedId));
    toast.success("Пользователь разблокирован");
  };

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
      const blob = new Blob([JSON.stringify({ exported_at: new Date().toISOString(), profile: profileRes.data, posts: postsRes.data || [], comments: commentsRes.data || [], likes: likesRes.data || [] }, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `maisoni-data-${new Date().toISOString().slice(0, 10)}.json`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success("Данные скачаны");
    } catch (e) { toast.error("Ошибка при скачивании данных"); }
    finally { setLoadingData(false); }
  }, [user]);

  const handleChangePassword = async () => {
    if (newPassword.length < 6) { toast.error("Пароль должен быть не менее 6 символов"); return; }
    if (newPassword !== confirmPassword) { toast.error("Пароли не совпадают"); return; }
    setSavingPassword(true);
    try {
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) throw error;
      toast.success("Пароль успешно изменён");
      setNewPassword(""); setConfirmPassword("");
      setCurrentScreen("security");
    } catch (e: any) { toast.error(e.message || "Ошибка при смене пароля"); }
    finally { setSavingPassword(false); }
  };

  const handleReport = () => {
    if (!reportText.trim()) { toast.error("Опишите проблему"); return; }
    toast.success("Спасибо! Ваше сообщение отправлено");
    setReportText("");
    setCurrentScreen("help");
  };

  useEffect(() => {
    if (currentScreen === "activity-likes") fetchLikedPosts();
    if (currentScreen === "activity-comments") fetchComments();
    if (currentScreen === "blocked-users") fetchBlockedUsers();
  }, [currentScreen, fetchLikedPosts, fetchComments, fetchBlockedUsers]);

  const handleBack = () => {
    if (currentScreen === "main") {
      navigate(-1);
    } else {
      setCurrentScreen(PARENT_MAP[currentScreen] || "main");
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
        <button onClick={handleBack} className="w-10 h-10 rounded-full bg-white/10 backdrop-blur-xl border border-white/20 flex items-center justify-center hover:bg-white/20 transition-colors">
          <ChevronLeft className="w-5 h-5 text-white" />
        </button>
      )}
      <h2 className="text-xl font-semibold flex-1 text-white">{title}</h2>
      {currentScreen === "main" && (
        <button onClick={() => navigate('/')} className="w-10 h-10 rounded-full bg-white/10 backdrop-blur-xl border border-white/20 flex items-center justify-center hover:bg-white/20 transition-colors">
          <X className="w-5 h-5 text-white" />
        </button>
      )}
    </div>
  );

  const renderMenuItem = (icon: React.ReactNode, label: string, onClick?: () => void, value?: string) => (
    <button onClick={onClick} className="w-full flex items-center gap-4 px-5 py-3.5 hover:bg-white/5 active:bg-white/10 transition-colors">
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

  const glassCard = "mx-4 bg-white/10 backdrop-blur-xl rounded-2xl border border-white/20 overflow-hidden";

  const renderScreen = () => {
    switch (currentScreen) {
      // ─── ACCOUNT ───
      case "saved":
        return (
          <>{renderHeader("Сохранённое")}
            <div className="flex-1 overflow-y-auto native-scroll">
              <div className={glassCard}>
                {renderMenuItem(<Bookmark className="w-5 h-5 text-white/60" />, "Все публикации", () => navigate("/profile?tab=saved"))}
                {renderMenuItem(<Heart className="w-5 h-5 text-white/60" />, "Понравившиеся", () => setCurrentScreen("activity-likes"))}
              </div>
              <p className="p-5 text-center text-white/60 text-sm">Создавайте коллекции для сохранённых публикаций</p>
            </div>
          </>
        );

      case "archive":
        return (
          <>{renderHeader("Архив")}
            <div className="flex-1 overflow-y-auto native-scroll">
              <div className={glassCard}>
                {renderMenuItem(<Archive className="w-5 h-5 text-white/60" />, "Архив историй", () => setCurrentScreen("archive-stories"))}
                {renderMenuItem(<Archive className="w-5 h-5 text-white/60" />, "Архив публикаций", () => setCurrentScreen("archive-posts"))}
                {renderMenuItem(<Archive className="w-5 h-5 text-white/60" />, "Архив прямых эфиров", () => setCurrentScreen("archive-lives"))}
              </div>
            </div>
          </>
        );

      case "archive-stories":
        return (
          <>{renderHeader("Архив историй")}
            <div className="flex-1 overflow-y-auto native-scroll">
              <div className="px-8 py-12 text-center">
                <Archive className="w-12 h-12 text-white/20 mx-auto mb-3" />
                <p className="text-white/60">У вас нет архивированных историй</p>
                <p className="text-white/40 text-sm mt-2">Истории автоматически архивируются через 24 часа</p>
              </div>
            </div>
          </>
        );

      case "archive-posts":
        return (
          <>{renderHeader("Архив публикаций")}
            <div className="flex-1 overflow-y-auto native-scroll">
              <div className="px-8 py-12 text-center">
                <Archive className="w-12 h-12 text-white/20 mx-auto mb-3" />
                <p className="text-white/60">У вас нет архивированных публикаций</p>
              </div>
            </div>
          </>
        );

      case "archive-lives":
        return (
          <>{renderHeader("Архив прямых эфиров")}
            <div className="flex-1 overflow-y-auto native-scroll">
              <div className="px-8 py-12 text-center">
                <Archive className="w-12 h-12 text-white/20 mx-auto mb-3" />
                <p className="text-white/60">У вас нет записей прямых эфиров</p>
              </div>
            </div>
          </>
        );

      // ─── ACTIVITY ───
      case "activity":
        return (
          <>{renderHeader("Ваша активность")}
            <div className="flex-1 overflow-y-auto native-scroll">
              <div className={glassCard}>
                {renderMenuItem(<Clock className="w-5 h-5 text-white/60" />, "Время в приложении", () => setCurrentScreen("activity-time"), sessionTime)}
                {renderMenuItem(<Heart className="w-5 h-5 text-white/60" />, "Лайки", () => setCurrentScreen("activity-likes"))}
                {renderMenuItem(<MessageCircle className="w-5 h-5 text-white/60" />, "Комментарии", () => setCurrentScreen("activity-comments"))}
                {renderMenuItem(<Share2 className="w-5 h-5 text-white/60" />, "Репосты", () => setCurrentScreen("activity-reposts"))}
                {renderMenuItem(<Download className="w-5 h-5 text-white/60" />, "Скачать данные", handleDownloadData)}
              </div>
            </div>
          </>
        );

      case "activity-time":
        return (
          <>{renderHeader("Время в приложении")}
            <div className="flex-1 overflow-y-auto native-scroll">
              <div className="mx-4 mt-4 flex flex-col items-center">
                <div className="w-32 h-32 rounded-full bg-white/10 backdrop-blur-xl border border-white/20 flex items-center justify-center mb-6">
                  <div className="text-center">
                    <Clock className="w-8 h-8 text-white/60 mx-auto mb-2" />
                    <span className="text-2xl font-bold text-white">{sessionTime}</span>
                  </div>
                </div>
                <p className="text-white/60 text-sm text-center px-8">Общее время, проведённое в приложении за все сессии</p>
              </div>
              <div className={cn(glassCard, "mt-6")}>
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
          <>{renderHeader("Лайки")}
            <div className="flex-1 overflow-y-auto native-scroll">
              {loadingData ? renderLoading() : likedPosts.length === 0 ? (
                <div className="px-8 py-12 text-center">
                  <Heart className="w-12 h-12 text-white/20 mx-auto mb-3" />
                  <p className="text-white/60">У вас пока нет лайков</p>
                </div>
              ) : (
                <div className={cn(glassCard, "divide-y divide-white/10")}>
                  {likedPosts.map((like) => (
                    <button key={like.id} onClick={() => navigate(`/post/${like.post_id}`)} className="w-full flex items-start gap-3 px-5 py-3.5 hover:bg-white/5 transition-colors text-left">
                      <Heart className="w-5 h-5 text-red-400 mt-0.5 shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-white text-sm font-medium truncate">{like.profile?.display_name || "Пользователь"}</p>
                        <p className="text-white/60 text-xs truncate">{like.post?.content?.slice(0, 80) || "Публикация"}</p>
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
          <>{renderHeader("Комментарии")}
            <div className="flex-1 overflow-y-auto native-scroll">
              {loadingData ? renderLoading() : comments.length === 0 ? (
                <div className="px-8 py-12 text-center">
                  <MessageCircle className="w-12 h-12 text-white/20 mx-auto mb-3" />
                  <p className="text-white/60">У вас пока нет комментариев</p>
                </div>
              ) : (
                <div className={cn(glassCard, "divide-y divide-white/10")}>
                  {comments.map((comment) => (
                    <button key={comment.id} onClick={() => navigate(`/post/${comment.post_id}`)} className="w-full flex items-start gap-3 px-5 py-3.5 hover:bg-white/5 transition-colors text-left">
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
          <>{renderHeader("Репосты")}
            <div className="flex-1 overflow-y-auto native-scroll">
              <div className="px-8 py-12 text-center">
                <Share2 className="w-12 h-12 text-white/20 mx-auto mb-3" />
                <p className="text-white/60">У вас пока нет репостов</p>
              </div>
            </div>
          </>
        );

      // ─── NOTIFICATIONS ───
      case "notifications":
        return (
          <>{renderHeader("Уведомления")}
            <div className="flex-1 overflow-y-auto native-scroll">
              <div className={glassCard}>
                {renderToggleItem(<Bell className="w-5 h-5 text-white/60" />, "Push-уведомления", "Получать уведомления на устройство", pushEnabled, setPushEnabled)}
                {renderToggleItem(<Heart className="w-5 h-5 text-white/60" />, "Лайки", "Уведомлять о новых лайках", likesNotif, setLikesNotif)}
                {renderToggleItem(<MessageCircle className="w-5 h-5 text-white/60" />, "Комментарии", "Уведомлять о новых комментариях", commentsNotif, setCommentsNotif)}
                {renderToggleItem(<Users className="w-5 h-5 text-white/60" />, "Подписчики", "Уведомлять о новых подписчиках", followersNotif, setFollowersNotif)}
              </div>
            </div>
          </>
        );

      // ─── PRIVACY ───
      case "privacy":
        return (
          <>{renderHeader("Конфиденциальность")}
            <div className="flex-1 overflow-y-auto native-scroll">
              <div className={glassCard}>
                {renderToggleItem(<Lock className="w-5 h-5 text-white/60" />, "Закрытый аккаунт", "Только подписчики видят ваши публикации", privateAccount, setPrivateAccount)}
                {renderToggleItem(<Eye className="w-5 h-5 text-white/60" />, "Статус активности", "Показывать когда вы были онлайн", activityStatus, setActivityStatus)}
              </div>
              <div className={cn(glassCard, "mt-3")}>
                {renderMenuItem(<Users className="w-5 h-5 text-white/60" />, "Близкие друзья", () => setCurrentScreen("close-friends"))}
                {renderMenuItem(<UserX className="w-5 h-5 text-white/60" />, "Заблокированные", () => setCurrentScreen("blocked-users"))}
                {renderMenuItem(<MessageCircle className="w-5 h-5 text-white/60" />, "Управление сообщениями", () => setCurrentScreen("message-settings"))}
              </div>
            </div>
          </>
        );

      case "close-friends":
        return (
          <>{renderHeader("Близкие друзья")}
            <div className="flex-1 overflow-y-auto native-scroll">
              <div className="px-8 py-12 text-center">
                <Users className="w-12 h-12 text-white/20 mx-auto mb-3" />
                <p className="text-white font-medium mb-2">Список близких друзей</p>
                <p className="text-white/60 text-sm">Делитесь историями и контентом только с выбранными людьми. Никто не узнает, что он в списке.</p>
              </div>
            </div>
          </>
        );

      case "blocked-users":
        return (
          <>{renderHeader("Заблокированные")}
            <div className="flex-1 overflow-y-auto native-scroll">
              {loadingData ? renderLoading() : blockedUsers.length === 0 ? (
                <div className="px-8 py-12 text-center">
                  <UserX className="w-12 h-12 text-white/20 mx-auto mb-3" />
                  <p className="text-white/60">Нет заблокированных пользователей</p>
                </div>
              ) : (
                <div className={cn(glassCard, "divide-y divide-white/10")}>
                  {blockedUsers.map((blocked) => (
                    <div key={blocked.id} className="flex items-center gap-3 px-5 py-3.5">
                      <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center overflow-hidden">
                        {blocked.profile?.avatar_url ? (
                          <img src={blocked.profile.avatar_url} alt="" className="w-full h-full object-cover" />
                        ) : (
                          <User className="w-5 h-5 text-white/60" />
                        )}
                      </div>
                      <span className="flex-1 text-white">{blocked.profile?.display_name || "Пользователь"}</span>
                      <button onClick={() => handleUnblock(blocked.blocked_id)} className="px-4 py-1.5 rounded-lg bg-white/10 border border-white/20 text-white text-sm hover:bg-white/20 transition-colors">
                        Разблокировать
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        );

      case "message-settings":
        return (
          <>{renderHeader("Управление сообщениями")}
            <div className="flex-1 overflow-y-auto native-scroll">
              <div className={glassCard}>
                <div className="px-5 py-3.5">
                  <p className="text-white font-medium mb-1">Кто может отправлять сообщения</p>
                  <p className="text-white/60 text-sm mb-3">Выберите, кто может писать вам</p>
                  {(["all", "followers", "none"] as const).map((opt) => (
                    <button key={opt} onClick={() => setMessagePrivacy(opt)} className={cn("w-full flex items-center gap-3 px-4 py-3 rounded-xl mb-2 transition-colors", messagePrivacy === opt ? "bg-white/20 border border-white/30" : "bg-white/5 border border-white/10")}>
                      <div className={cn("w-5 h-5 rounded-full border-2 flex items-center justify-center", messagePrivacy === opt ? "border-white" : "border-white/40")}>
                        {messagePrivacy === opt && <div className="w-2.5 h-2.5 rounded-full bg-white" />}
                      </div>
                      <span className="text-white">{opt === "all" ? "Все" : opt === "followers" ? "Только подписчики" : "Никто"}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </>
        );

      // ─── SECURITY ───
      case "security":
        return (
          <>{renderHeader("Безопасность")}
            <div className="flex-1 overflow-y-auto native-scroll">
              <div className={glassCard}>
                {renderMenuItem(<Key className="w-5 h-5 text-white/60" />, "Пароль", () => setCurrentScreen("change-password"), "Изменить")}
                {renderToggleItem(<Shield className="w-5 h-5 text-white/60" />, "Двухфакторная аутентификация", "Дополнительная защита аккаунта", twoFactor, setTwoFactor)}
              </div>
              <div className={cn(glassCard, "mt-3")}>
                {renderMenuItem(<Smartphone className="w-5 h-5 text-white/60" />, "Активные сеансы", () => setCurrentScreen("active-sessions"))}
                {renderMenuItem(<Mail className="w-5 h-5 text-white/60" />, "Письма от нас", () => setCurrentScreen("email-settings"))}
                {renderMenuItem(<Database className="w-5 h-5 text-white/60" />, "Данные аккаунта", () => setCurrentScreen("account-data"))}
              </div>
            </div>
          </>
        );

      case "change-password":
        return (
          <>{renderHeader("Изменить пароль")}
            <div className="flex-1 overflow-y-auto native-scroll">
              <div className="mx-4 mt-4 space-y-4">
                <div>
                  <label className="text-white/60 text-sm mb-2 block">Новый пароль</label>
                  <input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} placeholder="Минимум 6 символов" className="w-full px-4 py-3 rounded-xl bg-white/10 border border-white/20 text-white placeholder:text-white/40 focus:outline-none focus:border-white/40" />
                </div>
                <div>
                  <label className="text-white/60 text-sm mb-2 block">Подтвердите пароль</label>
                  <input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} placeholder="Повторите пароль" className="w-full px-4 py-3 rounded-xl bg-white/10 border border-white/20 text-white placeholder:text-white/40 focus:outline-none focus:border-white/40" />
                </div>
                <button onClick={handleChangePassword} disabled={savingPassword} className="w-full py-3 rounded-xl bg-white/20 border border-white/30 text-white font-medium hover:bg-white/30 transition-colors disabled:opacity-50">
                  {savingPassword ? <Loader2 className="w-5 h-5 animate-spin mx-auto" /> : "Сохранить"}
                </button>
              </div>
            </div>
          </>
        );

      case "active-sessions":
        return (
          <>{renderHeader("Активные сеансы")}
            <div className="flex-1 overflow-y-auto native-scroll">
              <div className={glassCard}>
                <div className="flex items-center gap-4 px-5 py-4">
                  <div className="w-10 h-10 rounded-full bg-green-500/20 flex items-center justify-center">
                    <Smartphone className="w-5 h-5 text-green-400" />
                  </div>
                  <div className="flex-1">
                    <p className="text-white font-medium">Текущий сеанс</p>
                    <p className="text-white/60 text-sm">Этот браузер · Активен сейчас</p>
                  </div>
                </div>
              </div>
              <div className="mx-4 mt-6">
                <button onClick={async () => { await supabase.auth.signOut({ scope: 'others' }); toast.success("Все другие сеансы завершены"); }} className="w-full py-3 rounded-xl bg-red-500/20 border border-red-500/30 text-red-400 font-medium hover:bg-red-500/30 transition-colors">
                  Завершить все другие сеансы
                </button>
              </div>
            </div>
          </>
        );

      case "email-settings":
        return (
          <>{renderHeader("Письма от нас")}
            <div className="flex-1 overflow-y-auto native-scroll">
              <div className={glassCard}>
                {renderToggleItem(<Mail className="w-5 h-5 text-white/60" />, "Важные уведомления", "Безопасность и активность аккаунта", emailNotifs, setEmailNotifs)}
                {renderToggleItem(<Bell className="w-5 h-5 text-white/60" />, "Промо и новости", "Новые функции и специальные предложения", promoEmails, setPromoEmails)}
              </div>
            </div>
          </>
        );

      case "account-data":
        return (
          <>{renderHeader("Данные аккаунта")}
            <div className="flex-1 overflow-y-auto native-scroll">
              <div className={glassCard}>
                <div className="px-5 py-3.5 border-b border-white/10">
                  <p className="text-white/60 text-sm">Email</p>
                  <p className="text-white">{user?.email || "Не указан"}</p>
                </div>
                <div className="px-5 py-3.5 border-b border-white/10">
                  <p className="text-white/60 text-sm">ID аккаунта</p>
                  <p className="text-white text-sm font-mono">{user?.id?.slice(0, 8)}...</p>
                </div>
                <div className="px-5 py-3.5">
                  <p className="text-white/60 text-sm">Дата регистрации</p>
                  <p className="text-white">{user?.created_at ? formatDate(user.created_at) : "Неизвестно"}</p>
                </div>
              </div>
              <div className="mx-4 mt-4">
                <button onClick={handleDownloadData} disabled={loadingData} className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-white/10 border border-white/20 text-white hover:bg-white/20 transition-colors">
                  {loadingData ? <Loader2 className="w-5 h-5 animate-spin" /> : <Download className="w-5 h-5" />}
                  <span>Скачать все данные</span>
                </button>
              </div>
            </div>
          </>
        );

      // ─── HELP ───
      case "help":
        return (
          <>{renderHeader("Помощь")}
            <div className="flex-1 overflow-y-auto native-scroll">
              <div className={glassCard}>
                {renderMenuItem(<HelpCircle className="w-5 h-5 text-white/60" />, "Справочный центр", () => setCurrentScreen("help-center"))}
                {renderMenuItem(<AlertCircle className="w-5 h-5 text-white/60" />, "Сообщить о проблеме", () => setCurrentScreen("report-problem"))}
                {renderMenuItem(<FileText className="w-5 h-5 text-white/60" />, "Условия использования", () => setCurrentScreen("terms"))}
                {renderMenuItem(<Lock className="w-5 h-5 text-white/60" />, "Политика конфиденциальности", () => setCurrentScreen("privacy-policy"))}
              </div>
            </div>
          </>
        );

      case "help-center":
        return (
          <>{renderHeader("Справочный центр")}
            <div className="flex-1 overflow-y-auto native-scroll">
              {[
                { q: "Как изменить пароль?", a: "Перейдите в Настройки → Безопасность → Пароль" },
                { q: "Как заблокировать пользователя?", a: "Откройте профиль пользователя и нажмите на три точки" },
                { q: "Как удалить публикацию?", a: "Нажмите на три точки на публикации и выберите «Удалить»" },
                { q: "Как сделать аккаунт закрытым?", a: "Настройки → Конфиденциальность → Закрытый аккаунт" },
                { q: "Как скачать свои данные?", a: "Настройки → Безопасность → Данные аккаунта → Скачать" },
              ].map((faq, i) => (
                <div key={i} className={cn(glassCard, "mb-3")}>
                  <div className="px-5 py-3.5">
                    <p className="text-white font-medium">{faq.q}</p>
                    <p className="text-white/60 text-sm mt-1">{faq.a}</p>
                  </div>
                </div>
              ))}
            </div>
          </>
        );

      case "report-problem":
        return (
          <>{renderHeader("Сообщить о проблеме")}
            <div className="flex-1 overflow-y-auto native-scroll">
              <div className="mx-4 mt-4 space-y-4">
                <div>
                  <label className="text-white/60 text-sm mb-2 block">Опишите проблему</label>
                  <textarea value={reportText} onChange={(e) => setReportText(e.target.value)} placeholder="Расскажите, что случилось..." rows={6} className="w-full px-4 py-3 rounded-xl bg-white/10 border border-white/20 text-white placeholder:text-white/40 focus:outline-none focus:border-white/40 resize-none" />
                </div>
                <button onClick={handleReport} className="w-full py-3 rounded-xl bg-white/20 border border-white/30 text-white font-medium hover:bg-white/30 transition-colors">
                  Отправить
                </button>
              </div>
            </div>
          </>
        );

      case "terms":
        return (
          <>{renderHeader("Условия использования")}
            <div className="flex-1 overflow-y-auto native-scroll">
              <div className={cn(glassCard, "mt-4 p-5")}>
                <p className="text-white/80 text-sm leading-relaxed">
                  Используя приложение Maisoni, вы соглашаетесь с нашими условиями использования. Приложение предоставляется «как есть». Мы оставляем за собой право изменять условия с уведомлением пользователей. Контент, загруженный пользователями, остаётся их собственностью. Запрещено использование платформы для распространения незаконного контента.
                </p>
                <p className="text-white/40 text-xs mt-4">Последнее обновление: 1 февраля 2026</p>
              </div>
            </div>
          </>
        );

      case "privacy-policy":
        return (
          <>{renderHeader("Политика конфиденциальности")}
            <div className="flex-1 overflow-y-auto native-scroll">
              <div className={cn(glassCard, "mt-4 p-5")}>
                <p className="text-white/80 text-sm leading-relaxed">
                  Мы собираем минимум данных, необходимых для работы сервиса. Ваши персональные данные хранятся в зашифрованном виде и не передаются третьим лицам без вашего согласия. Вы можете в любое время запросить удаление всех своих данных через настройки аккаунта.
                </p>
                <p className="text-white/40 text-xs mt-4">Последнее обновление: 1 февраля 2026</p>
              </div>
            </div>
          </>
        );

      // ─── ABOUT ───
      case "about":
        return (
          <>{renderHeader("О приложении")}
            <div className="flex-1 overflow-y-auto native-scroll">
              <div className="p-8 flex flex-col items-center">
                <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-violet-500 to-fuchsia-500 flex items-center justify-center mb-4 shadow-lg">
                  <span className="text-3xl text-white font-bold">M</span>
                </div>
                <h3 className="text-xl font-semibold text-white">Maisoni</h3>
                <p className="text-sm text-white/60">Версия 1.0.0</p>
              </div>
              <div className={glassCard}>
                {renderMenuItem(<FileText className="w-5 h-5 text-white/60" />, "Лицензии открытого ПО", () => setCurrentScreen("licenses"))}
                {renderMenuItem(<Info className="w-5 h-5 text-white/60" />, "Информация о разработчике", () => setCurrentScreen("developer-info"))}
              </div>
            </div>
          </>
        );

      case "licenses":
        return (
          <>{renderHeader("Лицензии открытого ПО")}
            <div className="flex-1 overflow-y-auto native-scroll">
              <div className="mx-4 mt-4 space-y-3">
                {[
                  { name: "React", license: "MIT License", url: "facebook.github.io/react" },
                  { name: "Tailwind CSS", license: "MIT License", url: "tailwindcss.com" },
                  { name: "Radix UI", license: "MIT License", url: "radix-ui.com" },
                  { name: "Framer Motion", license: "MIT License", url: "framer.com/motion" },
                  { name: "Lucide Icons", license: "ISC License", url: "lucide.dev" },
                  { name: "date-fns", license: "MIT License", url: "date-fns.org" },
                ].map((lib, i) => (
                  <div key={i} className="bg-white/10 backdrop-blur-xl rounded-2xl border border-white/20 px-5 py-3.5">
                    <p className="text-white font-medium">{lib.name}</p>
                    <p className="text-white/60 text-sm">{lib.license}</p>
                    <p className="text-white/40 text-xs">{lib.url}</p>
                  </div>
                ))}
              </div>
            </div>
          </>
        );

      case "developer-info":
        return (
          <>{renderHeader("Информация о разработчике")}
            <div className="flex-1 overflow-y-auto native-scroll">
              <div className="p-8 flex flex-col items-center">
                <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-violet-500 to-fuchsia-500 flex items-center justify-center mb-4 shadow-lg">
                  <span className="text-3xl text-white font-bold">M</span>
                </div>
                <h3 className="text-xl font-semibold text-white">Maisoni Team</h3>
                <p className="text-white/60 text-sm mt-1">Разработка социальных приложений</p>
              </div>
              <div className={glassCard}>
                <div className="px-5 py-3.5 border-b border-white/10">
                  <p className="text-white/60 text-sm">Версия</p>
                  <p className="text-white">1.0.0</p>
                </div>
                <div className="px-5 py-3.5 border-b border-white/10">
                  <p className="text-white/60 text-sm">Платформа</p>
                  <p className="text-white">Web (PWA)</p>
                </div>
                <div className="px-5 py-3.5">
                  <p className="text-white/60 text-sm">Год выпуска</p>
                  <p className="text-white">2026</p>
                </div>
              </div>
            </div>
          </>
        );

      // ─── MAIN ───
      default:
        return (
          <>{renderHeader("Настройки", false)}
            <div className="flex-1 overflow-y-auto native-scroll pb-8">
              {/* Theme */}
              <div className="px-4 py-4">
                <p className="text-sm text-white/60 mb-3 px-1">Тема оформления</p>
                <div className="flex gap-2">
                  <button onClick={() => setTheme("light")} className={cn("flex-1 flex items-center justify-center gap-2 py-3 rounded-xl transition-all border", theme === "light" ? "bg-white/20 border-white/40 text-white" : "bg-white/5 border-white/10 text-white/70")}>
                    <Sun className="w-5 h-5" /><span className="font-medium">Светлая</span>
                  </button>
                  <button onClick={() => setTheme("dark")} className={cn("flex-1 flex items-center justify-center gap-2 py-3 rounded-xl transition-all border", theme === "dark" ? "bg-white/20 border-white/40 text-white" : "bg-white/5 border-white/10 text-white/70")}>
                    <Moon className="w-5 h-5" /><span className="font-medium">Тёмная</span>
                  </button>
                </div>
              </div>

              {/* Account */}
              <div className="px-4 mb-3">
                <p className="text-sm text-white/60 mb-2 px-1">Аккаунт</p>
                <div className={cn(glassCard, "!mx-0")}>
                  {renderMenuItem(<Bookmark className="w-5 h-5 text-white/60" />, "Сохранённое", () => navigate("/profile?tab=saved"))}
                  {renderMenuItem(<Archive className="w-5 h-5 text-white/60" />, "Архив", () => setCurrentScreen("archive"))}
                  {renderMenuItem(<Clock className="w-5 h-5 text-white/60" />, "Ваша активность", () => setCurrentScreen("activity"))}
                </div>
              </div>

              {/* Settings */}
              <div className="px-4 mb-3">
                <p className="text-sm text-white/60 mb-2 px-1">Настройки</p>
                <div className={cn(glassCard, "!mx-0")}>
                  {renderMenuItem(<Bell className="w-5 h-5 text-white/60" />, "Уведомления", () => setCurrentScreen("notifications"))}
                  {renderMenuItem(<Lock className="w-5 h-5 text-white/60" />, "Конфиденциальность", () => setCurrentScreen("privacy"))}
                  {renderMenuItem(<Shield className="w-5 h-5 text-white/60" />, "Безопасность", () => setCurrentScreen("security"))}
                </div>
              </div>

              {/* Support */}
              <div className="px-4 mb-3">
                <p className="text-sm text-white/60 mb-2 px-1">Поддержка</p>
                <div className={cn(glassCard, "!mx-0")}>
                  {renderMenuItem(<HelpCircle className="w-5 h-5 text-white/60" />, "Помощь", () => setCurrentScreen("help"))}
                  {renderMenuItem(<Info className="w-5 h-5 text-white/60" />, "О приложении", () => setCurrentScreen("about"))}
                </div>
              </div>

              {/* Logout */}
              <div className="px-4 mt-6 pb-24">
                <button onClick={handleLogout} className="w-full flex items-center justify-center gap-3 px-4 py-3.5 rounded-2xl bg-red-500/20 border border-red-500/30 text-red-400 hover:bg-red-500/30 transition-colors">
                  <LogOut className="w-5 h-5" /><span className="font-medium">Выйти</span>
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
      <div className="relative z-10 h-full flex flex-col safe-area-top safe-area-bottom">
        {renderScreen()}
      </div>
    </div>
  );
}
