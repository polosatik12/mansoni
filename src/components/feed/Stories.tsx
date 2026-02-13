import { useState } from "react";
import { Plus, Loader2 } from "lucide-react";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { useScrollCollapse } from "@/hooks/useScrollCollapse";
import { useStories, type UserWithStories } from "@/hooks/useStories";
import { StoryViewer } from "./StoryViewer";
import { StoryEditorFlow } from "./StoryEditorFlow";

interface StoriesProps {
  onOpenStory?: (userIndex: number) => void;
}

export function Stories({ onOpenStory }: StoriesProps) {
  const { collapseProgress } = useScrollCollapse(100);
  const { usersWithStories, loading } = useStories();
  const [viewerOpen, setViewerOpen] = useState(false);
  const [selectedUserIndex, setSelectedUserIndex] = useState(0);
  const [storyEditorOpen, setStoryEditorOpen] = useState(false);

  // Use ONLY transform-based animations to avoid layout feedback loop
  // Container height stays fixed, we just scale the content down
  const scale = 1 - collapseProgress * 0.35; // scale from 1.0 to 0.65
  const nameOpacity = Math.max(0, 1 - collapseProgress * 3);

  const handleStoryClick = (index: number, user: UserWithStories) => {
    if (user.isOwn) {
      if (user.stories.length > 0) {
        setSelectedUserIndex(index);
        setViewerOpen(true);
      } else {
        setStoryEditorOpen(true);
      }
      return;
    }
    if (user.stories.length > 0) {
      setSelectedUserIndex(index);
      setViewerOpen(true);
    }
  };

  if (loading && usersWithStories.length === 0) {
    return (
      <div className="sticky top-0 z-30 bg-white/40 dark:bg-background backdrop-blur-xl py-4 flex items-center justify-center" style={{ height: '92px' }}>
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <>
      {/* Fixed-height container prevents layout feedback loop */}
      <div 
        className="sticky top-0 z-30 bg-white/40 dark:bg-background backdrop-blur-xl overflow-hidden"
        style={{ height: '92px' }}
      >
        <div
          style={{
            transform: `scale(${scale})`,
            transformOrigin: 'left center',
            transition: 'transform 0.1s ease-out',
            willChange: 'transform',
          }}
        >
          <ScrollArea className="w-full">
            <div className="flex px-4 py-3" style={{ gap: '16px' }}>
              {usersWithStories.map((user, index) => {
                const hasStories = user.stories.length > 0;
                
                return (
                  <div 
                    key={user.user_id} 
                    className="flex flex-col items-center flex-shrink-0 cursor-pointer"
                    onClick={() => handleStoryClick(index, user)}
                  >
                    <div
                      className={`relative rounded-full ${
                        user.hasNew
                          ? "bg-gradient-to-tr from-primary via-accent to-primary"
                          : user.isOwn && !hasStories
                          ? ""
                          : hasStories
                          ? "bg-muted-foreground/30"
                          : "bg-muted"
                      }`}
                      style={{ width: '68px', height: '68px', padding: '2px' }}
                    >
                      {user.isOwn && !hasStories ? (
                        <div className="w-full h-full rounded-full bg-muted flex items-center justify-center">
                          <div className="w-[60px] h-[60px] rounded-full bg-secondary flex items-center justify-center">
                            <Plus className="text-primary w-6 h-6" />
                          </div>
                        </div>
                      ) : (
                        <div className="w-full h-full rounded-full bg-card p-0.5">
                          <img
                            src={user.avatar_url || `https://i.pravatar.cc/150?u=${user.user_id}`}
                            alt={user.display_name || ''}
                            className="w-full h-full rounded-full object-cover"
                          />
                        </div>
                      )}
                      {user.isOwn && (
                        <div 
                          className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-primary flex items-center justify-center border-2 border-card z-20 cursor-pointer"
                          onClick={(e) => {
                            e.stopPropagation();
                            setStoryEditorOpen(true);
                          }}
                        >
                          <Plus className="text-primary-foreground w-3.5 h-3.5" />
                        </div>
                      )}
                      {user.hasNew && (
                        <div 
                          className="absolute left-1/2 px-1.5 py-0.5 bg-primary text-primary-foreground text-[9px] font-semibold rounded-full"
                          style={{
                            bottom: '-2px',
                            opacity: nameOpacity,
                            transform: 'translateX(-50%)',
                          }}
                        >
                          NEW
                        </div>
                      )}
                    </div>
                    <span 
                      className="text-xs text-foreground font-medium max-w-16 truncate overflow-hidden"
                      style={{
                        opacity: nameOpacity,
                        height: nameOpacity > 0.05 ? '20px' : '0px',
                        marginTop: nameOpacity > 0.05 ? '6px' : '0px',
                        transition: 'opacity 0.1s ease-out',
                      }}
                    >
                      {user.isOwn ? 'Вы' : user.display_name}
                    </span>
                  </div>
                );
              })}
            </div>
            <ScrollBar orientation="horizontal" className="invisible" />
          </ScrollArea>
        </div>
      </div>

      <StoryViewer
        usersWithStories={usersWithStories}
        initialUserIndex={selectedUserIndex}
        isOpen={viewerOpen}
        onClose={() => setViewerOpen(false)}
      />

      <StoryEditorFlow
        isOpen={storyEditorOpen}
        onClose={() => setStoryEditorOpen(false)}
      />
    </>
  );
}
