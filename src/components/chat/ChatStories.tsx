import { useState, useRef, useEffect } from "react";
import { Plus, Loader2 } from "lucide-react";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { useStories, type UserWithStories } from "@/hooks/useStories";
import { StoryViewer } from "@/components/feed/StoryViewer";
import { cn } from "@/lib/utils";

interface ChatStoriesProps {
  isExpanded: boolean;
  onExpandChange: (expanded: boolean) => void;
  swipeProgress?: number;
}

export function ChatStories({ isExpanded, onExpandChange, swipeProgress = 0 }: ChatStoriesProps) {
  const { usersWithStories, loading, uploadStory } = useStories();
  const [viewerOpen, setViewerOpen] = useState(false);
  const [selectedUserIndex, setSelectedUserIndex] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleStoryClick = (index: number, user: UserWithStories) => {
    if (user.isOwn && user.stories.length === 0) {
      fileInputRef.current?.click();
    } else if (user.stories.length > 0) {
      setSelectedUserIndex(index);
      setViewerOpen(true);
    }
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      await uploadStory(file);
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const hasNewStories = usersWithStories.some(u => u.hasNew);
  
  // Calculate interpolated values based on expansion state and swipe progress
  const effectiveProgress = isExpanded ? 1 : swipeProgress;
  
  // Sizes: collapsed = 40px avatar, expanded = 64px
  const avatarSize = 40 + (effectiveProgress * 24);
  // Gap: collapsed = -12px (stacked), expanded = 16px
  const gap = -12 + (effectiveProgress * 28);
  // Container height: collapsed = 56px, expanded = 140px
  const containerHeight = 56 + (effectiveProgress * 84);
  // Name opacity
  const nameOpacity = effectiveProgress;
  // Badge scale
  const badgeScale = effectiveProgress;

  if (loading && usersWithStories.length === 0) {
    return (
      <div className="flex items-center justify-center py-4" style={{ height: containerHeight }}>
        <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*,video/*"
        className="hidden"
        onChange={handleFileSelect}
      />
      
      <div 
        className="overflow-hidden transition-all duration-300 ease-out will-change-[height]"
        style={{ height: containerHeight }}
      >
        {/* Pull indicator - visible when collapsed */}
        <div 
          className="flex justify-center py-1 transition-opacity duration-200"
          style={{ opacity: 1 - effectiveProgress }}
        >
          <div className={cn(
            "w-10 h-1 rounded-full transition-all duration-300",
            hasNewStories 
              ? "bg-primary/60 animate-pulse" 
              : "bg-muted-foreground/30"
          )} />
        </div>

        <ScrollArea className="w-full">
          <div 
            className="flex px-4 py-2 transition-all duration-300 ease-out"
            style={{ gap: `${Math.max(gap, -12)}px` }}
          >
            {usersWithStories.slice(0, isExpanded ? undefined : 6).map((user, index) => {
              const hasStories = user.stories.length > 0;
              const isFirstFour = index < 4;
              
              // In collapsed state, only show first 4 avatars stacked
              if (!isExpanded && effectiveProgress < 0.5 && !isFirstFour) {
                return null;
              }
              
              return (
                <div 
                  key={user.user_id} 
                  className="flex flex-col items-center flex-shrink-0 cursor-pointer transition-all duration-300 will-change-transform"
                  onClick={() => {
                    if (isExpanded) {
                      handleStoryClick(index, user);
                    } else {
                      onExpandChange(true);
                    }
                  }}
                  style={{
                    zIndex: isExpanded ? 1 : (6 - index),
                    transform: !isExpanded && index > 0 ? `translateX(${-index * 8 * (1 - effectiveProgress)}px)` : undefined,
                  }}
                >
                  <div
                    className={cn(
                      "relative rounded-full transition-all duration-300 will-change-transform",
                      user.hasNew
                        ? "bg-gradient-to-tr from-primary via-accent to-primary p-0.5"
                        : user.isOwn && !hasStories
                        ? ""
                        : hasStories
                        ? "bg-muted-foreground/30 p-0.5"
                        : "bg-muted p-0.5"
                    )}
                    style={{ 
                      width: avatarSize + 4,
                      height: avatarSize + 4,
                    }}
                  >
                    {user.isOwn && !hasStories ? (
                      <div 
                        className="rounded-full bg-muted flex items-center justify-center transition-all duration-300"
                        style={{ width: avatarSize, height: avatarSize }}
                      >
                        <div 
                          className="rounded-full bg-secondary flex items-center justify-center"
                          style={{ 
                            width: avatarSize - 8, 
                            height: avatarSize - 8 
                          }}
                        >
                          <Plus className="text-primary" style={{ width: avatarSize * 0.35, height: avatarSize * 0.35 }} />
                        </div>
                      </div>
                    ) : (
                      <div 
                        className="rounded-full bg-card p-0.5 transition-all duration-300"
                        style={{ width: avatarSize, height: avatarSize }}
                      >
                        <img
                          src={user.avatar_url || `https://i.pravatar.cc/150?u=${user.user_id}`}
                          alt={user.display_name || ''}
                          className="w-full h-full rounded-full object-cover"
                        />
                      </div>
                    )}
                    {user.hasNew && effectiveProgress > 0.3 && (
                      <div 
                        className="absolute -bottom-0.5 left-1/2 -translate-x-1/2 px-1.5 py-0.5 bg-primary text-primary-foreground text-[9px] font-semibold rounded-full transition-all duration-200"
                        style={{ 
                          opacity: badgeScale,
                          transform: `translateX(-50%) scale(${0.5 + badgeScale * 0.5})`,
                        }}
                      >
                        NEW
                      </div>
                    )}
                  </div>
                  
                  {/* Name - only visible when expanded */}
                  <span 
                    className="text-xs text-foreground font-medium mt-1.5 max-w-16 truncate transition-opacity duration-200"
                    style={{ opacity: nameOpacity }}
                  >
                    {user.isOwn ? 'Моя история' : user.display_name}
                  </span>
                </div>
              );
            })}
            
            {/* Show count when collapsed */}
            {!isExpanded && usersWithStories.length > 4 && effectiveProgress < 0.5 && (
              <div 
                className="flex items-center justify-center text-xs text-muted-foreground font-medium ml-2"
                style={{ opacity: 1 - effectiveProgress }}
              >
                +{usersWithStories.length - 4}
              </div>
            )}
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
    </>
  );
}
