import { useState, useEffect, useCallback, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Search, Check, CheckCheck, LogIn, MessageCircle, X, UserPlus } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ChatConversation } from "@/components/chat/ChatConversation";
import { ChatStories } from "@/components/chat/ChatStories";
import { useAuth } from "@/hooks/useAuth";
import { useConversations, Conversation, useCreateConversation } from "@/hooks/useChat";
import { useSearch, SearchUser } from "@/hooks/useSearch";
import { formatDistanceToNow } from "date-fns";
import { ru } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { useSwipeGesture } from "@/hooks/useSwipeGesture";

interface LocationState {
  conversationId?: string;
  chatName?: string;
}

export function ChatsPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const locationState = location.state as LocationState | null;
  const { user, loading: authLoading } = useAuth();
  const { conversations, loading: chatsLoading, error: chatsError, refetch } = useConversations();
  const { users: searchedUsers, loading: searchLoading, searchUsers } = useSearch();
  const { createConversation } = useCreateConversation();
  
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [storiesExpanded, setStoriesExpanded] = useState(false);
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  
  // Refs for swipe gesture
  const storiesContainerRef = useRef<HTMLDivElement>(null);
  const lastScrollTop = useRef(0);

  // Swipe gesture for expanding stories
  const { progress: swipeProgress, isDragging } = useSwipeGesture(storiesContainerRef, {
    threshold: 60,
    onSwipeDown: () => setStoriesExpanded(true),
    enabled: !storiesExpanded,
  });

  // Handle scroll to collapse stories
  const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    const scrollTop = e.currentTarget.scrollTop;
    
    // Collapse stories when scrolling down
    if (scrollTop > lastScrollTop.current && scrollTop > 20 && storiesExpanded) {
      setStoriesExpanded(false);
    }
    
    lastScrollTop.current = scrollTop;
  }, [storiesExpanded]);

  // Get the other participant's info for display
  const getOtherParticipant = (conv: Conversation) => {
    const other = conv.participants.find((p) => p.user_id !== user?.id);
    return {
      user_id: other?.user_id || "",
      ...(other?.profile || { display_name: "Пользователь", avatar_url: null })
    };
  };

  // Handle incoming conversationId from navigation state
  useEffect(() => {
    if (locationState?.conversationId) {
      const immediateConv: Conversation = {
        id: locationState.conversationId,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        participants: [],
        unread_count: 0
      };
      
      setSelectedConversation(immediateConv);
      window.history.replaceState({}, document.title);
      refetch();
    }
  }, [locationState, refetch]);

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchQuery.trim().length >= 2) {
        searchUsers(searchQuery);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery, searchUsers]);

  const formatTime = (dateStr: string) => {
    try {
      return formatDistanceToNow(new Date(dateStr), { addSuffix: false, locale: ru });
    } catch {
      return "";
    }
  };

  // Filter conversations by search
  const filteredConversations = conversations.filter((conv) => {
    if (!searchQuery.trim()) return true;
    const other = getOtherParticipant(conv);
    return (other.display_name || "").toLowerCase().includes(searchQuery.toLowerCase());
  });

  // Filter searched users to exclude those already in conversations
  const conversationUserIds = new Set(
    conversations.flatMap(c => c.participants.map(p => p.user_id))
  );
  const newUsers = searchedUsers.filter(u => !conversationUserIds.has(u.user_id) && u.user_id !== user?.id);

  const handleUserClick = async (searchUser: SearchUser) => {
    try {
      const convId = await createConversation(searchUser.user_id);
      if (convId) {
        setSearchQuery("");
        setIsSearchFocused(false);
        const newConv: Conversation = {
          id: convId,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          participants: [{
            user_id: searchUser.user_id,
            profile: {
              display_name: searchUser.display_name,
              avatar_url: searchUser.avatar_url
            }
          }],
          unread_count: 0
        };
        setSelectedConversation(newConv);
      }
    } catch (error) {
      console.error("Failed to create conversation:", error);
    }
  };

  const clearSearch = () => {
    setSearchQuery("");
    setIsSearchFocused(false);
  };

  // Show auth prompt if not logged in
  if (!authLoading && !user) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6 text-center">
        <div className="w-20 h-20 rounded-full bg-muted flex items-center justify-center mb-4">
          <MessageCircle className="w-10 h-10 text-muted-foreground" />
        </div>
        <h2 className="text-xl font-semibold mb-2">Войдите для доступа к чатам</h2>
        <p className="text-muted-foreground mb-6">
          Чтобы переписываться и сохранять историю сообщений, необходимо войти в аккаунт
        </p>
        <Button onClick={() => navigate("/auth")} className="gap-2">
          <LogIn className="w-4 h-4" />
          Войти
        </Button>
      </div>
    );
  }

  if (selectedConversation) {
    const other = getOtherParticipant(selectedConversation);
    return (
      <ChatConversation
        conversationId={selectedConversation.id}
        chatName={other.display_name || "Пользователь"}
        chatAvatar={other.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${selectedConversation.id}`}
        otherUserId={other.user_id}
        onBack={() => {
          setSelectedConversation(null);
          refetch();
        }}
      />
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header with Title */}
      <div className="flex items-center justify-center py-3 border-b border-border">
        <h1 className="text-lg font-semibold">Чаты</h1>
      </div>

      {/* Stories Section - Pull down to expand */}
      <div 
        ref={storiesContainerRef}
        className={cn(
          "border-b border-border overflow-hidden touch-pan-y",
          isDragging && "select-none"
        )}
      >
        <ChatStories 
          isExpanded={storiesExpanded} 
          onExpandChange={setStoriesExpanded}
          swipeProgress={swipeProgress}
        />
      </div>

      {/* Unified Search */}
      <div className="p-3 border-b border-border">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Поиск"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onFocus={() => setIsSearchFocused(true)}
            className="pl-9 pr-9 h-10 rounded-xl bg-muted/50 border-0 focus-visible:ring-1"
          />
          {searchQuery && (
            <button 
              onClick={clearSearch}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Search Results - Users not in conversations */}
      {searchQuery.trim().length >= 2 && newUsers.length > 0 && (
        <div className="border-b border-border">
          <div className="px-4 py-2 text-xs font-medium text-muted-foreground uppercase">
            Пользователи
          </div>
          {newUsers.map((u) => (
            <div
              key={u.user_id}
              onClick={() => handleUserClick(u)}
              className="flex items-center gap-3 px-4 py-2.5 hover:bg-muted/50 transition-colors cursor-pointer"
            >
              <img
                src={u.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${u.user_id}`}
                alt={u.display_name}
                className="w-11 h-11 rounded-full object-cover bg-muted"
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
      )}

      {/* Loading */}
      {(chatsLoading || searchLoading) && (
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary" />
        </div>
      )}

      {/* Error */}
      {!chatsLoading && chatsError && (
        <div className="px-4 py-3">
          <div className="rounded-xl border border-border bg-card p-4">
            <p className="font-semibold text-foreground">Не удалось загрузить чаты</p>
            <p className="mt-1 text-sm text-muted-foreground break-words">{chatsError}</p>
            <div className="mt-3">
              <Button variant="outline" size="sm" onClick={() => refetch()}>Повторить</Button>
            </div>
          </div>
        </div>
      )}

      {/* Empty state */}
      {!chatsLoading && !chatsError && filteredConversations.length === 0 && !searchQuery && (
        <div className="flex flex-col items-center justify-center py-12 text-center px-6">
          <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
            <MessageCircle className="w-8 h-8 text-muted-foreground" />
          </div>
          <h3 className="font-semibold mb-1">Нет чатов</h3>
          <p className="text-sm text-muted-foreground">
            Найдите пользователей через поиск, чтобы начать переписку
          </p>
        </div>
      )}

      {/* Chat List */}
      <div className="flex-1 overflow-y-auto overscroll-contain" onScroll={handleScroll}>
        {filteredConversations.map((conv) => {
          const other = getOtherParticipant(conv);
          const lastMessage = conv.last_message;
          const isMyMessage = lastMessage?.sender_id === user?.id;

          return (
            <div
              key={conv.id}
              onClick={() => setSelectedConversation(conv)}
              className="flex items-center gap-3 px-4 py-2.5 hover:bg-muted/50 transition-colors cursor-pointer active:bg-muted border-b border-border/50"
            >
              {/* Avatar */}
              <div className="relative flex-shrink-0">
                <img
                  src={other.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${conv.id}`}
                  alt={other.display_name || "User"}
                  className="w-14 h-14 rounded-full object-cover bg-muted"
                />
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-0.5">
                  <span className="font-semibold text-foreground truncate">
                    {other.display_name || "Пользователь"}
                  </span>
                  {lastMessage && (
                    <span className="text-xs text-muted-foreground flex-shrink-0 ml-2">
                      {formatTime(lastMessage.created_at)}
                    </span>
                  )}
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1 flex-1 min-w-0">
                    {isMyMessage && lastMessage?.is_read && (
                      <CheckCheck className="w-4 h-4 text-primary flex-shrink-0" />
                    )}
                    {isMyMessage && !lastMessage?.is_read && (
                      <Check className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                    )}
                    <p className="text-sm text-muted-foreground truncate">
                      {lastMessage?.media_type === 'video_circle' 
                        ? '🎥 Видеосообщение'
                        : lastMessage?.media_type === 'voice'
                        ? '🎤 Голосовое сообщение'
                        : lastMessage?.media_url
                        ? '📷 Фото'
                        : lastMessage?.content || "Нет сообщений"}
                    </p>
                  </div>
                  
                  {conv.unread_count > 0 && (
                    <Badge className="h-5 min-w-5 rounded-full px-1.5 text-[11px] flex-shrink-0 ml-2 bg-primary">
                      {conv.unread_count}
                    </Badge>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
