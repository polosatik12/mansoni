import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Search, X, UserPlus, Megaphone, Users, Check } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { GradientAvatar } from "@/components/ui/gradient-avatar";
import { useSearch, SearchUser, SearchChannel } from "@/hooks/useSearch";
import { Channel } from "@/hooks/useChannels";

interface ChatSearchSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onStartChat: (user: SearchUser) => void;
  onOpenChannel?: (channel: Channel) => void;
  existingUserIds: Set<string>;
  currentUserId?: string;
}

export function ChatSearchSheet({ 
  open, 
  onOpenChange, 
  onStartChat,
  onOpenChannel,
  existingUserIds,
  currentUserId 
}: ChatSearchSheetProps) {
  const navigate = useNavigate();
  const { users: searchedUsers, channels: searchedChannels, loading, channelsLoading, searchUsers, searchChannels } = useSearch();
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState<"users" | "channels">("users");

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchQuery.trim().length >= 2) {
        searchUsers(searchQuery);
        searchChannels(searchQuery);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery, searchUsers, searchChannels]);

  // Reset on close
  useEffect(() => {
    if (!open) {
      setSearchQuery("");
      setActiveTab("users");
    }
  }, [open]);

  // Filter out users already in conversations
  const newUsers = searchedUsers.filter(
    u => !existingUserIds.has(u.user_id) && u.user_id !== currentUserId
  );

  const handleOpenProfile = (user: SearchUser) => {
    navigate(`/user/${user.user_id}`);
    onOpenChange(false);
  };

  const handleStartChat = (user: SearchUser) => {
    onStartChat(user);
    onOpenChange(false);
  };

  const handleOpenChannel = (ch: SearchChannel) => {
    if (!onOpenChannel) return;
    // Convert SearchChannel to Channel type for ChannelConversation
    const channel: Channel = {
      id: ch.id,
      name: ch.name,
      description: ch.description,
      avatar_url: ch.avatar_url,
      owner_id: "",
      is_public: true,
      member_count: ch.member_count,
      created_at: "",
      updated_at: "",
      is_member: ch.is_member,
    };
    onOpenChannel(channel);
    onOpenChange(false);
  };

  const isSearching = searchQuery.trim().length >= 2;
  const isLoading = activeTab === "users" ? loading : channelsLoading;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent 
        side="top" 
        className="h-[85vh] rounded-b-3xl border-b border-white/10 shadow-2xl overflow-hidden p-0 bg-transparent"
        overlayClassName="bg-transparent"
        closeButtonClassName="text-white"
        aria-describedby={undefined}
      >
        {/* Semi-transparent glass effect */}
        <div className="absolute inset-0 bg-black/40 backdrop-blur-xl pointer-events-none" />
        
        {/* Content */}
        <div className="relative z-10 h-full flex flex-col p-6 pt-12">
          <SheetHeader className="pb-4">
            <SheetTitle className="text-white">Глобальный поиск</SheetTitle>
          </SheetHeader>
          
          <div className="relative mb-4">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/60" />
            <Input
              placeholder="Поиск людей и каналов..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 pr-9 h-11 rounded-xl bg-white/10 border-white/20 text-white placeholder:text-white/50 focus-visible:ring-white/30"
              autoFocus
            />
            {searchQuery && (
              <button 
                onClick={() => setSearchQuery("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-white/60 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Tabs */}
          <div className="flex items-center gap-2 mb-4">
            <button
              onClick={() => setActiveTab("users")}
              className={`px-4 py-1.5 text-sm font-medium rounded-full transition-all ${
                activeTab === "users"
                  ? "bg-white/20 text-white"
                  : "text-white/50 hover:text-white/80"
              }`}
            >
              Люди
            </button>
            <button
              onClick={() => setActiveTab("channels")}
              className={`px-4 py-1.5 text-sm font-medium rounded-full transition-all flex items-center gap-1.5 ${
                activeTab === "channels"
                  ? "bg-white/20 text-white"
                  : "text-white/50 hover:text-white/80"
              }`}
            >
              <Megaphone className="w-3.5 h-3.5" />
              Каналы
            </button>
          </div>

          <div className="overflow-y-auto flex-1 -mx-6 px-6">
            {isLoading && (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white" />
              </div>
            )}

            {!isLoading && !isSearching && (
              <div className="text-center py-8 text-white/60 text-sm">
                {activeTab === "users"
                  ? "Введите минимум 2 символа для поиска"
                  : "Введите название канала для поиска"}
              </div>
            )}

            {/* Users tab */}
            {activeTab === "users" && !isLoading && isSearching && (
              <>
                {newUsers.length === 0 ? (
                  <div className="text-center py-8 text-white/60 text-sm">
                    Пользователи не найдены
                  </div>
                ) : (
                  newUsers.map((u) => (
                    <div
                      key={u.user_id}
                      onClick={() => handleOpenProfile(u)}
                      className="flex items-center gap-3 py-3 hover:bg-white/10 transition-colors cursor-pointer rounded-lg px-2 -mx-2"
                    >
                      <GradientAvatar
                        name={u.display_name || 'User'}
                        seed={u.user_id}
                        avatarUrl={u.avatar_url || null}
                        size="md"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span className="font-medium text-white truncate">
                            {u.display_name}
                          </span>
                          {u.verified && (
                            <span className="text-primary text-xs">✓</span>
                          )}
                        </div>
                        {u.bio && (
                          <p className="text-sm text-white/60 truncate">{u.bio}</p>
                        )}
                      </div>
                      <button
                        type="button"
                        className="p-2 -m-2 rounded-full hover:bg-white/10 active:bg-white/15 text-primary flex-shrink-0"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          handleStartChat(u);
                        }}
                        aria-label="Начать чат"
                      >
                        <UserPlus className="w-5 h-5" />
                      </button>
                    </div>
                  ))
                )}
              </>
            )}

            {/* Channels tab */}
            {activeTab === "channels" && !isLoading && isSearching && (
              <>
                {searchedChannels.length === 0 ? (
                  <div className="text-center py-8 text-white/60 text-sm">
                    Каналы не найдены
                  </div>
                ) : (
                  searchedChannels.map((ch) => (
                    <div
                      key={ch.id}
                      onClick={() => handleOpenChannel(ch)}
                      className="flex items-center gap-3 py-3 hover:bg-white/10 transition-colors cursor-pointer rounded-lg px-2 -mx-2"
                    >
                      <div className="relative flex-shrink-0">
                        <GradientAvatar
                          name={ch.name}
                          seed={ch.id}
                          avatarUrl={ch.avatar_url}
                          size="md"
                        />
                        {ch.is_member && (
                          <div className="absolute -bottom-0.5 -right-0.5 w-5 h-5 bg-emerald-500 rounded-full flex items-center justify-center border-2 border-slate-900">
                            <Check className="w-3 h-3 text-white" />
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5">
                          <Megaphone className="w-3.5 h-3.5 text-cyan-400 flex-shrink-0" />
                          <span className="font-medium text-white truncate">
                            {ch.name}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <p className="text-sm text-white/50 truncate flex-1">
                            {ch.description || "Публичный канал"}
                          </p>
                          <div className="flex items-center gap-1 text-xs text-white/40 flex-shrink-0">
                            <Users className="w-3 h-3" />
                            {ch.member_count}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </>
            )}
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
