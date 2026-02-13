import { useState } from "react";
import { Plus, Loader2, User, Search } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { useScrollCollapse } from "@/hooks/useScrollCollapse";
import { StoryViewer } from "./StoryViewer";
import { StoryEditorFlow } from "./StoryEditorFlow";
import { useStories, type UserWithStories } from "@/hooks/useStories";

const AVATAR_SIZE = 64;

export function FeedHeader() {
  const navigate = useNavigate();
  const { collapseProgress } = useScrollCollapse(120);
  const { usersWithStories, loading } = useStories();
  const [storyViewerOpen, setStoryViewerOpen] = useState(false);
  const [selectedStoryIndex, setSelectedStoryIndex] = useState(0);
  const [storyEditorOpen, setStoryEditorOpen] = useState(false);

  const handleStoryClick = (index: number, user: UserWithStories) => {
    if (user.isOwn) {
      if (user.stories.length > 0) {
        setSelectedStoryIndex(index);
        setStoryViewerOpen(true);
      } else {
        setStoryEditorOpen(true);
      }
    } else if (user.stories.length > 0) {
      setSelectedStoryIndex(index);
      setStoryViewerOpen(true);
    }
  };

  // Only use transform — never change container height
  const p = collapseProgress;
  const scale = 1 - p * 0.4; // 1.0 → 0.6
  const nameOpacity = Math.max(0, 1 - p * 3);

  return (
    <>
      {/* FIXED height — never changes — prevents feedback loop */}
      <div
        className="sticky top-0 z-30 bg-black/20 backdrop-blur-xl border-b border-white/10 flex items-center"
        style={{ height: '96px' }}
      >
        {/* Search icon */}
        <button
          onClick={() => navigate('/search')}
          className="pl-3 pr-1 flex-shrink-0 text-white/70 hover:text-white transition-colors"
        >
          <Search className="w-5 h-5" />
        </button>
        {loading && usersWithStories.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <div
            className="h-full flex items-center"
            style={{
              transform: `scale(${scale})`,
              transformOrigin: 'left center',
              transition: 'transform 0.15s ease-out',
              willChange: 'transform',
            }}
          >
            <ScrollArea className="w-full">
              <div className="flex gap-4 px-4">
                {usersWithStories.map((user, index) => {
                  const hasStories = user.stories.length > 0;

                  return (
                    <button
                      key={user.user_id}
                      onClick={() => handleStoryClick(index, user)}
                      className="flex flex-col items-center flex-shrink-0 cursor-pointer"
                    >
                      <div
                        className={cn(
                          "rounded-full flex-shrink-0 relative",
                          user.isOwn && !hasStories
                            ? "p-0.5 bg-muted"
                            : user.isOwn && hasStories
                              ? "p-[2.5px] bg-gradient-to-tr from-primary/50 via-accent/50 to-primary/50"
                              : user.hasNew
                                ? "p-[2.5px] bg-gradient-to-tr from-primary via-accent to-primary"
                                : hasStories
                                  ? "p-0.5 bg-muted-foreground/30"
                                  : "p-0.5 bg-muted"
                        )}
                        style={{
                          width: `${AVATAR_SIZE}px`,
                          height: `${AVATAR_SIZE}px`,
                        }}
                      >
                        <div className="w-full h-full rounded-full bg-background p-[2px]">
                          <div className="w-full h-full rounded-full overflow-hidden bg-muted flex items-center justify-center">
                            {user.avatar_url ? (
                              <img
                                src={user.avatar_url}
                                alt={user.display_name || ''}
                                className="w-full h-full object-cover rounded-full"
                                loading="lazy"
                              />
                            ) : (
                              <User className="w-6 h-6 text-muted-foreground" />
                            )}
                          </div>
                        </div>
                        {user.isOwn && p < 0.5 && (
                          <div
                            className="absolute -bottom-0.5 -right-0.5 w-5 h-5 rounded-full bg-primary border-2 border-background flex items-center justify-center cursor-pointer z-20"
                            onClick={(e) => {
                              e.stopPropagation();
                              setStoryEditorOpen(true);
                            }}
                          >
                            <Plus className="w-3 h-3 text-primary-foreground" />
                          </div>
                        )}
                      </div>
                      {nameOpacity > 0.05 && (
                        <span
                          className="text-xs text-white font-medium max-w-16 truncate mt-1"
                          style={{ opacity: nameOpacity }}
                        >
                          {user.isOwn ? 'Вы' : user.display_name}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
              <ScrollBar orientation="horizontal" className="invisible" />
            </ScrollArea>
          </div>
        )}
      </div>

      <StoryViewer
        usersWithStories={usersWithStories}
        initialUserIndex={selectedStoryIndex}
        isOpen={storyViewerOpen}
        onClose={() => setStoryViewerOpen(false)}
      />

      <StoryEditorFlow
        isOpen={storyEditorOpen}
        onClose={() => setStoryEditorOpen(false)}
      />
    </>
  );
}
