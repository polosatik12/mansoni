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

  // Simple collapse: shrink avatars and fade names
  const expandedAvatarSize = 64;
  const collapsedAvatarSize = 40;

  // Calculate current avatar size
  const avatarSize = expandedAvatarSize - (collapseProgress * (expandedAvatarSize - collapsedAvatarSize));
  
  // Name opacity fades out quickly
  const nameOpacity = Math.max(0, 1 - collapseProgress * 2.5);
  const nameHeight = 20 * Math.max(0, 1 - collapseProgress * 2.5);

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
      <div className="sticky top-0 z-30 bg-white/40 dark:bg-background backdrop-blur-xl py-4 flex items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <>
      
      <div 
        className="sticky top-0 z-30 bg-white/40 dark:bg-background backdrop-blur-xl transition-all duration-150"
        style={{ 
          paddingTop: `${12 - collapseProgress * 4}px`,
          paddingBottom: `${12 - collapseProgress * 8}px`,
        }}
      >
        <ScrollArea className="w-full">
          <div 
            className="flex px-4 transition-all duration-150"
            style={{ gap: `${16 - collapseProgress * 8}px` }}
          >
            {usersWithStories.map((user, index) => {
              const hasStories = user.stories.length > 0;
              
              return (
                <div 
                  key={user.user_id} 
                  className="flex flex-col items-center flex-shrink-0 cursor-pointer"
                  style={{
                    transition: 'all 0.15s ease-out',
                  }}
                  onClick={() => handleStoryClick(index, user)}
                >
                  <div
                    className={`relative rounded-full transition-all duration-200 ${
                      user.hasNew
                        ? "bg-gradient-to-tr from-primary via-accent to-primary"
                        : user.isOwn && !hasStories
                        ? ""
                        : hasStories
                        ? "bg-muted-foreground/30"
                        : "bg-muted"
                    }`}
                    style={{
                      width: `${avatarSize + 4}px`,
                      height: `${avatarSize + 4}px`,
                      padding: '2px',
                    }}
                  >
                    {user.isOwn && !hasStories ? (
                      <div className="w-full h-full rounded-full bg-muted flex items-center justify-center">
                        <div 
                          className="rounded-full bg-secondary flex items-center justify-center transition-all duration-200"
                          style={{
                            width: `${avatarSize - 4}px`,
                            height: `${avatarSize - 4}px`,
                          }}
                        >
                          <Plus 
                            className="text-primary transition-all duration-200" 
                            style={{ 
                              width: `${Math.max(avatarSize * 0.4, 14)}px`,
                              height: `${Math.max(avatarSize * 0.4, 14)}px`,
                            }}
                          />
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
                        className="absolute left-1/2 -translate-x-1/2 px-1.5 py-0.5 bg-primary text-primary-foreground text-[9px] font-semibold rounded-full transition-all duration-200"
                        style={{
                          bottom: '-2px',
                          opacity: nameOpacity,
                          transform: `translateX(-50%) scale(${1 - collapseProgress * 0.5})`,
                        }}
                      >
                        NEW
                      </div>
                    )}
                  </div>
                  <span 
                    className="text-xs text-foreground font-medium max-w-16 truncate transition-all duration-200 overflow-hidden"
                    style={{
                      opacity: nameOpacity,
                      height: `${nameHeight}px`,
                      marginTop: nameOpacity > 0.1 ? '6px' : '0px',
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
