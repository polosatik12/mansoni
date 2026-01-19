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
  const { collapseProgress, isCollapsed } = useScrollCollapse(80);

  // Calculate sizes based on collapse progress
  const avatarSize = 64 - (collapseProgress * 32); // 64px -> 32px
  const gap = 16 - (collapseProgress * 12); // 16px -> 4px
  const padding = 12 - (collapseProgress * 8); // 12px -> 4px
  const nameOpacity = 1 - collapseProgress;
  const nameHeight = 20 * (1 - collapseProgress);
  
  // Overlap effect when collapsed
  const overlap = collapseProgress * 20; // Stories overlap by up to 20px

  return (
    <div 
      className="sticky top-0 z-30 bg-background transition-all duration-150"
      style={{ 
        paddingTop: `${padding}px`,
        paddingBottom: `${padding}px`,
      }}
    >
      <ScrollArea className="w-full">
        <div 
          className="flex px-4 transition-all duration-150"
          style={{ gap: `${gap}px` }}
        >
          {stories.map((story, index) => (
            <div 
              key={story.id} 
              className="flex flex-col items-center flex-shrink-0 transition-all duration-150"
              style={{ 
                marginLeft: index > 0 ? `-${overlap}px` : 0,
                zIndex: stories.length - index,
              }}
            >
              <div
                className={`relative rounded-full transition-all duration-150 ${
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
                  <div 
                    className="w-full h-full rounded-full bg-muted flex items-center justify-center"
                  >
                    <div 
                      className="rounded-full bg-secondary flex items-center justify-center transition-all duration-150"
                      style={{
                        width: `${avatarSize - 4}px`,
                        height: `${avatarSize - 4}px`,
                      }}
                    >
                      <Plus 
                        className="text-primary transition-all duration-150" 
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
                    className="absolute left-1/2 -translate-x-1/2 px-1.5 py-0.5 bg-primary text-primary-foreground text-[9px] font-semibold rounded-full transition-all duration-150"
                    style={{
                      bottom: isCollapsed ? '0px' : '-2px',
                      opacity: isCollapsed ? 0 : 1,
                      transform: `translateX(-50%) scale(${1 - collapseProgress * 0.5})`,
                    }}
                  >
                    NEW
                  </div>
                )}
              </div>
              <span 
                className="text-xs text-foreground font-medium max-w-16 truncate transition-all duration-150 overflow-hidden"
                style={{
                  opacity: nameOpacity,
                  height: `${nameHeight}px`,
                  marginTop: nameOpacity > 0.1 ? '6px' : '0px',
                }}
              >
                {story.name}
              </span>
            </div>
          ))}
        </div>
        <ScrollBar orientation="horizontal" className="invisible" />
      </ScrollArea>
    </div>
  );
}
