import { Play, Heart, MessageCircle, Share2, Music2, Pause } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";

const reels = [
  {
    id: "1",
    video: "https://images.unsplash.com/photo-1512453979798-5ea266f8880c?w=400&q=80",
    author: { name: "dubai_life", avatar: "https://i.pravatar.cc/150?img=15" },
    description: "Закат в Дубае 🌅 #dubai #sunset #travel",
    music: "Original Sound - dubai_life",
    likes: 45200,
    comments: 892,
  },
  {
    id: "2",
    video: "https://images.unsplash.com/photo-1461749280684-dccba630e2f6?w=400&q=80",
    author: { name: "tech_tips", avatar: "https://i.pravatar.cc/150?img=20" },
    description: "Лайфхак для разработчиков 💻 #coding #dev #tips",
    music: "Tech Vibes - Lofi Beats",
    likes: 23100,
    comments: 456,
  },
  {
    id: "3",
    video: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&q=80",
    author: { name: "lifestyle", avatar: "https://i.pravatar.cc/150?img=5" },
    description: "Утренняя рутина успешного человека ✨ #morning #routine",
    music: "Calm Morning - Relaxing",
    likes: 67800,
    comments: 1234,
  },
];

export function ReelsPage() {
  const [currentReel, setCurrentReel] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);
  const [likedReels, setLikedReels] = useState<Set<string>>(new Set());

  const formatNumber = (num: number) => {
    if (num >= 1000) {
      return (num / 1000).toFixed(1) + "K";
    }
    return num.toString();
  };

  const toggleLike = (id: string) => {
    const newLiked = new Set(likedReels);
    if (newLiked.has(id)) {
      newLiked.delete(id);
    } else {
      newLiked.add(id);
    }
    setLikedReels(newLiked);
  };

  const reel = reels[currentReel];

  return (
    <div className="fixed inset-0 bg-black">
      {/* Reel Content */}
      <div className="relative h-full">
        {/* Background Image (simulating video) */}
        <img
          src={reel.video}
          alt=""
          className="w-full h-full object-cover"
          onClick={() => setIsPlaying(!isPlaying)}
        />

        {/* Play/Pause overlay */}
        {!isPlaying && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/30">
            <Play className="w-20 h-20 text-white fill-white" />
          </div>
        )}

        {/* Gradient overlays */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/30 pointer-events-none" />

        {/* Top bar */}
        <div className="absolute top-4 left-4 right-4 flex items-center justify-between">
          <h1 className="text-white font-bold text-xl">Reels</h1>
          <div className="flex items-center gap-2">
            {reels.map((_, i) => (
              <div
                key={i}
                className={cn(
                  "h-1 rounded-full transition-all",
                  i === currentReel ? "w-6 bg-white" : "w-2 bg-white/50"
                )}
              />
            ))}
          </div>
        </div>

        {/* Right sidebar actions */}
        <div className="absolute right-4 bottom-32 flex flex-col items-center gap-6">
          <button
            onClick={() => toggleLike(reel.id)}
            className="flex flex-col items-center gap-1"
          >
            <Heart
              className={cn(
                "w-8 h-8 transition-colors",
                likedReels.has(reel.id)
                  ? "text-red-500 fill-red-500"
                  : "text-white"
              )}
            />
            <span className="text-white text-xs font-medium">
              {formatNumber(reel.likes + (likedReels.has(reel.id) ? 1 : 0))}
            </span>
          </button>

          <button className="flex flex-col items-center gap-1">
            <MessageCircle className="w-8 h-8 text-white" />
            <span className="text-white text-xs font-medium">
              {formatNumber(reel.comments)}
            </span>
          </button>

          <button className="flex flex-col items-center gap-1">
            <Share2 className="w-8 h-8 text-white" />
            <span className="text-white text-xs font-medium">Поделиться</span>
          </button>

          <img
            src={reel.author.avatar}
            alt=""
            className="w-10 h-10 rounded-lg border-2 border-white object-cover"
          />
        </div>

        {/* Bottom info */}
        <div className="absolute left-4 right-20 bottom-24">
          <div className="flex items-center gap-2 mb-2">
            <img
              src={reel.author.avatar}
              alt=""
              className="w-10 h-10 rounded-full border-2 border-white object-cover"
            />
            <span className="text-white font-semibold">@{reel.author.name}</span>
            <button className="text-white text-sm border border-white rounded-full px-3 py-0.5">
              Подписаться
            </button>
          </div>
          <p className="text-white text-sm mb-2">{reel.description}</p>
          <div className="flex items-center gap-2">
            <Music2 className="w-4 h-4 text-white" />
            <span className="text-white text-xs">{reel.music}</span>
          </div>
        </div>

        {/* Navigation */}
        <div className="absolute left-0 right-0 top-1/2 -translate-y-1/2 flex justify-between px-2 pointer-events-none">
          <button
            onClick={() => setCurrentReel(Math.max(0, currentReel - 1))}
            className="w-12 h-24 pointer-events-auto"
          />
          <button
            onClick={() => setCurrentReel(Math.min(reels.length - 1, currentReel + 1))}
            className="w-12 h-24 pointer-events-auto"
          />
        </div>
      </div>
    </div>
  );
}
