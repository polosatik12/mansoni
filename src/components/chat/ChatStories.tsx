import { useState, useRef, useMemo } from "react";
import { Plus, Loader2 } from "lucide-react";
import { useStories, type UserWithStories } from "@/hooks/useStories";
import { StoryViewer } from "@/components/feed/StoryViewer";
import { useScrollCollapse } from "@/hooks/useScrollCollapse";
import { useScrollContainer } from "@/contexts/ScrollContainerContext";
import { cn } from "@/lib/utils";

// Animation constants - matching FeedHeader exactly
const EXPANDED_AVATAR_SIZE = 64;
const COLLAPSED_AVATAR_SIZE = 32;
const EXPANDED_GAP = 16;
const COLLAPSED_OVERLAP = 10;
const MAX_VISIBLE_IN_STACK = 4;
const EXPANDED_ROW_HEIGHT = 88;
const HEADER_HEIGHT = 12;
const PADDING_LEFT = 16;
const COLLAPSED_START_X = PADDING_LEFT;
const SCROLL_THRESHOLD = 100;

// Precomputed values for animation
const SIZE_DIFF = EXPANDED_AVATAR_SIZE - COLLAPSED_AVATAR_SIZE;
const COLLAPSED_Y = 8;
const Y_DIFF = COLLAPSED_Y - HEADER_HEIGHT;

export function ChatStories() {
  const { usersWithStories, loading, uploadStory } = useStories();
  const { collapseProgress } = useScrollCollapse(SCROLL_THRESHOLD, true);
  const scrollContainerRef = useScrollContainer();
  
  const [viewerOpen, setViewerOpen] = useState(false);
  const [selectedUserIndex, setSelectedUserIndex] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleStoryClick = (index: number, user: UserWithStories) => {
    // If collapsed, scroll to top to expand (like feed)
    if (collapseProgress > 0.1) {
      scrollContainerRef?.current?.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }
    
    // If expanded, handle story interaction
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

  // Memoize story styles calculation - matching FeedHeader approach
  const storyStyles = useMemo(() => {
    return usersWithStories.map((_, index) => {
      const progress = collapseProgress;
      
      // Use scale instead of width/height for GPU acceleration
      const scale = 1 - ((SIZE_DIFF / EXPANDED_AVATAR_SIZE) * progress);
      
      // Expanded X position
      const expandedX = PADDING_LEFT + index * (EXPANDED_AVATAR_SIZE + EXPANDED_GAP);
      
      // Collapsed X position
      const isInStack = index < MAX_VISIBLE_IN_STACK;
      const collapsedX = isInStack
        ? COLLAPSED_START_X + index * COLLAPSED_OVERLAP
        : COLLAPSED_START_X + (MAX_VISIBLE_IN_STACK - 1) * COLLAPSED_OVERLAP;
      
      // Interpolate positions
      const x = expandedX + (collapsedX - expandedX) * progress;
      const y = HEADER_HEIGHT + Y_DIFF * progress;
      
      // Opacity for items outside stack
      const opacity = isInStack ? 1 : Math.max(0, 1 - progress * 2);
      
      // Z-index
      const zIndex = isInStack ? MAX_VISIBLE_IN_STACK - index + 10 : 1;
      
      // Name visibility
      const nameOpacity = Math.max(0, 1 - progress * 1.5);

      return { scale, x, y, opacity, zIndex, nameOpacity, isInStack };
    });
  }, [usersWithStories.length, collapseProgress]);

  // Container height - matching FeedHeader calculation
  const containerHeight = HEADER_HEIGHT + EXPANDED_ROW_HEIGHT * (1 - collapseProgress) + collapseProgress * 48;

  if (loading && usersWithStories.length === 0) {
    return (
      <div 
        className="flex items-center justify-center border-b border-border"
        style={{ height: containerHeight }}
      >
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
        className="relative overflow-hidden bg-card border-b border-border will-change-auto"
        style={{ height: `${containerHeight}px` }}
      >
        {/* Stories - GPU-accelerated transforms like FeedHeader */}
        {usersWithStories.map((user, index) => {
          const styles = storyStyles[index];
          if (!styles) return null;
          
          const hasStories = user.stories.length > 0;
          const showPlusIcon = user.isOwn && !hasStories && collapseProgress < 0.5;

          return (
            <button
              key={user.user_id}
              onClick={() => handleStoryClick(index, user)}
              className="absolute flex flex-col items-center cursor-pointer"
              style={{
                left: 0,
                top: 0,
                transform: `translate3d(${styles.x}px, ${styles.y}px, 0)`,
                opacity: styles.opacity,
                zIndex: styles.zIndex,
                pointerEvents: styles.opacity < 0.3 ? 'none' : 'auto',
              }}
            >
              {/* Avatar with border - using transform scale for GPU */}
              <div
                className={cn(
                  "rounded-full flex-shrink-0 relative",
                  user.isOwn && !hasStories
                    ? "p-0.5 bg-muted"
                    : user.hasNew
                      ? "p-[2.5px] bg-gradient-to-tr from-primary via-accent to-primary"
                      : hasStories
                        ? "p-0.5 bg-muted-foreground/30"
                        : "p-0.5 bg-muted"
                )}
                style={{
                  width: `${EXPANDED_AVATAR_SIZE}px`,
                  height: `${EXPANDED_AVATAR_SIZE}px`,
                  transform: `scale(${styles.scale})`,
                  transformOrigin: 'top left',
                }}
              >
                <div className="w-full h-full rounded-full bg-background p-[2px]">
                  <div className="w-full h-full rounded-full overflow-hidden">
                    {user.isOwn && !hasStories ? (
                      <div className="w-full h-full rounded-full bg-secondary flex items-center justify-center">
                        <Plus className="w-6 h-6 text-primary" />
                      </div>
                    ) : (
                      <img
                        src={user.avatar_url || `https://i.pravatar.cc/150?u=${user.user_id}`}
                        alt={user.display_name || ''}
                        className="w-full h-full object-cover rounded-full"
                        loading="lazy"
                      />
                    )}
                  </div>
                </div>
                {/* Plus icon for own story with existing stories */}
                {showPlusIcon && hasStories && (
                  <div 
                    className="absolute -bottom-0.5 -right-0.5 w-5 h-5 rounded-full bg-primary border-2 border-background flex items-center justify-center"
                    style={{ opacity: 1 - collapseProgress }}
                  >
                    <Plus className="w-3 h-3 text-primary-foreground" />
                  </div>
                )}
              </div>

              {/* Name - simplified animation */}
              <span
                className="text-xs text-foreground font-medium max-w-16 truncate overflow-hidden"
                style={{
                  opacity: styles.nameOpacity,
                  height: styles.nameOpacity > 0.1 ? '20px' : '0px',
                  marginTop: styles.nameOpacity > 0.1 ? '4px' : '0px',
                }}
              >
                {user.isOwn ? 'Вы' : user.display_name}
              </span>
            </button>
          );
        })}

        {/* Show count when collapsed */}
        {collapseProgress > 0.5 && usersWithStories.length > MAX_VISIBLE_IN_STACK && (
          <div 
            className="absolute flex items-center justify-center text-xs text-muted-foreground font-medium"
            style={{ 
              left: COLLAPSED_START_X + MAX_VISIBLE_IN_STACK * COLLAPSED_OVERLAP + 20,
              top: COLLAPSED_Y + 8,
              opacity: (collapseProgress - 0.5) * 2,
            }}
          >
            +{usersWithStories.length - MAX_VISIBLE_IN_STACK}
          </div>
        )}
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
