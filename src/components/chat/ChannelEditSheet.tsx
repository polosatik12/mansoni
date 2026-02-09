import { useState, useRef } from "react";
import { X, Camera } from "lucide-react";
import { Button } from "@/components/ui/button";
import { GradientAvatar } from "@/components/ui/gradient-avatar";
import { BrandBackground } from "@/components/ui/brand-background";
import { Channel } from "@/hooks/useChannels";
import { useChannelManagement } from "@/hooks/useChannelManagement";
import { toast } from "sonner";

interface ChannelEditSheetProps {
  channel: Channel;
  open: boolean;
  onClose: () => void;
  onSave: (data: Partial<Channel>) => void;
}

export function ChannelEditSheet({ channel, open, onClose, onSave }: ChannelEditSheetProps) {
  const { updateChannel, uploadChannelAvatar } = useChannelManagement();
  const [name, setName] = useState(channel.name);
  const [description, setDescription] = useState(channel.description || "");
  const [avatarUrl, setAvatarUrl] = useState(channel.avatar_url);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!open) return null;

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const url = await uploadChannelAvatar(channel.id, file);
      setAvatarUrl(url);
      toast.success("Фото обновлено");
    } catch {
      toast.error("Не удалось загрузить фото");
    } finally {
      setUploading(false);
    }
  };

  const handleSave = async () => {
    if (!name.trim()) {
      toast.error("Название не может быть пустым");
      return;
    }

    setSaving(true);
    try {
      const data: Partial<Channel> = {
        name: name.trim(),
        description: description.trim() || null,
        avatar_url: avatarUrl,
      };
      await updateChannel(channel.id, data);
      onSave(data);
      toast.success("Канал обновлён");
    } catch {
      toast.error("Не удалось сохранить");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[220] flex flex-col">
      <BrandBackground />

      {/* Header */}
      <div className="flex-shrink-0 safe-area-top relative z-10 backdrop-blur-xl bg-black/20 border-b border-white/10">
        <div className="flex items-center justify-between px-4 py-3">
          <button onClick={onClose} className="text-white/70 hover:text-white">
            <X className="w-6 h-6" />
          </button>
          <h2 className="text-white font-semibold text-base">Редактировать</h2>
          <Button
            onClick={handleSave}
            disabled={saving || !name.trim()}
            size="sm"
            className="bg-[#6ab3f3] hover:bg-[#6ab3f3]/80 text-white rounded-full px-4"
          >
            {saving ? "..." : "Готово"}
          </Button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto relative z-10 px-4 py-6">
        {/* Avatar */}
        <div className="flex flex-col items-center mb-8">
          <div className="relative">
            <GradientAvatar
              name={name}
              seed={channel.id}
              avatarUrl={avatarUrl}
              size="xl"
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              className="absolute bottom-0 right-0 w-9 h-9 rounded-full bg-[#6ab3f3] flex items-center justify-center border-2 border-black/30"
            >
              <Camera className="w-4 h-4 text-white" />
            </button>
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleAvatarUpload}
          />
          {uploading && <p className="text-white/50 text-xs mt-2">Загрузка...</p>}
        </div>

        {/* Name */}
        <div className="mb-4">
          <label className="text-white/60 text-sm mb-1.5 block">Название</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full h-11 px-4 rounded-xl bg-white/10 backdrop-blur-xl border border-white/20 text-white placeholder:text-white/30 outline-none focus:border-[#6ab3f3]/50 transition-colors"
            placeholder="Название канала"
          />
        </div>

        {/* Description */}
        <div className="mb-4">
          <label className="text-white/60 text-sm mb-1.5 block">Описание</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
            className="w-full px-4 py-3 rounded-xl bg-white/10 backdrop-blur-xl border border-white/20 text-white placeholder:text-white/30 outline-none focus:border-[#6ab3f3]/50 transition-colors resize-none"
            placeholder="Описание канала"
          />
        </div>
      </div>
    </div>
  );
}
