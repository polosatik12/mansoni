import { useState, useRef, useEffect } from "react";
import { ArrowLeft, Phone, Video, MoreVertical, Send, Mic, Paperclip, Smile, X, Play, Pause, Circle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useMessages } from "@/hooks/useChat";
import { useAuth } from "@/hooks/useAuth";
import { format } from "date-fns";
import chatBackground from "@/assets/chat-background.jpg";
import { VideoCircleRecorder } from "./VideoCircleRecorder";
import { VideoCircleMessage } from "./VideoCircleMessage";

interface ChatConversationProps {
  conversationId: string;
  chatName: string;
  chatAvatar: string;
  onBack: () => void;
}

export function ChatConversation({ conversationId, chatName, chatAvatar, onBack }: ChatConversationProps) {
  const { user } = useAuth();
  const { messages, loading, sendMessage } = useMessages(conversationId);
  const [inputText, setInputText] = useState("");
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [playingVoice, setPlayingVoice] = useState<string | null>(null);
  const [showVideoRecorder, setShowVideoRecorder] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const recordingInterval = useRef<NodeJS.Timeout | null>(null);

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
    if (!inputText.trim()) return;
    await sendMessage(inputText);
    setInputText("");
  };

  const startRecording = () => {
    setIsRecording(true);
  };

  const stopRecording = async () => {
    if (recordingTime > 0) {
      // For now, just send a text placeholder for voice messages
      await sendMessage(`🎤 Голосовое сообщение (${formatTime(recordingTime)})`);
    }
    setIsRecording(false);
  };

  const cancelRecording = () => {
    setIsRecording(false);
  };

  const toggleVoicePlay = (messageId: string) => {
    setPlayingVoice(playingVoice === messageId ? null : messageId);
  };

  const handleVideoRecord = async (videoBlob: Blob, duration: number) => {
    // Create a URL for the video (in a real app, upload to storage)
    const videoUrl = URL.createObjectURL(videoBlob);
    const formatDuration = (seconds: number) => {
      const mins = Math.floor(seconds / 60);
      const secs = seconds % 60;
      return `${mins}:${secs.toString().padStart(2, "0")}`;
    };
    // For now, send as placeholder text with video marker
    await sendMessage(`🎬 Видео-кружок (${formatDuration(duration)})`);
    setShowVideoRecorder(false);
  };

  return (
    <div className="fixed inset-0 flex flex-col bg-background z-[60]">
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
          <Button variant="ghost" size="icon">
            <Phone className="w-5 h-5" />
          </Button>
          <Button variant="ghost" size="icon">
            <Video className="w-5 h-5" />
          </Button>
          <Button variant="ghost" size="icon">
            <MoreVertical className="w-5 h-5" />
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
          const isVoice = message.content.startsWith("🎤");
          const isVideoCircle = message.content.startsWith("🎬");

          return (
            <div
              key={message.id}
              className={`flex ${isOwn ? "justify-end" : "justify-start"}`}
            >
              {isVideoCircle ? (
                <div className="flex flex-col items-center gap-1">
                  <div className={`w-36 h-36 rounded-full border-2 flex items-center justify-center ${
                    isOwn ? "border-primary bg-primary/20" : "border-muted-foreground/30 bg-muted"
                  }`}>
                    <div className="text-center">
                      <Circle className={`w-8 h-8 mx-auto mb-1 ${isOwn ? "text-primary" : "text-muted-foreground"}`} />
                      <span className={`text-xs ${isOwn ? "text-primary" : "text-muted-foreground"}`}>
                        {message.content.match(/\(([^)]+)\)/)?.[1] || "0:00"}
                      </span>
                    </div>
                  </div>
                  <span className="text-[10px] text-muted-foreground">{formatMessageTime(message.created_at)}</span>
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
                        onClick={() => toggleVoicePlay(message.id)}
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
                        {message.content.match(/\(([^)]+)\)/)?.[1] || "0:00"}
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

      {/* Input - fixed */}
      <div className="flex-shrink-0 border-t border-border bg-card p-3 safe-area-bottom">
        {isRecording ? (
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={cancelRecording}>
              <X className="w-5 h-5 text-destructive" />
            </Button>
            
            <div className="flex-1 flex items-center gap-3">
              <div className="w-3 h-3 rounded-full bg-destructive animate-pulse" />
              <span className="text-sm text-muted-foreground">
                Запись... {formatTime(recordingTime)}
              </span>
            </div>
            
            <Button
              size="icon"
              className="rounded-full h-12 w-12 bg-primary"
              onClick={stopRecording}
            >
              <Send className="w-5 h-5" />
            </Button>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon">
              <Paperclip className="w-5 h-5" />
            </Button>
            
            <div className="flex-1 relative">
              <Input
                placeholder="Сообщение..."
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSendMessage()}
                className="pr-10 rounded-full bg-muted border-0"
              />
              <Button
                variant="ghost"
                size="icon"
                className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8"
              >
                <Smile className="w-5 h-5" />
              </Button>
            </div>
            
            {inputText.trim() ? (
              <Button
                size="icon"
                className="rounded-full h-10 w-10"
                onClick={handleSendMessage}
              >
                <Send className="w-5 h-5" />
              </Button>
            ) : (
              <>
                <Button
                  size="icon"
                  variant="ghost"
                  className="rounded-full h-10 w-10"
                  onClick={() => setShowVideoRecorder(true)}
                >
                  <Circle className="w-5 h-5" />
                </Button>
                <Button
                  size="icon"
                  variant="ghost"
                  className="rounded-full h-10 w-10"
                  onMouseDown={startRecording}
                  onMouseUp={stopRecording}
                  onMouseLeave={stopRecording}
                  onTouchStart={startRecording}
                  onTouchEnd={stopRecording}
                >
                  <Mic className="w-5 h-5" />
                </Button>
              </>
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
    </div>
  );
}
