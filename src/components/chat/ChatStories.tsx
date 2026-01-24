import { useState, useRef } from "react";
import { Plus, Loader2, ChevronDown } from "lucide-react";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { useStories, type UserWithStories } from "@/hooks/useStories";
import { StoryViewer } from "@/components/feed/StoryViewer";
import { cn } from "@/lib/utils";

interface ChatStoriesProps {
  isExpanded: boolean;
  onToggle: () => void;
}

export function ChatStories({ isExpanded, onToggle }: ChatStoriesProps) {
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

  if (loading && usersWithStories.length === 0) {
    return (
      <div className="flex items-center justify-center py-6">
        <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  // Collapsed state - show stacked avatars
  if (!isExpanded) {
    const visibleUsers = usersWithStories.slice(0, 5);
    const hasNewStories = usersWithStories.some(u => u.hasNew);
    
    return (
      <button 
        onClick={onToggle}
        className="flex items-center gap-2 px-4 py-2 hover:bg-muted/50 transition-colors w-full"
      >
        <div className="flex -space-x-3">
          {visibleUsers.map((user, index) => (
            <div
              key={user.user_id}
              className={cn(
                "relative rounded-full border-2 border-background transition-all",
                user.hasNew && "ring-2 ring-primary ring-offset-1 ring-offset-background"
              )}
              style={{ zIndex: visibleUsers.length - index }}
            >
              <img
                src={user.avatar_url || `https://i.pravatar.cc/150?u=${user.user_id}`}
                alt={user.display_name || ''}
                className="w-9 h-9 rounded-full object-cover"
              />
            </div>
          ))}
        </div>
        {usersWithStories.length > 5 && (
          <span className="text-xs text-muted-foreground">
            +{usersWithStories.length - 5}
          </span>
        )}
        <ChevronDown className={cn(
          "w-4 h-4 text-muted-foreground ml-auto transition-transform",
          hasNewStories && "text-primary"
        )} />
      </button>
    );
  }

  // Expanded state - full stories row
  return (
    <>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*,video/*"
        className="hidden"
        onChange={handleFileSelect}
      />
      
      <div className="py-3 animate-fade-in">
        <ScrollArea className="w-full">
          <div className="flex px-4 gap-4">
            {usersWithStories.map((user, index) => {
              const hasStories = user.stories.length > 0;
              
              return (
                <div 
                  key={user.user_id} 
                  className="flex flex-col items-center flex-shrink-0 cursor-pointer"
                  onClick={() => handleStoryClick(index, user)}
                >
                  <div
                    className={cn(
                      "relative rounded-full p-0.5",
                      user.hasNew
                        ? "bg-gradient-to-tr from-primary via-accent to-primary"
                        : user.isOwn && !hasStories
                        ? ""
                        : hasStories
                        ? "bg-muted-foreground/30"
                        : "bg-muted"
                    )}
                  >
                    {user.isOwn && !hasStories ? (
                      <div className="w-[60px] h-[60px] rounded-full bg-muted flex items-center justify-center">
                        <div className="w-14 h-14 rounded-full bg-secondary flex items-center justify-center">
                          <Plus className="w-5 h-5 text-primary" />
                        </div>
                      </div>
                    ) : (
                      <div className="w-[60px] h-[60px] rounded-full bg-card p-0.5">
                        <img
                          src={user.avatar_url || `https://i.pravatar.cc/150?u=${user.user_id}`}
                          alt={user.display_name || ''}
                          className="w-full h-full rounded-full object-cover"
                        />
                      </div>
                    )}
                    {user.hasNew && (
                      <div className="absolute -bottom-0.5 left-1/2 -translate-x-1/2 px-1.5 py-0.5 bg-primary text-primary-foreground text-[9px] font-semibold rounded-full">
                        NEW
                      </div>
                    )}
                  </div>
                  <span className="text-xs text-foreground font-medium mt-1.5 max-w-16 truncate">
                    {user.isOwn ? 'Моя история' : user.display_name}
                  </span>
                </div>
              );
            })}
          </div>
          <ScrollBar orientation="horizontal" className="invisible" />
        </ScrollArea>
        
        {/* Collapse button */}
        <button 
          onClick={onToggle}
          className="w-full flex items-center justify-center py-2 text-muted-foreground hover:text-foreground transition-colors"
        >
          <ChevronDown className="w-4 h-4 rotate-180" />
        </button>
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
