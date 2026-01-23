import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Grid3X3, Bookmark, Heart, Play, MoreHorizontal, BadgeCheck, MessageCircle, Loader2, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useProfileByUsername, useUserPosts } from "@/hooks/useProfile";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

const tabs = [
  { id: "posts", icon: Grid3X3 },
  { id: "saved", icon: Bookmark },
  { id: "liked", icon: Heart },
];

function formatNumber(num: number): string {
  if (num >= 1000000) {
    return (num / 1000000).toFixed(1).replace(/\.0$/, '') + 'M';
  }
  if (num >= 1000) {
    return (num / 1000).toFixed(1).replace(/\.0$/, '') + 'K';
  }
  return num.toString();
}

export function UserProfilePage() {
  const { username: rawUsername } = useParams<{ username: string }>();
  const navigate = useNavigate();
  const { user: currentUser } = useAuth();
  const [activeTab, setActiveTab] = useState("posts");
  const [isCreatingChat, setIsCreatingChat] = useState(false);

  // Decode URI component to handle spaces and special characters
  const username = rawUsername ? decodeURIComponent(rawUsername) : undefined;

  const { profile, loading: profileLoading, error, follow, unfollow } = useProfileByUsername(username);
  const { posts, loading: postsLoading } = useUserPosts(profile?.user_id);

  const handleFollowToggle = async () => {
    if (!currentUser) {
      toast.error("Войдите, чтобы подписаться");
      navigate("/auth");
      return;
    }

    try {
      if (profile?.isFollowing) {
        await unfollow();
        toast.success("Вы отписались");
      } else {
        await follow();
        toast.success("Вы подписались");
      }
    } catch (err) {
      toast.error("Не удалось выполнить действие");
    }
  };

  const handleMessage = async () => {
    if (!currentUser) {
      toast.error("Войдите, чтобы написать сообщение");
      navigate("/auth");
      return;
    }

    if (!profile) return;

    setIsCreatingChat(true);

    try {
      const { data: conversationId, error: rpcError } = await supabase
        .rpc("get_or_create_dm_by_display_name", { target_display_name: profile.display_name });

      if (rpcError) throw rpcError;

      navigate("/chats", { 
        state: { 
          conversationId, 
          chatName: profile.display_name || "Пользователь" 
        } 
      });

    } catch (error) {
      console.error("[Chat] Error:", error);
      const msg = error instanceof Error ? error.message : String(error);
      
      if (msg.includes("Cannot message yourself")) {
        toast.error("Нельзя написать самому себе");
      } else if (msg.includes("Target not registered")) {
        toast.info("Этот пользователь ещё не зарегистрирован");
      } else {
        toast.error("Не удалось открыть чат", { description: msg });
      }
    } finally {
      setIsCreatingChat(false);
    }
  };

  // Get first media URL for a post
  const getPostImage = (post: any): string | null => {
    if (post.post_media && post.post_media.length > 0) {
      return post.post_media[0].media_url;
    }
    return null;
  };

  if (profileLoading) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-background z-[60]">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className="fixed inset-0 flex flex-col bg-background z-[60]">
        <div className="flex-shrink-0 flex items-center gap-3 px-4 py-3 border-b border-border bg-card safe-area-top">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)} className="shrink-0">
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div className="flex-1">
            <h2 className="font-semibold text-foreground">Профиль</h2>
          </div>
        </div>
        <div className="flex-1 flex flex-col items-center justify-center p-8">
          <User className="w-16 h-16 text-muted-foreground mb-4" />
          <h2 className="text-lg font-semibold mb-2">Пользователь не найден</h2>
          <p className="text-muted-foreground text-center">
            Возможно, аккаунт был удалён или никнейм введён неверно
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 flex flex-col bg-background z-[60]">
      {/* Header */}
      <div className="flex-shrink-0 flex items-center gap-3 px-4 py-3 border-b border-border bg-card safe-area-top">
        <Button variant="ghost" size="icon" onClick={() => navigate(-1)} className="shrink-0">
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5">
            <h2 className="font-semibold text-foreground truncate">{profile.display_name}</h2>
            {profile.verified && (
              <BadgeCheck className="w-4 h-4 text-primary fill-primary stroke-primary-foreground" />
            )}
          </div>
          <p className="text-xs text-muted-foreground">{profile.stats.postsCount} публикаций</p>
        </div>
        <Button variant="ghost" size="icon">
          <MoreHorizontal className="w-5 h-5" />
        </Button>
      </div>

      {/* Scrollable Content */}
      <div className="flex-1 overflow-y-auto native-scroll">
        {/* Cover Image */}
        <div className="relative h-36 bg-muted">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-secondary/20" />
        </div>

        {/* Avatar */}
        <div className="relative z-10 -mt-12 ml-4 mb-4">
          <div className="w-20 h-20 rounded-full border-4 border-card bg-card overflow-hidden shadow-lg">
            <Avatar className="w-full h-full">
              <AvatarImage src={profile.avatar_url || undefined} alt={profile.display_name || 'Profile'} />
              <AvatarFallback className="bg-muted">
                <User className="w-8 h-8 text-muted-foreground" />
              </AvatarFallback>
            </Avatar>
          </div>
        </div>

        {/* Profile Info */}
        <div className="bg-card px-4 pb-4">
          {/* Name & Verified */}
          <div className="flex items-center gap-2 mb-1">
            <h1 className="text-lg font-bold text-foreground">{profile.display_name || 'Пользователь'}</h1>
            {profile.verified && (
              <BadgeCheck className="w-5 h-5 text-primary fill-primary stroke-primary-foreground" />
            )}
          </div>
          
          <p className="text-muted-foreground text-sm mb-3">@{profile.display_name?.toLowerCase().replace(/\s+/g, '_') || 'user'}</p>

          {/* Action Buttons - only show if not own profile */}
          {!profile.isOwnProfile && (
            <div className="flex items-center gap-3 mb-4">
              <Button 
                onClick={handleFollowToggle}
                variant={profile.isFollowing ? "outline" : "default"}
                className="rounded-full px-8 flex-1"
              >
                {profile.isFollowing ? "Отписаться" : "Подписаться"}
              </Button>
              <Button 
                variant="outline" 
                className="rounded-full px-6 gap-2"
                onClick={handleMessage}
                disabled={isCreatingChat}
              >
                {isCreatingChat ? (
                  <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                ) : (
                  <MessageCircle className="w-4 h-4" />
                )}
                Сообщение
              </Button>
            </div>
          )}

          {/* Bio */}
          {profile.bio && (
            <p className="text-foreground mb-3 text-sm leading-relaxed">
              {profile.bio}
            </p>
          )}

          {/* Website Link */}
          {profile.website && (
            <a 
              href={profile.website.startsWith('http') ? profile.website : `https://${profile.website}`} 
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary font-medium text-sm mb-4 block"
            >
              {profile.website}
            </a>
          )}

          {/* Stats */}
          <div className="flex items-center gap-8 py-4 border-y border-border">
            <div className="text-center">
              <p className="text-lg font-bold text-foreground">{profile.stats.postsCount}</p>
              <p className="text-xs text-muted-foreground">Постов</p>
            </div>
            <div className="text-center">
              <p className="text-lg font-bold text-foreground">{formatNumber(profile.stats.followersCount)}</p>
              <p className="text-xs text-muted-foreground">Подписчиков</p>
            </div>
            <div className="text-center">
              <p className="text-lg font-bold text-foreground">{formatNumber(profile.stats.followingCount)}</p>
              <p className="text-xs text-muted-foreground">Подписок</p>
            </div>
          </div>
        </div>

        {/* Content Tabs */}
        <div className="bg-card sticky top-0 z-10">
          <div className="flex">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={cn(
                    "flex-1 flex items-center justify-center py-3 transition-all border-b-2",
                    isActive
                      ? "border-primary text-primary"
                      : "border-transparent text-muted-foreground hover:text-foreground"
                  )}
                >
                  <Icon className="w-5 h-5" />
                </button>
              );
            })}
          </div>
        </div>

        {/* Posts Grid */}
        <div className="bg-card">
          {activeTab === "posts" && (
            <>
              {postsLoading ? (
                <div className="p-12 flex justify-center">
                  <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
                </div>
              ) : posts.length > 0 ? (
                <div className="grid grid-cols-3 gap-[2px]">
                  {posts.map((post) => {
                    const imageUrl = getPostImage(post);
                    const isVideo = post.post_media?.[0]?.media_type === 'video';
                    return (
                      <div key={post.id} className="aspect-square relative group cursor-pointer overflow-hidden bg-muted">
                        {imageUrl ? (
                          <img
                            src={imageUrl}
                            alt={`Post ${post.id}`}
                            className="w-full h-full object-cover transition-transform group-hover:scale-105"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <Grid3X3 className="w-6 h-6 text-muted-foreground" />
                          </div>
                        )}
                        {isVideo && (
                          <div className="absolute top-2 right-2">
                            <div className="w-6 h-6 rounded-full bg-black/60 flex items-center justify-center">
                              <Play className="w-3 h-3 text-white fill-white ml-0.5" />
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="p-12 text-center">
                  <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mx-auto mb-3">
                    <Grid3X3 className="w-8 h-8 text-muted-foreground" />
                  </div>
                  <h3 className="font-semibold text-foreground mb-1">Нет публикаций</h3>
                  <p className="text-sm text-muted-foreground">Пользователь ещё ничего не опубликовал</p>
                </div>
              )}
            </>
          )}

          {activeTab === "saved" && (
            <div className="p-12 text-center">
              <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mx-auto mb-3">
                <Bookmark className="w-8 h-8 text-muted-foreground" />
              </div>
              <h3 className="font-semibold text-foreground mb-1">Скрыто</h3>
              <p className="text-sm text-muted-foreground">Сохранённые посты скрыты</p>
            </div>
          )}

          {activeTab === "liked" && (
            <div className="p-12 text-center">
              <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mx-auto mb-3">
                <Heart className="w-8 h-8 text-muted-foreground" />
              </div>
              <h3 className="font-semibold text-foreground mb-1">Скрыто</h3>
              <p className="text-sm text-muted-foreground">Понравившиеся посты скрыты</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
