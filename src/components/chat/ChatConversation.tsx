import { useState, useRef, useEffect } from "react";
import { ArrowLeft, Phone, Video, Send, Mic, Paperclip, Clock, X, Play, Pause } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useMessages } from "@/hooks/useChat";
import { useAuth } from "@/hooks/useAuth";
import { useCalls } from "@/hooks/useCalls";
import { useChatOpen } from "@/contexts/ChatOpenContext";
import { format } from "date-fns";
import { toast } from "sonner";
import chatBackground from "@/assets/chat-background.jpg";
import { VideoCircleRecorder } from "./VideoCircleRecorder";
import { VideoCircleMessage } from "./VideoCircleMessage";
import { AttachmentSheet } from "./AttachmentSheet";
import { ImageViewer } from "./ImageViewer";
import { VideoPlayer, FullscreenVideoPlayer } from "./VideoPlayer";
import { IncomingCallSheet } from "./IncomingCallSheet";
import { CallScreen } from "./CallScreen";

interface ChatConversationProps {
  conversationId: string;
  chatName: string;
  chatAvatar: string;
  otherUserId: string;
  onBack: () => void;
}

export function ChatConversation({ conversationId, chatName, chatAvatar, otherUserId, onBack }: ChatConversationProps) {
  const { user } = useAuth();
  const { messages, loading, sendMessage, sendMediaMessage } = useMessages(conversationId);
  const { activeCall, incomingCall, startCall, acceptCall, declineCall, endCall } = useCalls();
  const { setIsChatOpen } = useChatOpen();
  
  const [inputText, setInputText] = useState("");
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [playingVoice, setPlayingVoice] = useState<string | null>(null);
  const [showVideoRecorder, setShowVideoRecorder] = useState(false);
  const [showAttachmentSheet, setShowAttachmentSheet] = useState(false);
  const [viewingImage, setViewingImage] = useState<string | null>(null);
  const [viewingVideo, setViewingVideo] = useState<string | null>(null);
  const [isCallInitiator, setIsCallInitiator] = useState(false);
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
    setIsCallInitiator(true);
    await startCall(conversationId, otherUserId, "audio");
  };

  const handleStartVideoCall = async () => {
    setIsCallInitiator(true);
    await startCall(conversationId, otherUserId, "video");
  };

  const handleAcceptCall = async () => {
    if (incomingCall) {
      setIsCallInitiator(false);
      await acceptCall(incomingCall.id);
    }
  };

  const handleDeclineCall = async () => {
    if (incomingCall) {
      await declineCall(incomingCall.id);
    }
  };

  const handleEndCall = async () => {
    if (activeCall) {
      await endCall(activeCall.id);
    }
  };

  return (
    <div className="fixed inset-0 flex flex-col bg-background z-[200]">
      {/* Header - fixed */}
      <div className="flex-shrink-0 flex items-center gap-3 px-4 py-3 border-b border-border bg-card safe-area-top">
        <Button variant="ghost" size="icon" onClick={onBack} className="shrink-0">
          <ArrowLeft className="w-5 h-5" />
        </Button>
        
        <div className="relative">
          <img
            src={chatAvatar}
            alt={chatName}
            className="w-10 h-10 rounded-full object-cover bg-muted"
          />
        </div>
        
        <div className="flex-1 min-w-0">
          <h2 className="font-semibold text-foreground truncate">{chatName}</h2>
          <p className="text-xs text-muted-foreground">был(а) недавно</p>
        </div>
        
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="icon" onClick={handleStartAudioCall}>
            <Phone className="w-5 h-5" />
          </Button>
          <Button variant="ghost" size="icon" onClick={handleStartVideoCall}>
            <Video className="w-5 h-5" />
          </Button>
        </div>
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

        {messages.map((message) => {
          const isOwn = message.sender_id === user?.id;
          const isVoice = message.media_type === 'voice';
          const isVideoCircle = message.media_type === 'video_circle';
          const isImage = message.media_type === 'image';
          const isVideo = message.media_type === 'video';

          return (
            <div
              key={message.id}
              className={`flex ${isOwn ? "justify-end" : "justify-start"}`}
            >
              {isVideoCircle && message.media_url ? (
                <div className="flex flex-col items-center gap-1">
                  <VideoCircleMessage
                    videoUrl={message.media_url}
                    duration={String(message.duration_seconds || 0)}
                    isOwn={isOwn}
                  />
                  <span className="text-[10px] text-muted-foreground">{formatMessageTime(message.created_at)}</span>
                </div>
              ) : isImage && message.media_url ? (
                <div 
                  className={`max-w-[75%] rounded-2xl overflow-hidden cursor-pointer ${
                    isOwn ? "rounded-br-md" : "rounded-bl-md"
                  }`}
                  onClick={() => setViewingImage(message.media_url!)}
                >
                  <img 
                    src={message.media_url} 
                    alt="Изображение" 
                    className="max-w-full h-auto"
                  />
                  <div className={`px-3 py-1 ${isOwn ? "bg-primary" : "bg-muted"}`}>
                    <span className={`text-[10px] ${isOwn ? "text-primary-foreground/70" : "text-muted-foreground"}`}>
                      {formatMessageTime(message.created_at)}
                    </span>
                  </div>
                </div>
              ) : isVideo && message.media_url ? (
                <div className="flex flex-col gap-1">
                  <VideoPlayer
                    src={message.media_url}
                    isOwn={isOwn}
                    onFullscreen={() => setViewingVideo(message.media_url!)}
                  />
                  <span className={`text-[10px] ${isOwn ? "text-right" : "text-left"} text-muted-foreground`}>
                    {formatMessageTime(message.created_at)}
                  </span>
                </div>
              ) : (
                <div
                  className={`max-w-[75%] rounded-2xl px-4 py-2 ${
                    isOwn
                      ? "bg-primary text-primary-foreground rounded-br-md"
                      : "bg-muted text-foreground rounded-bl-md"
                  }`}
                >
                  {isVoice ? (
                    <div className="flex items-center gap-3">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 shrink-0"
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
                              className={`w-1 rounded-full ${
                                isOwn ? "bg-primary-foreground/50" : "bg-foreground/30"
                              }`}
                              style={{ height: `${Math.random() * 16 + 8}px` }}
                            />
                          ))}
                        </div>
                      </div>
                      <span className={`text-xs ${isOwn ? "text-primary-foreground/70" : "text-muted-foreground"}`}>
                        {message.duration_seconds ? formatTime(message.duration_seconds) : "0:00"}
                      </span>
                    </div>
                  ) : (
                    <p className="text-sm">{message.content}</p>
                  )}
                  <div className={`flex items-center justify-end gap-1 mt-1 ${
                    isOwn ? "text-primary-foreground/70" : "text-muted-foreground"
                  }`}>
                    <span className="text-[10px]">{formatMessageTime(message.created_at)}</span>
                  </div>
                </div>
              )}
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>

      {/* Input - Telegram style */}
      <div className="flex-shrink-0 p-2 safe-area-bottom">
        {isRecording ? (
          <div className="flex items-center gap-2 px-1">
            <button 
              onClick={cancelRecording}
              className="w-[42px] h-[42px] rounded-full border border-white/20 bg-black/40 backdrop-blur-md flex items-center justify-center shrink-0"
            >
              <X className="w-5 h-5 text-white/70" />
            </button>
            
            <div className="flex-1 flex items-center gap-3 h-[42px] px-4 rounded-full border border-white/20 bg-black/40 backdrop-blur-md">
              <div className="w-2.5 h-2.5 rounded-full bg-red-500 animate-pulse" />
              <span className="text-sm text-white/70">
                Запись... {formatTime(recordingTime)}
              </span>
            </div>
            
            <button
              onClick={stopRecording}
              className="w-[42px] h-[42px] rounded-full bg-primary flex items-center justify-center shrink-0"
            >
              <Send className="w-5 h-5 text-primary-foreground" />
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            {/* Attachment button - circular with border */}
            <button 
              onClick={() => setShowAttachmentSheet(true)}
              className="w-[42px] h-[42px] rounded-full border border-white/20 bg-black/40 backdrop-blur-md flex items-center justify-center shrink-0"
            >
              <Paperclip className="w-5 h-5 text-white/70" />
            </button>
            
            {/* Input field - pill shaped with transparency */}
            <div className="flex-1 relative">
              <input
                type="text"
                placeholder="Сообщение"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSendMessage()}
                className="w-full h-[42px] px-4 pr-12 rounded-full border border-white/20 bg-black/40 backdrop-blur-md text-white placeholder:text-white/40 outline-none focus:border-white/30 transition-colors"
              />
              {/* Clock icon inside input on the right */}
              <div className="absolute right-3 top-1/2 -translate-y-1/2">
                <button className="p-1">
                  <Clock className="w-5 h-5 text-white/50" />
                </button>
              </div>
            </div>
            
            {/* Send or toggleable Mic/Video button */}
            {inputText.trim() ? (
              <button
                onClick={handleSendMessage}
                className="w-[42px] h-[42px] rounded-full bg-primary flex items-center justify-center shrink-0"
              >
                <Send className="w-5 h-5 text-primary-foreground" />
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
                className="w-[42px] h-[42px] rounded-full border border-white/20 bg-black/40 backdrop-blur-md flex items-center justify-center shrink-0 transition-all touch-none"
              >
                {recordMode === 'voice' ? (
                  <Mic className="w-5 h-5 text-white/70" />
                ) : (
                  <Video className="w-5 h-5 text-white/70" />
                )}
              </button>
            )}
          </div>
        )}
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

      {/* Incoming Call */}
      {incomingCall && (
        <IncomingCallSheet
          call={incomingCall}
          onAccept={handleAcceptCall}
          onDecline={handleDeclineCall}
        />
      )}

      {/* Active Call - show for calling, ringing, and active statuses */}
      {activeCall && ["calling", "ringing", "active"].includes(activeCall.status) && (
        <CallScreen
          call={activeCall}
          isInitiator={isCallInitiator}
          onEnd={handleEndCall}
        />
      )}
    </div>
  );
}
