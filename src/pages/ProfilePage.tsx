import { Settings, Grid3X3, Bookmark, Play, Plus, AtSign, MessageCircle, Phone, Video, Mail, User, Loader2, ChevronLeft } from "lucide-react";
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
  { id: "posts", label: "Публикации", icon: Grid3X3 },
  { id: "saved", label: "Сохранённое", icon: Bookmark },
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

  const getPostImage = (post: any): string | null => {
    if (post.post_media && post.post_media.length > 0) {
      return post.post_media[0].media_url;
    }
    return null;
  };

  if (profileLoading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-white/60" />
      </div>
    );
  }

  if (!user || !profile) {
    return (
      <div className="min-h-screen bg-black flex flex-col items-center justify-center p-4">
        <User className="w-16 h-16 text-white/60 mb-4" />
        <h2 className="text-lg font-semibold text-white mb-2">Войдите в аккаунт</h2>
        <p className="text-white/60 text-center mb-4">
          Чтобы просматривать свой профиль, войдите в аккаунт
        </p>
        <Button onClick={() => window.location.href = '/auth'} className="bg-white/20 backdrop-blur-xl text-white border border-white/30">
          Войти
        </Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Aurora Background */}
      <div className="fixed inset-0 bg-gradient-to-br from-slate-900 via-purple-900/80 to-slate-900">
        {/* Animated gradient orbs */}
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-cyan-500/30 rounded-full blur-3xl animate-pulse" />
        <div className="absolute top-1/3 right-1/4 w-80 h-80 bg-blue-500/25 rounded-full blur-3xl animate-pulse delay-1000" />
        <div className="absolute bottom-1/4 left-1/3 w-72 h-72 bg-violet-500/30 rounded-full blur-3xl animate-pulse delay-500" />
        <div className="absolute top-1/2 right-1/3 w-64 h-64 bg-indigo-400/20 rounded-full blur-3xl animate-pulse delay-700" />
      </div>

      {/* Content */}
      <div className="relative z-10 pb-24">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 pt-safe">
          <button className="w-10 h-10 rounded-full bg-white/10 backdrop-blur-xl border border-white/20 flex items-center justify-center">
            <ChevronLeft className="w-5 h-5 text-white" />
          </button>
          <button 
            onClick={() => setShowSettings(true)}
            className="px-4 py-2 rounded-full bg-white/10 backdrop-blur-xl border border-white/20 text-white text-sm font-medium"
          >
            Настройки
          </button>
        </div>

        {/* Profile Hero Section */}
        <div className="flex flex-col items-center px-4 pt-8 pb-6">
          {/* Large Glass Avatar */}
          <button 
            className="relative mb-6"
            onClick={() => setShowCreateMenu(true)}
          >
            {/* Outer glass ring */}
            <div className="absolute -inset-3 rounded-full bg-gradient-to-br from-white/30 via-white/10 to-white/5 backdrop-blur-xl border border-white/30" />
            {/* Inner glass ring */}
            <div className="absolute -inset-1.5 rounded-full bg-white/10 backdrop-blur-md" />
            {/* Avatar */}
            <Avatar className="w-32 h-32 border-2 border-white/40 relative">
              <AvatarImage src={profile.avatar_url || undefined} alt={profile.display_name || 'Profile'} />
              <AvatarFallback className="bg-white/20 backdrop-blur-xl text-white text-4xl font-light">
                {profile.display_name?.charAt(0)?.toUpperCase() || <User className="w-12 h-12" />}
              </AvatarFallback>
            </Avatar>
            {/* Add story button */}
            <div className="absolute -bottom-1 -right-1 w-8 h-8 rounded-full bg-blue-500 border-2 border-white/50 flex items-center justify-center shadow-lg shadow-blue-500/30">
              <Plus className="w-5 h-5 text-white" />
            </div>
          </button>

          {/* Name */}
          <div className="flex items-center gap-2 mb-2">
            <h1 className="text-3xl font-semibold text-white">{profile.display_name || 'Пользователь'}</h1>
            {profile.verified && <VerifiedBadge size="lg" />}
          </div>

          {/* Bio */}
          {profile.bio && (
            <p className="text-white/70 text-center text-sm max-w-xs mb-4">{profile.bio}</p>
          )}

          {/* Stats Row */}
          <div className="flex items-center gap-8 mb-6">
            <div className="text-center">
              <p className="text-xl font-bold text-white">{profile.stats.postsCount}</p>
              <p className="text-xs text-white/60">публикаций</p>
            </div>
            <button onClick={() => setShowFollowers(true)} className="text-center">
              <p className="text-xl font-bold text-white">{formatNumber(profile.stats.followersCount)}</p>
              <p className="text-xs text-white/60">подписчиков</p>
            </button>
            <button onClick={() => setShowFollowing(true)} className="text-center">
              <p className="text-xl font-bold text-white">{formatNumber(profile.stats.followingCount)}</p>
              <p className="text-xs text-white/60">подписок</p>
            </button>
          </div>

          {/* Action Buttons Row */}
          <div className="flex items-center gap-4 mb-6">
            <button className="w-12 h-12 rounded-full bg-white/15 backdrop-blur-xl border border-white/25 flex items-center justify-center hover:bg-white/25 transition-colors">
              <MessageCircle className="w-5 h-5 text-white" />
            </button>
            <button className="w-12 h-12 rounded-full bg-white/15 backdrop-blur-xl border border-white/25 flex items-center justify-center hover:bg-white/25 transition-colors">
              <Phone className="w-5 h-5 text-white" />
            </button>
            <button className="w-12 h-12 rounded-full bg-white/15 backdrop-blur-xl border border-white/25 flex items-center justify-center hover:bg-white/25 transition-colors">
              <Video className="w-5 h-5 text-white" />
            </button>
            <button className="w-12 h-12 rounded-full bg-white/15 backdrop-blur-xl border border-white/25 flex items-center justify-center hover:bg-white/25 transition-colors">
              <Mail className="w-5 h-5 text-white" />
            </button>
          </div>

          {/* Edit Profile Button */}
          <button 
            onClick={() => navigate('/profile/edit')}
            className="px-6 py-2.5 rounded-full bg-white/15 backdrop-blur-xl border border-white/25 text-white text-sm font-medium hover:bg-white/25 transition-colors"
          >
            Редактировать профиль
          </button>
        </div>

        {/* Glass Tabs */}
        <div className="flex justify-center gap-2 px-4 mb-4">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => handleTabChange(tab.id)}
              className={cn(
                "px-5 py-2.5 rounded-full text-sm font-medium transition-all",
                activeTab === tab.id
                  ? "bg-white/25 backdrop-blur-xl border border-white/40 text-white shadow-lg"
                  : "bg-white/10 backdrop-blur-xl border border-white/20 text-white/70 hover:bg-white/15"
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Content Cards */}
        <div className="px-4">
          {/* Glass Card Container */}
          <div className="bg-white/10 backdrop-blur-xl rounded-3xl border border-white/20 overflow-hidden min-h-[300px]">
            {activeTab === "posts" && (
              <>
                {postsLoading ? (
                  <div className="p-12 flex justify-center">
                    <Loader2 className="w-8 h-8 animate-spin text-white/60" />
                  </div>
                ) : posts.length > 0 ? (
                  <div className="grid grid-cols-3 gap-[1px]">
                    {posts.map((post) => {
                      const imageUrl = getPostImage(post);
                      const isVideo = post.post_media?.[0]?.media_type === 'video';
                      return (
                        <div key={post.id} className="aspect-square relative group cursor-pointer overflow-hidden bg-white/5">
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
                            <div className="absolute top-2 right-2">
                              <Play className="w-5 h-5 text-white fill-white drop-shadow-lg" />
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="p-12 text-center">
                    <div className="w-16 h-16 rounded-full bg-white/10 backdrop-blur-xl flex items-center justify-center mx-auto mb-3">
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
                  <div className="grid grid-cols-3 gap-[1px]">
                    {savedPosts.map((post: any) => {
                      const imageUrl = post.post_media?.[0]?.media_url;
                      return (
                        <div key={post.id} className="aspect-square relative group cursor-pointer overflow-hidden bg-white/5">
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
                  <div className="p-12 text-center">
                    <div className="w-16 h-16 rounded-full bg-white/10 backdrop-blur-xl flex items-center justify-center mx-auto mb-3">
                      <Bookmark className="w-8 h-8 text-white/60" />
                    </div>
                    <h3 className="font-semibold text-white mb-1">Сохранённое</h3>
                    <p className="text-sm text-white/60">Сохраняйте понравившиеся публикации</p>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>

      {/* Modals */}
      <CreateMenu 
        isOpen={showCreateMenu} 
        onClose={() => setShowCreateMenu(false)} 
        onSelect={handleCreateSelect}
      />
      <PostEditorFlow 
        isOpen={showPostEditor} 
        onClose={() => setShowPostEditor(false)} 
      />
      <StoryEditorFlow 
        isOpen={showStoryEditor} 
        onClose={() => setShowStoryEditor(false)} 
      />
      <SettingsDrawer 
        isOpen={showSettings} 
        onClose={() => setShowSettings(false)} 
      />
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
