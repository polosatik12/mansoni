import { Plus } from "lucide-react";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { useScrollCollapse } from "@/hooks/useScrollCollapse";

const stories = [
  { id: "you", name: "Вы", avatar: null, isOwn: true },
  { id: "1", name: "Алиса", avatar: "https://i.pravatar.cc/150?img=1", hasNew: true },
  { id: "2", name: "Макс", avatar: "https://i.pravatar.cc/150?img=3", hasNew: true },
  { id: "3", name: "Кира", avatar: "https://i.pravatar.cc/150?img=5", hasNew: true },
  { id: "4", name: "Дэн", avatar: "https://i.pravatar.cc/150?img=8", hasNew: false },
  { id: "5", name: "Софи", avatar: "https://i.pravatar.cc/150?img=9", hasNew: false },
  { id: "6", name: "Иван", avatar: "https://i.pravatar.cc/150?img=12", hasNew: true },
];

export function Stories() {
  const { collapseProgress } = useScrollCollapse(100);

  // Telegram-style: stack to the left
  const maxVisibleInStack = 4;
  const stackOverlap = 16; // How much avatars overlap in stack
  const expandedAvatarSize = 64;
  const collapsedAvatarSize = 44;
  const expandedGap = 16;
  const expandedItemWidth = expandedAvatarSize + expandedGap;

  // Calculate current avatar size
  const avatarSize = expandedAvatarSize - (collapseProgress * (expandedAvatarSize - collapsedAvatarSize));
  
  // Name opacity fades out
  const nameOpacity = 1 - collapseProgress;
  const nameHeight = 20 * (1 - collapseProgress);

  // Calculate position for each story
  const getStoryStyle = (index: number) => {
    // Original position (expanded)
    const originalX = index * expandedItemWidth;
    
    // Target position in stack (collapsed)
    const isInStack = index < maxVisibleInStack;
    const targetX = isInStack ? index * stackOverlap : (maxVisibleInStack - 1) * stackOverlap;
    
    // Interpolate between original and target position
    const currentX = originalX - (collapseProgress * (originalX - targetX));
    
    // Z-index: first items on top in stack
    const zIndex = stories.length - index;
    
    // Opacity/scale for items beyond stack
    const isHidden = !isInStack && collapseProgress > 0.5;
    const hiddenProgress = Math.max(0, (collapseProgress - 0.5) * 2);
    const itemOpacity = isInStack ? 1 : 1 - hiddenProgress;
    const itemScale = isInStack ? 1 : 1 - (hiddenProgress * 0.3);

    return {
      transform: `translateX(${currentX - (index * expandedItemWidth)}px) scale(${itemScale})`,
      zIndex,
      opacity: itemOpacity,
    };
  };

  return (
    <div 
      className="sticky top-0 z-30 bg-background transition-all duration-150"
      style={{ 
        paddingTop: `${12 - collapseProgress * 4}px`,
        paddingBottom: `${12 - collapseProgress * 8}px`,
      }}
    >
      <ScrollArea className="w-full">
        <div 
          className="flex px-4 transition-all duration-150"
          style={{ gap: `${expandedGap}px` }}
        >
          {stories.map((story, index) => {
            const storyStyle = getStoryStyle(index);
            
            return (
              <div 
                key={story.id} 
                className="flex flex-col items-center flex-shrink-0 transition-all duration-200 ease-out"
                style={{
                  ...storyStyle,
                  pointerEvents: storyStyle.opacity < 0.3 ? 'none' : 'auto',
                }}
              >
                <div
                  className={`relative rounded-full transition-all duration-200 ${
                    story.hasNew
                      ? "bg-gradient-to-tr from-primary via-accent to-primary"
                      : story.isOwn
                      ? ""
                      : "bg-muted"
                  }`}
                  style={{
                    width: `${avatarSize + 4}px`,
                    height: `${avatarSize + 4}px`,
                    padding: '2px',
                  }}
                >
                  {story.isOwn ? (
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
                        src={story.avatar!}
                        alt={story.name}
                        className="w-full h-full rounded-full object-cover"
                      />
                    </div>
                  )}
                  {story.hasNew && !story.isOwn && (
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
                  {story.name}
                </span>
              </div>
            );
          })}
        </div>
        <ScrollBar orientation="horizontal" className="invisible" />
      </ScrollArea>
    </div>
  );
}
