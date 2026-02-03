import { Settings, Grid3X3, Bookmark, Play, Plus, AtSign, Share2, Eye, User, Loader2, Edit3, QrCode } from "lucide-react";
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
  { id: "posts", icon: Grid3X3, label: "Публикации" },
  { id: "saved", icon: Bookmark, label: "Сохранённое" },
  { id: "reels", icon: Play, label: "Reels" },
  { id: "tagged", icon: AtSign, label: "Отметки" },
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
      <div className="min-h-screen relative overflow-hidden">
        {/* Aurora Background */}
        <div className="fixed inset-0 bg-gradient-to-br from-slate-900 via-purple-900/80 to-slate-900">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-cyan-500/30 rounded-full blur-3xl animate-pulse" />
          <div className="absolute top-1/3 right-1/4 w-80 h-80 bg-blue-500/25 rounded-full blur-3xl animate-pulse delay-1000" />
          <div className="absolute bottom-1/4 left-1/3 w-72 h-72 bg-violet-500/30 rounded-full blur-3xl animate-pulse delay-500" />
        </div>
        <div className="relative z-10 min-h-screen flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-white/60" />
        </div>
      </div>
    );
  }

  if (!user || !profile) {
    return (
      <div className="min-h-screen relative overflow-hidden">
        {/* Aurora Background */}
        <div className="fixed inset-0 bg-gradient-to-br from-slate-900 via-purple-900/80 to-slate-900">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-cyan-500/30 rounded-full blur-3xl animate-pulse" />
          <div className="absolute top-1/3 right-1/4 w-80 h-80 bg-blue-500/25 rounded-full blur-3xl animate-pulse delay-1000" />
          <div className="absolute bottom-1/4 left-1/3 w-72 h-72 bg-violet-500/30 rounded-full blur-3xl animate-pulse delay-500" />
        </div>
        <div className="relative z-10 min-h-screen flex flex-col items-center justify-center p-4">
          <div className="w-20 h-20 rounded-full bg-white/10 backdrop-blur-xl border border-white/20 flex items-center justify-center mb-4">
            <User className="w-10 h-10 text-white/60" />
          </div>
          <h2 className="text-lg font-semibold text-white mb-2">Войдите в аккаунт</h2>
          <p className="text-white/60 text-center mb-4">
            Чтобы просматривать свой профиль, войдите в аккаунт
          </p>
          <button 
            onClick={() => window.location.href = '/auth'}
            className="px-6 py-3 bg-white/10 backdrop-blur-xl rounded-2xl border border-white/20 text-white font-medium hover:bg-white/20 transition-colors"
          >
            Войти
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Aurora Background */}
      <div className="fixed inset-0 bg-gradient-to-br from-slate-900 via-purple-900/80 to-slate-900">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-cyan-500/30 rounded-full blur-3xl animate-pulse" />
        <div className="absolute top-1/3 right-1/4 w-80 h-80 bg-blue-500/25 rounded-full blur-3xl animate-pulse delay-1000" />
        <div className="absolute bottom-1/4 left-1/3 w-72 h-72 bg-violet-500/30 rounded-full blur-3xl animate-pulse delay-500" />
      </div>

      {/* Content */}
      <div className="relative z-10 min-h-screen pb-24">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 pt-safe">
          <div className="w-10" />
          <div className="flex items-center gap-1.5">
            <h1 className="font-semibold text-lg text-white">{profile.display_name || 'Профиль'}</h1>
            {profile.verified && <VerifiedBadge size="md" />}
          </div>
          <button 
            onClick={() => setShowSettings(true)}
            className="w-10 h-10 rounded-full bg-white/10 backdrop-blur-xl border border-white/20 flex items-center justify-center hover:bg-white/20 transition-colors"
          >
            <Settings className="w-5 h-5 text-white" />
          </button>
        </div>

        {/* Profile Section */}
        <div className="flex flex-col items-center px-4 pt-4 pb-6">
          {/* Glass Avatar */}
          <button 
            className="relative mb-4"
            onClick={() => setShowCreateMenu(true)}
          >
            <div className="absolute -inset-2 rounded-full bg-gradient-to-br from-white/20 via-white/5 to-white/10 backdrop-blur-xl" />
            <Avatar className="w-24 h-24 border-2 border-white/30 relative">
              <AvatarImage src={profile.avatar_url || undefined} alt={profile.display_name || 'Profile'} />
              <AvatarFallback className="bg-violet-500/80 backdrop-blur-xl text-white text-3xl font-medium">
                {profile.display_name?.charAt(0)?.toUpperCase() || <User className="w-10 h-10" />}
              </AvatarFallback>
            </Avatar>
            {/* Add story button */}
            <div className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full bg-primary border-2 border-white/30 flex items-center justify-center shadow-lg">
              <Plus className="w-4 h-4 text-primary-foreground" />
            </div>
          </button>

          {/* Name & Verified */}
          <div className="flex items-center gap-1.5 mb-1">
            <h1 className="text-xl font-semibold text-white">{profile.display_name || 'Пользователь'}</h1>
            {profile.verified && <VerifiedBadge size="md" />}
          </div>

          {/* Bio */}
          {profile.bio && (
            <p className="text-sm text-white/70 text-center max-w-[280px] mb-2">{profile.bio}</p>
          )}
          {profile.website && (
            <a href={profile.website.startsWith('http') ? profile.website : `https://${profile.website}`} 
               target="_blank" 
               rel="noopener noreferrer"
               className="text-sm text-[#6ab3f3] font-medium mb-4">
              {profile.website}
            </a>
          )}

          {/* Stats */}
          <div className="flex items-center gap-8 mb-6">
            <div className="text-center">
              <p className="font-bold text-white text-lg">{profile.stats.postsCount}</p>
              <p className="text-xs text-white/60">публикации</p>
            </div>
            <button 
              className="text-center"
              onClick={() => setShowFollowers(true)}
            >
              <p className="font-bold text-white text-lg">{formatNumber(profile.stats.followersCount)}</p>
              <p className="text-xs text-white/60">подписчики</p>
            </button>
            <button 
              className="text-center"
              onClick={() => setShowFollowing(true)}
            >
              <p className="font-bold text-white text-lg">{formatNumber(profile.stats.followingCount)}</p>
              <p className="text-xs text-white/60">подписки</p>
            </button>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-3">
            <button 
              onClick={() => navigate('/profile/edit')}
              className="flex flex-col items-center gap-1.5"
            >
              <div className="w-14 h-14 rounded-2xl bg-white/10 backdrop-blur-xl border border-white/20 flex items-center justify-center hover:bg-white/20 transition-colors">
                <Edit3 className="w-6 h-6 text-white" />
              </div>
              <span className="text-xs text-white/70">Изменить</span>
            </button>

            <button className="flex flex-col items-center gap-1.5">
              <div className="w-14 h-14 rounded-2xl bg-white/10 backdrop-blur-xl border border-white/20 flex items-center justify-center hover:bg-white/20 transition-colors">
                <Share2 className="w-6 h-6 text-white" />
              </div>
              <span className="text-xs text-white/70">Поделиться</span>
            </button>

            <button className="flex flex-col items-center gap-1.5">
              <div className="w-14 h-14 rounded-2xl bg-white/10 backdrop-blur-xl border border-white/20 flex items-center justify-center hover:bg-white/20 transition-colors">
                <QrCode className="w-6 h-6 text-white" />
              </div>
              <span className="text-xs text-white/70">QR-код</span>
            </button>
          </div>
        </div>

        {/* Content Tabs */}
        <div className="px-4 mb-3">
          <div className="bg-white/10 backdrop-blur-xl rounded-2xl border border-white/20 p-1 flex">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => handleTabChange(tab.id)}
                  className={cn(
                    "flex-1 flex items-center justify-center py-2.5 rounded-xl transition-all",
                    isActive
                      ? "bg-white/20 text-white"
                      : "text-white/50 hover:text-white/70"
                  )}
                >
                  <Icon className={cn("w-5 h-5", tab.id === "reels" && "fill-current")} />
                </button>
              );
            })}
          </div>
        </div>

        {/* Posts Grid */}
        <div className="px-4">
          {activeTab === "posts" && (
            <>
              {postsLoading ? (
                <div className="p-12 flex justify-center">
                  <Loader2 className="w-8 h-8 animate-spin text-white/60" />
                </div>
              ) : posts.length > 0 ? (
                <div className="grid grid-cols-3 gap-1 rounded-2xl overflow-hidden">
                  {posts.map((post) => {
                    const imageUrl = getPostImage(post);
                    const isVideo = post.post_media?.[0]?.media_type === 'video';
                    return (
                      <div key={post.id} className="aspect-square relative group cursor-pointer overflow-hidden bg-white/10">
                        {imageUrl ? (
                          <img
                            src={imageUrl}
                            alt={`Post ${post.id}`}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <Grid3X3 className="w-6 h-6 text-white/40" />
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
                <div className="py-12 text-center">
                  <div className="w-16 h-16 rounded-full bg-white/10 backdrop-blur-xl border border-white/20 flex items-center justify-center mx-auto mb-3">
                    <Grid3X3 className="w-8 h-8 text-white/60" />
                  </div>
                  <h3 className="font-semibold text-white mb-1">Нет публикаций</h3>
                  <p className="text-sm text-white/60">Создайте свой первый пост</p>
                </div>
              )}
            </>
          )}

          {activeTab === "saved" && (
            <>
              {savedLoading ? (
                <div className="p-12 flex justify-center">
                  <Loader2 className="w-8 h-8 animate-spin text-white/60" />
                </div>
              ) : savedPosts.length > 0 ? (
                <div className="grid grid-cols-3 gap-1 rounded-2xl overflow-hidden">
                  {savedPosts.map((post: any) => {
                    const imageUrl = post.post_media?.[0]?.media_url;
                    return (
                      <div key={post.id} className="aspect-square relative group cursor-pointer overflow-hidden bg-white/10">
                        {imageUrl ? (
                          <img
                            src={imageUrl}
                            alt={`Saved ${post.id}`}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <Bookmark className="w-6 h-6 text-white/40" />
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="py-12 text-center">
                  <div className="w-16 h-16 rounded-full bg-white/10 backdrop-blur-xl border border-white/20 flex items-center justify-center mx-auto mb-3">
                    <Bookmark className="w-8 h-8 text-white/60" />
                  </div>
                  <h3 className="font-semibold text-white mb-1">Сохранённое</h3>
                  <p className="text-sm text-white/60">Сохраняйте понравившиеся публикации</p>
                </div>
              )}
            </>
          )}

          {activeTab === "reels" && (
            <div className="py-12 text-center">
              <div className="w-16 h-16 rounded-full bg-white/10 backdrop-blur-xl border border-white/20 flex items-center justify-center mx-auto mb-3">
                <Play className="w-8 h-8 text-white/60" />
              </div>
              <h3 className="font-semibold text-white mb-1">Reels</h3>
              <p className="text-sm text-white/60">Ваши видео Reels</p>
            </div>
          )}

          {activeTab === "tagged" && (
            <div className="py-12 text-center">
              <div className="w-16 h-16 rounded-full bg-white/10 backdrop-blur-xl border border-white/20 flex items-center justify-center mx-auto mb-3">
                <AtSign className="w-8 h-8 text-white/60" />
              </div>
              <h3 className="font-semibold text-white mb-1">Отметки</h3>
              <p className="text-sm text-white/60">Публикации с вашими отметками</p>
            </div>
          )}
        </div>
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
