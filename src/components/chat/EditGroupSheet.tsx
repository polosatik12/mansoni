import { useState, useRef } from "react";
import { ArrowLeft, Camera, Loader2 } from "lucide-react";
import { GradientAvatar } from "@/components/ui/gradient-avatar";
import { useGroupManagement } from "@/hooks/useGroupManagement";
import { GroupChat } from "@/hooks/useGroupChats";
import { toast } from "sonner";

interface EditGroupSheetProps {
  group: GroupChat;
  open: boolean;
  onClose: () => void;
  onSaved?: (updated: Partial<GroupChat>) => void;
}

export function EditGroupSheet({ group, open, onClose, onSaved }: EditGroupSheetProps) {
  const { updateGroup, uploadGroupAvatar } = useGroupManagement();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [name, setName] = useState(group.name);
  const [description, setDescription] = useState(group.description || "");
  const [avatarUrl, setAvatarUrl] = useState(group.avatar_url);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file
    if (!file.type.startsWith("image/")) {
      toast.error("Выберите изображение");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Файл слишком большой (макс. 5 МБ)");
      return;
    }

    setUploading(true);
    try {
      const url = await uploadGroupAvatar(group.id, file);
      setAvatarUrl(url);
      toast.success("Фото загружено");
    } catch {
      toast.error("Не удалось загрузить фото");
    } finally {
      setUploading(false);
    }
  };

  const handleSave = async () => {
    if (!name.trim()) {
      toast.error("Введите название группы");
      return;
    }

    setSaving(true);
    try {
      const data: Partial<GroupChat> = {
        name: name.trim(),
        description: description.trim() || null,
        avatar_url: avatarUrl,
      };
      await updateGroup(group.id, data);
      toast.success("Группа обновлена");
      onSaved?.(data);
    } catch {
      toast.error("Не удалось сохранить изменения");
    } finally {
      setSaving(false);
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 flex flex-col z-[220]">
      {/* Background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute inset-0 bg-gradient-to-br from-[#0a1628] via-[#0d2035] to-[#071420]" />
        <div
          className="absolute top-0 left-1/4 w-[500px] h-[500px] rounded-full blur-[120px] opacity-60"
          style={{
            background: "radial-gradient(circle, #0066CC 0%, transparent 70%)",
            animation: "float-orb-1 15s ease-in-out infinite",
          }}
        />
      </div>

      {/* Header */}
      <div className="flex-shrink-0 safe-area-top relative z-10 backdrop-blur-xl bg-black/20 border-b border-white/10">
        <div className="flex items-center justify-between px-2 py-2">
          <button
            onClick={onClose}
            className="flex items-center gap-1 px-2 py-1 text-[#6ab3f3] hover:bg-white/5 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            <span className="text-sm">Отмена</span>
          </button>
          <h2 className="font-semibold text-white text-base">Редактировать</h2>
          <button
            onClick={handleSave}
            disabled={saving || !name.trim()}
            className="px-3 py-1 text-[#6ab3f3] hover:bg-white/5 rounded-lg transition-colors disabled:opacity-50 text-sm font-medium"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : "Готово"}
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto relative z-10 px-4 pt-6">
        {/* Avatar upload */}
        <div className="flex flex-col items-center mb-8">
          <div className="relative">
            <GradientAvatar
              name={name || group.name}
              seed={group.id}
              avatarUrl={avatarUrl}
              size="xl"
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              className="absolute bottom-0 right-0 w-9 h-9 rounded-full bg-[#6ab3f3] flex items-center justify-center border-2 border-[#0d2035] shadow-lg"
            >
              {uploading ? (
                <Loader2 className="w-4 h-4 text-white animate-spin" />
              ) : (
                <Camera className="w-4 h-4 text-white" />
              )}
            </button>
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleAvatarChange}
          />
        </div>

        {/* Name field */}
        <div className="mb-4">
          <label className="text-xs text-[#6ab3f3] font-medium uppercase tracking-wider mb-2 block">
            Название
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Название группы"
            maxLength={100}
            className="w-full h-12 px-4 rounded-xl bg-white/5 backdrop-blur-xl border border-white/10 text-white placeholder:text-white/30 outline-none focus:border-[#6ab3f3]/40 transition-colors"
          />
        </div>

        {/* Description field */}
        <div className="mb-4">
          <label className="text-xs text-[#6ab3f3] font-medium uppercase tracking-wider mb-2 block">
            Описание
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Описание группы (необязательно)"
            maxLength={500}
            rows={4}
            className="w-full px-4 py-3 rounded-xl bg-white/5 backdrop-blur-xl border border-white/10 text-white placeholder:text-white/30 outline-none focus:border-[#6ab3f3]/40 transition-colors resize-none"
          />
          <p className="text-xs text-white/30 mt-1 text-right">{description.length}/500</p>
        </div>
      </div>
    </div>
  );
}
