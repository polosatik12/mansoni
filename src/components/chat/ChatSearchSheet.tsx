import { useState, useEffect } from "react";
import { Search, X, UserPlus } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { useSearch, SearchUser } from "@/hooks/useSearch";

interface ChatSearchSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUserSelect: (user: SearchUser) => void;
  existingUserIds: Set<string>;
  currentUserId?: string;
}

export function ChatSearchSheet({ 
  open, 
  onOpenChange, 
  onUserSelect, 
  existingUserIds,
  currentUserId 
}: ChatSearchSheetProps) {
  const { users: searchedUsers, loading, searchUsers } = useSearch();
  const [searchQuery, setSearchQuery] = useState("");

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchQuery.trim().length >= 2) {
        searchUsers(searchQuery);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery, searchUsers]);

  // Reset on close
  useEffect(() => {
    if (!open) {
      setSearchQuery("");
    }
  }, [open]);

  // Filter out users already in conversations
  const newUsers = searchedUsers.filter(
    u => !existingUserIds.has(u.user_id) && u.user_id !== currentUserId
  );

  const handleSelect = (user: SearchUser) => {
    onUserSelect(user);
    onOpenChange(false);
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent 
        side="top" 
        className="h-[85vh] rounded-b-3xl bg-white/20 dark:bg-black/30 backdrop-blur-2xl border-b border-white/20 shadow-2xl"
      >
        <SheetHeader className="pb-4">
          <SheetTitle>Поиск пользователей</SheetTitle>
        </SheetHeader>
        
        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Введите имя..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 pr-9 h-11 rounded-xl bg-muted/50 border-0 focus-visible:ring-1"
            autoFocus
          />
          {searchQuery && (
            <button 
              onClick={() => setSearchQuery("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        <div className="overflow-y-auto flex-1 -mx-6 px-6">
          {loading && (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary" />
            </div>
          )}

          {!loading && searchQuery.trim().length < 2 && (
            <div className="text-center py-8 text-muted-foreground text-sm">
              Введите минимум 2 символа для поиска
            </div>
          )}

          {!loading && searchQuery.trim().length >= 2 && newUsers.length === 0 && (
            <div className="text-center py-8 text-muted-foreground text-sm">
              Пользователи не найдены
            </div>
          )}

          {newUsers.map((u) => (
            <div
              key={u.user_id}
              onClick={() => handleSelect(u)}
              className="flex items-center gap-3 py-3 hover:bg-muted/50 transition-colors cursor-pointer rounded-lg px-2 -mx-2"
            >
              <img
                src={u.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${u.user_id}`}
                alt={u.display_name}
                className="w-12 h-12 rounded-full object-cover bg-muted"
              />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className="font-medium text-foreground truncate">
                    {u.display_name}
                  </span>
                  {u.verified && (
                    <span className="text-primary text-xs">✓</span>
                  )}
                </div>
                {u.bio && (
                  <p className="text-sm text-muted-foreground truncate">{u.bio}</p>
                )}
              </div>
              <UserPlus className="w-5 h-5 text-primary flex-shrink-0" />
            </div>
          ))}
        </div>
      </SheetContent>
    </Sheet>
  );
}
