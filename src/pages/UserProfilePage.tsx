import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Settings, Grid3X3, Bookmark, Heart, Share2, Play, MoreHorizontal, BadgeCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";

// Mock user data - in real app this would come from API
const usersData: Record<string, {
  name: string;
  username: string;
  avatar: string;
  cover: string;
  verified: boolean;
  bio: string;
  website: string;
  posts: number;
  followers: string;
  following: number;
  isFollowing: boolean;
  highlights: { id: string; name: string; image: string }[];
  userPosts: { id: string; image: string; isVideo: boolean }[];
}> = {
  "techbro": {
    name: "Дмитрий Петров",
    username: "techbro",
    avatar: "https://i.pravatar.cc/150?img=11",
    cover: "https://images.unsplash.com/photo-1518770660439-4636190af475?w=800&q=80",
    verified: true,
    bio: "Tech enthusiast & Developer. Love building amazing products. 🚀",
    website: "techbro.dev",
    posts: 89,
    followers: "45.2K",
    following: 234,
    isFollowing: false,
    highlights: [
      { id: "1", name: "Tech", image: "https://images.unsplash.com/photo-1518770660439-4636190af475?w=150&q=80" },
      { id: "2", name: "Code", image: "https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=150&q=80" },
    ],
    userPosts: [
      { id: "1", image: "https://images.unsplash.com/photo-1461749280684-dccba630e2f6?w=300&q=80", isVideo: false },
      { id: "2", image: "https://images.unsplash.com/photo-1498050108023-c5249f4df085?w=300&q=80", isVideo: true },
      { id: "3", image: "https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=300&q=80", isVideo: false },
    ],
  },
  "figma.create": {
    name: "Figma Create",
    username: "figma.create",
    avatar: "https://i.pravatar.cc/150?img=15",
    cover: "https://images.unsplash.com/photo-1558655146-9f40138edfeb?w=800&q=80",
    verified: true,
    bio: "Official Figma design community. Share your designs! 🎨",
    website: "figma.com",
    posts: 1240,
    followers: "2.1M",
    following: 12,
    isFollowing: true,
    highlights: [
      { id: "1", name: "UI Kits", image: "https://images.unsplash.com/photo-1558655146-9f40138edfeb?w=150&q=80" },
      { id: "2", name: "Icons", image: "https://images.unsplash.com/photo-1611162617474-5b21e879e113?w=150&q=80" },
    ],
    userPosts: [
      { id: "1", image: "https://images.unsplash.com/photo-1558655146-9f40138edfeb?w=300&q=80", isVideo: false },
      { id: "2", image: "https://images.unsplash.com/photo-1611162617474-5b21e879e113?w=300&q=80", isVideo: false },
    ],
  },
};

const defaultUser = {
  name: "Пользователь",
  username: "user",
  avatar: "https://i.pravatar.cc/150?img=1",
  cover: "https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=800&q=80",
  verified: false,
  bio: "Привет! Это мой профиль.",
  website: "",
  posts: 0,
  followers: "0",
  following: 0,
  isFollowing: false,
  highlights: [],
  userPosts: [],
};

const tabs = [
  { id: "posts", icon: Grid3X3 },
  { id: "saved", icon: Bookmark },
  { id: "liked", icon: Heart },
];

export function UserProfilePage() {
  const { username } = useParams<{ username: string }>();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("posts");
  const [isFollowing, setIsFollowing] = useState(false);

  const user = username && usersData[username] ? usersData[username] : defaultUser;

  return (
    <div className="fixed inset-0 flex flex-col bg-background z-[60]">
      {/* Header */}
      <div className="flex-shrink-0 flex items-center gap-3 px-4 py-3 border-b border-border bg-card safe-area-top">
        <Button variant="ghost" size="icon" onClick={() => navigate(-1)} className="shrink-0">
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5">
            <h2 className="font-semibold text-foreground truncate">{user.username}</h2>
            {user.verified && (
              <BadgeCheck className="w-4 h-4 text-primary fill-primary stroke-primary-foreground" />
            )}
          </div>
          <p className="text-xs text-muted-foreground">{user.posts} публикаций</p>
        </div>
        <Button variant="ghost" size="icon">
          <MoreHorizontal className="w-5 h-5" />
        </Button>
      </div>

      {/* Scrollable Content */}
      <div className="flex-1 overflow-y-auto native-scroll">
        {/* Cover Image */}
        <div className="relative h-36">
          <img
            src={user.cover}
            alt="Cover"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
        </div>

        {/* Avatar */}
        <div className="relative z-10 -mt-12 ml-4 mb-4">
          <div className="w-20 h-20 rounded-full border-4 border-card bg-card overflow-hidden shadow-lg">
            <img
              src={user.avatar}
              alt="Profile"
              className="w-full h-full object-cover"
            />
          </div>
        </div>

        {/* Profile Info */}
        <div className="bg-card px-4 pb-4">
          {/* Name & Verified */}
          <div className="flex items-center gap-2 mb-1">
            <h1 className="text-lg font-bold text-foreground">{user.name}</h1>
            {user.verified && (
              <BadgeCheck className="w-5 h-5 text-primary fill-primary stroke-primary-foreground" />
            )}
          </div>
          
          <p className="text-muted-foreground text-sm mb-3">@{user.username}</p>

          {/* Action Buttons */}
          <div className="flex items-center gap-3 mb-4">
            <Button 
              onClick={() => setIsFollowing(!isFollowing)}
              variant={isFollowing ? "outline" : "default"}
              className="rounded-full px-8 flex-1"
            >
              {isFollowing ? "Отписаться" : "Подписаться"}
            </Button>
            <Button variant="outline" className="rounded-full px-6">
              Сообщение
            </Button>
          </div>

          {/* Bio */}
          {user.bio && (
            <p className="text-foreground mb-3 text-sm leading-relaxed">
              {user.bio}
            </p>
          )}

          {/* Website Link */}
          {user.website && (
            <a href="#" className="text-primary font-medium text-sm mb-4 block">
              {user.website}
            </a>
          )}

          {/* Stats */}
          <div className="flex items-center gap-8 py-4 border-y border-border">
            <div className="text-center">
              <p className="text-lg font-bold text-foreground">{user.posts}</p>
              <p className="text-xs text-muted-foreground">Постов</p>
            </div>
            <div className="text-center">
              <p className="text-lg font-bold text-foreground">{user.followers}</p>
              <p className="text-xs text-muted-foreground">Подписчиков</p>
            </div>
            <div className="text-center">
              <p className="text-lg font-bold text-foreground">{user.following}</p>
              <p className="text-xs text-muted-foreground">Подписок</p>
            </div>
          </div>
        </div>

        {/* Highlights */}
        {user.highlights.length > 0 && (
          <div className="bg-card px-4 py-4">
            <ScrollArea className="w-full">
              <div className="flex gap-4">
                {user.highlights.map((highlight) => (
                  <div key={highlight.id} className="flex flex-col items-center gap-2 flex-shrink-0">
                    <div className="w-14 h-14 rounded-full p-0.5 bg-gradient-to-tr from-primary via-accent to-primary">
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
              </div>
              <ScrollBar orientation="horizontal" className="invisible" />
            </ScrollArea>
          </div>
        )}

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
          {activeTab === "posts" && user.userPosts.length > 0 && (
            <div className="grid grid-cols-3 gap-[2px]">
              {user.userPosts.map((post) => (
                <div key={post.id} className="aspect-square relative group cursor-pointer overflow-hidden">
                  <img
                    src={post.image}
                    alt={`Post ${post.id}`}
                    className="w-full h-full object-cover transition-transform group-hover:scale-105"
                  />
                  {post.isVideo && (
                    <div className="absolute top-2 right-2">
                      <div className="w-6 h-6 rounded-full bg-black/60 flex items-center justify-center">
                        <Play className="w-3 h-3 text-white fill-white ml-0.5" />
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {activeTab === "posts" && user.userPosts.length === 0 && (
            <div className="p-12 text-center">
              <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mx-auto mb-3">
                <Grid3X3 className="w-8 h-8 text-muted-foreground" />
              </div>
              <h3 className="font-semibold text-foreground mb-1">Нет публикаций</h3>
              <p className="text-sm text-muted-foreground">Пользователь ещё ничего не опубликовал</p>
            </div>
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
