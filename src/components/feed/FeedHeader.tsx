import { Plus } from "lucide-react";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { useScrollCollapse } from "@/hooks/useScrollCollapse";
import { ServicesMenu } from "@/components/layout/ServicesMenu";
import { cn } from "@/lib/utils";
import { useState } from "react";

const stories = [
  { id: "you", name: "Вы", avatar: null, isOwn: true },
  { id: "1", name: "Алиса", avatar: "https://i.pravatar.cc/150?img=1", hasNew: true },
  { id: "2", name: "Макс", avatar: "https://i.pravatar.cc/150?img=3", hasNew: true },
  { id: "3", name: "Кира", avatar: "https://i.pravatar.cc/150?img=5", hasNew: true },
  { id: "4", name: "Дэн", avatar: "https://i.pravatar.cc/150?img=8", hasNew: false },
  { id: "5", name: "Софи", avatar: "https://i.pravatar.cc/150?img=9", hasNew: false },
  { id: "6", name: "Иван", avatar: "https://i.pravatar.cc/150?img=12", hasNew: true },
];

const tabs = [
  { id: "foryou", label: "Рекомендации" },
  { id: "following", label: "Подписки" },
];

export function FeedHeader() {
  const { collapseProgress } = useScrollCollapse(100);
  const [activeTab, setActiveTab] = useState("foryou");

  // Collapsed stories config
  const collapsedAvatarSize = 32;
  const collapsedStackOverlap = 10;
  const maxVisibleInStack = 4;

  // Expanded stories config
  const expandedAvatarSize = 64;
  const expandedRowHeight = 88;

  return (
    <div className="sticky top-0 z-30 bg-background">
      {/* Top row: Collapsed stories + Tabs */}
      <div className="flex items-center justify-between px-4 py-3">
        {/* Left side: Menu + Collapsed stories stack */}
        <div className="flex items-center gap-2">
          <ServicesMenu />
          
          {/* Collapsed stories - appear as progress increases */}
          <div 
            className="flex items-center transition-all duration-200"
            style={{
              opacity: collapseProgress,
              transform: `scale(${0.7 + collapseProgress * 0.3})`,
              width: collapseProgress > 0.1 
                ? `${collapsedAvatarSize + (maxVisibleInStack - 1) * collapsedStackOverlap}px` 
                : 0,
              marginLeft: collapseProgress > 0.1 ? '8px' : 0,
            }}
          >
            {stories.slice(0, maxVisibleInStack).map((story, index) => (
              <div
                key={story.id}
                className="absolute flex-shrink-0"
                style={{
                  left: `${index * collapsedStackOverlap}px`,
                  zIndex: maxVisibleInStack - index,
                }}
              >
                <div
                  className={cn(
                    "rounded-full",
                    story.hasNew
                      ? "bg-gradient-to-tr from-primary via-accent to-primary p-[2px]"
                      : story.isOwn
                      ? "bg-muted p-[2px]"
                      : "bg-muted p-[2px]"
                  )}
                  style={{
                    width: `${collapsedAvatarSize}px`,
                    height: `${collapsedAvatarSize}px`,
                  }}
                >
                  {story.isOwn ? (
                    <div className="w-full h-full rounded-full bg-secondary flex items-center justify-center">
                      <Plus className="text-primary" style={{ width: 14, height: 14 }} />
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
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right side: Tabs */}
        <div className="flex bg-muted rounded-full p-1">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                "px-4 py-1.5 text-sm font-medium rounded-full transition-all",
                activeTab === tab.id
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Expanded stories row - height decreases as we scroll */}
      <div
        className="overflow-hidden transition-all duration-150"
        style={{
          height: `${expandedRowHeight * (1 - collapseProgress)}px`,
          opacity: 1 - collapseProgress,
        }}
      >
        <ScrollArea className="w-full">
          <div className="flex px-4 gap-4">
            {stories.map((story) => (
              <div
                key={story.id}
                className="flex flex-col items-center flex-shrink-0"
              >
                <div
                  className={cn(
                    "relative rounded-full",
                    story.hasNew
                      ? "bg-gradient-to-tr from-primary via-accent to-primary"
                      : story.isOwn
                      ? ""
                      : "bg-muted"
                  )}
                  style={{
                    width: `${expandedAvatarSize + 4}px`,
                    height: `${expandedAvatarSize + 4}px`,
                    padding: '2px',
                  }}
                >
                  {story.isOwn ? (
                    <div className="w-full h-full rounded-full bg-muted flex items-center justify-center">
                      <div
                        className="rounded-full bg-secondary flex items-center justify-center"
                        style={{
                          width: `${expandedAvatarSize - 4}px`,
                          height: `${expandedAvatarSize - 4}px`,
                        }}
                      >
                        <Plus className="text-primary" style={{ width: 24, height: 24 }} />
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
                    <div className="absolute left-1/2 -translate-x-1/2 bottom-[-2px] px-1.5 py-0.5 bg-primary text-primary-foreground text-[9px] font-semibold rounded-full">
                      NEW
                    </div>
                  )}
                </div>
                <span className="text-xs text-foreground font-medium max-w-16 truncate mt-1.5">
                  {story.name}
                </span>
              </div>
            ))}
          </div>
          <ScrollBar orientation="horizontal" className="invisible" />
        </ScrollArea>
      </div>
    </div>
  );
}
