import { Search, MoreVertical, Check, CheckCheck } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

const chats = [
  {
    id: "1",
    name: "Алиса Морозова",
    avatar: "https://i.pravatar.cc/150?img=1",
    lastMessage: "Привет! Как дела с проектом?",
    time: "2м",
    unread: 3,
    online: true,
    read: false,
  },
  {
    id: "2",
    name: "Дмитрий Волков",
    avatar: "https://i.pravatar.cc/150?img=11",
    lastMessage: "Отправил документы на почту",
    time: "15м",
    unread: 0,
    online: true,
    read: true,
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
  },
  {
    id: "5",
    name: "Анна Петрова",
    avatar: "https://i.pravatar.cc/150?img=5",
    lastMessage: "Спасибо за помощь!",
    time: "вчера",
    unread: 0,
    online: false,
    read: true,
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
  },
];

export function ChatsPage() {
  return (
    <div className="min-h-screen">
      {/* Search */}
      <div className="p-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
          <Input
            placeholder="Поиск в чатах..."
            className="pl-10 h-12 rounded-xl bg-card border-border"
          />
        </div>
      </div>

      {/* Chat List */}
      <div className="divide-y divide-border">
        {chats.map((chat) => (
          <div
            key={chat.id}
            className="flex items-center gap-3 px-4 py-3 hover:bg-muted/50 transition-colors cursor-pointer"
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
                <p className="text-sm text-muted-foreground truncate pr-2">
                  {chat.lastMessage}
                </p>
                <div className="flex items-center gap-2 flex-shrink-0">
                  {chat.read && !chat.unread && (
                    <CheckCheck className="w-4 h-4 text-primary" />
                  )}
                  {chat.unread > 0 && (
                    <Badge className="h-5 min-w-5 rounded-full px-1.5 text-[11px]">
                      {chat.unread}
                    </Badge>
                  )}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
