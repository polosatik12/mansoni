import { useState } from "react";
import { Users, Megaphone, X, Camera } from "lucide-react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useCreateChannel } from "@/hooks/useChannels";
import { toast } from "sonner";
import glassBackground from "@/assets/glass-background.png";

interface CreateChatSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onChannelCreated?: (channelId: string) => void;
}

type CreateMode = "select" | "channel" | "group";

export function CreateChatSheet({ open, onOpenChange, onChannelCreated }: CreateChatSheetProps) {
  const [mode, setMode] = useState<CreateMode>("select");
  const [channelName, setChannelName] = useState("");
  const [channelDescription, setChannelDescription] = useState("");
  const [loading, setLoading] = useState(false);
  
  const { createChannel } = useCreateChannel();

  const handleClose = () => {
    setMode("select");
    setChannelName("");
    setChannelDescription("");
    onOpenChange(false);
  };

  const handleCreateChannel = async () => {
    if (!channelName.trim()) {
      toast.error("Введите название канала");
      return;
    }

    setLoading(true);
    try {
      const channelId = await createChannel(channelName.trim(), channelDescription.trim());
      if (channelId) {
        toast.success("Канал создан!");
        onChannelCreated?.(channelId);
        handleClose();
      } else {
        toast.error("Не удалось создать канал");
      }
    } catch (error) {
      toast.error("Ошибка при создании канала");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Sheet open={open} onOpenChange={handleClose}>
      <SheetContent 
        side="bottom" 
        className="h-auto max-h-[80vh] rounded-t-3xl border-t border-white/10 shadow-2xl overflow-hidden p-0"
        overlayClassName="bg-black/40"
      >
        {/* Glass background */}
        <div 
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: `url(${glassBackground})` }}
        />
        <div className="absolute inset-0 bg-black/50 backdrop-blur-xl" />
        
        {/* Content */}
        <div className="relative z-10 p-6">
          <SheetHeader className="pb-4">
            <SheetTitle className="text-white flex items-center justify-between">
              {mode === "select" && "Создать"}
              {mode === "channel" && (
                <div className="flex items-center gap-2">
                  <button onClick={() => setMode("select")} className="text-white/60 hover:text-white">
                    ←
                  </button>
                  Новый канал
                </div>
              )}
              {mode === "group" && (
                <div className="flex items-center gap-2">
                  <button onClick={() => setMode("select")} className="text-white/60 hover:text-white">
                    ←
                  </button>
                  Новая группа
                </div>
              )}
            </SheetTitle>
          </SheetHeader>

          {mode === "select" && (
            <div className="space-y-2">
              <button
                onClick={() => setMode("channel")}
                className="w-full flex items-center gap-4 p-4 rounded-2xl bg-white/10 hover:bg-white/15 transition-colors text-left"
              >
                <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center">
                  <Megaphone className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <div className="font-medium text-white">Новый канал</div>
                  <div className="text-sm text-white/60">Создайте канал для публикаций</div>
                </div>
              </button>
              
              <button
                onClick={() => setMode("group")}
                className="w-full flex items-center gap-4 p-4 rounded-2xl bg-white/10 hover:bg-white/15 transition-colors text-left"
              >
                <div className="w-12 h-12 rounded-full bg-blue-500/20 flex items-center justify-center">
                  <Users className="w-6 h-6 text-blue-400" />
                </div>
                <div>
                  <div className="font-medium text-white">Новая группа</div>
                  <div className="text-sm text-white/60">Создайте групповой чат</div>
                </div>
              </button>
            </div>
          )}

          {mode === "channel" && (
            <div className="space-y-4">
              {/* Avatar placeholder */}
              <div className="flex justify-center">
                <button className="w-20 h-20 rounded-full bg-white/10 border-2 border-dashed border-white/30 flex items-center justify-center hover:bg-white/15 transition-colors">
                  <Camera className="w-8 h-8 text-white/60" />
                </button>
              </div>
              
              <div className="space-y-3">
                <Input
                  placeholder="Название канала"
                  value={channelName}
                  onChange={(e) => setChannelName(e.target.value)}
                  className="h-12 bg-white/10 border-white/20 text-white placeholder:text-white/50 rounded-xl"
                />
                <Textarea
                  placeholder="Описание (необязательно)"
                  value={channelDescription}
                  onChange={(e) => setChannelDescription(e.target.value)}
                  className="bg-white/10 border-white/20 text-white placeholder:text-white/50 rounded-xl resize-none"
                  rows={3}
                />
              </div>
              
              <Button 
                onClick={handleCreateChannel}
                disabled={loading || !channelName.trim()}
                className="w-full h-12 rounded-xl"
              >
                {loading ? "Создание..." : "Создать канал"}
              </Button>
            </div>
          )}

          {mode === "group" && (
            <div className="space-y-4">
              <div className="flex justify-center">
                <button className="w-20 h-20 rounded-full bg-white/10 border-2 border-dashed border-white/30 flex items-center justify-center hover:bg-white/15 transition-colors">
                  <Camera className="w-8 h-8 text-white/60" />
                </button>
              </div>
              
              <div className="space-y-3">
                <Input
                  placeholder="Название группы"
                  className="h-12 bg-white/10 border-white/20 text-white placeholder:text-white/50 rounded-xl"
                />
                <p className="text-center text-white/60 text-sm">
                  Функция групповых чатов скоро будет доступна
                </p>
              </div>
              
              <Button disabled className="w-full h-12 rounded-xl opacity-50">
                Скоро
              </Button>
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
