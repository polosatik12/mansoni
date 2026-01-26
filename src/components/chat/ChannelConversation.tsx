import { useState, useRef, useEffect } from "react";
import { ArrowLeft, Eye, Share2, Search, Volume2, VolumeX, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useChannelMessages, useJoinChannel, Channel } from "@/hooks/useChannels";
import { useAuth } from "@/hooks/useAuth";
import { format } from "date-fns";
import { toast } from "sonner";

interface ChannelConversationProps {
  channel: Channel;
  onBack: () => void;
  onLeave?: () => void;
}

// Format subscriber count like "4 119 170 подписчиков"
const formatSubscribers = (count: number): string => {
  return count.toString().replace(/\B(?=(\d{3})+(?!\d))/g, " ") + " подписчиков";
};

// Format view count like "168,6K"
const formatViews = (count: number): string => {
  if (count >= 1000000) {
    return (count / 1000000).toFixed(1).replace(".", ",") + "M";
  }
  if (count >= 1000) {
    return (count / 1000).toFixed(1).replace(".", ",") + "K";
  }
  return count.toString();
};

// Sample reactions for demo
const sampleReactions = [
  { emoji: "👍", count: 1423 },
  { emoji: "🤡", count: 536 },
  { emoji: "👍", count: 167 },
  { emoji: "❤️", count: 106 },
  { emoji: "🎉", count: 83 },
  { emoji: "😂", count: 48 },
];

export function ChannelConversation({ channel, onBack, onLeave }: ChannelConversationProps) {
  const { user } = useAuth();
  const { messages, loading } = useChannelMessages(channel.id);
  const { joinChannel, leaveChannel } = useJoinChannel();
  const [isMember, setIsMember] = useState(channel.is_member);
  const [isMuted, setIsMuted] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [showScrollDown, setShowScrollDown] = useState(false);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleScroll = () => {
    if (!scrollContainerRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = scrollContainerRef.current;
    setShowScrollDown(scrollHeight - scrollTop - clientHeight > 200);
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const handleJoin = async () => {
    const success = await joinChannel(channel.id);
    if (success) {
      setIsMember(true);
      toast.success("Вы подписались на канал");
    } else {
      toast.error("Не удалось подписаться");
    }
  };

  const handleLeave = async () => {
    const success = await leaveChannel(channel.id);
    if (success) {
      setIsMember(false);
      toast.success("Вы отписались от канала");
      onLeave?.();
    } else {
      toast.error("Не удалось отписаться");
    }
  };

  const formatTime = (dateStr: string) => {
    try {
      return format(new Date(dateStr), "HH:mm");
    } catch {
      return "";
    }
  };

  return (
    <div className="h-full flex flex-col bg-background">
      {/* Header - Telegram style */}
      <div className="flex-shrink-0 flex items-center gap-2 px-2 py-2 bg-card/95 backdrop-blur-sm border-b border-border">
        {/* Back button with unread count placeholder */}
        <button 
          onClick={onBack} 
          className="flex items-center gap-1 px-2 py-1.5 rounded-full bg-muted hover:bg-muted/80 transition-colors"
        >
          <ArrowLeft className="w-5 h-5 text-foreground" />
          <span className="text-foreground text-sm font-medium pr-1">
            {Math.floor(Math.random() * 1000) + 100}
          </span>
        </button>
        
        {/* Channel info - centered */}
        <div className="flex-1 flex flex-col items-center min-w-0">
          <h2 className="font-semibold text-foreground text-sm truncate">{channel.name}</h2>
          <p className="text-[11px] text-primary">
            {formatSubscribers(channel.member_count || 0)}
          </p>
        </div>

        {/* Channel avatar */}
        <img
          src={channel.avatar_url || `https://api.dicebear.com/7.x/shapes/svg?seed=${channel.id}`}
          alt={channel.name}
          className="w-10 h-10 rounded-full object-cover bg-muted"
        />
      </div>

      {/* Pinned message bar */}
      <div className="flex-shrink-0 flex items-center justify-between px-3 py-2 bg-card/90 border-b border-border">
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <div className="w-0.5 h-8 bg-primary rounded-full flex-shrink-0" />
          <div className="min-w-0">
            <p className="text-xs text-primary font-medium">Закреплённое сообщение</p>
            <p className="text-xs text-muted-foreground truncate">Увидели что-то важное и интересное...</p>
          </div>
        </div>
        {!isMember && (
          <Button 
            onClick={handleJoin}
            size="sm" 
            className="rounded-full px-4 h-8 text-xs font-medium"
          >
            Подписаться
          </Button>
        )}
      </div>

      {/* Messages as posts */}
      <div 
        ref={scrollContainerRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto px-2 py-3 space-y-3"
      >
        {loading && (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary" />
          </div>
        )}

        {!loading && messages.length === 0 && (
          <div className="text-center py-8 text-muted-foreground">
            <p>Пока нет публикаций</p>
          </div>
        )}

        {messages.map((msg, index) => {
          // Generate random view count for demo
          const viewCount = Math.floor(Math.random() * 200000) + 1000;
          // Get random subset of reactions
          const postReactions = sampleReactions.slice(0, Math.floor(Math.random() * 4) + 3);
          
          return (
            <div key={msg.id} className="bg-card rounded-xl overflow-hidden border border-border">
              {/* Post header */}
              <div className="flex items-center gap-2 px-3 pt-3 pb-2">
                <span className="text-primary text-lg">👉</span>
                <span className="text-primary font-medium text-sm">{channel.name}.</span>
                {!isMember && (
                  <button 
                    onClick={handleJoin}
                    className="text-primary text-sm hover:underline"
                  >
                    Подписаться
                  </button>
                )}
              </div>

              {/* Post content */}
              <div className="px-3 pb-2">
                <p className="text-foreground text-[15px] leading-relaxed whitespace-pre-wrap">
                  {msg.content}
                </p>
              </div>

              {/* Post image if exists */}
              {msg.media_url && (
                <div className="relative">
                  <img 
                    src={msg.media_url} 
                    alt="" 
                    className="w-full max-h-80 object-cover"
                  />
                </div>
              )}

              {/* Reactions row */}
              <div className="flex flex-wrap gap-1.5 px-3 py-2">
                {postReactions.map((reaction, i) => (
                  <button 
                    key={i}
                    className="flex items-center gap-1 px-2 py-1 rounded-full bg-muted hover:bg-muted/80 transition-colors"
                  >
                    <span className="text-sm">{reaction.emoji}</span>
                    <span className="text-xs text-foreground/80">{formatViews(reaction.count)}</span>
                  </button>
                ))}
              </div>

              {/* Post footer - views and time */}
              <div className="flex items-center justify-between px-3 pb-3">
                <div className="flex items-center gap-1.5 text-muted-foreground">
                  <Eye className="w-4 h-4" />
                  <span className="text-xs">{formatViews(viewCount)}</span>
                  <span className="text-xs ml-1">{formatTime(msg.created_at)}</span>
                </div>
                <button className="text-muted-foreground hover:text-foreground transition-colors">
                  <Share2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>

      {/* Scroll to bottom button */}
      {showScrollDown && (
        <button
          onClick={scrollToBottom}
          className="absolute right-4 bottom-20 w-10 h-10 rounded-full bg-card flex items-center justify-center shadow-lg hover:bg-muted transition-colors border border-border"
        >
          <ChevronDown className="w-6 h-6 text-foreground" />
        </button>
      )}

      {/* Bottom bar - subscriber view */}
      <div className="flex-shrink-0 flex items-center justify-between px-4 py-3 bg-card/95 backdrop-blur-sm border-t border-border">
        {/* Spacer for centering */}
        <div className="w-10" />
        
        <button
          onClick={() => setIsMuted(!isMuted)}
          className="flex items-center gap-2 px-4 py-2 rounded-full bg-muted hover:bg-muted/80 transition-colors"
        >
          {isMuted ? (
            <VolumeX className="w-4 h-4 text-muted-foreground" />
          ) : (
            <Volume2 className="w-4 h-4 text-muted-foreground" />
          )}
          <span className="text-sm text-muted-foreground">
            {isMuted ? "Включить звук" : "Убрать звук"}
          </span>
        </button>

        <button className="w-10 h-10 flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors">
          <Search className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
}
