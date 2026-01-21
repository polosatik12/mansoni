import { Settings, Grid3X3, Bookmark, Play, Plus, AtSign, Share2, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { CreateMenu } from "@/components/feed/CreateMenu";
import { PostEditorFlow } from "@/components/feed/PostEditorFlow";
import { StoryEditorFlow } from "@/components/feed/StoryEditorFlow";
import { SettingsDrawer } from "@/components/profile/SettingsDrawer";
import { AccountSwitcher } from "@/components/profile/AccountSwitcher";

const highlights = [
  { id: "1", name: "..life?", image: "https://images.unsplash.com/photo-1512453979798-5ea266f8880c?w=150&q=80", hasEmoji: true },
  { id: "2", name: "🚗", image: "https://images.unsplash.com/photo-1498050108023-c5249f4df085?w=150&q=80", hasEmoji: true },
  { id: "3", name: "Travel", image: "https://images.unsplash.com/photo-1469474968028-56623f02e42e?w=150&q=80" },
  { id: "4", name: "Food", image: "https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=150&q=80" },
];

const userPosts = [
  { id: "1", image: "https://images.unsplash.com/photo-1461749280684-dccba630e2f6?w=300&q=80", isVideo: true, views: 175 },
  { id: "2", image: "https://images.unsplash.com/photo-1498050108023-c5249f4df085?w=300&q=80", isVideo: false },
  { id: "3", image: "https://images.unsplash.com/photo-1504639725590-34d0984388bd?w=300&q=80", isVideo: false },
  { id: "4", image: "https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=300&q=80", isVideo: false },
  { id: "5", image: "https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=300&q=80", isVideo: true, views: 89 },
  { id: "6", image: "https://images.unsplash.com/photo-1542831371-29b0f74f9713?w=300&q=80", isVideo: false },
  { id: "7", image: "https://images.unsplash.com/photo-1512453979798-5ea266f8880c?w=300&q=80", isVideo: false },
  { id: "8", image: "https://images.unsplash.com/photo-1469474968028-56623f02e42e?w=300&q=80", isVideo: true, views: 234 },
  { id: "9", image: "https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=300&q=80", isVideo: false },
];

const tabs = [
  { id: "posts", icon: Grid3X3 },
  { id: "reels", icon: Play },
  { id: "reposts", icon: Share2 },
  { id: "tagged", icon: AtSign },
];

export function ProfilePage() {
  const [activeTab, setActiveTab] = useState("posts");
  const [showCreateMenu, setShowCreateMenu] = useState(false);
  const [showPostEditor, setShowPostEditor] = useState(false);
  const [showStoryEditor, setShowStoryEditor] = useState(false);
  const [showSettings, setShowSettings] = useState(false);

  const handleCreateSelect = (type: string) => {
    if (type === "post") {
      setShowPostEditor(true);
    } else if (type === "story") {
      setShowStoryEditor(true);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border">
        <Button variant="ghost" size="icon" onClick={() => setShowCreateMenu(true)}>
          <Plus className="w-6 h-6" />
        </Button>
        <AccountSwitcher currentUsername="alex_ivanov" />
        <Button variant="ghost" size="icon" onClick={() => setShowSettings(true)}>
          <Settings className="w-6 h-6" />
        </Button>
      </div>

      {/* Profile Info Row */}
      <div className="px-4 py-4">
        <div className="flex items-start gap-4">
          {/* Avatar with story ring */}
          <div className="relative">
            <div className="w-20 h-20 rounded-full p-0.5 bg-gradient-to-tr from-primary via-accent to-primary">
              <div className="w-full h-full rounded-full bg-card p-0.5">
                <img
                  src="https://i.pravatar.cc/150?img=32"
                  alt="Profile"
                  className="w-full h-full rounded-full object-cover"
                />
              </div>
            </div>
            {/* Add story button */}
            <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-primary border-2 border-card flex items-center justify-center">
              <Plus className="w-4 h-4 text-primary-foreground" />
            </div>
          </div>

          {/* Stats */}
          <div className="flex-1">
            <h1 className="text-lg font-semibold mb-2">Александр Иванов</h1>
            <div className="flex items-center gap-6">
              <div className="text-center">
                <p className="font-bold text-foreground">142</p>
                <p className="text-xs text-muted-foreground">публикации</p>
              </div>
              <div className="text-center">
                <p className="font-bold text-foreground">12.4K</p>
                <p className="text-xs text-muted-foreground">подписчики</p>
              </div>
              <div className="text-center">
                <p className="font-bold text-foreground">892</p>
                <p className="text-xs text-muted-foreground">подписки</p>
              </div>
            </div>
          </div>
        </div>

        {/* Bio */}
        <div className="mt-3">
          <p className="text-sm text-foreground">Предприниматель</p>
        </div>


        {/* Action Buttons */}
        <div className="flex items-center gap-2 mt-4">
          <Button variant="secondary" className="flex-1 rounded-lg h-9">
            Редактировать профиль
          </Button>
          <Button variant="secondary" className="flex-1 rounded-lg h-9">
            Поделиться профилем
          </Button>
        </div>
      </div>

      {/* Highlights */}
      <div className="px-4 pb-4">
        <ScrollArea className="w-full">
          <div className="flex gap-4">
            {/* Add New */}
            <div className="flex flex-col items-center gap-1.5 flex-shrink-0">
              <div className="w-16 h-16 rounded-full border-2 border-border flex items-center justify-center bg-card">
                <Plus className="w-6 h-6 text-foreground" />
              </div>
              <span className="text-xs text-foreground">Добавить</span>
            </div>

            {highlights.map((highlight) => (
              <div key={highlight.id} className="flex flex-col items-center gap-1.5 flex-shrink-0">
                <div className="w-16 h-16 rounded-full p-0.5 bg-muted">
                  <img
                    src={highlight.image}
                    alt={highlight.name}
                    className="w-full h-full rounded-full object-cover"
                  />
                </div>
                <span className="text-xs text-foreground">{highlight.name}</span>
              </div>
            ))}
          </div>
          <ScrollBar orientation="horizontal" className="invisible" />
        </ScrollArea>
      </div>

      {/* Content Tabs */}
      <div className="border-t border-border sticky top-0 z-10 bg-card">
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
      <div>
        {activeTab === "posts" && (
          <div className="grid grid-cols-3 gap-[2px]">
            {userPosts.map((post) => (
              <div key={post.id} className="aspect-square relative group cursor-pointer overflow-hidden">
                <img
                  src={post.image}
                  alt={`Post ${post.id}`}
                  className="w-full h-full object-cover"
                />
                {post.isVideo && (
                  <>
                    <div className="absolute top-2 right-2">
                      <Play className="w-5 h-5 text-white fill-white drop-shadow-lg" />
                    </div>
                    <div className="absolute bottom-2 left-2 flex items-center gap-1">
                      <Eye className="w-4 h-4 text-white drop-shadow-lg" />
                      <span className="text-white text-xs font-medium drop-shadow-lg">{post.views}</span>
                    </div>
                  </>
                )}
              </div>
            ))}
          </div>
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

        {activeTab === "reposts" && (
          <div className="p-12 text-center">
            <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mx-auto mb-3">
              <Share2 className="w-8 h-8 text-muted-foreground" />
            </div>
            <h3 className="font-semibold text-foreground mb-1">Репосты</h3>
            <p className="text-sm text-muted-foreground">Публикации, которыми вы поделились</p>
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
    </div>
  );
}
