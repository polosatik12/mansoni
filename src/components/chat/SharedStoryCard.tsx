import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { Eye } from "lucide-react";
import { StoryViewer } from "@/components/feed/StoryViewer";
import type { UserWithStories } from "@/hooks/useStories";

interface SharedStory {
  id: string;
  author_id: string;
  media_url: string;
  media_type: string;
  caption: string | null;
  created_at: string;
  expires_at: string;
  author?: {
    display_name: string | null;
    avatar_url: string | null;
    verified: boolean;
  };
}

interface SharedStoryCardProps {
  storyId: string;
  isOwn: boolean;
  caption?: string;
}

export function SharedStoryCard({ storyId, isOwn, caption }: SharedStoryCardProps) {
  const [story, setStory] = useState<SharedStory | null>(null);
  const [loading, setLoading] = useState(true);
  const [expired, setExpired] = useState(false);
  const [viewerOpen, setViewerOpen] = useState(false);

  useEffect(() => {
    const fetchStory = async () => {
      try {
        const { data, error } = await (supabase
          .from("stories" as any)
          .select("*")
          .eq("id", storyId)
          .single() as any);

        if (error || !data) {
          setExpired(true);
          return;
        }

        // Check if expired
        if (new Date(data.expires_at) < new Date()) {
          setExpired(true);
          setStory(data);
          return;
        }

        // Fetch author profile
        const { data: profile } = await supabase
          .from("profiles")
          .select("display_name, avatar_url, verified")
          .eq("user_id", data.author_id)
          .single();

        setStory({
          ...data,
          author: profile || undefined,
        });
      } catch {
        setExpired(true);
      } finally {
        setLoading(false);
      }
    };

    fetchStory();
  }, [storyId]);

  if (loading) {
    return (
      <div className={`w-48 rounded-2xl overflow-hidden ${isOwn ? "bg-[#1e3a4f]" : "bg-[#1a2733]"}`}>
        <div className="animate-pulse">
          <div className="h-64 bg-white/10" />
        </div>
      </div>
    );
  }

  if (expired || !story) {
    return (
      <div className={`w-48 rounded-2xl p-4 ${isOwn ? "bg-[#1e3a4f]" : "bg-[#1a2733]"}`}>
        <div className="flex flex-col items-center gap-2 py-6">
          <div className="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center">
            <Eye className="w-5 h-5 text-white/30" />
          </div>
          <p className="text-sm text-white/40 text-center">История недоступна</p>
        </div>
      </div>
    );
  }

  const authorName = story.author?.display_name || "Пользователь";

  // Build data for StoryViewer
  const userWithStories: UserWithStories = {
    user_id: story.author_id,
    display_name: story.author?.display_name || null,
    avatar_url: story.author?.avatar_url || null,
    verified: story.author?.verified || false,
    stories: [{
      id: story.id,
      author_id: story.author_id,
      media_url: story.media_url,
      media_type: story.media_type,
      caption: story.caption,
      created_at: story.created_at,
      expires_at: story.expires_at,
    }],
    hasNew: true,
    isOwn: false,
  };

  return (
    <>
      <button
        onClick={() => setViewerOpen(true)}
        className={`w-48 rounded-2xl overflow-hidden text-left transition-transform active:scale-[0.97] ${
          isOwn ? "bg-[#1e3a4f]" : "bg-[#1a2733]"
        }`}
      >
        {/* Story preview image */}
        <div className="relative h-64 overflow-hidden">
          {story.media_type === 'video' ? (
            <video
              src={story.media_url}
              className="w-full h-full object-cover"
              muted
              playsInline
            />
          ) : (
            <img
              src={story.media_url}
              alt=""
              className="w-full h-full object-cover"
            />
          )}
          <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-black/60" />

          {/* Author info overlay */}
          <div className="absolute top-3 left-3 right-3 flex items-center gap-2">
            <img
              src={story.author?.avatar_url || `https://i.pravatar.cc/150?u=${story.author_id}`}
              alt={authorName}
              className="w-7 h-7 rounded-full border-2 border-white/50 object-cover"
            />
            <span className="text-xs font-semibold text-white truncate drop-shadow-lg">
              {authorName}
            </span>
          </div>

          {/* Caption overlay */}
          {story.caption && (
            <div className="absolute bottom-3 left-3 right-3">
              <p className="text-xs text-white/90 line-clamp-2 drop-shadow-lg">
                {story.caption}
              </p>
            </div>
          )}
        </div>

        {/* Message text */}
        {caption && (
          <div className="px-3 py-2">
            <p className="text-sm text-white/90">{caption}</p>
          </div>
        )}
      </button>

      {/* Story Viewer */}
      {viewerOpen && (
        <StoryViewer
          usersWithStories={[userWithStories]}
          initialUserIndex={0}
          isOpen={viewerOpen}
          onClose={() => setViewerOpen(false)}
        />
      )}
    </>
  );
}
