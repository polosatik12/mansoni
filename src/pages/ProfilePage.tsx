import { Settings, Grid3X3, Bookmark, Play, Plus, AtSign, Share2, Eye, User, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";
import { CreateMenu } from "@/components/feed/CreateMenu";
import { PostEditorFlow } from "@/components/feed/PostEditorFlow";
import { StoryEditorFlow } from "@/components/feed/StoryEditorFlow";
import { SettingsDrawer } from "@/components/profile/SettingsDrawer";
import { FollowersSheet } from "@/components/profile/FollowersSheet";
import { useProfile, useUserPosts } from "@/hooks/useProfile";
import { useSavedPosts } from "@/hooks/useSavedPosts";
import { useAuth } from "@/hooks/useAuth";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { VerifiedBadge } from "@/components/ui/verified-badge";

const tabs = [
  { id: "posts", icon: Grid3X3 },
  { id: "saved", icon: Bookmark },
  { id: "reels", icon: Play },
  { id: "tagged", icon: AtSign },
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

export function ProfilePage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { profile, loading: profileLoading, updateProfile } = useProfile();
  const { posts, loading: postsLoading } = useUserPosts();
  const { savedPosts, fetchSavedPosts, loading: savedLoading } = useSavedPosts();
  
  const [activeTab, setActiveTab] = useState("posts");
  const [showCreateMenu, setShowCreateMenu] = useState(false);
  const [showPostEditor, setShowPostEditor] = useState(false);
  const [showStoryEditor, setShowStoryEditor] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showFollowers, setShowFollowers] = useState(false);
  const [showFollowing, setShowFollowing] = useState(false);

  const handleCreateSelect = (type: string) => {
    if (type === "post") {
      setShowPostEditor(true);
    } else if (type === "story") {
      setShowStoryEditor(true);
    }
  };

  const handleTabChange = (tabId: string) => {
    setActiveTab(tabId);
    if (tabId === "saved") {
      fetchSavedPosts();
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
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!user || !profile) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4">
        <User className="w-16 h-16 text-muted-foreground mb-4" />
        <h2 className="text-lg font-semibold mb-2">Войдите в аккаунт</h2>
        <p className="text-muted-foreground text-center mb-4">
          Чтобы просматривать свой профиль, войдите в аккаунт
        </p>
        <Button onClick={() => window.location.href = '/auth'}>
          Войти
        </Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 bg-white/80 dark:bg-card backdrop-blur-md sticky top-0 z-20">
        <div className="w-10" />
        <div className="flex items-center gap-1.5">
          <h1 className="font-semibold text-lg">{profile.display_name || 'Профиль'}</h1>
          {profile.verified && <VerifiedBadge size="md" />}
        </div>
        <Button variant="ghost" size="icon" onClick={() => setShowSettings(true)}>
          <Settings className="w-6 h-6" />
        </Button>
      </div>

      {/* Profile Info Row */}
      <div className="px-4 py-4 bg-white/80 dark:bg-transparent backdrop-blur-md">
        <div className="flex items-start gap-4">
          {/* Avatar - clickable to open create menu */}
          <button 
            className="relative cursor-pointer"
            onClick={() => setShowCreateMenu(true)}
          >
            <Avatar className="w-20 h-20 border-2 border-border">
              <AvatarImage src={profile.avatar_url || undefined} alt={profile.display_name || 'Profile'} />
              <AvatarFallback className="bg-muted">
                <User className="w-8 h-8 text-muted-foreground" />
              </AvatarFallback>
            </Avatar>
            {/* Add story button */}
            <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-primary border-2 border-background flex items-center justify-center">
              <Plus className="w-4 h-4 text-primary-foreground" />
            </div>
          </button>

          {/* Stats */}
          <div className="flex-1">
            <div className="flex items-center gap-1.5 mb-2">
              <h1 className="text-lg font-semibold">{profile.display_name || 'Пользователь'}</h1>
              {profile.verified && <VerifiedBadge size="md" />}
            </div>
            <div className="flex items-center gap-6">
              <div className="text-center">
                <p className="font-bold text-foreground">{profile.stats.postsCount}</p>
                <p className="text-xs text-muted-foreground">публикации</p>
              </div>
              <button 
                className="text-center"
                onClick={() => setShowFollowers(true)}
              >
                <p className="font-bold text-foreground">{formatNumber(profile.stats.followersCount)}</p>
                <p className="text-xs text-muted-foreground">подписчики</p>
              </button>
              <button 
                className="text-center"
                onClick={() => setShowFollowing(true)}
              >
                <p className="font-bold text-foreground">{formatNumber(profile.stats.followingCount)}</p>
                <p className="text-xs text-muted-foreground">подписки</p>
              </button>
            </div>
          </div>
        </div>

        {/* Bio */}
        <div className="mt-3">
          <p className="text-sm text-foreground">{profile.bio || ''}</p>
          {profile.website && (
            <a href={profile.website.startsWith('http') ? profile.website : `https://${profile.website}`} 
               target="_blank" 
               rel="noopener noreferrer"
               className="text-sm text-primary font-medium">
              {profile.website}
            </a>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-1.5 mt-4">
          <Button 
            variant="secondary" 
            className="flex-1 rounded-lg h-8 text-sm font-semibold px-3"
            onClick={() => navigate('/profile/edit')}
          >
            Редактировать профиль
          </Button>
          <Button variant="secondary" className="flex-1 rounded-lg h-8 text-sm font-semibold px-3">
            Поделиться профилем
          </Button>
        </div>
      </div>

      {/* Content Tabs */}
      <div className="border-t border-white/30 dark:border-border sticky top-[52px] z-10 bg-white/80 dark:bg-card backdrop-blur-md">
        <div className="flex">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => handleTabChange(tab.id)}
                className={cn(
                  "flex-1 flex items-center justify-center py-3 transition-all border-b-2",
                  isActive
                    ? "border-foreground text-foreground"
                    : "border-transparent text-muted-foreground hover:text-foreground"
                )}
              >
                <Icon className={cn("w-6 h-6", tab.id === "reels" && "fill-current")} />
              </button>
            );
          })}
        </div>
      </div>

      {/* Posts Grid */}
      <div className="bg-white/90 dark:bg-background min-h-[50vh]">
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
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Grid3X3 className="w-6 h-6 text-muted-foreground" />
                        </div>
                      )}
                      {isVideo && (
                        <>
                          <div className="absolute top-2 right-2">
                            <Play className="w-5 h-5 text-white fill-white drop-shadow-lg" />
                          </div>
                          <div className="absolute bottom-2 left-2 flex items-center gap-1">
                            <Eye className="w-4 h-4 text-white drop-shadow-lg" />
                            <span className="text-white text-xs font-medium drop-shadow-lg">{post.views_count}</span>
                          </div>
                        </>
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
                <p className="text-sm text-muted-foreground">Создайте свой первый пост</p>
              </div>
            )}
          </>
        )}

        {activeTab === "saved" && (
          <>
            {savedLoading ? (
              <div className="p-12 flex justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
              </div>
            ) : savedPosts.length > 0 ? (
              <div className="grid grid-cols-3 gap-[2px]">
                {savedPosts.map((post: any) => {
                  const imageUrl = post.post_media?.[0]?.media_url;
                  return (
                    <div key={post.id} className="aspect-square relative group cursor-pointer overflow-hidden bg-muted">
                      {imageUrl ? (
                        <img
                          src={imageUrl}
                          alt={`Saved ${post.id}`}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Bookmark className="w-6 h-6 text-muted-foreground" />
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="p-12 text-center">
                <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mx-auto mb-3">
                  <Bookmark className="w-8 h-8 text-muted-foreground" />
                </div>
                <h3 className="font-semibold text-foreground mb-1">Сохранённое</h3>
                <p className="text-sm text-muted-foreground">Сохраняйте понравившиеся публикации</p>
              </div>
            )}
          </>
        )}

        {activeTab === "reels" && (
          <div className="p-12 text-center">
            <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mx-auto mb-3">
              <Play className="w-8 h-8 text-muted-foreground" />
            </div>
            <h3 className="font-semibold text-foreground mb-1">Reels</h3>
            <p className="text-sm text-muted-foreground">Ваши видео Reels</p>
          </div>
        )}

        {activeTab === "tagged" && (
          <div className="p-12 text-center">
            <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mx-auto mb-3">
              <AtSign className="w-8 h-8 text-muted-foreground" />
            </div>
            <h3 className="font-semibold text-foreground mb-1">Отметки</h3>
            <p className="text-sm text-muted-foreground">Публикации с вашими отметками</p>
          </div>
        )}
      </div>

      {/* Create Menu */}
      <CreateMenu 
        isOpen={showCreateMenu} 
        onClose={() => setShowCreateMenu(false)} 
        onSelect={handleCreateSelect}
      />

      {/* Post Editor */}
      <PostEditorFlow 
        isOpen={showPostEditor} 
        onClose={() => setShowPostEditor(false)} 
      />

      {/* Story Editor */}
      <StoryEditorFlow 
        isOpen={showStoryEditor} 
        onClose={() => setShowStoryEditor(false)} 
      />

      {/* Settings Drawer */}
      <SettingsDrawer 
        isOpen={showSettings} 
        onClose={() => setShowSettings(false)} 
      />

      {/* Followers Sheet */}
      {user && (
        <>
          <FollowersSheet
            isOpen={showFollowers}
            onClose={() => setShowFollowers(false)}
            userId={user.id}
            type="followers"
            title="Подписчики"
          />
          <FollowersSheet
            isOpen={showFollowing}
            onClose={() => setShowFollowing(false)}
            userId={user.id}
            type="following"
            title="Подписки"
          />
        </>
      )}
    </div>
  );
}
