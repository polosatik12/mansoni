import { useState } from "react";
import { Plus, Loader2, User } from "lucide-react";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { StoryViewer } from "./StoryViewer";
import { StoryEditorFlow } from "./StoryEditorFlow";
import { useStories, type UserWithStories } from "@/hooks/useStories";

const AVATAR_SIZE = 64;

export function FeedHeader() {
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

  return (
    <>
      <div className="bg-black/20 backdrop-blur-xl border-b border-white/10">
        {/* Stories row */}
        {loading && usersWithStories.length === 0 ? (
          <div className="flex items-center justify-center py-4">
            <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <ScrollArea className="w-full">
            <div className="flex gap-4 px-4 py-3">
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
                      {user.isOwn && (
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
                      {user.hasNew && (
                        <div className="absolute left-1/2 -translate-x-1/2 -bottom-0.5 px-1.5 py-0.5 bg-primary text-primary-foreground text-[9px] font-semibold rounded-full">
                          NEW
                        </div>
                      )}
                    </div>
                    <span className="text-xs text-white font-medium max-w-16 truncate mt-1">
                      {user.isOwn ? 'Вы' : user.display_name}
                    </span>
                  </button>
                );
              })}
            </div>
            <ScrollBar orientation="horizontal" className="invisible" />
          </ScrollArea>
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
