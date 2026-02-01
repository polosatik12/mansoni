import { useState, useRef, useEffect } from "react";
import { ArrowLeft, Phone, Video, Send, Mic, Paperclip, X, Play, Pause, Check, CheckCheck, Smile } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useMessages } from "@/hooks/useChat";
import { useAuth } from "@/hooks/useAuth";
import { useMarkConversationRead } from "@/hooks/useMarkConversationRead";
import { useVideoCallContext } from "@/contexts/VideoCallContext";
import { useChatOpen } from "@/contexts/ChatOpenContext";
import { format } from "date-fns";
import { toast } from "sonner";
import chatBackground from "@/assets/chat-background.jpg";
import { VideoCircleRecorder } from "./VideoCircleRecorder";
import { VideoCircleMessage } from "./VideoCircleMessage";
import { AttachmentSheet } from "./AttachmentSheet";
import { ImageViewer } from "./ImageViewer";
import { VideoPlayer, FullscreenVideoPlayer } from "./VideoPlayer";
import { SharedPostCard } from "./SharedPostCard";
import { SharedReelCard } from "./SharedReelCard";
import { EmojiStickerPicker } from "./EmojiStickerPicker";
interface ChatConversationProps {
  conversationId: string;
  chatName: string;
  chatAvatar: string;
  otherUserId: string;
  onBack: () => void;
  participantCount?: number;
  isGroup?: boolean;
  totalUnreadCount?: number;
  /** Called to refresh conversation list after marking messages read */
  onRefetch?: () => void;
}

export function ChatConversation({ conversationId, chatName, chatAvatar, otherUserId, onBack, participantCount, isGroup, totalUnreadCount, onRefetch }: ChatConversationProps) {
  const { user } = useAuth();
  const { messages, loading, sendMessage, sendMediaMessage, deleteMessage } = useMessages(conversationId);
  const { markConversationRead } = useMarkConversationRead();
  const { startCall } = useVideoCallContext();
  const { setIsChatOpen } = useChatOpen();
  
  const [inputText, setInputText] = useState("");
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [playingVoice, setPlayingVoice] = useState<string | null>(null);
  const [showVideoRecorder, setShowVideoRecorder] = useState(false);
  const [showAttachmentSheet, setShowAttachmentSheet] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [viewingImage, setViewingImage] = useState<string | null>(null);
  const [viewingVideo, setViewingVideo] = useState<string | null>(null);
  const [recordMode, setRecordMode] = useState<'voice' | 'video'>('voice');
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const recordingInterval = useRef<NodeJS.Timeout | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const holdTimerRef = useRef<NodeJS.Timeout | null>(null);
  const isHoldingRef = useRef(false);

  // Mark chat as open/closed for hiding bottom nav
  useEffect(() => {
    setIsChatOpen(true);
    return () => setIsChatOpen(false);
  }, [setIsChatOpen]);

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

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

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
      await sendMessage(inputText);
      setInputText("");
    } catch (error) {
      console.error("[handleSendMessage] error:", error);
      toast.error("Не удалось отправить сообщение");
    }
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
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
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        
        if (duration > 0) {
          const file = new File([audioBlob], `voice_${Date.now()}.webm`, { type: 'audio/webm' });
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

  const toggleVoicePlay = (messageId: string, mediaUrl?: string) => {
    if (playingVoice === messageId) {
      audioRef.current?.pause();
      setPlayingVoice(null);
    } else {
      if (audioRef.current) {
        audioRef.current.pause();
      }
      if (mediaUrl) {
        audioRef.current = new Audio(mediaUrl);
        audioRef.current.onended = () => setPlayingVoice(null);
        audioRef.current.play();
        setPlayingVoice(messageId);
      }
    }
  };

  const handleVideoRecord = async (videoBlob: Blob, duration: number) => {
    const file = new File([videoBlob], `video_circle_${Date.now()}.webm`, { type: 'video/webm' });
    await sendMediaMessage(file, 'video_circle', duration);
    setShowVideoRecorder(false);
  };

  const handleAttachment = async (file: File, type: "image" | "video") => {
    if (type === "image") {
      await sendMediaMessage(file, 'image');
    } else {
      // For video files, we can add a 'video' type or reuse 'video_circle'
      await sendMediaMessage(file, 'video' as any);
    }
  };

  const handleStartAudioCall = async () => {
    await startCall(otherUserId, conversationId, "audio");
  };

  const handleStartVideoCall = async () => {
    await startCall(otherUserId, conversationId, "video");
  };

  return (
    <div className="fixed inset-0 flex flex-col bg-background z-[200]">
      {/* Header - Telegram style centered */}
      <div className="flex-shrink-0 bg-[#17212b] safe-area-top">
        <div className="flex items-center px-2 py-2">
          {/* Back button with unread count */}
          <button 
            onClick={onBack} 
            className="flex items-center gap-1 px-2 py-1 text-[#6ab3f3] hover:bg-white/5 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            {totalUnreadCount && totalUnreadCount > 0 ? (
              <span className="text-sm font-medium">{totalUnreadCount}</span>
            ) : null}
          </button>
          
          {/* Center - Chat info */}
          <div className="flex-1 flex flex-col items-center justify-center min-w-0">
            <h2 className="font-semibold text-white text-base truncate max-w-[200px]">{chatName}</h2>
            <p className="text-xs text-[#6ab3f3]">
              {isGroup 
                ? `${participantCount || 0} участник${participantCount === 1 ? '' : participantCount && participantCount < 5 ? 'а' : 'ов'}`
                : 'был(а) недавно'
              }
            </p>
          </div>
          
          {/* Right - Call buttons + Avatar */}
          <div className="flex items-center gap-1">
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
            
            {/* Avatar */}
            <img
              src={chatAvatar}
              alt={chatName}
              className="w-10 h-10 rounded-full object-cover bg-[#6ab3f3] ml-1"
            />
          </div>
        </div>
        
        {/* Add participants banner for groups */}
        {isGroup && (
          <button className="w-full py-2.5 px-4 bg-[#1e2c3a] flex items-center justify-center gap-2 border-t border-white/5">
            <span className="text-[#6ab3f3] text-sm font-medium">Добавить участников</span>
            <span className="w-5 h-5 rounded-full border border-white/20 flex items-center justify-center">
              <X className="w-3 h-3 text-white/40" />
            </span>
          </button>
        )}
      </div>

      {/* Messages - scrollable with Telegram-style background */}
      <div 
        className="flex-1 overflow-y-auto p-4 space-y-1 native-scroll"
        style={{
          backgroundImage: `url(${chatBackground})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundAttachment: 'fixed'
        }}
      >
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

        {messages.map((message, index) => {
          const isOwn = message.sender_id === user?.id;
          const isVoice = message.media_type === 'voice';
          const isVideoCircle = message.media_type === 'video_circle';
          const isImage = message.media_type === 'image';
          const isVideo = message.media_type === 'video';
          const isSharedPost = !!message.shared_post_id;
          const isSharedReel = !!message.shared_reel_id;
          const isRead = message.is_read;

          // Group messages - show avatar only for first in sequence
          const prevMessage = index > 0 ? messages[index - 1] : null;
          const showAvatar = !isOwn && (!prevMessage || prevMessage.sender_id !== message.sender_id);
          const showSenderName = isGroup && !isOwn && showAvatar;

          return (
            <div
              key={message.id}
              className={`flex items-end gap-2 ${isOwn ? "justify-end" : "justify-start"}`}
            >
              {/* Avatar for incoming messages */}
              {!isOwn && (
                <div className="w-8 shrink-0">
                  {showAvatar && (
                    <img 
                      src={chatAvatar} 
                      alt="" 
                      className="w-8 h-8 rounded-full object-cover"
                    />
                  )}
                </div>
              )}

              {isSharedReel && message.shared_reel_id ? (
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
                    <span className="text-[11px] text-white/50">{formatMessageTime(message.created_at)}</span>
                    {isOwn && (
                      <CheckCheck className={`w-4 h-4 ${isRead ? 'text-[#6ab3f3]' : 'text-white/40'}`} />
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
                    <span className="text-[11px] text-white/50">{formatMessageTime(message.created_at)}</span>
                    {isOwn && (
                      <CheckCheck className={`w-4 h-4 ${isRead ? 'text-[#6ab3f3]' : 'text-white/40'}`} />
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
                <div 
                  className={`max-w-[75%] rounded-2xl overflow-hidden cursor-pointer ${
                    isOwn ? "rounded-br-md bg-[#2b5278]" : "rounded-bl-md bg-[#182533]"
                  }`}
                  onClick={() => setViewingImage(message.media_url!)}
                >
                  <img 
                    src={message.media_url} 
                    alt="Изображение" 
                    className="max-w-full h-auto"
                  />
                  <div className="px-3 py-1.5 flex items-center justify-end gap-1">
                    <span className="text-[11px] text-white/50">{formatMessageTime(message.created_at)}</span>
                    {isOwn && (
                      <CheckCheck className={`w-4 h-4 ${isRead ? 'text-[#6ab3f3]' : 'text-white/40'}`} />
                    )}
                  </div>
                </div>
              ) : isVideo && message.media_url ? (
                <div className="flex flex-col gap-1">
                  <VideoPlayer
                    src={message.media_url}
                    isOwn={isOwn}
                    onFullscreen={() => setViewingVideo(message.media_url!)}
                  />
                  <div className={`flex items-center gap-1 ${isOwn ? "justify-end" : "justify-start"}`}>
                    <span className="text-[11px] text-white/50">{formatMessageTime(message.created_at)}</span>
                    {isOwn && (
                      <CheckCheck className={`w-4 h-4 ${isRead ? 'text-[#6ab3f3]' : 'text-white/40'}`} />
                    )}
                  </div>
                </div>
              ) : (
                <div
                  className={`max-w-[75%] rounded-2xl px-3 py-2 ${
                    isOwn
                      ? "bg-[#2b5278] text-white rounded-br-sm"
                      : "bg-[#182533] text-white rounded-bl-sm"
                  }`}
                >
                  {/* Sender name for group chats */}
                  {showSenderName && (
                    <p className="text-[13px] font-medium text-[#6ab3f3] mb-0.5">Эдгар</p>
                  )}
                  
                  {isVoice ? (
                    <div className="flex items-center gap-3">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 shrink-0 text-white hover:bg-white/10"
                        onClick={() => toggleVoicePlay(message.id, message.media_url || undefined)}
                      >
                        {playingVoice === message.id ? (
                          <Pause className="w-4 h-4" />
                        ) : (
                          <Play className="w-4 h-4" />
                        )}
                      </Button>
                      <div className="flex-1">
                        <div className="h-6 flex items-center gap-0.5">
                          {Array.from({ length: 20 }).map((_, i) => (
                            <div
                              key={i}
                              className="w-1 rounded-full bg-white/30"
                              style={{ height: `${Math.random() * 16 + 8}px` }}
                            />
                          ))}
                        </div>
                      </div>
                      <span className="text-xs text-white/50">
                        {message.duration_seconds ? formatTime(message.duration_seconds) : "0:00"}
                      </span>
                    </div>
                  ) : (
                    <p className="text-[15px] leading-[1.4] whitespace-pre-wrap">{message.content}</p>
                  )}
                  
                  {/* Time and read status */}
                  <div className="flex items-center justify-end gap-1 mt-1">
                    <span className="text-[11px] text-white/40">{formatMessageTime(message.created_at)}</span>
                    {isOwn && (
                      <CheckCheck className={`w-4 h-4 ${isRead ? 'text-[#6ab3f3]' : 'text-white/40'}`} />
                    )}
                  </div>
                </div>
              )}
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>

      {/* Input area - Telegram style */}
      <div className="flex-shrink-0 bg-[#17212b] safe-area-bottom">
        {/* Emoji Picker - Telegram style inline above input */}
        <EmojiStickerPicker
          open={showEmojiPicker}
          onOpenChange={setShowEmojiPicker}
          onEmojiSelect={(emoji) => {
            setInputText((prev) => prev + emoji);
          }}
        />
        
        {/* Input controls */}
        <div className="px-2 py-2">
          {isRecording ? (
            <div className="flex items-center gap-2">
              <button 
                onClick={cancelRecording}
                className="w-11 h-11 rounded-full bg-[#242f3d] flex items-center justify-center shrink-0"
              >
                <X className="w-5 h-5 text-white/70" />
              </button>
              
              <div className="flex-1 flex items-center gap-3 h-11 px-4 rounded-full bg-[#242f3d]">
                <div className="w-2.5 h-2.5 rounded-full bg-red-500 animate-pulse" />
                <span className="text-sm text-white/70">
                  Запись... {formatTime(recordingTime)}
                </span>
              </div>
              
              <button
                onClick={stopRecording}
                className="w-11 h-11 rounded-full bg-[#6ab3f3] flex items-center justify-center shrink-0"
              >
                <Send className="w-5 h-5 text-white" />
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              {/* Attachment button */}
              <button 
                onClick={() => setShowAttachmentSheet(true)}
                className="w-11 h-11 rounded-full bg-[#242f3d] flex items-center justify-center shrink-0"
              >
                <Paperclip className="w-5 h-5 text-white/60 rotate-45" />
              </button>
              
              {/* Input field */}
              <div className="flex-1 relative">
                <input
                  type="text"
                  placeholder="Сообщение"
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSendMessage()}
                  onFocus={() => setShowEmojiPicker(false)}
                  className="w-full h-11 px-4 pr-12 rounded-full bg-[#242f3d] text-white placeholder:text-white/40 outline-none focus:ring-1 focus:ring-[#6ab3f3]/30 transition-all"
                />
                {/* Emoji button inside input */}
                <button
                  onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                  className={`absolute right-3 top-1/2 -translate-y-1/2 transition-colors ${showEmojiPicker ? 'text-[#6ab3f3]' : 'text-white/50 hover:text-white/80'}`}
                >
                  <Smile className="w-5 h-5" />
                </button>
              </div>
              
              {/* Send or toggleable Mic button */}
              {inputText.trim() ? (
                <button
                  onClick={handleSendMessage}
                  className="w-11 h-11 rounded-full bg-[#6ab3f3] flex items-center justify-center shrink-0"
                >
                  <Send className="w-5 h-5 text-white" />
                </button>
              ) : (
                <button
                  onMouseDown={(e) => {
                    e.preventDefault();
                    isHoldingRef.current = false;
                    holdTimerRef.current = setTimeout(() => {
                      isHoldingRef.current = true;
                      if (recordMode === 'voice') startRecording();
                      else setShowVideoRecorder(true);
                    }, 200);
                  }}
                  onMouseUp={() => {
                    if (holdTimerRef.current) clearTimeout(holdTimerRef.current);
                    if (isHoldingRef.current) {
                      if (recordMode === 'voice') stopRecording();
                    } else {
                      setRecordMode(prev => prev === 'voice' ? 'video' : 'voice');
                    }
                    isHoldingRef.current = false;
                  }}
                  onMouseLeave={() => {
                    if (holdTimerRef.current) clearTimeout(holdTimerRef.current);
                    if (isHoldingRef.current && recordMode === 'voice' && isRecording) {
                      cancelRecording();
                    }
                    isHoldingRef.current = false;
                  }}
                  onTouchStart={(e) => {
                    e.preventDefault();
                    isHoldingRef.current = false;
                    holdTimerRef.current = setTimeout(() => {
                      isHoldingRef.current = true;
                      if (recordMode === 'voice') startRecording();
                      else setShowVideoRecorder(true);
                    }, 200);
                  }}
                  onTouchEnd={() => {
                    if (holdTimerRef.current) clearTimeout(holdTimerRef.current);
                    if (isHoldingRef.current) {
                      if (recordMode === 'voice') stopRecording();
                    } else {
                      setRecordMode(prev => prev === 'voice' ? 'video' : 'voice');
                    }
                    isHoldingRef.current = false;
                  }}
                  className="w-11 h-11 rounded-full bg-[#242f3d] flex items-center justify-center shrink-0 transition-all touch-none"
                >
                  {recordMode === 'voice' ? (
                    <Mic className="w-5 h-5 text-white/60" />
                  ) : (
                    <Video className="w-5 h-5 text-white/60" />
                  )}
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Video Circle Recorder */}
      {showVideoRecorder && (
        <VideoCircleRecorder
          onRecord={handleVideoRecord}
          onCancel={() => setShowVideoRecorder(false)}
        />
      )}

      {/* Attachment Sheet */}
      <AttachmentSheet
        open={showAttachmentSheet}
        onOpenChange={setShowAttachmentSheet}
        onSelectFile={handleAttachment}
      />


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

    </div>
  );
}
