import { Plus } from "lucide-react";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";

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
  return (
    <ScrollArea className="w-full">
      <div className="flex gap-4 px-4 py-3">
        {stories.map((story) => (
          <div key={story.id} className="flex flex-col items-center gap-1.5 flex-shrink-0">
            <div
              className={`relative w-16 h-16 rounded-full p-0.5 ${
                story.hasNew
                  ? "bg-gradient-to-tr from-primary via-accent to-primary"
                  : story.isOwn
                  ? ""
                  : "bg-muted"
              }`}
            >
              {story.isOwn ? (
                <div className="w-full h-full rounded-full bg-muted flex items-center justify-center">
                  <div className="w-14 h-14 rounded-full bg-secondary flex items-center justify-center">
                    <Plus className="w-6 h-6 text-primary" />
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
                <div className="absolute -bottom-0.5 left-1/2 -translate-x-1/2 px-1.5 py-0.5 bg-primary text-primary-foreground text-[9px] font-semibold rounded-full">
                  NEW
                </div>
              )}
            </div>
            <span className="text-xs text-foreground font-medium max-w-16 truncate">
              {story.name}
            </span>
          </div>
        ))}
      </div>
      <ScrollBar orientation="horizontal" className="invisible" />
    </ScrollArea>
  );
}
