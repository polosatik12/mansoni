import { useState, useRef, useEffect, useCallback, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Phone, Video, Send, Mic, X, Play, Pause, Check, CheckCheck, Smile } from "lucide-react";
import { AttachmentIcon } from "./AttachmentIcon";
import { DateSeparator, shouldShowDateSeparator } from "./DateSeparator";
import { Button } from "@/components/ui/button";
import { useMessages } from "@/hooks/useChat";
import { useAuth } from "@/hooks/useAuth";
import { useMarkConversationRead } from "@/hooks/useMarkConversationRead";
import { useVideoCallContext } from "@/contexts/VideoCallContext";
import { useChatOpen } from "@/contexts/ChatOpenContext";
import { format } from "date-fns";
import { toast } from "sonner";
import { BrandBackground } from "@/components/ui/brand-background";
import { VideoCircleRecorder } from "./VideoCircleRecorder";
import { VideoCircleMessage } from "./VideoCircleMessage";
import { AttachmentSheet } from "./AttachmentSheet";
import { MediaPreviewOverlay } from "./MediaPreviewOverlay";
import { ImageViewer } from "./ImageViewer";
import { VideoPlayer, FullscreenVideoPlayer } from "./VideoPlayer";
import { MediaMessageBubble } from "./MediaMessageBubble";
import { SharedPostCard } from "./SharedPostCard";
import { SharedReelCard } from "./SharedReelCard";
import { SharedStoryCard } from "./SharedStoryCard";
import { EmojiStickerPicker } from "./EmojiStickerPicker";
import { MessageContextMenu } from "./MessageContextMenu";
import { MessageReactions } from "./MessageReactions";
import { SelectionHeader } from "./SelectionHeader";
import { SelectionCheckbox } from "./SelectionCheckbox";
import { DeleteConfirmDialog } from "./DeleteConfirmDialog";
import { supabase } from "@/integrations/supabase/client";
import { formatLastSeen } from "@/hooks/usePresence";
import { useMessageReactions } from "@/hooks/useMessageReactions";
import { useTypingIndicator } from "@/hooks/useTypingIndicator";
import { useProfile } from "@/hooks/useProfile";
import { usePinnedMessage } from "@/hooks/usePinnedMessage";
import { PinnedMessageBar } from "./PinnedMessageBar";
import { ForwardSheet } from "./ForwardSheet";
import { ReplyPreview, EditPreview, QuotedReply } from "./ReplyPreview";
import { AnimatePresence, motion } from "framer-motion";
import { GradientAvatar } from "@/components/ui/gradient-avatar";

interface ChatConversationProps {
  conversationId: string;
  chatName: string;
  chatAvatar: string | null;
  otherUserId: string;
  onBack: () => void;
  participantCount?: number;
  isGroup?: boolean;
  totalUnreadCount?: number;
  /** Called to refresh conversation list after marking messages read */
  onRefetch?: () => void;
}

export function ChatConversation({ conversationId, chatName, chatAvatar, otherUserId, onBack, participantCount, isGroup, totalUnreadCount, onRefetch }: ChatConversationProps) {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { profile } = useProfile();
  const { messages, loading, sendMessage, sendMediaMessage, deleteMessage, editMessage } = useMessages(conversationId);
  const { reactions, toggleReaction } = useMessageReactions(conversationId);
  const { markConversationRead } = useMarkConversationRead();
  const { startCall } = useVideoCallContext();
  const { setIsChatOpen } = useChatOpen();
  const { sendTyping, stopTyping, typingUsers } = useTypingIndicator(
    `typing:conv:${conversationId}`,
    user?.id,
    profile?.display_name || user?.email?.split("@")[0] || "User"
  );
  const { pinnedMessage, pinMessage, unpinMessage } = usePinnedMessage(conversationId);
  
  const [inputText, setInputText] = useState("");
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [playingVoice, setPlayingVoice] = useState<string | null>(null);
  const [showVideoRecorder, setShowVideoRecorder] = useState(false);
  const [videoRecorderKey, setVideoRecorderKey] = useState(0);
  const [showAttachmentSheet, setShowAttachmentSheet] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [viewingImage, setViewingImage] = useState<string | null>(null);
  const [viewingVideo, setViewingVideo] = useState<string | null>(null);
  const [recordMode, setRecordMode] = useState<'voice' | 'video'>('voice');
  
  // Media staging state (Telegram-style preview before send)
  const [stagedMedia, setStagedMedia] = useState<{
    file: File;
    type: "image" | "video";
  } | null>(null);
  const [lastSeenStatus, setLastSeenStatus] = useState<string>("был(а) недавно");
  
  // Context menu state
  const [contextMenuMessage, setContextMenuMessage] = useState<{
    id: string;
    content: string;
    isOwn: boolean;
    touchPoint: { x: number; y: number };
    position: { top: number; left: number; width: number; height: number; bottom: number; right: number };
  } | null>(null);
  const longPressTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Forward sheet state
  const [forwardData, setForwardData] = useState<{
    content: string;
    senderName: string;
  } | null>(null);

  // Reply state
  const [replyTo, setReplyTo] = useState<{
    id: string;
    content: string;
    senderName: string;
  } | null>(null);

  // Highlight animation for scrolled-to messages
  const [highlightedMessageId, setHighlightedMessageId] = useState<string | null>(null);

  // Edit state
  const [editingMessage, setEditingMessage] = useState<{
    id: string;
    content: string;
  } | null>(null);

  // Selection mode state
  const [selectedMessages, setSelectedMessages] = useState<string[]>([]);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const isSelectionMode = selectedMessages.length > 0;

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const recordingInterval = useRef<NodeJS.Timeout | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const recordingMimeTypeRef = useRef<string | null>(null);
  const holdTimerRef = useRef<NodeJS.Timeout | null>(null);
  const isHoldingRef = useRef(false);

  // Mark chat as open/closed for hiding bottom nav
  useEffect(() => {
    setIsChatOpen(true);
    return () => setIsChatOpen(false);
  }, [setIsChatOpen]);

  // Fetch other user's last_seen_at for presence status
  useEffect(() => {
    if (isGroup || !otherUserId) return;
    
    const fetchPresence = async () => {
      const { data } = await supabase
        .from("profiles")
        .select("last_seen_at")
        .eq("user_id", otherUserId)
        .single();
      
      if (data?.last_seen_at) {
        setLastSeenStatus(formatLastSeen(data.last_seen_at));
      }
    };

    fetchPresence();
    // Refresh every 30 seconds
    const interval = setInterval(fetchPresence, 30000);
    return () => clearInterval(interval);
  }, [otherUserId, isGroup]);

  // Mark incoming messages as read when chat is opened / receives new messages.
  useEffect(() => {
    // Only for DMs (groups/channels have separate infra).
    if (!conversationId || !user || isGroup) return;
    (async () => {
      await markConversationRead(conversationId);
      // Refresh list so unread badge updates immediately.
      onRefetch?.();
    })();
  }, [conversationId, user, isGroup, messages.length, markConversationRead, onRefetch]);

  // Scroll to bottom on initial load and new messages
  const prevMsgCountRef = useRef(0);
  useEffect(() => {
    if (messages.length === 0) return;
    const isNewMessage = messages.length > prevMsgCountRef.current;
    prevMsgCountRef.current = messages.length;
    messagesEndRef.current?.scrollIntoView({ behavior: isNewMessage ? "smooth" : "auto" });
  }, [messages.length]);

  useEffect(() => {
    if (isRecording) {
      recordingInterval.current = setInterval(() => {
        setRecordingTime((prev) => prev + 1);
      }, 1000);
    } else {
      if (recordingInterval.current) {
        clearInterval(recordingInterval.current);
      }
      setRecordingTime(0);
    }
    return () => {
      if (recordingInterval.current) {
        clearInterval(recordingInterval.current);
      }
    };
  }, [isRecording]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const formatMessageTime = (dateStr: string) => {
    try {
      return format(new Date(dateStr), "HH:mm");
    } catch {
      return "";
    }
  };

  const handleSendMessage = async () => {
    console.log("[handleSendMessage] inputText:", inputText);
    if (!inputText.trim()) {
      console.log("[handleSendMessage] empty input, skipping");
      return;
    }
    try {
      stopTyping();

      // If editing, update the existing message
      if (editingMessage) {
        const result = await editMessage(editingMessage.id, inputText);
        if (result.error) {
          toast.error("Не удалось отредактировать сообщение");
          return;
        }
        setEditingMessage(null);
        setInputText("");
      } else {
        await sendMessage(inputText, replyTo?.id || null);
        setInputText("");
        setReplyTo(null);
      }
      // Keep focus on input to prevent keyboard closing on mobile
      requestAnimationFrame(() => {
        inputRef.current?.focus();
      });
    } catch (error) {
      console.error("[handleSendMessage] error:", error);
      toast.error("Не удалось отправить сообщение");
    }
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

      // Pick best supported audio container/codec (iOS Safari often can't play webm/opus)
      const preferredTypes = [
        "audio/mp4",
        "audio/webm;codecs=opus",
        "audio/webm",
        "audio/ogg;codecs=opus",
      ];

      const mimeType = preferredTypes.find((t) => MediaRecorder.isTypeSupported(t)) || "";
      recordingMimeTypeRef.current = mimeType || null;

      const mediaRecorder = mimeType
        ? new MediaRecorder(stream, { mimeType })
        : new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          audioChunksRef.current.push(e.data);
        }
      };

      mediaRecorder.start();
      setIsRecording(true);
    } catch (err) {
      console.error('Failed to start recording:', err);
    }
  };

  const stopRecording = async () => {
    if (!mediaRecorderRef.current || !isRecording) return;

    const duration = recordingTime;
    
    return new Promise<void>((resolve) => {
      mediaRecorderRef.current!.onstop = async () => {
        const mimeType = recordingMimeTypeRef.current || mediaRecorderRef.current?.mimeType || "audio/webm";
        const audioBlob = new Blob(audioChunksRef.current, { type: mimeType });
        
        if (duration > 0) {
          const ext = mimeType.includes("mp4") ? "m4a" : mimeType.includes("ogg") ? "ogg" : "webm";
          const file = new File([audioBlob], `voice_${Date.now()}.${ext}`, { type: mimeType });
          await sendMediaMessage(file, 'voice', duration);
        }

        // Stop all tracks
        mediaRecorderRef.current?.stream.getTracks().forEach(track => track.stop());
        resolve();
      };

      mediaRecorderRef.current!.stop();
      setIsRecording(false);
    });
  };

  const cancelRecording = () => {
    if (mediaRecorderRef.current) {
      mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
      mediaRecorderRef.current = null;
    }
    audioChunksRef.current = [];
    setIsRecording(false);
  };

  const toggleVoicePlay = async (messageId: string, mediaUrl?: string) => {
    if (playingVoice === messageId) {
      audioRef.current?.pause();
      setPlayingVoice(null);
    } else {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
      if (mediaUrl) {
        try {
          const audio = new Audio(mediaUrl);
          audio.onended = () => setPlayingVoice(null);
          audio.onerror = (e) => {
            console.error('Audio playback error:', e);
            setPlayingVoice(null);
          };
          await audio.play();
          audioRef.current = audio;
          setPlayingVoice(messageId);
        } catch (error) {
          console.error('Failed to play audio:', error);
          setPlayingVoice(null);
        }
      }
    }
  };

  // Generate stable waveform heights for voice messages
  const getWaveformHeights = useMemo(() => {
    const cache: Record<string, number[]> = {};
    return (messageId: string): number[] => {
      if (!cache[messageId]) {
        // Use message ID as seed for consistent random heights
        const heights: number[] = [];
        let seed = messageId.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
        for (let i = 0; i < 20; i++) {
          seed = (seed * 1103515245 + 12345) % 2147483648;
          heights.push((seed % 16) + 8);
        }
        cache[messageId] = heights;
      }
      return cache[messageId];
    };
  }, []);

  const handleVideoRecord = async (videoBlob: Blob, duration: number) => {
    const blobType = videoBlob.type || 'video/webm';
    const ext = blobType.includes('mp4') ? 'mp4' : 'webm';
    const file = new File([videoBlob], `video_circle_${Date.now()}.${ext}`, { type: blobType });
    await sendMediaMessage(file, 'video_circle', duration);
    setShowVideoRecorder(false);
  };

  // Stage media for preview instead of uploading immediately
  const handleAttachment = (file: File, type: "image" | "video") => {
    setStagedMedia({ file, type });
  };

  // Called from MediaPreviewOverlay when user confirms send
  const handleStagedMediaSend = async (file: File, mediaType: "image" | "video", caption: string) => {
    await sendMediaMessage(file, mediaType, undefined, caption || undefined);
    setStagedMedia(null);
  };

  const handleStartAudioCall = async () => {
    await startCall(otherUserId, conversationId, "audio");
  };

  const handleStartVideoCall = async () => {
    await startCall(otherUserId, conversationId, "video");
  };

  // Hold-to-record handlers for dynamic mic/video button
  const holdStartedRef = useRef(false); // Track if mousedown happened on button
  const isTouchDeviceRef = useRef(false); // Prevent duplicate mouse events on touch devices

  const handleRecordButtonDown = useCallback((e: React.TouchEvent | React.MouseEvent) => {
    // On touch devices, ignore mouse events (touch already handled it)
    if ('touches' in e) {
      isTouchDeviceRef.current = true;
    } else if (isTouchDeviceRef.current) {
      return; // Skip mouse event on touch device
    }
    e.preventDefault();
    isHoldingRef.current = false;
    holdStartedRef.current = true;

    // In video mode, open recorder immediately on press (no hold needed)
    if (recordMode === 'video') {
      setVideoRecorderKey(prev => prev + 1);
      setShowVideoRecorder(true);
      holdStartedRef.current = false;
      return;
    }
    
    holdTimerRef.current = setTimeout(() => {
      isHoldingRef.current = true;
      startRecording();
    }, 200); // 200ms delay to distinguish tap from hold
  }, [recordMode]);

  const handleRecordButtonUp = useCallback(() => {
    // Only process if button down started on this button
    if (!holdStartedRef.current) return;
    holdStartedRef.current = false;
    
    if (holdTimerRef.current) {
      clearTimeout(holdTimerRef.current);
      holdTimerRef.current = null;
    }
    
    if (isHoldingRef.current) {
      // This was a hold — stop voice recording
      if (recordMode === 'voice' && isRecording) {
        stopRecording();
      }
    } else {
      // This was a tap — switch mode
      setRecordMode(prev => prev === 'voice' ? 'video' : 'voice');
    }
    isHoldingRef.current = false;
  }, [recordMode, isRecording]);

  // Cancel hold timer when mouse leaves (but don't switch mode)
  const handleRecordButtonLeave = useCallback(() => {
    if (holdTimerRef.current) {
      clearTimeout(holdTimerRef.current);
      holdTimerRef.current = null;
    }
    // Don't reset holdStartedRef - mouseUp can still happen
  }, []);

  // Long press handlers for context menu
  const handleMessageLongPressStart = useCallback((
    messageId: string, 
    content: string, 
    isOwn: boolean,
    event: React.MouseEvent | React.TouchEvent
  ) => {
    const target = event.currentTarget as HTMLElement;
    const rect = target.getBoundingClientRect();

    // Capture exact touch/click coordinates
    let clientX: number, clientY: number;
    if ("touches" in event && event.touches.length > 0) {
      clientX = event.touches[0].clientX;
      clientY = event.touches[0].clientY;
    } else if ("clientX" in event) {
      clientX = event.clientX;
      clientY = event.clientY;
    } else {
      clientX = rect.left + rect.width / 2;
      clientY = rect.top + rect.height / 2;
    }
    
    longPressTimerRef.current = setTimeout(() => {
      setContextMenuMessage({ 
        id: messageId, 
        content, 
        isOwn,
        touchPoint: { x: clientX, y: clientY },
        position: {
          top: rect.top,
          left: rect.left,
          width: rect.width,
          height: rect.height,
          bottom: rect.bottom,
          right: rect.right,
        }
      });
    }, 500);
  }, []);

  const handleMessageLongPressEnd = useCallback(() => {
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }
  }, []);

  const handleMessageDelete = async (messageId: string) => {
    const result = await deleteMessage(messageId);
    if (result.error) {
      toast.error("Не удалось удалить сообщение");
    }
  };

  const handleMessagePin = async (messageId: string) => {
    await pinMessage(messageId);
  };

  const handleMessageReaction = async (messageId: string, emoji: string) => {
    await toggleReaction(messageId, emoji);
  };

  const handleMessageReply = (messageId: string) => {
    const msg = messages.find((m) => m.id === messageId);
    if (!msg) return;
    const senderName = msg.sender_id === user?.id
      ? profile?.display_name || "Вы"
      : chatName;
    setReplyTo({ id: messageId, content: msg.content, senderName });
    // Focus input after selecting reply
    requestAnimationFrame(() => inputRef.current?.focus());
  };

  const scrollToMessage = (messageId: string) => {
    const el = document.querySelector(`[data-message-id="${messageId}"]`);
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "center" });
      setHighlightedMessageId(messageId);
      setTimeout(() => setHighlightedMessageId(null), 1500);
    }
  };

  const handleMessageForward = (messageId: string) => {
    const msg = messages.find((m) => m.id === messageId);
    if (!msg) return;
    const senderName = msg.forwarded_from
      ? msg.forwarded_from
      : msg.sender_id === user?.id
        ? profile?.display_name || "Вы"
        : chatName;
    setForwardData({ content: msg.content, senderName });
  };

  const handleMessageEdit = (messageId: string) => {
    const msg = messages.find((m) => m.id === messageId);
    if (!msg || msg.sender_id !== user?.id) return;
    setEditingMessage({ id: messageId, content: msg.content });
    setInputText(msg.content);
    setReplyTo(null);
    requestAnimationFrame(() => inputRef.current?.focus());
  };

  const cancelEditing = () => {
    setEditingMessage(null);
    setInputText("");
  };

  // Selection mode handlers
  const toggleSelection = useCallback((id: string) => {
    setSelectedMessages((prev) =>
      prev.includes(id) ? prev.filter((mid) => mid !== id) : [...prev, id]
    );
  }, []);

  const cancelSelection = useCallback(() => {
    setSelectedMessages([]);
  }, []);

  const handleSelectFromContext = useCallback((messageId: string) => {
    setSelectedMessages([messageId]);
  }, []);

  const handleBatchDelete = useCallback(async () => {
    if (selectedMessages.length === 0) return;
    for (const msgId of selectedMessages) {
      await deleteMessage(msgId);
    }
    setSelectedMessages([]);
    setShowDeleteConfirm(false);
  }, [selectedMessages, deleteMessage]);

  const handleBatchForward = useCallback(() => {
    const msgs = selectedMessages
      .map((id) => messages.find((m) => m.id === id))
      .filter(Boolean)
      .map((msg) => ({
        content: msg!.content,
        senderName: msg!.forwarded_from
          ? msg!.forwarded_from
          : msg!.sender_id === user?.id
            ? profile?.display_name || "Вы"
            : chatName,
      }));
    if (msgs.length > 0) {
      setForwardData({ content: msgs[0].content, senderName: msgs[0].senderName });
    }
  }, [selectedMessages, messages, user?.id, profile?.display_name, chatName]);

  // Check if all selected messages are own (for delete permission)
  const canDeleteSelected = useMemo(() => {
    return selectedMessages.every((id) => {
      const msg = messages.find((m) => m.id === id);
      return msg && msg.sender_id === user?.id;
    });
  }, [selectedMessages, messages, user?.id]);

  // Batch messages for forward sheet
  const batchForwardMessages = useMemo(() => {
    if (!isSelectionMode || !forwardData) return undefined;
    return selectedMessages
      .map((id) => messages.find((m) => m.id === id))
      .filter(Boolean)
      .map((msg) => ({
        content: msg!.content,
        senderName: msg!.forwarded_from
          ? msg!.forwarded_from
          : msg!.sender_id === user?.id
            ? profile?.display_name || "Вы"
            : chatName,
      }));
  }, [isSelectionMode, forwardData, selectedMessages, messages, user?.id, profile?.display_name, chatName]);

  return (
    <div className="fixed inset-0 flex flex-col z-[200]">
      {/* Header - Selection mode or standard */}
      <AnimatePresence mode="wait">
        {isSelectionMode ? (
          <SelectionHeader
            key="selection-header"
            count={selectedMessages.length}
            onCancel={cancelSelection}
            onForward={handleBatchForward}
            onDelete={() => setShowDeleteConfirm(true)}
            canDelete={canDeleteSelected}
          />
        ) : (
          <motion.div
            key="standard-header"
            initial={false}
          >
      {/* Header - transparent with glass effect */}
      <div className="flex-shrink-0 safe-area-top relative z-10 backdrop-blur-xl bg-black/20 border-b border-white/10">
        <div className="flex items-center px-2 py-2">
          {/* Back button */}
          <button 
            onClick={onBack} 
            className="flex items-center gap-1 p-2 text-[#6ab3f3] hover:bg-white/5 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            {totalUnreadCount && totalUnreadCount > 0 ? (
              <span className="text-sm font-medium">{totalUnreadCount}</span>
            ) : null}
          </button>
          
          {/* Avatar + Name + Status - clickable to profile */}
          <button
            onClick={() => navigate(`/contact/${otherUserId}`, { state: { name: chatName, avatar: chatAvatar || undefined, conversationId } })}
            className="flex items-center gap-3 flex-1 min-w-0 hover:bg-white/5 rounded-lg px-2 py-1 transition-colors"
          >
            <GradientAvatar
              name={chatName}
              seed={otherUserId}
              avatarUrl={chatAvatar}
              size="sm"
              className="w-10 h-10 text-base flex-shrink-0"
            />
            <div className="flex flex-col items-start min-w-0">
              <h2 className="font-semibold text-white text-base truncate max-w-[180px]">{chatName}</h2>
              <p className={`text-xs ${
                typingUsers.length > 0
                  ? 'text-emerald-400 italic'
                  : lastSeenStatus === 'онлайн' ? 'text-emerald-400' : 'text-[#6ab3f3]'
              }`}>
                {typingUsers.length > 0
                  ? 'печатает...'
                  : isGroup 
                    ? `${participantCount || 0} участник${participantCount === 1 ? '' : participantCount && participantCount < 5 ? 'а' : 'ов'}`
                    : lastSeenStatus
                }
              </p>
            </div>
          </button>
          
          {/* Right - Call buttons */}
          <div className="flex items-center">
            {/* Audio call button */}
            {!isGroup && (
              <button
                onClick={handleStartAudioCall}
                className="p-2 rounded-full hover:bg-white/10 active:bg-white/15 transition-colors"
                aria-label="Аудиозвонок"
              >
                <Phone className="w-5 h-5 text-[#6ab3f3]" />
              </button>
            )}
            
            {/* Video call button */}
            {!isGroup && (
              <button
                onClick={handleStartVideoCall}
                className="p-2 rounded-full hover:bg-white/10 active:bg-white/15 transition-colors"
                aria-label="Видеозвонок"
              >
                <Video className="w-5 h-5 text-[#6ab3f3]" />
              </button>
            )}
          </div>
        </div>
        
        {/* Add participants banner for groups */}
        {isGroup && (
          <button className="w-full py-2.5 px-4 bg-white/5 flex items-center justify-center gap-2 border-t border-white/5">
            <span className="text-[#6ab3f3] text-sm font-medium">Добавить участников</span>
            <span className="w-5 h-5 rounded-full border border-white/20 flex items-center justify-center">
              <X className="w-3 h-3 text-white/40" />
            </span>
          </button>
        )}
      </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Pinned message bar */}
      {pinnedMessage && (
        <PinnedMessageBar
          senderName={pinnedMessage.sender_name}
          content={pinnedMessage.content}
          onScrollTo={() => {
            const el = document.querySelector(`[data-message-id="${pinnedMessage.id}"]`);
            el?.scrollIntoView({ behavior: "smooth", block: "center" });
          }}
          onUnpin={unpinMessage}
        />
      )}

      {/* Messages - scrollable with animated brand background */}
      <div className="flex-1 overflow-y-auto native-scroll flex flex-col relative">
        {/* Brand background - fixed to cover full screen */}
        <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none">
          <div className="absolute inset-0 bg-gradient-to-br from-[#0a1628] via-[#0d2035] to-[#071420]" />
          <div 
            className="absolute top-0 left-1/4 w-[500px] h-[500px] rounded-full blur-[120px] opacity-60"
            style={{
              background: 'radial-gradient(circle, #0066CC 0%, transparent 70%)',
              animation: 'float-orb-1 15s ease-in-out infinite',
            }}
          />
          <div 
            className="absolute bottom-20 right-0 w-[450px] h-[450px] rounded-full blur-[100px] opacity-50"
            style={{
              background: 'radial-gradient(circle, #00A3B4 0%, transparent 70%)',
              animation: 'float-orb-2 18s ease-in-out infinite',
              animationDelay: '-5s',
            }}
          />
          <div 
            className="absolute top-1/3 -right-20 w-[400px] h-[400px] rounded-full blur-[90px] opacity-55"
            style={{
              background: 'radial-gradient(circle, #00C896 0%, transparent 70%)',
              animation: 'float-orb-3 20s ease-in-out infinite',
              animationDelay: '-10s',
            }}
          />
          <div 
            className="absolute bottom-1/3 -left-10 w-[350px] h-[350px] rounded-full blur-[80px] opacity-45"
            style={{
              background: 'radial-gradient(circle, #4FD080 0%, transparent 70%)',
              animation: 'float-orb-4 22s ease-in-out infinite',
              animationDelay: '-3s',
            }}
          />
        </div>
        
        {/* Content layer */}
        <div className="relative z-10 flex-1 flex flex-col p-4">
        {/* Spacer to push messages to bottom */}
        <div className="flex-1" />
        
        {loading && (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary" />
          </div>
        )}

        {!loading && messages.length === 0 && (
          <div className="flex items-center justify-center py-8 text-center">
            <p className="text-muted-foreground">Начните переписку!</p>
          </div>
        )}
        
        <div className="flex flex-col">

        {messages.map((message, index) => {
          const isOwn = message.sender_id === user?.id;
          const isVoice = message.media_type === 'voice';
          const isVideoCircle = message.media_type === 'video_circle';
          const isImage = message.media_type === 'image';
          const isVideo = message.media_type === 'video';
          const isSharedPost = !!message.shared_post_id;
          const isSharedReel = !!message.shared_reel_id;
          const isSharedStory = !!(message as any).shared_story_id || (message.media_type === 'image' && message.media_url?.includes('stories-media'));
          const isRead = message.is_read;

          const prevMessage = index > 0 ? messages[index - 1] : null;
          const nextMessage = index < messages.length - 1 ? messages[index + 1] : null;
          const showDate = shouldShowDateSeparator(message.created_at, prevMessage?.created_at);

          // Grouping logic: same sender within 5 minutes
          const FIVE_MINUTES = 5 * 60 * 1000;
          const isSameGroupAsPrev = !showDate &&
            prevMessage &&
            prevMessage.sender_id === message.sender_id &&
            (new Date(message.created_at).getTime() - new Date(prevMessage.created_at).getTime()) < FIVE_MINUTES;

          const isSameGroupAsNext =
            nextMessage &&
            nextMessage.sender_id === message.sender_id &&
            (new Date(nextMessage.created_at).getTime() - new Date(message.created_at).getTime()) < FIVE_MINUTES &&
            !shouldShowDateSeparator(nextMessage.created_at, message.created_at);

          // Position in group: first, middle, last, or single
          const isFirstInGroup = !isSameGroupAsPrev;
          const isLastInGroup = !isSameGroupAsNext;

          // Show avatar on last message of incoming group (Telegram-style)
          const showAvatar = !isOwn && isLastInGroup;
          const showSenderName = isGroup && !isOwn && isFirstInGroup;

          // Tail on last message of each group
          const hasTail = isLastInGroup;

          // Spacing: tight within group, wider between groups
          const topMargin = index === 0 ? '' : (isSameGroupAsPrev ? 'mt-[2px]' : 'mt-3');

          // Hide message if it's currently shown in context menu
          const isInContextMenu = contextMenuMessage?.id === message.id;

          const msgReactions = reactions[message.id] || [];

          // Bubble border-radius based on position
          const getBubbleRadius = () => {
            if (isOwn) {
              if (!isSameGroupAsPrev && !isSameGroupAsNext) return 'rounded-2xl rounded-br-[5px]'; // single
              if (isFirstInGroup) return 'rounded-2xl rounded-br-md'; // first
              if (isLastInGroup) return 'rounded-2xl rounded-tr-md rounded-br-[5px]'; // last (tail)
              return 'rounded-2xl rounded-tr-md rounded-br-md'; // middle
            } else {
              if (!isSameGroupAsPrev && !isSameGroupAsNext) return 'rounded-2xl rounded-bl-[5px]'; // single
              if (isFirstInGroup) return 'rounded-2xl rounded-bl-md'; // first
              if (isLastInGroup) return 'rounded-2xl rounded-tl-md rounded-bl-[5px]'; // last (tail)
              return 'rounded-2xl rounded-tl-md rounded-bl-md'; // middle
            }
          };

          const isSelected = selectedMessages.includes(message.id);

          return (
            <div
              key={message.id}
              data-message-id={message.id}
              className={topMargin}
              onClick={isSelectionMode ? () => toggleSelection(message.id) : undefined}
              style={isSelectionMode ? { cursor: "pointer" } : undefined}
            >
              {showDate && <DateSeparator date={message.created_at} />}
              <div
              className={`flex items-end gap-1.5 ${isOwn ? "justify-end" : "justify-start"} ${highlightedMessageId === message.id ? "animate-highlight-message" : ""}`}
              style={highlightedMessageId === message.id ? { 
                animation: 'highlight-flash 1.5s ease-out',
              } : undefined}
            >
              {/* Selection checkbox — fixed width so layout doesn't jump */}
              <div className={`flex-shrink-0 transition-all duration-200 overflow-hidden ${isSelectionMode ? "w-8" : "w-0"}`}>
                {isSelectionMode && (
                  <SelectionCheckbox
                    checked={isSelected}
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleSelection(message.id);
                    }}
                  />
                )}
              </div>

              {/* Avatar for incoming messages - only on last in group */}
              {!isOwn && (
                <div className="w-7 shrink-0">
                  {showAvatar && (
                    <GradientAvatar
                      name={chatName}
                      seed={otherUserId}
                      avatarUrl={chatAvatar}
                      size="sm"
                      className="w-7 h-7 text-xs"
                    />
                  )}
                </div>
              )}

              <div className={`flex flex-col ${isOwn ? "items-end" : "items-start"} max-w-[75%]`}>
              {isSharedStory ? (
                <div className="flex flex-col gap-1">
                  {(message as any).shared_story_id ? (
                    <SharedStoryCard
                      storyId={(message as any).shared_story_id}
                      isOwn={isOwn}
                      caption={message.content || undefined}
                    />
                  ) : (
                    <SharedStoryCard
                      mediaUrl={message.media_url!}
                      isOwn={isOwn}
                      caption={message.content || undefined}
                    />
                  )}
                  <div className={`flex items-center gap-1 ${isOwn ? "justify-end" : "justify-start"}`}>
                    {message.edited_at && <span className="text-[10px] text-white/30 italic">ред.</span>}
                    <span className="text-[11px] text-white/50">{formatMessageTime(message.created_at)}</span>
                    {isOwn && (
                      isRead 
                        ? <CheckCheck className="w-3.5 h-3.5 text-[#6ab3f3]" />
                        : <Check className="w-3.5 h-3.5 text-white/40" />
                    )}
                  </div>
                </div>
              ) : isSharedReel && message.shared_reel_id ? (
                <div className="flex flex-col gap-1">
                  <SharedReelCard 
                    reelId={message.shared_reel_id} 
                    isOwn={isOwn} 
                    messageId={message.id}
                    onDelete={async (msgId) => {
                      const result = await deleteMessage(msgId);
                      if (result.error) {
                        toast.error("Не удалось удалить сообщение");
                      }
                    }}
                  />
                  <div className={`flex items-center gap-1 ${isOwn ? "justify-end" : "justify-start"}`}>
                    {message.edited_at && <span className="text-[10px] text-white/30 italic">ред.</span>}
                    <span className="text-[11px] text-white/50">{formatMessageTime(message.created_at)}</span>
                    {isOwn && (
                      isRead 
                        ? <CheckCheck className="w-3.5 h-3.5 text-[#6ab3f3]" />
                        : <Check className="w-3.5 h-3.5 text-white/40" />
                    )}
                  </div>
                </div>
              ) : isSharedPost && message.shared_post_id ? (
                <div className="flex flex-col gap-1">
                  <SharedPostCard 
                    postId={message.shared_post_id} 
                    isOwn={isOwn} 
                    messageId={message.id}
                    onDelete={async (msgId) => {
                      const result = await deleteMessage(msgId);
                      if (result.error) {
                        toast.error("Не удалось удалить сообщение");
                      }
                    }}
                  />
                  <div className={`flex items-center gap-1 ${isOwn ? "justify-end" : "justify-start"}`}>
                    {message.edited_at && <span className="text-[10px] text-white/30 italic">ред.</span>}
                    <span className="text-[11px] text-white/50">{formatMessageTime(message.created_at)}</span>
                    {isOwn && (
                      isRead 
                        ? <CheckCheck className="w-3.5 h-3.5 text-[#6ab3f3]" />
                        : <Check className="w-3.5 h-3.5 text-white/40" />
                    )}
                  </div>
                </div>
              ) : isVideoCircle && message.media_url ? (
                <div className="flex flex-col items-center gap-1">
                  <VideoCircleMessage
                    videoUrl={message.media_url}
                    duration={String(message.duration_seconds || 0)}
                    isOwn={isOwn}
                  />
                  <span className="text-[10px] text-white/50">{formatMessageTime(message.created_at)}</span>
                </div>
              ) : isImage && message.media_url ? (
                <MediaMessageBubble
                  mediaUrl={message.media_url}
                  mediaType="image"
                  content={message.content}
                  time={formatMessageTime(message.created_at)}
                  isOwn={isOwn}
                  isRead={isRead}
                  isEdited={!!message.edited_at}
                  bubbleRadius={getBubbleRadius()}
                  onImageClick={() => setViewingImage(message.media_url!)}
                />
              ) : isVideo && message.media_url ? (
                <MediaMessageBubble
                  mediaUrl={message.media_url}
                  mediaType="video"
                  content={message.content}
                  time={formatMessageTime(message.created_at)}
                  isOwn={isOwn}
                  isRead={isRead}
                  isEdited={!!message.edited_at}
                  bubbleRadius={getBubbleRadius()}
                  onVideoClick={() => setViewingVideo(message.media_url!)}
                />
              ) : (
                <div
                  className={`${getBubbleRadius()} px-3 py-1.5 select-none backdrop-blur-xl border border-white/10 ${
                    isOwn
                      ? "bg-white/10 text-white"
                      : "bg-white/5 text-white"
                  } ${isSelected ? "ring-2 ring-[#3390ec]/50" : ""}`}
                  style={{
                    boxShadow: isOwn 
                      ? 'inset 0 1px 0 rgba(255,255,255,0.15), 0 2px 8px rgba(0,0,0,0.2)'
                      : 'inset 0 1px 0 rgba(255,255,255,0.1), 0 2px 8px rgba(0,0,0,0.15)'
                  }}
                  onMouseDown={isSelectionMode ? undefined : (e) => handleMessageLongPressStart(message.id, message.content, isOwn, e)}
                  onMouseUp={isSelectionMode ? undefined : handleMessageLongPressEnd}
                  onMouseLeave={isSelectionMode ? undefined : handleMessageLongPressEnd}
                  onTouchStart={isSelectionMode ? undefined : (e) => handleMessageLongPressStart(message.id, message.content, isOwn, e)}
                  onTouchEnd={isSelectionMode ? undefined : handleMessageLongPressEnd}
                >
                  {/* Quoted reply block */}
                  {message.reply_to_message_id && (() => {
                    const repliedMsg = messages.find((m) => m.id === message.reply_to_message_id);
                    if (!repliedMsg) return null;
                    const repliedSender = repliedMsg.sender_id === user?.id
                      ? profile?.display_name || "Вы"
                      : chatName;
                    return (
                      <QuotedReply
                        senderName={repliedSender}
                        content={repliedMsg.content}
                        onClick={() => scrollToMessage(repliedMsg.id)}
                      />
                    );
                  })()}

                  {/* Forwarded indicator */}
                  {message.forwarded_from && (
                    <p className="text-[11px] text-[#6ab3f3] italic mb-0.5">
                      Переслано от {message.forwarded_from}
                    </p>
                  )}

                  {/* Sender name for group chats - only first in group */}
                  {showSenderName && (
                    <p className="text-[13px] font-medium text-[#6ab3f3] mb-0.5">{chatName}</p>
                  )}
                  
                  {isVoice ? (
                    <div className="flex items-center gap-3 min-w-[200px]">
                      <button
                        className="w-10 h-10 shrink-0 rounded-full flex items-center justify-center transition-all active:scale-95"
                        style={{
                          background: playingVoice === message.id
                            ? 'linear-gradient(135deg, #00A3B4 0%, #0066CC 100%)'
                            : 'rgba(255,255,255,0.12)',
                          boxShadow: playingVoice === message.id
                            ? '0 0 12px rgba(0,163,180,0.4)'
                            : 'none',
                        }}
                        onTouchStart={(e) => e.stopPropagation()}
                        onMouseDown={(e) => e.stopPropagation()}
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleVoicePlay(message.id, message.media_url || undefined);
                        }}
                      >
                        {playingVoice === message.id ? (
                          <Pause className="w-5 h-5 text-white" />
                        ) : (
                          <Play className="w-5 h-5 text-white ml-0.5" />
                        )}
                      </button>
                      <div className="flex-1 flex items-end gap-[2px] h-8">
                        {getWaveformHeights(message.id).map((height, i) => (
                          <div
                            key={i}
                            className="w-[3px] rounded-full transition-all duration-200"
                            style={{ 
                              height: `${height}px`,
                              background: playingVoice === message.id
                                ? `linear-gradient(180deg, rgba(0,163,180,0.9) 0%, rgba(0,102,204,0.7) 100%)`
                                : 'rgba(255,255,255,0.35)',
                              transform: playingVoice === message.id
                                ? `scaleY(${1 + Math.sin(Date.now() / 200 + i) * 0.15})`
                                : 'scaleY(1)',
                            }}
                          />
                        ))}
                      </div>
                      <span className="text-xs text-white/60 font-medium tabular-nums">
                        {message.duration_seconds ? formatTime(message.duration_seconds) : "0:00"}
                      </span>
                    </div>
                  ) : (
                    <p className="text-[15px] leading-[1.35] whitespace-pre-wrap">{message.content}</p>
                  )}
                  
                  {/* Time and read status - inline float */}
                  <div className="flex items-center justify-end gap-1 -mb-0.5 mt-0.5">
                    {message.edited_at && (
                      <span className="text-[10px] text-white/30 italic">ред.</span>
                    )}
                    <span className="text-[11px] text-white/40">{formatMessageTime(message.created_at)}</span>
                    {isOwn && (
                      isRead 
                        ? <CheckCheck className="w-3.5 h-3.5 text-[#6ab3f3]" />
                        : <Check className="w-3.5 h-3.5 text-white/40" />
                    )}
                  </div>
                </div>
              )}

              {/* Reactions row below message */}
              {msgReactions.length > 0 && (
                <MessageReactions
                  reactions={msgReactions}
                  isOwn={isOwn}
                  onToggle={(emoji) => toggleReaction(message.id, emoji)}
                />
              )}
              </div>
              </div>
            </div>
          );
        })}
        </div>
        <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Input area - Fully transparent like Telegram */}
      <div className="flex-shrink-0 relative z-10">

        {/* Reply preview bar */}
        <AnimatePresence>
          {replyTo && !editingMessage && (
            <ReplyPreview
              senderName={replyTo.senderName}
              content={replyTo.content}
              onClose={() => setReplyTo(null)}
              onScrollTo={() => scrollToMessage(replyTo.id)}
            />
          )}
          {editingMessage && (
            <EditPreview
              content={editingMessage.content}
              onClose={cancelEditing}
            />
          )}
        </AnimatePresence>
        
        {/* Input controls */}
        <div className="px-3 py-3">
          {isRecording ? (
            <div className="flex items-center gap-3">
              <button 
                onClick={cancelRecording}
                className="w-12 h-12 rounded-full flex items-center justify-center shrink-0 backdrop-blur-xl border border-white/10"
                style={{
                  background: 'linear-gradient(145deg, rgba(255,255,255,0.08) 0%, rgba(255,255,255,0.02) 100%)',
                  boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.1), 0 4px 20px rgba(0,0,0,0.3)'
                }}
              >
                <X className="w-5 h-5 text-white/70" />
              </button>
              
              <div 
                className="flex-1 flex items-center gap-3 h-12 px-5 rounded-full backdrop-blur-xl border border-white/10"
                style={{
                  background: 'linear-gradient(145deg, rgba(255,255,255,0.08) 0%, rgba(255,255,255,0.02) 100%)',
                  boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.1), 0 4px 20px rgba(0,0,0,0.3)'
                }}
              >
                <div className="w-2.5 h-2.5 rounded-full bg-red-500 animate-pulse" />
                <span className="text-sm text-white/70">
                  Запись... {formatTime(recordingTime)}
                </span>
              </div>
              
              <button
                onClick={stopRecording}
                className="w-12 h-12 rounded-full flex items-center justify-center shrink-0"
                style={{
                  background: 'linear-gradient(135deg, #00A3B4 0%, #0066CC 50%, #00C896 100%)',
                  boxShadow: '0 0 20px rgba(0,163,180,0.4), 0 4px 20px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.2)'
                }}
              >
                <Send className="w-5 h-5 text-white" />
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-3">
              {/* Input field - dark transparent like Telegram */}
              <div className="flex-1 relative">
                <input
                  ref={inputRef}
                  type="text"
                  placeholder="Сообщение"
                  value={inputText}
                  onChange={(e) => {
                    setInputText(e.target.value);
                    sendTyping();
                  }}
                  onKeyDown={(e) => e.key === "Enter" && handleSendMessage()}
                  onFocus={() => setShowEmojiPicker(false)}
                  className="w-full h-11 px-5 pr-20 rounded-full text-white placeholder:text-white/50 outline-none bg-black/40 border-0 transition-all"
                />
                {/* Icons inside input */}
                <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-2">
                  <button
                    onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                    className={`transition-colors ${showEmojiPicker ? 'text-cyan-400' : 'text-white/50 hover:text-white/70'}`}
                  >
                    <Smile className="w-5 h-5" />
                  </button>
                  <button 
                    onClick={() => setShowAttachmentSheet(true)}
                    className="text-white/50 hover:text-white/70 transition-colors"
                  >
                    <AttachmentIcon className="w-5 h-5" />
                  </button>
                </div>
              </div>
              
              {/* Right button - Dynamic based on text and record mode */}
              {inputText.trim() ? (
                <button
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={handleSendMessage}
                  className="w-12 h-12 rounded-full flex items-center justify-center shrink-0 transition-all"
                  style={{
                    background: 'linear-gradient(135deg, #00A3B4 0%, #0066CC 50%, #00C896 100%)',
                    boxShadow: '0 0 25px rgba(0,163,180,0.5), 0 4px 20px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.2)'
                  }}
                >
                  <Send className="w-5 h-5 text-white" />
                </button>
              ) : (
                <button
                  onTouchStart={handleRecordButtonDown}
                  onTouchEnd={handleRecordButtonUp}
                  onMouseDown={handleRecordButtonDown}
                  onMouseUp={handleRecordButtonUp}
                  onMouseLeave={handleRecordButtonLeave}
                  onContextMenu={(e) => e.preventDefault()}
                  className="w-12 h-12 rounded-full flex items-center justify-center shrink-0 transition-all backdrop-blur-xl border border-cyan-400/30 select-none"
                  style={{
                    background: recordMode === 'video' 
                      ? 'linear-gradient(145deg, rgba(139,92,246,0.3) 0%, rgba(0,102,204,0.2) 100%)'
                      : 'linear-gradient(145deg, rgba(0,163,180,0.3) 0%, rgba(0,102,204,0.2) 100%)',
                    boxShadow: '0 0 20px rgba(0,163,180,0.3), inset 0 1px 0 rgba(255,255,255,0.15), 0 4px 20px rgba(0,0,0,0.3)'
                  }}
                >
                  {recordMode === 'voice' ? (
                    <Mic className="w-5 h-5 text-cyan-300" />
                  ) : (
                    <Video className="w-5 h-5 text-purple-300" />
                  )}
                </button>
              )}
            </div>
          )}
        </div>
        
        {/* Emoji Picker - Telegram style inline below input */}
        <EmojiStickerPicker
          open={showEmojiPicker}
          onOpenChange={setShowEmojiPicker}
          onEmojiSelect={(emoji) => {
            setInputText((prev) => prev + emoji);
          }}
        />
      </div>
      
      {/* Safe area for bottom - transparent */}
      {!showEmojiPicker && <div className="safe-area-bottom" />}

      {/* Video Circle Recorder */}
      {showVideoRecorder && (
        <VideoCircleRecorder
          key={videoRecorderKey}
          onRecord={handleVideoRecord}
          onCancel={() => setShowVideoRecorder(false)}
          autoRecord={false}
        />
      )}

      {/* Attachment Sheet */}
      <AttachmentSheet
        open={showAttachmentSheet}
        onOpenChange={setShowAttachmentSheet}
        onSelectFile={handleAttachment}
      />

      {/* Media Preview Overlay (Telegram-style staging) */}
      {stagedMedia && (
        <MediaPreviewOverlay
          file={stagedMedia.file}
          mediaType={stagedMedia.type}
          onSend={handleStagedMediaSend}
          onCancel={() => setStagedMedia(null)}
        />
      )}


      {/* Image Viewer */}
      {viewingImage && (
        <ImageViewer
          src={viewingImage}
          onClose={() => setViewingImage(null)}
        />
      )}

      {/* Fullscreen Video Player */}
      {viewingVideo && (
        <FullscreenVideoPlayer
          src={viewingVideo}
          onClose={() => setViewingVideo(null)}
        />
      )}

      {/* Message Context Menu */}
      {contextMenuMessage && (
        <MessageContextMenu
          isOpen={!!contextMenuMessage}
          onClose={() => setContextMenuMessage(null)}
          messageId={contextMenuMessage.id}
          messageContent={contextMenuMessage.content}
          isOwn={contextMenuMessage.isOwn}
          touchPoint={contextMenuMessage.touchPoint}
          position={contextMenuMessage.position}
          onDelete={handleMessageDelete}
          onPin={handleMessagePin}
          onReaction={handleMessageReaction}
          onReply={handleMessageReply}
          onForward={handleMessageForward}
          onEdit={handleMessageEdit}
          onSelect={handleSelectFromContext}
        />
      )}

      {/* Forward Sheet */}
      <ForwardSheet
        open={!!forwardData}
        onClose={() => {
          setForwardData(null);
          if (isSelectionMode) cancelSelection();
        }}
        messageContent={forwardData?.content || ""}
        originalSenderName={forwardData?.senderName || ""}
        batchMessages={batchForwardMessages}
      />

      {/* Delete Confirm Dialog */}
      <DeleteConfirmDialog
        open={showDeleteConfirm}
        count={selectedMessages.length}
        onConfirm={handleBatchDelete}
        onCancel={() => setShowDeleteConfirm(false)}
      />

    </div>
  );
}
