import { Search, Filter, Users, Hash, TrendingUp, Sparkles } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { useState } from "react";

const filterTabs = [
  { id: "all", label: "Все", icon: Sparkles },
  { id: "people", label: "Люди", icon: Users },
  { id: "tags", label: "Теги", icon: Hash },
  { id: "trends", label: "Тренды", icon: TrendingUp },
];

const trends = [
  { tag: "NFT2024", posts: "125K", growth: "+24%" },
  { tag: "Dubai", posts: "89K", growth: "+18%" },
  { tag: "Crypto", posts: "234K", growth: "+12%" },
  { tag: "AI", posts: "456K", growth: "+45%" },
  { tag: "Startup", posts: "67K", growth: "+8%" },
  { tag: "Tech", posts: "189K", growth: "+15%" },
];

const recommendations = [
  { name: "Дмитрий Волков", username: "dvolkov", avatar: "https://i.pravatar.cc/150?img=11", followers: "124K" },
  { name: "Анна Петрова", username: "anna_p", avatar: "https://i.pravatar.cc/150?img=5", followers: "89K" },
  { name: "Максим Козлов", username: "max_koz", avatar: "https://i.pravatar.cc/150?img=12", followers: "56K" },
  { name: "Елена Смирнова", username: "elena_s", avatar: "https://i.pravatar.cc/150?img=9", followers: "234K" },
];

export function SearchPage() {
  const [activeFilter, setActiveFilter] = useState("all");

  return (
    <div className="min-h-screen p-4 space-y-6">
      {/* Search Bar */}
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
          <Input
            placeholder="Поиск людей, тегов, постов..."
            className="pl-10 h-12 rounded-xl bg-card border-border"
          />
        </div>
        <Button variant="outline" size="icon" className="h-12 w-12 rounded-xl">
          <Filter className="w-5 h-5" />
        </Button>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2 overflow-x-auto scrollbar-hide">
        {filterTabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveFilter(tab.id)}
            className={cn(
              "flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all",
              activeFilter === tab.id
                ? "bg-primary text-primary-foreground"
                : "bg-muted text-muted-foreground hover:bg-muted/80"
            )}
          >
            <tab.icon className="w-4 h-4" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Trends */}
      <div className="bg-card rounded-2xl border border-border p-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-primary" />
            <h2 className="font-semibold text-foreground">Тренды</h2>
          </div>
          <button className="text-primary text-sm font-medium">Все</button>
        </div>
        <div className="grid grid-cols-2 gap-3">
          {trends.map((trend) => (
            <div
              key={trend.tag}
              className="bg-muted rounded-xl p-3 hover:bg-muted/80 transition-colors cursor-pointer"
            >
              <div className="flex items-center gap-1.5 mb-1">
                <Hash className="w-4 h-4 text-primary" />
                <span className="font-semibold text-foreground">{trend.tag}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">{trend.posts} постов</span>
                <span className="text-xs text-green-500 font-medium">{trend.growth}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Recommendations */}
      <div className="bg-card rounded-2xl border border-border p-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Users className="w-5 h-5 text-muted-foreground" />
            <h2 className="font-semibold text-foreground">Рекомендации</h2>
          </div>
          <button className="text-primary text-sm font-medium">Все</button>
        </div>
        <div className="space-y-4">
          {recommendations.map((user) => (
            <div key={user.username} className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <img
                  src={user.avatar}
                  alt={user.name}
                  className="w-12 h-12 rounded-full object-cover"
                />
                <div>
                  <p className="font-semibold text-foreground">{user.name}</p>
                  <p className="text-sm text-muted-foreground">@{user.username}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-sm text-muted-foreground">{user.followers}</span>
                <Button size="sm" className="rounded-full">
                  Подписаться
                </Button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Interesting section */}
      <div className="bg-card rounded-2xl border border-border p-4">
        <div className="flex items-center gap-2 mb-4">
          <Sparkles className="w-5 h-5 text-primary" />
          <h2 className="font-semibold text-foreground">Интересное</h2>
        </div>
        <div className="flex gap-3 overflow-x-auto scrollbar-hide">
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="flex-shrink-0 w-32 h-44 rounded-xl overflow-hidden relative"
            >
              <img
                src={`https://images.unsplash.com/photo-${1500000000000 + i * 100}?w=200&q=80`}
                alt="Reel"
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
              <div className="absolute bottom-2 left-2 right-2">
                <div className="w-8 h-8 rounded-full bg-primary/90 flex items-center justify-center">
                  <div className="w-0 h-0 border-l-[8px] border-l-white border-y-[5px] border-y-transparent ml-1" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
