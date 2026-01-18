import { Search, Play, Hash } from "lucide-react";
import { Input } from "@/components/ui/input";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";

const trends = [
  { tag: "NFT2024", posts: "125K" },
  { tag: "Dubai", posts: "89K" },
  { tag: "Crypto", posts: "234K" },
  { tag: "AI", posts: "456K" },
];

const explorePosts = [
  { id: "1", image: "https://images.unsplash.com/photo-1461749280684-dccba630e2f6?w=400&q=80", isVideo: false },
  { id: "2", image: "https://images.unsplash.com/photo-1498050108023-c5249f4df085?w=400&q=80", isVideo: true },
  { id: "3", image: "https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=400&q=80", isVideo: false },
  { id: "4", image: "https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=400&q=80", isVideo: false },
  { id: "5", image: "https://images.unsplash.com/photo-1542831371-29b0f74f9713?w=400&q=80", isVideo: true },
  { id: "6", image: "https://images.unsplash.com/photo-1504639725590-34d0984388bd?w=400&q=80", isVideo: false },
  { id: "7", image: "https://images.unsplash.com/photo-1512453979798-5ea266f8880c?w=400&q=80", isVideo: false },
  { id: "8", image: "https://images.unsplash.com/photo-1469474968028-56623f02e42e?w=400&q=80", isVideo: true },
  { id: "9", image: "https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=400&q=80", isVideo: false },
  { id: "10", image: "https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=400&q=80", isVideo: false },
  { id: "11", image: "https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=400&q=80", isVideo: true },
  { id: "12", image: "https://images.unsplash.com/photo-1518770660439-4636190af475?w=400&q=80", isVideo: false },
  { id: "13", image: "https://images.unsplash.com/photo-1531297484001-80022131f5a1?w=400&q=80", isVideo: false },
  { id: "14", image: "https://images.unsplash.com/photo-1488590528505-98d2b5aba04b?w=400&q=80", isVideo: true },
  { id: "15", image: "https://images.unsplash.com/photo-1519389950473-47ba0277781c?w=400&q=80", isVideo: false },
  { id: "16", image: "https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=400&q=80", isVideo: false },
  { id: "17", image: "https://images.unsplash.com/photo-1504868584819-f8e8b4b6d7e3?w=400&q=80", isVideo: true },
  { id: "18", image: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=400&q=80", isVideo: false },
];

export function SearchPage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Search Bar */}
      <div className="sticky top-0 z-10 bg-background p-3 pb-0">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
          <Input
            placeholder="Поиск"
            className="pl-10 h-11 rounded-xl bg-muted border-0"
          />
        </div>
      </div>

      {/* Hashtags */}
      <div className="px-3 py-3 flex items-center gap-2">
        <div className="flex-1 overflow-x-auto scrollbar-hide">
          <div className="flex gap-2">
            {trends.map((trend) => (
              <button
                key={trend.tag}
                className="flex items-center gap-1.5 px-4 py-2 bg-muted rounded-full flex-shrink-0 active:opacity-70 transition-opacity"
              >
                <Hash className="w-4 h-4 text-primary" />
                <span className="font-medium text-sm">{trend.tag}</span>
                <span className="text-xs text-muted-foreground">{trend.posts}</span>
              </button>
            ))}
          </div>
        </div>
        <button className="px-3 py-2 text-primary font-medium text-sm flex-shrink-0">
          Все
        </button>
      </div>

      {/* Explore Grid */}
      <div className="grid grid-cols-3 gap-[1px]">
        {explorePosts.map((post) => (
          <div
            key={post.id}
            className="aspect-square relative cursor-pointer overflow-hidden"
          >
            <img
              src={post.image}
              alt=""
              className="w-full h-full object-cover"
            />
            {post.isVideo && (
              <div className="absolute top-2 right-2">
                <Play className="w-5 h-5 text-white fill-white drop-shadow-lg" />
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
