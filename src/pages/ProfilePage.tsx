import { Settings, Edit3, Grid3X3, Bookmark, Heart, Share2, Plus, Play } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";

const highlights = [
  { id: "1", name: "Dubai", image: "https://images.unsplash.com/photo-1512453979798-5ea266f8880c?w=150&q=80" },
  { id: "2", name: "Work", image: "https://images.unsplash.com/photo-1498050108023-c5249f4df085?w=150&q=80" },
  { id: "3", name: "Travel", image: "https://images.unsplash.com/photo-1469474968028-56623f02e42e?w=150&q=80" },
  { id: "4", name: "Food", image: "https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=150&q=80" },
  { id: "5", name: "Tech", image: "https://images.unsplash.com/photo-1518770660439-4636190af475?w=150&q=80" },
];

const userPosts = [
  { id: "1", image: "https://images.unsplash.com/photo-1461749280684-dccba630e2f6?w=300&q=80", isVideo: true },
  { id: "2", image: "https://images.unsplash.com/photo-1498050108023-c5249f4df085?w=300&q=80", isVideo: false },
  { id: "3", image: "https://images.unsplash.com/photo-1504639725590-34d0984388bd?w=300&q=80", isVideo: false },
  { id: "4", image: "https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=300&q=80", isVideo: false },
  { id: "5", image: "https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=300&q=80", isVideo: true },
  { id: "6", image: "https://images.unsplash.com/photo-1542831371-29b0f74f9713?w=300&q=80", isVideo: false },
  { id: "7", image: "https://images.unsplash.com/photo-1512453979798-5ea266f8880c?w=300&q=80", isVideo: false },
  { id: "8", image: "https://images.unsplash.com/photo-1469474968028-56623f02e42e?w=300&q=80", isVideo: true },
  { id: "9", image: "https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=300&q=80", isVideo: false },
];

const tabs = [
  { id: "posts", icon: Grid3X3, count: 142 },
  { id: "saved", icon: Bookmark, count: 56 },
  { id: "liked", icon: Heart, count: 234 },
];

export function ProfilePage() {
  const [activeTab, setActiveTab] = useState("posts");

  return (
    <div className="min-h-screen bg-background -mt-14">
      {/* Cover Image */}
      <div className="relative h-48">
        <img
          src="https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=800&q=80"
          alt="Cover"
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
        
        {/* Top Actions */}
        <div className="absolute top-4 right-4 flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            className="bg-black/30 hover:bg-black/50 text-white rounded-full backdrop-blur-sm"
          >
            <Share2 className="w-5 h-5" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="bg-black/30 hover:bg-black/50 text-white rounded-full backdrop-blur-sm"
          >
            <Settings className="w-5 h-5" />
          </Button>
        </div>

        {/* Avatar */}
        <div className="absolute -bottom-16 left-4">
          <div className="w-28 h-28 rounded-full border-4 border-card bg-card overflow-hidden shadow-lg">
            <img
              src="https://i.pravatar.cc/150?img=32"
              alt="Profile"
              className="w-full h-full object-cover"
            />
          </div>
        </div>
      </div>

      {/* Profile Info */}
      <div className="bg-card rounded-t-3xl -mt-4 relative pt-14 px-4 pb-4">
        {/* Name & Verified */}
        <div className="flex items-center gap-2 mb-1">
          <h1 className="text-xl font-bold text-foreground">Александр Иванов</h1>
          <div className="w-5 h-5 rounded-full bg-amber-400 flex items-center justify-center">
            <span className="text-white text-xs">★</span>
          </div>
        </div>
        
        <p className="text-muted-foreground text-sm mb-3">@alex_ivanov</p>

        {/* Action Buttons */}
        <div className="flex items-center gap-3 mb-4">
          <Button className="rounded-full gap-2 px-6">
            <Edit3 className="w-4 h-4" />
            Редактировать
          </Button>
          <Button variant="outline" size="icon" className="rounded-full">
            <span className="text-lg">•••</span>
          </Button>
        </div>

        {/* Bio */}
        <p className="text-foreground mb-3 text-[15px] leading-relaxed">
          Product Designer & Developer. Building the future of digital experiences. Passionate about Web3, AI, and creating beautiful interfaces.
        </p>

        {/* Website Link */}
        <a href="#" className="text-primary font-medium text-sm mb-4 block">
          nexus.design
        </a>

        {/* Stats */}
        <div className="flex items-center gap-8 py-4 border-y border-border">
          <div className="text-center">
            <p className="text-xl font-bold text-foreground">142</p>
            <p className="text-sm text-muted-foreground">Постов</p>
          </div>
          <div className="text-center">
            <p className="text-xl font-bold text-foreground">12.4K</p>
            <p className="text-sm text-muted-foreground">Подписчиков</p>
          </div>
          <div className="text-center">
            <p className="text-xl font-bold text-foreground">892</p>
            <p className="text-sm text-muted-foreground">Подписок</p>
          </div>
        </div>
      </div>

      {/* Highlights */}
      <div className="bg-card px-4 py-4">
        <ScrollArea className="w-full">
          <div className="flex gap-4">
            {highlights.map((highlight) => (
              <div key={highlight.id} className="flex flex-col items-center gap-2 flex-shrink-0">
                <div className="w-16 h-16 rounded-full p-0.5 bg-gradient-to-tr from-primary via-accent to-primary">
                  <div className="w-full h-full rounded-full bg-card p-0.5">
                    <img
                      src={highlight.image}
                      alt={highlight.name}
                      className="w-full h-full rounded-full object-cover"
                    />
                  </div>
                </div>
                <span className="text-xs text-foreground font-medium">{highlight.name}</span>
              </div>
            ))}
            
            {/* Add New Highlight */}
            <div className="flex flex-col items-center gap-2 flex-shrink-0">
              <div className="w-16 h-16 rounded-full border-2 border-dashed border-muted-foreground/30 flex items-center justify-center">
                <Plus className="w-6 h-6 text-muted-foreground" />
              </div>
              <span className="text-xs text-muted-foreground font-medium">Новое</span>
            </div>
          </div>
          <ScrollBar orientation="horizontal" className="invisible" />
        </ScrollArea>
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
                  "flex-1 flex items-center justify-center gap-2 py-3 transition-all border-b-2",
                  isActive
                    ? "border-primary text-primary bg-primary/5"
                    : "border-transparent text-muted-foreground hover:text-foreground"
                )}
              >
                <Icon className="w-5 h-5" />
                <span className="text-sm font-medium">({tab.count})</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Posts Grid */}
      <div className="bg-card">
        {activeTab === "posts" && (
          <div className="grid grid-cols-3 gap-0.5">
            {userPosts.map((post) => (
              <div key={post.id} className="aspect-square relative group cursor-pointer">
                <img
                  src={post.image}
                  alt={`Post ${post.id}`}
                  className="w-full h-full object-cover"
                />
                {post.isVideo && (
                  <div className="absolute top-2 right-2">
                    <div className="w-6 h-6 rounded-full bg-black/50 backdrop-blur-sm flex items-center justify-center">
                      <Play className="w-3 h-3 text-white fill-white" />
                    </div>
                  </div>
                )}
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors" />
              </div>
            ))}
          </div>
        )}

        {activeTab === "saved" && (
          <div className="p-12 text-center">
            <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mx-auto mb-3">
              <Bookmark className="w-8 h-8 text-muted-foreground" />
            </div>
            <h3 className="font-semibold text-foreground mb-1">Сохранённые посты</h3>
            <p className="text-sm text-muted-foreground">Сохраняйте интересные посты</p>
          </div>
        )}

        {activeTab === "liked" && (
          <div className="p-12 text-center">
            <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mx-auto mb-3">
              <Heart className="w-8 h-8 text-muted-foreground" />
            </div>
            <h3 className="font-semibold text-foreground mb-1">Понравившиеся</h3>
            <p className="text-sm text-muted-foreground">Посты, которые вам понравились</p>
          </div>
        )}
      </div>
    </div>
  );
}
