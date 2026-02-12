import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Play, Loader2, Eye } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface ProfileReel {
  id: string;
  video_url: string;
  thumbnail_url: string | null;
  views_count: number;
  likes_count: number;
}

interface ProfileReelsGridProps {
  userId: string;
}

export function ProfileReelsGrid({ userId }: ProfileReelsGridProps) {
  const navigate = useNavigate();
  const [reels, setReels] = useState<ProfileReel[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchReels = async () => {
    setLoading(true);
    const { data, error } = await (supabase as any)
      .from("reels")
      .select("id, video_url, thumbnail_url, views_count, likes_count")
      .eq("author_id", userId)
      .order("created_at", { ascending: false });

    if (!error && data) setReels(data);
    setLoading(false);
  };

  useEffect(() => {
    fetchReels();

    // Listen for new reels from this user
    const channel = supabase
      .channel(`profile-reels-${userId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'reels',
          filter: `author_id=eq.${userId}`,
        },
        () => {
          fetchReels();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId]);

  if (loading) {
    return (
      <div className="p-12 flex justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-white/60" />
      </div>
    );
  }

  if (reels.length === 0) {
    return (
      <div className="py-12 text-center">
        <div className="w-16 h-16 rounded-full bg-white/10 backdrop-blur-xl border border-white/20 flex items-center justify-center mx-auto mb-3">
          <Play className="w-8 h-8 text-white/60" />
        </div>
        <h3 className="font-semibold text-white mb-1">Нет Reels</h3>
        <p className="text-sm text-white/60">Ваши видео Reels появятся здесь</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-3 gap-1 rounded-2xl overflow-hidden">
      {reels.map((reel) => (
        <button
          key={reel.id}
          onClick={() => navigate("/reels")}
          className="aspect-[9/16] relative group cursor-pointer overflow-hidden bg-white/10"
        >
          {reel.thumbnail_url ? (
            <img
              src={reel.thumbnail_url}
              alt=""
              className="w-full h-full object-cover"
            />
          ) : (
            <video
              src={reel.video_url}
              className="w-full h-full object-cover"
              muted
              preload="metadata"
            />
          )}
          {/* Play icon */}
          <div className="absolute top-2 right-2">
            <Play className="w-4 h-4 text-white fill-white drop-shadow-lg" />
          </div>
          {/* Views */}
          <div className="absolute bottom-2 left-2 flex items-center gap-1">
            <Eye className="w-3.5 h-3.5 text-white drop-shadow-lg" />
            <span className="text-white text-[11px] font-medium drop-shadow-lg">
              {reel.views_count || 0}
            </span>
          </div>
        </button>
      ))}
    </div>
  );
}
