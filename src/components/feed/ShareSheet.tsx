import { useState, useEffect } from "react";
import { Search, Loader2, Send, Users, Radio } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import { useConversations } from "@/hooks/useChat";
import { useGroupChats } from "@/hooks/useGroupChats";
import { useChannels } from "@/hooks/useChannels";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/lib/supabase";
import {
  Drawer,
  DrawerContent,
} from "@/components/ui/drawer";

interface ShareSheetProps {
  isOpen: boolean;
  onClose: () => void;
  postId: string;
  postContent?: string;
  postImage?: string;
}

interface ShareTarget {
  id: string;
  type: "dm" | "group" | "channel";
  name: string;
  avatar?: string;
}

export function ShareSheet({
  isOpen,
  onClose,
  postId,
  postContent,
  postImage,
}: ShareSheetProps) {
  const { user } = useAuth();
  const { conversations, loading: dmsLoading } = useConversations();
  const { groups, loading: groupsLoading } = useGroupChats();
  const { channels, loading: channelsLoading } = useChannels();
  
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTargets, setSelectedTargets] = useState<Set<string>>(new Set());
  const [sending, setSending] = useState(false);

  // Reset selection when sheet opens/closes
  useEffect(() => {
    if (!isOpen) {
      setSelectedTargets(new Set());
      setSearchQuery("");
    }
  }, [isOpen]);

  const loading = dmsLoading || groupsLoading || channelsLoading;

  // Build unified list of share targets
  const targets: ShareTarget[] = [];

  // Add DM conversations
  conversations.forEach((conv) => {
    const other = conv.participants.find((p) => p.user_id !== user?.id);
    if (other?.profile) {
      targets.push({
        id: `dm:${conv.id}`,
        type: "dm",
        name: other.profile.display_name || "Пользователь",
        avatar: other.profile.avatar_url || undefined,
      });
    }
  });

  // Add groups
  groups.forEach((group) => {
    targets.push({
      id: `group:${group.id}`,
      type: "group",
      name: group.name,
      avatar: group.avatar_url || undefined,
    });
  });

  // Add channels where user can post
  channels.forEach((channel) => {
    if (channel.owner_id === user?.id) {
      targets.push({
        id: `channel:${channel.id}`,
        type: "channel",
        name: channel.name,
        avatar: channel.avatar_url || undefined,
      });
    }
  });

  // Filter by search
  const filteredTargets = targets.filter((t) =>
    t.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const toggleTarget = (id: string) => {
    setSelectedTargets((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const handleShare = async () => {
    if (selectedTargets.size === 0 || !user) return;
    
    setSending(true);
    
    try {
      const promises: Promise<void>[] = [];

      for (const targetId of selectedTargets) {
        const [type, id] = targetId.split(":");
        
        if (type === "dm") {
          // Send to DM conversation with shared post
          const sendDm = async () => {
            const { error } = await supabase.from("messages").insert({
              conversation_id: id,
              sender_id: user.id,
              content: "📤 Поделился публикацией",
              shared_post_id: postId,
            });
            if (error) throw error;
            await supabase
              .from("conversations")
              .update({ updated_at: new Date().toISOString() })
              .eq("id", id);
          };
          promises.push(sendDm());
        } else if (type === "group") {
          // Send to group chat with shared post
          const sendGroup = async () => {
            const { error } = await supabase.from("group_chat_messages").insert({
              group_id: id,
              sender_id: user.id,
              content: "📤 Поделился публикацией",
              shared_post_id: postId,
            });
            if (error) throw error;
            await supabase
              .from("group_chats")
              .update({ updated_at: new Date().toISOString() })
              .eq("id", id);
          };
          promises.push(sendGroup());
        } else if (type === "channel") {
          // Send to channel with shared post
          const sendChannel = async () => {
            const { error } = await supabase.from("channel_messages").insert({
              channel_id: id,
              sender_id: user.id,
              content: "📤 Поделился публикацией",
              shared_post_id: postId,
            });
            if (error) throw error;
            await supabase
              .from("channels")
              .update({ updated_at: new Date().toISOString() })
              .eq("id", id);
          };
          promises.push(sendChannel());
        }
      }

      await Promise.all(promises);
      
      toast({
        title: "Отправлено",
        description: `Пост отправлен в ${selectedTargets.size} чат${selectedTargets.size > 1 ? "ов" : ""}`,
      });
      
      onClose();
    } catch (err) {
      console.error("Failed to share:", err);
      toast({
        title: "Ошибка",
        description: "Не удалось поделиться постом",
        variant: "destructive",
      });
    } finally {
      setSending(false);
    }
  };

  const getIcon = (type: ShareTarget["type"]) => {
    switch (type) {
      case "group":
        return <Users className="w-4 h-4 text-muted-foreground" />;
      case "channel":
        return <Radio className="w-4 h-4 text-muted-foreground" />;
      default:
        return null;
    }
  };

  return (
    <Drawer open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DrawerContent className="h-[70dvh] max-h-[70dvh] mt-0 flex flex-col border-0 bg-transparent">
        <div
          className="h-full flex flex-col rounded-t-2xl overflow-hidden border border-white/20"
          style={{
            background: "rgba(255,255,255,0.08)",
            backdropFilter: "blur(24px) saturate(1.5)",
            WebkitBackdropFilter: "blur(24px) saturate(1.5)",
            boxShadow: "0 -8px 32px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.15)",
          }}
        >
          <div className="flex justify-center pt-3 pb-2">
            <div className="w-9 h-1 bg-white/30 rounded-full" />
          </div>
          <div className="text-center pb-3 border-b border-white/10">
            <h3 className="text-lg font-semibold text-white">Поделиться</h3>
          </div>

          {/* Search */}
          <div className="px-4 py-3 border-b border-white/10">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
              <Input
                placeholder="Поиск..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 bg-white/10 border-white/10 rounded-xl text-white placeholder:text-white/40"
              />
            </div>
          </div>

          {/* Targets List */}
          <div className="flex-1 overflow-y-auto native-scroll">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-6 h-6 animate-spin text-white/40" />
              </div>
            ) : filteredTargets.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12">
                <p className="text-base text-white/60">Нет доступных чатов</p>
                <p className="text-sm mt-1 text-white/40">Начните переписку, чтобы делиться</p>
              </div>
            ) : (
              <div className="py-2">
                {filteredTargets.map((target) => {
                  const isSelected = selectedTargets.has(target.id);
                  return (
                    <button
                      key={target.id}
                      onClick={() => toggleTarget(target.id)}
                      className={cn(
                        "w-full flex items-center gap-3 px-4 py-3 transition-colors",
                        isSelected ? "bg-white/10" : "hover:bg-white/5"
                      )}
                    >
                      <Avatar className="w-12 h-12">
                        <AvatarImage src={target.avatar} />
                        <AvatarFallback className="bg-white/10 text-white/70">
                          {target.name.slice(0, 2).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 text-left">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-white">{target.name}</span>
                          {getIcon(target.type)}
                        </div>
                      </div>
                      <div
                        className={cn(
                          "w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors",
                          isSelected ? "bg-primary border-primary" : "border-white/30"
                        )}
                      >
                        {isSelected && <div className="w-2 h-2 rounded-full bg-white" />}
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Send Button */}
          {selectedTargets.size > 0 && (
            <div className="p-4 border-t border-white/10 safe-area-bottom">
              <Button
                onClick={handleShare}
                disabled={sending}
                className="w-full h-12 text-base font-semibold"
              >
                {sending ? (
                  <Loader2 className="w-5 h-5 animate-spin mr-2" />
                ) : (
                  <Send className="w-5 h-5 mr-2" />
                )}
                Отправить ({selectedTargets.size})
              </Button>
            </div>
          )}
        </div>
      </DrawerContent>
    </Drawer>
  );
}
