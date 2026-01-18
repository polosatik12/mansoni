import { useState, useRef, useEffect } from "react";
import { ArrowLeft, Phone, Video, MoreVertical, Send, Mic, Paperclip, Smile, X, Play, Pause } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface Message {
  id: string;
  text?: string;
  voice?: string;
  voiceDuration?: number;
  isOwn: boolean;
  time: string;
  read: boolean;
}

interface Chat {
  id: string;
  name: string;
  avatar: string;
  online: boolean;
  verified?: boolean;
}

interface ChatConversationProps {
  chat: Chat;
  onBack: () => void;
}

const initialMessages: Message[] = [
  {
    id: "1",
    text: "Привет! Как дела с проектом?",
    isOwn: false,
    time: "10:30",
    read: true,
  },
  {
    id: "2",
    text: "Привет! Все отлично, заканчиваю дизайн 🎨",
    isOwn: true,
    time: "10:32",
    read: true,
  },
  {
    id: "3",
    text: "Супер! Когда сможешь показать?",
    isOwn: false,
    time: "10:33",
    read: true,
  },
  {
    id: "4",
    text: "Сегодня вечером скину превью",
    isOwn: true,
    time: "10:35",
    read: true,
  },
];

export function ChatConversation({ chat, onBack }: ChatConversationProps) {
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [inputText, setInputText] = useState("");
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [playingVoice, setPlayingVoice] = useState<string | null>(null);
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

  const sendMessage = () => {
    if (!inputText.trim()) return;
    
    const newMessage: Message = {
      id: Date.now().toString(),
      text: inputText,
      isOwn: true,
      time: new Date().toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit" }),
      read: false,
    };
    
    setMessages((prev) => [...prev, newMessage]);
    setInputText("");
  };

  const startRecording = () => {
    setIsRecording(true);
  };

  const stopRecording = () => {
    if (recordingTime > 0) {
      const newMessage: Message = {
        id: Date.now().toString(),
        voice: "voice_message",
        voiceDuration: recordingTime,
        isOwn: true,
        time: new Date().toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit" }),
        read: false,
      };
      setMessages((prev) => [...prev, newMessage]);
    }
    setIsRecording(false);
  };

  const cancelRecording = () => {
    setIsRecording(false);
  };

  const toggleVoicePlay = (messageId: string) => {
    setPlayingVoice(playingVoice === messageId ? null : messageId);
  };

  return (
    <div className="fixed inset-0 flex flex-col bg-background z-40">
      {/* Header - fixed */}
      <div className="flex-shrink-0 flex items-center gap-3 px-4 py-3 border-b border-border bg-card safe-area-top">
        <Button variant="ghost" size="icon" onClick={onBack} className="shrink-0">
          <ArrowLeft className="w-5 h-5" />
        </Button>
        
        <div className="relative">
          <img
            src={chat.avatar}
            alt={chat.name}
            className="w-10 h-10 rounded-full object-cover"
          />
          {chat.online && (
            <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-card rounded-full" />
          )}
        </div>
        
        <div className="flex-1 min-w-0">
          <h2 className="font-semibold text-foreground truncate">{chat.name}</h2>
          <p className="text-xs text-muted-foreground">
            {chat.online ? "в сети" : "был(а) недавно"}
          </p>
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

      {/* Messages - scrollable */}
      <div className="flex-1 overflow-y-auto p-4 space-y-1 native-scroll">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex ${message.isOwn ? "justify-end" : "justify-start"}`}
          >
            <div
              className={`max-w-[75%] rounded-2xl px-4 py-2 ${
                message.isOwn
                  ? "bg-primary text-primary-foreground rounded-br-md"
                  : "bg-muted text-foreground rounded-bl-md"
              }`}
            >
              {message.voice ? (
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
                            message.isOwn ? "bg-primary-foreground/50" : "bg-foreground/30"
                          }`}
                          style={{ height: `${Math.random() * 16 + 8}px` }}
                        />
                      ))}
                    </div>
                  </div>
                  <span className={`text-xs ${message.isOwn ? "text-primary-foreground/70" : "text-muted-foreground"}`}>
                    {formatTime(message.voiceDuration || 0)}
                  </span>
                </div>
              ) : (
                <p className="text-sm">{message.text}</p>
              )}
              <div className={`flex items-center justify-end gap-1 mt-1 ${
                message.isOwn ? "text-primary-foreground/70" : "text-muted-foreground"
              }`}>
                <span className="text-[10px]">{message.time}</span>
              </div>
            </div>
          </div>
        ))}
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
                onKeyDown={(e) => e.key === "Enter" && sendMessage()}
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
                onClick={sendMessage}
              >
                <Send className="w-5 h-5" />
              </Button>
            ) : (
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
            )}
          </div>
        )}
      </div>
    </div>
  );
}
