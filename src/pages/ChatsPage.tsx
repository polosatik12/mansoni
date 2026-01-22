import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Search, Check, CheckCheck, LogIn, MessageCircle } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ChatConversation } from "@/components/chat/ChatConversation";
import { useAuth } from "@/hooks/useAuth";
import { useConversations, Conversation } from "@/hooks/useChat";
import { formatDistanceToNow } from "date-fns";
import { ru } from "date-fns/locale";

interface LocationState {
  conversationId?: string;
  chatName?: string;
}

export function ChatsPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const locationState = location.state as LocationState | null;
  const { user, loading: authLoading } = useAuth();
  const { conversations, loading: chatsLoading, refetch } = useConversations();
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [pendingConversationId, setPendingConversationId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  // Get the other participant's info for display
  const getOtherParticipant = (conv: Conversation) => {
    const other = conv.participants.find((p) => p.user_id !== user?.id);
    return other?.profile || { display_name: "Пользователь", avatar_url: null };
  };

  // Handle incoming conversationId from navigation state
  useEffect(() => {
    if (locationState?.conversationId) {
      console.log("[ChatsPage] Received conversationId from navigation:", locationState.conversationId);
      setPendingConversationId(locationState.conversationId);
      // Clear the state to prevent re-opening on refresh
      window.history.replaceState({}, document.title);
    }
  }, [locationState]);

  // Auto-select conversation when data is loaded
  useEffect(() => {
    if (!pendingConversationId || chatsLoading || conversations.length === 0) return;
    
    const conv = conversations.find((c) => c.id === pendingConversationId);
    if (conv) {
      console.log("[ChatsPage] Auto-selecting conversation:", conv.id);
      setSelectedConversation(conv);
      setPendingConversationId(null);
    } else {
      console.log("[ChatsPage] Conversation not found in list, refetching...");
      // Conversation might be newly created, refetch
      refetch().then(() => {
        setPendingConversationId(null);
      });
    }
  }, [pendingConversationId, chatsLoading, conversations, refetch]);

  const formatTime = (dateStr: string) => {
    try {
      return formatDistanceToNow(new Date(dateStr), { addSuffix: false, locale: ru });
    } catch {
      return "";
    }
  };

  const filteredConversations = conversations.filter((conv) => {
    const other = getOtherParticipant(conv);
    return (other.display_name || "").toLowerCase().includes(searchQuery.toLowerCase());
  });

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
        onBack={() => {
          setSelectedConversation(null);
          refetch();
        }}
      />
    );
  }

  return (
    <div className="min-h-screen">
      {/* Search */}
      <div className="p-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
          <Input
            placeholder="Поиск в чатах..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 h-12 rounded-xl bg-card border-border"
          />
        </div>
      </div>

      {/* Loading */}
      {chatsLoading && (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
        </div>
      )}

      {/* Empty state */}
      {!chatsLoading && filteredConversations.length === 0 && (
        <div className="flex flex-col items-center justify-center py-12 text-center px-6">
          <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
            <MessageCircle className="w-8 h-8 text-muted-foreground" />
          </div>
          <h3 className="font-semibold mb-1">Нет чатов</h3>
          <p className="text-sm text-muted-foreground">
            Начните переписку с другими пользователями
          </p>
        </div>
      )}

      {/* Chat List */}
      <div className="divide-y divide-border">
        {filteredConversations.map((conv) => {
          const other = getOtherParticipant(conv);
          const lastMessage = conv.last_message;
          const isMyMessage = lastMessage?.sender_id === user?.id;

          return (
            <div
              key={conv.id}
              onClick={() => setSelectedConversation(conv)}
              className="flex items-center gap-3 px-4 py-3 hover:bg-muted/50 transition-colors cursor-pointer active:bg-muted"
            >
              {/* Avatar */}
              <div className="relative">
                <img
                  src={other.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${conv.id}`}
                  alt={other.display_name || "User"}
                  className="w-14 h-14 rounded-full object-cover bg-muted"
                />
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-1.5">
                    <span className="font-semibold text-foreground truncate">
                      {other.display_name || "Пользователь"}
                    </span>
                  </div>
                  {lastMessage && (
                    <span className="text-xs text-muted-foreground flex-shrink-0">
                      {formatTime(lastMessage.created_at)}
                    </span>
                  )}
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 flex-1 min-w-0">
                    {/* Read status for sent messages */}
                    {isMyMessage && lastMessage?.is_read && (
                      <CheckCheck className="w-4 h-4 text-primary flex-shrink-0" />
                    )}
                    {isMyMessage && !lastMessage?.is_read && (
                      <Check className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                    )}
                    
                    <p className="text-sm text-muted-foreground truncate">
                      {lastMessage?.content || "Нет сообщений"}
                    </p>
                  </div>
                  
                  {/* Unread badge */}
                  {conv.unread_count > 0 && (
                    <Badge className="h-5 min-w-5 rounded-full px-1.5 text-[11px] flex-shrink-0 ml-2">
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
