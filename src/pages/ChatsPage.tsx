import { useState, useEffect, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Search, Check, CheckCheck, LogIn, MessageCircle, Plus, Megaphone, Users } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ChatConversation } from "@/components/chat/ChatConversation";
import { ChatStories } from "@/components/chat/ChatStories";
import { ChatSearchSheet } from "@/components/chat/ChatSearchSheet";
import { CreateChatSheet } from "@/components/chat/CreateChatSheet";
import { ChannelConversation } from "@/components/chat/ChannelConversation";
import { GroupConversation } from "@/components/chat/GroupConversation";
import { useAuth } from "@/hooks/useAuth";
import { useConversations, Conversation, useCreateConversation } from "@/hooks/useChat";
import { useChannels, Channel } from "@/hooks/useChannels";
import { useGroupChats, GroupChat } from "@/hooks/useGroupChats";
import { SearchUser } from "@/hooks/useSearch";
import { formatDistanceToNow } from "date-fns";
import { ru } from "date-fns/locale";
import { ScrollContainerProvider } from "@/contexts/ScrollContainerContext";
import { usePullDownExpand } from "@/hooks/usePullDownExpand";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface LocationState {
  conversationId?: string;
  chatName?: string;
}

// Animation constants
const HEADER_BASE_HEIGHT = 56;
const STORIES_ROW_HEIGHT = 92;

export function ChatsPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const locationState = location.state as LocationState | null;
  const { user, loading: authLoading } = useAuth();
  const { conversations, loading: chatsLoading, error: chatsError, refetch } = useConversations();
  const { channels, loading: channelsLoading, refetch: refetchChannels } = useChannels();
  const { groups, loading: groupsLoading, refetch: refetchGroups } = useGroupChats();
  const { createConversation } = useCreateConversation();
  
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [selectedChannel, setSelectedChannel] = useState<Channel | null>(null);
  const [selectedGroup, setSelectedGroup] = useState<GroupChat | null>(null);
  const [searchOpen, setSearchOpen] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<"chats" | "channels">("chats");
  
  // Local scroll container for chat list
  const chatListRef = useRef<HTMLDivElement>(null);
  
  // Pull-down expand hook for stories
  const { expandProgress, isExpanded, toggleExpanded } = usePullDownExpand(chatListRef, {
    threshold: 80,
    collapseScrollThreshold: 10,
  });

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

  const formatTime = (dateStr: string) => {
    try {
      return formatDistanceToNow(new Date(dateStr), { addSuffix: false, locale: ru });
    } catch {
      return "";
    }
  };

  // Get user IDs already in conversations
  const conversationUserIds = new Set(
    conversations.flatMap(c => c.participants.map(p => p.user_id))
  );

  const handleUserSelect = async (searchUser: SearchUser) => {
    try {
      const convId = await createConversation(searchUser.user_id);
      if (convId) {
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

  const handleChannelCreated = (channelId: string) => {
    refetchChannels();
    const newChannel = channels.find(c => c.id === channelId);
    if (newChannel) {
      setSelectedChannel(newChannel);
    }
  };

  const handleGroupCreated = (groupId: string) => {
    refetchGroups();
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

  // Show selected DM conversation
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

  // Show selected channel
  if (selectedChannel) {
    return (
      <ChannelConversation
        channel={selectedChannel}
        onBack={() => {
          setSelectedChannel(null);
          refetchChannels();
        }}
        onLeave={() => refetchChannels()}
      />
    );
  }

  // Show selected group
  if (selectedGroup) {
    return (
      <GroupConversation
        group={selectedGroup}
        onBack={() => {
          setSelectedGroup(null);
          refetchGroups();
        }}
        onLeave={() => refetchGroups()}
      />
    );
  }

  // Calculate header height based on expand progress
  const headerHeight = HEADER_BASE_HEIGHT + (STORIES_ROW_HEIGHT * expandProgress);

  return (
    <ScrollContainerProvider value={chatListRef}>
      <div className="h-full flex flex-col overflow-hidden">
        {/* Dynamic Header with stories stack/row */}
        <div 
          className="flex-shrink-0 border-b border-border bg-background will-change-auto overflow-hidden"
          style={{ 
            height: headerHeight,
            transition: expandProgress === 0 || expandProgress === 1 ? 'height 0.2s ease-out' : 'none',
          }}
        >
          {/* Top row: stack (when collapsed) + title + actions */}
          <div className="flex items-center justify-between px-4 h-14">
            {/* Stories stack (collapsed) - left side */}
            <div 
              className="flex-shrink-0 transition-opacity"
              style={{ 
                opacity: 1 - expandProgress,
                pointerEvents: expandProgress > 0.5 ? 'none' : 'auto',
              }}
            >
              <ChatStories 
                expandProgress={0} 
                mode="stack" 
                onStackClick={toggleExpanded}
              />
            </div>
            
            {/* Title - shifts based on expand */}
            <h1 
              className="text-lg font-semibold absolute left-1/2 -translate-x-1/2"
              style={{
                transform: `translateX(-50%) translateX(${(1 - expandProgress) * 30}px)`,
              }}
            >
              Чаты
            </h1>
            
            {/* Actions: Search + Create */}
            <div className="flex items-center gap-1">
              <button 
                onClick={() => setSearchOpen(true)}
                className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-muted transition-colors"
              >
                <Search className="w-5 h-5 text-foreground" />
              </button>
              <button 
                onClick={() => setCreateOpen(true)}
                className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-muted transition-colors"
              >
                <Plus className="w-5 h-5 text-foreground" />
              </button>
            </div>
          </div>
          
          {/* Stories row (expanded) - appears below title */}
          <div 
            className="overflow-hidden"
            style={{ 
              opacity: expandProgress,
              height: STORIES_ROW_HEIGHT * expandProgress,
              pointerEvents: expandProgress < 0.5 ? 'none' : 'auto',
            }}
          >
            <ChatStories 
              expandProgress={expandProgress} 
              mode="row" 
            />
          </div>
        </div>

        {/* Tabs for switching between chats and channels */}
        <div className="flex-shrink-0 px-4 py-2 bg-background border-b border-border">
          <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as "chats" | "channels")}>
            <TabsList className="w-full">
              <TabsTrigger value="chats" className="flex-1 gap-2">
                <MessageCircle className="w-4 h-4" />
                Личные
              </TabsTrigger>
              <TabsTrigger value="channels" className="flex-1 gap-2">
                <Megaphone className="w-4 h-4" />
                Каналы
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        {/* Scrollable list */}
        <div 
          ref={chatListRef}
          className="flex-1 overflow-y-auto overscroll-contain"
        >
          {activeTab === "chats" && (
            <>
              {/* Loading */}
              {chatsLoading && (
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
              {!chatsLoading && !groupsLoading && !chatsError && conversations.length === 0 && groups.length === 0 && (
                <div className="flex flex-col items-center justify-center py-12 text-center px-6">
                  <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
                    <MessageCircle className="w-8 h-8 text-muted-foreground" />
                  </div>
                  <h3 className="font-semibold mb-1">Нет чатов</h3>
                  <p className="text-sm text-muted-foreground">
                    Найдите пользователей через поиск или создайте группу
                  </p>
                </div>
              )}

              {/* Group Chats */}
              {groups.map((group) => (
                <div
                  key={group.id}
                  onClick={() => setSelectedGroup(group)}
                  className="flex items-center gap-3 px-4 py-2.5 hover:bg-muted/50 transition-colors cursor-pointer active:bg-muted border-b border-border/50"
                >
                  <div className="relative flex-shrink-0">
                    <img
                      src={group.avatar_url || `https://api.dicebear.com/7.x/shapes/svg?seed=${group.id}`}
                      alt={group.name}
                      className="w-14 h-14 rounded-full object-cover bg-muted"
                    />
                    <div className="absolute -bottom-0.5 -right-0.5 w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center border-2 border-background">
                      <Users className="w-3 h-3 text-white" />
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-0.5">
                      <span className="font-semibold text-foreground truncate flex items-center gap-1">
                        {group.name}
                      </span>
                      {group.last_message && (
                        <span className="text-xs text-muted-foreground flex-shrink-0 ml-2">
                          {formatTime(group.last_message.created_at)}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center justify-between">
                      <p className="text-sm text-muted-foreground truncate flex-1">
                        {group.last_message?.content || `${group.member_count} участников`}
                      </p>
                    </div>
                  </div>
                </div>
              ))}

              {/* Chat List Items */}
              {conversations.map((conv) => {
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
            </>
          )}

          {activeTab === "channels" && (
            <>
              {/* Loading */}
              {channelsLoading && (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary" />
                </div>
              )}

              {/* Empty state */}
              {!channelsLoading && channels.length === 0 && (
                <div className="flex flex-col items-center justify-center py-12 text-center px-6">
                  <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
                    <Megaphone className="w-8 h-8 text-muted-foreground" />
                  </div>
                  <h3 className="font-semibold mb-1">Нет каналов</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Создайте свой канал или вступите в существующий
                  </p>
                  <Button onClick={() => setCreateOpen(true)} className="gap-2">
                    <Plus className="w-4 h-4" />
                    Создать канал
                  </Button>
                </div>
              )}

              {/* Channel List Items */}
              {channels.map((channel) => (
                <div
                  key={channel.id}
                  onClick={() => setSelectedChannel(channel)}
                  className="flex items-center gap-3 px-4 py-2.5 hover:bg-muted/50 transition-colors cursor-pointer active:bg-muted border-b border-border/50"
                >
                  {/* Avatar */}
                  <div className="relative flex-shrink-0">
                    <img
                      src={channel.avatar_url || `https://api.dicebear.com/7.x/shapes/svg?seed=${channel.id}`}
                      alt={channel.name}
                      className="w-14 h-14 rounded-full object-cover bg-muted"
                    />
                    {channel.is_member && (
                      <div className="absolute -bottom-0.5 -right-0.5 w-5 h-5 bg-primary rounded-full flex items-center justify-center border-2 border-background">
                        <Check className="w-3 h-3 text-primary-foreground" />
                      </div>
                    )}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-0.5">
                      <span className="font-semibold text-foreground truncate flex items-center gap-1">
                        <Megaphone className="w-4 h-4 text-primary flex-shrink-0" />
                        {channel.name}
                      </span>
                      {channel.last_message && (
                        <span className="text-xs text-muted-foreground flex-shrink-0 ml-2">
                          {formatTime(channel.last_message.created_at)}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center justify-between">
                      <p className="text-sm text-muted-foreground truncate flex-1">
                        {channel.last_message?.content || channel.description || `${channel.member_count} участников`}
                      </p>
                      <div className="flex items-center gap-1 text-xs text-muted-foreground ml-2">
                        <Users className="w-3 h-3" />
                        {channel.member_count}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </>
          )}
        </div>

        {/* Search Sheet */}
        <ChatSearchSheet
          open={searchOpen}
          onOpenChange={setSearchOpen}
          onUserSelect={handleUserSelect}
          existingUserIds={conversationUserIds}
          currentUserId={user?.id}
        />

        {/* Create Chat Sheet */}
        <CreateChatSheet
          open={createOpen}
          onOpenChange={setCreateOpen}
          onChannelCreated={handleChannelCreated}
          onGroupCreated={handleGroupCreated}
        />
      </div>
    </ScrollContainerProvider>
  );
}
