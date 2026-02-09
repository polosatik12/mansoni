import { useState, useMemo } from "react";
import { Search, X, MessageCircle, Users, Megaphone } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { GradientAvatar } from "@/components/ui/gradient-avatar";
import { useConversations } from "@/hooks/useChat";
import { useGroupChats } from "@/hooks/useGroupChats";
import { useChannels } from "@/hooks/useChannels";
import { useAuth } from "@/hooks/useAuth";
import { useForwardMessage, ForwardTarget } from "@/hooks/useForwardMessage";

interface ForwardSheetProps {
  open: boolean;
  onClose: () => void;
  messageContent: string;
  originalSenderName: string;
  /** For batch forwarding multiple messages */
  batchMessages?: { content: string; senderName: string }[];
}

interface ChatItem {
  id: string;
  name: string;
  avatarUrl: string | null;
  type: "dm" | "group" | "channel";
  targetId: string; // conversationId, groupId, or channelId
}

export function ForwardSheet({
  open,
  onClose,
  messageContent,
  originalSenderName,
  batchMessages,
}: ForwardSheetProps) {
  const { user } = useAuth();
  const { conversations } = useConversations();
  const { groups } = useGroupChats();
  const { channels } = useChannels();
  const { forwardMessage } = useForwardMessage();

  const [search, setSearch] = useState("");
  const [sending, setSending] = useState(false);

  // Build unified chat list
  const allChats = useMemo<ChatItem[]>(() => {
    const items: ChatItem[] = [];

    // DMs
    (conversations || []).forEach((conv) => {
      const other = conv.participants.find((p) => p.user_id !== user?.id);
      if (!other) return;
      items.push({
        id: `dm-${conv.id}`,
        name: other.profile?.display_name || "Аноним",
        avatarUrl: other.profile?.avatar_url || null,
        type: "dm",
        targetId: conv.id,
      });
    });

    // Groups
    (groups || []).forEach((g) => {
      items.push({
        id: `group-${g.id}`,
        name: g.name,
        avatarUrl: g.avatar_url,
        type: "group",
        targetId: g.id,
      });
    });

    // Channels (only ones user is member of)
    (channels || [])
      .filter((ch) => ch.is_member)
      .forEach((ch) => {
        items.push({
          id: `channel-${ch.id}`,
          name: ch.name,
          avatarUrl: ch.avatar_url,
          type: "channel",
          targetId: ch.id,
        });
      });

    return items;
  }, [conversations, groups, channels, user?.id]);

  const filtered = useMemo(() => {
    if (!search.trim()) return allChats;
    const q = search.toLowerCase();
    return allChats.filter((c) => c.name.toLowerCase().includes(q));
  }, [allChats, search]);

  const handleSelect = async (chat: ChatItem) => {
    if (sending) return;
    setSending(true);

    let target: ForwardTarget;
    switch (chat.type) {
      case "dm":
        target = { type: "dm", conversationId: chat.targetId, name: chat.name };
        break;
      case "group":
        target = { type: "group", groupId: chat.targetId, name: chat.name };
        break;
      case "channel":
        target = { type: "channel", channelId: chat.targetId, name: chat.name };
        break;
    }

    // Batch forward multiple messages
    const msgs = batchMessages && batchMessages.length > 0
      ? batchMessages
      : [{ content: messageContent, senderName: originalSenderName }];
    
    let allSuccess = true;
    for (const msg of msgs) {
      const success = await forwardMessage(msg.content, msg.senderName, target);
      if (!success) allSuccess = false;
    }

    setSending(false);
    if (allSuccess) onClose();
  };

  const getTypeIcon = (type: "dm" | "group" | "channel") => {
    switch (type) {
      case "dm":
        return <MessageCircle className="w-3.5 h-3.5 text-white/30" />;
      case "group":
        return <Users className="w-3.5 h-3.5 text-white/30" />;
      case "channel":
        return <Megaphone className="w-3.5 h-3.5 text-white/30" />;
    }
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }}
          className="fixed inset-0 z-[310] flex flex-col"
          onClick={onClose}
        >
          {/* Backdrop */}
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />

          {/* Sheet */}
          <motion.div
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", damping: 28, stiffness: 350 }}
            className="relative mt-auto max-h-[80vh] flex flex-col bg-[#1a2735] rounded-t-2xl overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-white/10">
              <h3 className="text-white font-semibold text-base">Переслать</h3>
              <button
                onClick={onClose}
                className="p-1 rounded-full hover:bg-white/10 transition-colors"
              >
                <X className="w-5 h-5 text-white/60" />
              </button>
            </div>

            {/* Search */}
            <div className="px-4 py-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
                <input
                  type="text"
                  placeholder="Поиск..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full h-10 pl-10 pr-4 rounded-full bg-white/5 text-white placeholder:text-white/30 outline-none focus:ring-1 focus:ring-[#6ab3f3]/30 text-sm"
                  autoFocus
                />
              </div>
            </div>

            {/* Message preview */}
            <div className="px-4 py-2">
              <div className="bg-white/5 rounded-xl px-3 py-2 border border-white/5">
                {batchMessages && batchMessages.length > 1 ? (
                  <p className="text-xs text-white/60">
                    {batchMessages.length} {batchMessages.length < 5 ? "сообщения" : "сообщений"}
                  </p>
                ) : (
                  <>
                    <p className="text-[11px] text-[#6ab3f3] font-medium">
                      Переслано от {originalSenderName}
                    </p>
                    <p className="text-xs text-white/60 truncate">{messageContent}</p>
                  </>
                )}
              </div>
            </div>

            {/* Chat list */}
            <div className="flex-1 overflow-y-auto min-h-0">
              {filtered.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-white/40 text-sm">Ничего не найдено</p>
                </div>
              ) : (
                <div className="py-1">
                  {filtered.map((chat) => (
                    <button
                      key={chat.id}
                      onClick={() => handleSelect(chat)}
                      disabled={sending}
                      className="w-full flex items-center gap-3 px-4 py-3 hover:bg-white/5 active:bg-white/10 transition-colors disabled:opacity-50"
                    >
                      <GradientAvatar
                        name={chat.name}
                        seed={chat.targetId}
                        avatarUrl={chat.avatarUrl}
                        size="sm"
                      />
                      <div className="flex-1 min-w-0 text-left">
                        <p className="text-white text-[15px] truncate">{chat.name}</p>
                      </div>
                      {getTypeIcon(chat.type)}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Safe area */}
            <div className="safe-area-bottom" />
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
