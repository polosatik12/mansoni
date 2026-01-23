import { useState } from "react";
import { Plus, Loader2 } from "lucide-react";
import { useScrollCollapse } from "@/hooks/useScrollCollapse";
import { ServicesMenu } from "@/components/layout/ServicesMenu";
import { cn } from "@/lib/utils";
import { useScrollContainer } from "@/contexts/ScrollContainerContext";
import { StoryViewer } from "./StoryViewer";
import { useStories, type UserWithStories } from "@/hooks/useStories";

export function FeedHeader() {
  const { collapseProgress } = useScrollCollapse(100);
  const scrollContainerRef = useScrollContainer();
  const { usersWithStories, loading } = useStories();
  const [storyViewerOpen, setStoryViewerOpen] = useState(false);
  const [selectedStoryIndex, setSelectedStoryIndex] = useState(0);

  // Handle story click - either scroll to top or open viewer
  const handleStoryClick = (index: number, user: UserWithStories) => {
    if (collapseProgress > 0.1 && scrollContainerRef?.current) {
      // If collapsed, scroll to top first
      scrollContainerRef.current.scrollTo({
        top: 0,
        behavior: 'smooth'
      });
    } else if (user.stories.length > 0) {
      // If expanded and has stories, open story viewer
      setSelectedStoryIndex(index);
      setStoryViewerOpen(true);
    }
  };

  // Animation parameters
  const expandedAvatarSize = 64;
  const collapsedAvatarSize = 32;
  const expandedGap = 16;
  const collapsedOverlap = 10;
  const maxVisibleInStack = 4;
  const expandedRowHeight = 88;
  const headerHeight = 52;
  const paddingLeft = 16;

  // Calculate styles for each story based on collapse progress
  const getStoryStyles = (index: number) => {
    const progress = collapseProgress;

    // Size interpolation: 64px → 32px
    const size = expandedAvatarSize - (expandedAvatarSize - collapsedAvatarSize) * progress;

    // Expanded X position (with gaps)
    const expandedX = paddingLeft + index * (expandedAvatarSize + expandedGap);

    // Collapsed X position (stacked with overlap, after menu button)
    const menuButtonWidth = 40;
    const collapsedStartX = paddingLeft + menuButtonWidth + 8;
    const isInStack = index < maxVisibleInStack;
    const collapsedX = isInStack
      ? collapsedStartX + index * collapsedOverlap
      : collapsedStartX + (maxVisibleInStack - 1) * collapsedOverlap;

    // Interpolate X position
    const x = expandedX + (collapsedX - expandedX) * progress;

    // Y position: moves up from stories row into header row
    const expandedY = headerHeight;
    const collapsedY = (headerHeight - collapsedAvatarSize) / 2;
    const y = expandedY + (collapsedY - expandedY) * progress;

    // Opacity: items beyond stack fade out
    const opacity = isInStack ? 1 : Math.max(0, 1 - progress * 2);

    // Z-index: first items on top when stacked
    const zIndex = isInStack ? maxVisibleInStack - index + 10 : 1;

    // Name opacity and height
    const nameOpacity = Math.max(0, 1 - progress * 1.5);
    const nameHeight = 20 * (1 - progress);

    return { size, x, y, opacity, zIndex, nameOpacity, nameHeight };
  };

  // Container height shrinks as we scroll
  const containerHeight = headerHeight + expandedRowHeight * (1 - collapseProgress);

  return (
    <div 
      className="sticky top-0 z-30 bg-card overflow-hidden"
      style={{ height: `${containerHeight}px` }}
    >
      {/* Header row with menu */}
      <div 
        className="absolute top-0 left-0 right-0 flex items-center px-4"
        style={{ height: `${headerHeight}px` }}
      >
        <ServicesMenu />
      </div>

      {/* Loading state */}
      {loading && usersWithStories.length === 0 && (
        <div 
          className="absolute flex items-center justify-center"
          style={{ 
            left: paddingLeft, 
            top: headerHeight,
            height: expandedAvatarSize 
          }}
        >
          <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
        </div>
      )}

      {/* Stories - single set with animated positions */}
      {usersWithStories.map((user, index) => {
        const styles = getStoryStyles(index);
        const hasStories = user.stories.length > 0;

        return (
          <button
            key={user.user_id}
            onClick={() => handleStoryClick(index, user)}
            className="absolute flex flex-col items-center transition-all duration-200 ease-out cursor-pointer"
            style={{
              left: 0,
              top: 0,
              transform: `translate(${styles.x}px, ${styles.y}px)`,
              opacity: styles.opacity,
              zIndex: styles.zIndex,
              pointerEvents: styles.opacity < 0.3 ? 'none' : 'auto',
            }}
          >
            {/* Avatar with border */}
            <div
              className={cn(
                "rounded-full transition-all duration-200 flex-shrink-0 relative",
                user.isOwn && !hasStories
                  ? "p-0.5 bg-muted"
                  : user.hasNew
                    ? "p-[2.5px] bg-gradient-to-tr from-blue-500 via-sky-400 to-cyan-400"
                    : hasStories
                      ? "p-0.5 bg-muted-foreground/30"
                      : "p-0.5 bg-muted"
              )}
              style={{
                width: `${styles.size}px`,
                height: `${styles.size}px`,
              }}
            >
              <div className="w-full h-full rounded-full bg-background p-[2px]">
                <div className="w-full h-full rounded-full overflow-hidden">
                  <img
                    src={user.avatar_url || `https://i.pravatar.cc/150?u=${user.user_id}`}
                    alt={user.display_name || ''}
                    className="w-full h-full object-cover rounded-full"
                  />
                </div>
              </div>
              {/* Plus icon for own story without stories */}
              {user.isOwn && !hasStories && collapseProgress < 0.5 && (
                <div 
                  className="absolute -bottom-0.5 -right-0.5 w-5 h-5 rounded-full bg-primary border-2 border-background flex items-center justify-center transition-opacity duration-200"
                  style={{ opacity: 1 - collapseProgress * 2 }}
                >
                  <Plus className="w-3 h-3 text-primary-foreground" />
                </div>
              )}
            </div>

            {/* Name */}
            <span
              className="text-xs text-foreground font-medium max-w-16 truncate transition-all duration-200 overflow-hidden"
              style={{
                opacity: styles.nameOpacity,
                height: `${styles.nameHeight}px`,
                marginTop: styles.nameOpacity > 0.1 ? '4px' : '0px',
              }}
            >
              {user.isOwn ? 'Вы' : user.display_name}
            </span>
          </button>
        );
      })}

      {/* Story Viewer */}
      <StoryViewer
        usersWithStories={usersWithStories}
        initialUserIndex={selectedStoryIndex}
        isOpen={storyViewerOpen}
        onClose={() => setStoryViewerOpen(false)}
      />
    </div>
  );
}
