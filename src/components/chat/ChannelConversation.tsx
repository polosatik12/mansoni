import { useState, useRef, useEffect } from "react";
import { ArrowLeft, Send, MoreVertical, Users, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useChannelMessages, useJoinChannel, Channel } from "@/hooks/useChannels";
import { useAuth } from "@/hooks/useAuth";
import { formatDistanceToNow } from "date-fns";
import { ru } from "date-fns/locale";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from "sonner";

interface ChannelConversationProps {
  channel: Channel;
  onBack: () => void;
  onLeave?: () => void;
}

export function ChannelConversation({ channel, onBack, onLeave }: ChannelConversationProps) {
  const { user } = useAuth();
  const { messages, loading, sendMessage } = useChannelMessages(channel.id);
  const { joinChannel, leaveChannel } = useJoinChannel();
  const [newMessage, setNewMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [isMember, setIsMember] = useState(channel.is_member);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = async () => {
    if (!newMessage.trim() || sending) return;
    
    setSending(true);
    try {
      await sendMessage(newMessage);
      setNewMessage("");
    } catch (error) {
      toast.error("Не удалось отправить сообщение");
    } finally {
      setSending(false);
    }
  };

  const handleJoin = async () => {
    const success = await joinChannel(channel.id);
    if (success) {
      setIsMember(true);
      toast.success("Вы вступили в канал");
    } else {
      toast.error("Не удалось вступить в канал");
    }
  };

  const handleLeave = async () => {
    const success = await leaveChannel(channel.id);
    if (success) {
      toast.success("Вы покинули канал");
      onLeave?.();
      onBack();
    } else {
      toast.error("Не удалось покинуть канал");
    }
  };

  const formatTime = (dateStr: string) => {
    try {
      return formatDistanceToNow(new Date(dateStr), { addSuffix: false, locale: ru });
    } catch {
      return "";
    }
  };

  return (
    <div className="h-full flex flex-col bg-background">
      {/* Header */}
      <div className="flex-shrink-0 flex items-center gap-3 px-4 py-3 border-b border-border bg-background">
        <button onClick={onBack} className="p-1">
          <ArrowLeft className="w-6 h-6" />
        </button>
        
        <img
          src={channel.avatar_url || `https://api.dicebear.com/7.x/shapes/svg?seed=${channel.id}`}
          alt={channel.name}
          className="w-10 h-10 rounded-full object-cover bg-muted"
        />
        
        <div className="flex-1 min-w-0">
          <h2 className="font-semibold truncate">{channel.name}</h2>
          <p className="text-xs text-muted-foreground">
            {channel.member_count} участников
          </p>
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon">
              <MoreVertical className="w-5 h-5" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem>
              <Users className="w-4 h-4 mr-2" />
              Участники
            </DropdownMenuItem>
            {isMember && channel.owner_id !== user?.id && (
              <DropdownMenuItem onClick={handleLeave} className="text-destructive">
                <LogOut className="w-4 h-4 mr-2" />
                Покинуть канал
              </DropdownMenuItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {loading && (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary" />
          </div>
        )}

        {!loading && messages.length === 0 && (
          <div className="text-center py-8 text-muted-foreground">
            <p>Пока нет сообщений</p>
            <p className="text-sm mt-1">Станьте первым, кто напишет!</p>
          </div>
        )}

        {messages.map((msg) => {
          const isMe = msg.sender_id === user?.id;
          return (
            <div
              key={msg.id}
              className={`flex ${isMe ? "justify-end" : "justify-start"}`}
            >
              <div className={`max-w-[80%] ${isMe ? "order-2" : ""}`}>
                {!isMe && (
                  <div className="flex items-center gap-2 mb-1">
                    <img
                      src={msg.sender?.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${msg.sender_id}`}
                      alt=""
                      className="w-6 h-6 rounded-full"
                    />
                    <span className="text-xs font-medium text-primary">
                      {msg.sender?.display_name || "Аноним"}
                    </span>
                  </div>
                )}
                <div
                  className={`rounded-2xl px-4 py-2 ${
                    isMe
                      ? "bg-primary text-primary-foreground rounded-br-md"
                      : "bg-muted rounded-bl-md"
                  }`}
                >
                  <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                  <p className={`text-[10px] mt-1 ${isMe ? "text-primary-foreground/70" : "text-muted-foreground"}`}>
                    {formatTime(msg.created_at)}
                  </p>
                </div>
              </div>
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>

      {/* Input or Join button */}
      {isMember ? (
        <div className="flex-shrink-0 p-4 border-t border-border bg-background">
          <div className="flex items-center gap-2">
            <Input
              placeholder="Сообщение..."
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && handleSend()}
              className="flex-1"
            />
            <Button
              size="icon"
              onClick={handleSend}
              disabled={!newMessage.trim() || sending}
            >
              <Send className="w-5 h-5" />
            </Button>
          </div>
        </div>
      ) : (
        <div className="flex-shrink-0 p-4 border-t border-border bg-background">
          <Button onClick={handleJoin} className="w-full">
            Вступить в канал
          </Button>
        </div>
      )}
    </div>
  );
}
