import { useState, useRef, useEffect, useMemo } from "react";
import { ArrowLeft, Send, Eye, Share2, ChevronDown, Image as ImageIcon } from "lucide-react";
import { useChannelMessages, useJoinChannel, Channel } from "@/hooks/useChannels";
import { MediaMessageBubble } from "./MediaMessageBubble";
import { useChannelRole } from "@/hooks/useChannelMembers";
import { useAuth } from "@/hooks/useAuth";
import { useChatOpen } from "@/contexts/ChatOpenContext";
import { GradientAvatar } from "@/components/ui/gradient-avatar";
import { BrandBackground } from "@/components/ui/brand-background";
import { ChannelInfoSheet } from "./ChannelInfoSheet";
import { DateSeparator, shouldShowDateSeparator } from "./DateSeparator";
import { PinnedMessageBar } from "./PinnedMessageBar";
import { MessageContextMenu } from "./MessageContextMenu";
import { MediaPreviewOverlay } from "./MediaPreviewOverlay";
import { useChannelPinnedMessage } from "@/hooks/usePinnedMessage";
import { useMessageViews } from "@/hooks/useMessageViews";
import { format } from "date-fns";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";


interface ChannelConversationProps {
  channel: Channel;
  onBack: () => void;
  onLeave?: () => void;
}

const formatSubscribers = (count: number): string => {
  const s = count.toString().replace(/\B(?=(\d{3})+(?!\d))/g, " ");
  return `${s} подписчик${count === 1 ? "" : count < 5 ? "а" : "ов"}`;
};

const formatViews = (count: number): string => {
  if (count >= 1000000) return (count / 1000000).toFixed(1).replace(".", ",") + "M";
  if (count >= 1000) return (count / 1000).toFixed(1).replace(".", ",") + "K";
  return count.toString();
};

export function ChannelConversation({ channel: initialChannel, onBack, onLeave }: ChannelConversationProps) {
  const { user } = useAuth();
  const [channel, setChannel] = useState(initialChannel);
  const { setIsChatOpen } = useChatOpen();
  const { messages, loading, sendMessage } = useChannelMessages(channel.id);
  const { joinChannel, leaveChannel } = useJoinChannel();
  const { isAdmin, role } = useChannelRole(channel.id);
  const { pinnedMessage, pinMessage, unpinMessage } = useChannelPinnedMessage(channel.id);

  // Real view tracking
  const messageIds = useMemo(() => messages.map((m) => m.id), [messages]);
  const { getViewCount, setupObserver } = useMessageViews(channel.id, messageIds);

  const [isMember, setIsMember] = useState(channel.is_member);
  const [inputText, setInputText] = useState("");
  const [sending, setSending] = useState(false);
  const [infoOpen, setInfoOpen] = useState(false);
  const [uploading, setUploading] = useState(false);

  // Staged media for Telegram-style preview before send
  const [stagedMedia, setStagedMedia] = useState<{
    file: File;
    type: "image" | "video";
  } | null>(null);

  // Context menu state for channel messages
  const [contextMenuMessage, setContextMenuMessage] = useState<{
    id: string;
    content: string;
    isOwn: boolean;
    position: { top: number; left: number; width: number };
  } | null>(null);
  const longPressTimerRef = useRef<NodeJS.Timeout | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [showScrollDown, setShowScrollDown] = useState(false);

  useEffect(() => {
    setIsChatOpen(true);
    return () => setIsChatOpen(false);
  }, [setIsChatOpen]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    // Re-setup observer when messages change so new elements are observed
    const timer = setTimeout(() => setupObserver(scrollContainerRef.current), 100);
    return () => clearTimeout(timer);
  }, [messages, setupObserver]);

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

  const handleSend = async () => {
    if (!inputText.trim() || sending) return;

    setSending(true);
    try {
      await sendMessage(inputText);
      setInputText("");
      // Keep focus on input
      setTimeout(() => inputRef.current?.focus(), 50);
    } catch {
      toast.error("Не удалось отправить");
    } finally {
      setSending(false);
    }
  };

  // Stage media for preview instead of uploading immediately
  const handleMediaSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const type = file.type.startsWith("video") ? "video" as const : "image" as const;
    setStagedMedia({ file, type });
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  // Called from MediaPreviewOverlay when user confirms send
  const handleStagedMediaSend = async (file: File, mediaType: "image" | "video", caption: string) => {
    if (!user) return;
    setUploading(true);
    try {
      const ext = file.name.split(".").pop() || "jpg";
      const path = `channels/${channel.id}/${Date.now()}.${ext}`;

      const { error: uploadError } = await supabase.storage
        .from("chat-media")
        .upload(path, file, { upsert: true });

      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage
        .from("chat-media")
        .getPublicUrl(path);

      await sendMessage(caption || "", urlData.publicUrl, mediaType);
      setStagedMedia(null);
      toast.success("Медиа отправлено");
    } catch {
      toast.error("Не удалось загрузить файл");
    } finally {
      setUploading(false);
    }
  };

  const formatTime = (dateStr: string) => {
    try {
      return format(new Date(dateStr), "HH:mm");
    } catch {
      return "";
    }
  };

  const handleChannelUpdated = (updated: Partial<Channel>) => {
    setChannel((prev) => ({ ...prev, ...updated }));
  };

  // Long-press for context menu (admin only)
  const handleMessageLongPressStart = (
    msgId: string,
    content: string,
    isOwn: boolean,
    e: React.TouchEvent | React.MouseEvent
  ) => {
    if (!isAdmin) return;
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    longPressTimerRef.current = setTimeout(() => {
      setContextMenuMessage({
        id: msgId,
        content,
        isOwn,
        position: { top: rect.top, left: rect.left, width: rect.width },
      });
    }, 500);
  };

  const handleMessageLongPressEnd = () => {
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }
  };

  const handleChannelMessagePin = async (messageId: string) => {
    await pinMessage(messageId);
  };

  return (
    <>
      <div className="fixed inset-0 flex flex-col z-[200]">
        <BrandBackground />

        {/* Header */}
        <div className="flex-shrink-0 safe-area-top relative z-10 backdrop-blur-xl bg-black/20 border-b border-white/10">
          <div className="flex items-center px-2 py-2">
            {/* Back button */}
            <button
              onClick={onBack}
              className="flex items-center gap-1 px-2 py-1 text-[#6ab3f3] hover:bg-white/5 rounded-lg transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>

            {/* Channel info - clickable */}
            <button
              onClick={() => setInfoOpen(true)}
              className="flex-1 flex items-center gap-2.5 min-w-0 hover:opacity-80 transition-opacity"
            >
              <GradientAvatar
                name={channel.name}
                seed={channel.id}
                avatarUrl={channel.avatar_url}
                size="sm"
              />
              <div className="min-w-0 text-left">
                <h2 className="font-semibold text-white text-sm truncate">{channel.name}</h2>
                <p className="text-[11px] text-white/50">
                  {formatSubscribers(channel.member_count || 0)}
                </p>
              </div>
            </button>

            <div className="w-10" />
          </div>
        </div>

        {/* Pinned message bar */}
        {pinnedMessage && (
          <PinnedMessageBar
            senderName={pinnedMessage.sender_name}
            content={pinnedMessage.content}
            onScrollTo={() => {
              const el = document.querySelector(`[data-message-id="${pinnedMessage.id}"]`);
              el?.scrollIntoView({ behavior: "smooth", block: "center" });
            }}
            onUnpin={isAdmin ? unpinMessage : undefined}
          />
        )}

        {/* Messages */}
        <div
          ref={scrollContainerRef}
          onScroll={handleScroll}
          className="flex-1 overflow-y-auto relative z-10"
        >
          <div className="flex flex-col min-h-full">
            {/* Top spacer to push messages to bottom */}
            <div className="flex-1" />

            <div className="p-3 space-y-3">
              {loading && (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white/40" />
                </div>
              )}

              {!loading && messages.length === 0 && (
                <div className="text-center py-8">
                  <p className="text-white/40">Пока нет публикаций</p>
                </div>
              )}

              {messages.map((msg, index) => {
                const viewCount = getViewCount(msg.id);
                const prevMsg = index > 0 ? messages[index - 1] : null;
                const showDate = shouldShowDateSeparator(msg.created_at, prevMsg?.created_at);

                return (
                  <div key={msg.id} data-message-id={msg.id}>
                    {showDate && <DateSeparator date={msg.created_at} />}
                    <div
                      className="bg-white/5 backdrop-blur-xl rounded-2xl overflow-hidden border border-white/10"
                      onTouchStart={(e) =>
                        handleMessageLongPressStart(msg.id, msg.content, msg.sender_id === user?.id, e)
                      }
                      onTouchEnd={handleMessageLongPressEnd}
                      onMouseDown={(e) =>
                        handleMessageLongPressStart(msg.id, msg.content, msg.sender_id === user?.id, e)
                      }
                      onMouseUp={handleMessageLongPressEnd}
                      onMouseLeave={handleMessageLongPressEnd}
                    >
                    {/* Post header */}
                    <div className="flex items-center gap-2 px-3 pt-3 pb-2">
                      <GradientAvatar
                        name={channel.name}
                        seed={channel.id}
                        avatarUrl={channel.avatar_url}
                        size="sm"
                        className="w-8 h-8"
                      />
                      <span className="text-[#6ab3f3] font-medium text-sm">{channel.name}</span>
                    </div>

                    {/* Media - adaptive Telegram style */}
                    {msg.media_url && (
                      <div className="px-3 pb-1">
                        <MediaMessageBubble
                          mediaUrl={msg.media_url}
                          mediaType={(msg.media_type === "video" ? "video" : "image") as "image" | "video"}
                          content={msg.content}
                          time={formatTime(msg.created_at)}
                          isOwn={false}
                          viewCount={viewCount}
                          bubbleRadius="rounded-xl"
                        />
                      </div>
                    )}

                    {/* Text-only content (no media) */}
                    {!msg.media_url && msg.content && (
                      <div className="px-3 py-2">
                        <p className="text-white text-[15px] leading-relaxed whitespace-pre-wrap">
                          {msg.content}
                        </p>
                      </div>
                    )}

                    {/* Footer for text-only posts */}
                    {!msg.media_url && (
                      <div className="flex items-center justify-between px-3 pb-3 pt-1">
                        <div className="flex items-center gap-1.5 text-white/30">
                          <Eye className="w-4 h-4" />
                          <span className="text-xs">{formatViews(viewCount)}</span>
                          <span className="text-xs ml-1">{formatTime(msg.created_at)}</span>
                        </div>
                        <button className="text-white/30 hover:text-white/60 transition-colors">
                          <Share2 className="w-4 h-4" />
                        </button>
                      </div>
                    )}

                    {/* Share button for media posts */}
                    {msg.media_url && (
                      <div className="flex items-center justify-end px-3 pb-2">
                        <button className="text-white/30 hover:text-white/60 transition-colors">
                          <Share2 className="w-4 h-4" />
                        </button>
                      </div>
                    )}
                    </div>
                  </div>
                );
              })}
              <div ref={messagesEndRef} />
            </div>
          </div>
        </div>

        {/* Scroll to bottom */}
        {showScrollDown && (
          <button
            onClick={scrollToBottom}
            className="absolute right-4 bottom-20 w-10 h-10 rounded-full bg-white/10 backdrop-blur-xl border border-white/20 flex items-center justify-center z-20"
          >
            <ChevronDown className="w-6 h-6 text-white" />
          </button>
        )}

        {/* Bottom bar */}
        {isAdmin ? (
          /* Owner/Admin input */
          <div className="flex-shrink-0 px-2 py-2 relative z-10 backdrop-blur-xl bg-black/20 border-t border-white/10 safe-area-bottom">
            <div className="flex items-center gap-2">
              {/* Attach button */}
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
                className="w-11 h-11 rounded-full bg-white/10 flex items-center justify-center shrink-0"
              >
                {uploading ? (
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white/50" />
                ) : (
                  <ImageIcon className="w-5 h-5 text-white/60" />
                )}
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*,video/*"
                className="hidden"
                onChange={handleMediaSelect}
              />

              {/* Text input */}
              <div className="flex-1">
                <input
                  ref={inputRef}
                  type="text"
                  placeholder="Написать в канал..."
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSend()}
                  className="w-full h-11 px-4 rounded-full bg-white/10 text-white placeholder:text-white/30 outline-none focus:ring-1 focus:ring-[#6ab3f3]/30 transition-all"
                />
              </div>

              {/* Send button */}
              <button
                onClick={handleSend}
                disabled={!inputText.trim() || sending}
                className="w-11 h-11 rounded-full bg-[#6ab3f3] flex items-center justify-center shrink-0 disabled:opacity-50"
              >
                <Send className="w-5 h-5 text-white" />
              </button>
            </div>
          </div>
        ) : !isMember ? (
          /* Join button for non-members */
          <div className="flex-shrink-0 px-4 py-3 relative z-10 backdrop-blur-xl bg-black/20 border-t border-white/10 safe-area-bottom">
            <button
              onClick={handleJoin}
              className="w-full h-11 rounded-full bg-[#6ab3f3] text-white font-medium"
            >
              Подписаться
            </button>
          </div>
        ) : (
          /* Muted bottom bar for subscribers */
          <div className="flex-shrink-0 px-4 py-3 relative z-10 backdrop-blur-xl bg-black/20 border-t border-white/10 safe-area-bottom">
            <p className="text-center text-white/30 text-sm">Только админы могут публиковать</p>
          </div>
        )}
      </div>

      {/* Channel Info Sheet */}
      <ChannelInfoSheet
        channel={channel}
        open={infoOpen}
        onClose={() => setInfoOpen(false)}
        onLeave={onLeave}
        onChannelUpdated={handleChannelUpdated}
      />

      {/* Message Context Menu (admin only) */}
      {contextMenuMessage && (
        <MessageContextMenu
          isOpen={!!contextMenuMessage}
          onClose={() => setContextMenuMessage(null)}
          messageId={contextMenuMessage.id}
          messageContent={contextMenuMessage.content}
          isOwn={contextMenuMessage.isOwn}
          position={contextMenuMessage.position}
          onPin={handleChannelMessagePin}
        />
      )}

      {/* Media Preview Overlay (Telegram-style staging) */}
      {stagedMedia && (
        <MediaPreviewOverlay
          file={stagedMedia.file}
          mediaType={stagedMedia.type}
          onSend={handleStagedMediaSend}
          onCancel={() => setStagedMedia(null)}
        />
      )}
    </>
  );
}
