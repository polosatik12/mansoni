import { useState } from "react";
import { Search, Check, CheckCheck, Mic } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ChatConversation } from "@/components/chat/ChatConversation";

interface Chat {
  id: string;
  name: string;
  avatar: string;
  lastMessage: string;
  time: string;
  unread: number;
  online: boolean;
  read: boolean;
  verified?: boolean;
  isGroup?: boolean;
  isVoice?: boolean;
  voiceDuration?: string;
  isSentByMe?: boolean;
}

const chats: Chat[] = [
  {
    id: "1",
    name: "Алиса Морозова",
    avatar: "https://i.pravatar.cc/150?img=1",
    lastMessage: "Привет! Как дела с проектом?",
    time: "2м",
    unread: 3,
    online: true,
    read: false,
    isSentByMe: false,
  },
  {
    id: "2",
    name: "Дмитрий Волков",
    avatar: "https://i.pravatar.cc/150?img=11",
    lastMessage: "",
    time: "15м",
    unread: 0,
    online: true,
    read: true,
    isVoice: true,
    voiceDuration: "0:24",
    isSentByMe: true,
  },
  {
    id: "3",
    name: "Dubai Tech Hub",
    avatar: "https://i.pravatar.cc/150?img=15",
    lastMessage: "Ваша заявка одобрена! 🎉",
    time: "1ч",
    unread: 1,
    online: false,
    read: false,
    verified: true,
    isSentByMe: false,
  },
  {
    id: "4",
    name: "Команда разработки",
    avatar: "https://i.pravatar.cc/150?img=20",
    lastMessage: "Максим: Деплой завершён успешно",
    time: "3ч",
    unread: 0,
    online: false,
    read: true,
    isGroup: true,
    isSentByMe: false,
  },
  {
    id: "5",
    name: "Анна Петрова",
    avatar: "https://i.pravatar.cc/150?img=5",
    lastMessage: "",
    time: "вчера",
    unread: 0,
    online: false,
    read: true,
    isVoice: true,
    voiceDuration: "1:12",
    isSentByMe: true,
  },
  {
    id: "6",
    name: "Поддержка Недвижимость",
    avatar: "https://i.pravatar.cc/150?img=25",
    lastMessage: "Ваша заявка №12345 обработана",
    time: "вчера",
    unread: 0,
    online: false,
    read: true,
    isSentByMe: false,
  },
];

export function ChatsPage() {
  const [selectedChat, setSelectedChat] = useState<Chat | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  const filteredChats = chats.filter((chat) =>
    chat.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (selectedChat) {
    return (
      <ChatConversation
        chat={selectedChat}
        onBack={() => setSelectedChat(null)}
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

      {/* Chat List */}
      <div className="divide-y divide-border">
        {filteredChats.map((chat) => (
          <div
            key={chat.id}
            onClick={() => setSelectedChat(chat)}
            className="flex items-center gap-3 px-4 py-3 hover:bg-muted/50 transition-colors cursor-pointer active:bg-muted"
          >
            {/* Avatar */}
            <div className="relative">
              <img
                src={chat.avatar}
                alt={chat.name}
                className="w-14 h-14 rounded-full object-cover"
              />
              {chat.online && (
                <div className="absolute bottom-0 right-0 w-4 h-4 bg-green-500 border-2 border-card rounded-full" />
              )}
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-1.5">
                  <span className="font-semibold text-foreground truncate">
                    {chat.name}
                  </span>
                  {chat.verified && (
                    <div className="w-4 h-4 rounded-full bg-primary flex items-center justify-center">
                      <Check className="w-3 h-3 text-primary-foreground" />
                    </div>
                  )}
                </div>
                <span className="text-xs text-muted-foreground flex-shrink-0">
                  {chat.time}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 flex-1 min-w-0">
                  {/* Read status for sent messages */}
                  {chat.isSentByMe && chat.read && !chat.unread && (
                    <CheckCheck className="w-4 h-4 text-primary flex-shrink-0" />
                  )}
                  {chat.isSentByMe && !chat.read && !chat.unread && (
                    <Check className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                  )}
                  
                  {/* Voice message indicator */}
                  {chat.isVoice ? (
                    <div className="flex items-center gap-1.5 text-muted-foreground">
                      <Mic className="w-4 h-4 flex-shrink-0" />
                      <span className="text-sm">{chat.voiceDuration}</span>
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground truncate">
                      {chat.lastMessage}
                    </p>
                  )}
                </div>
                
                {/* Unread badge */}
                {chat.unread > 0 && (
                  <Badge className="h-5 min-w-5 rounded-full px-1.5 text-[11px] flex-shrink-0 ml-2">
                    {chat.unread}
                  </Badge>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}