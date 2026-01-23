import { useState, useRef } from "react";
import { X, Image, MapPin, Users, Smile, MoreHorizontal, ChevronDown, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/hooks/useAuth";
import { usePostActions } from "@/hooks/usePosts";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface CreatePostSheetProps {
  isOpen: boolean;
  onClose: () => void;
}

export function CreatePostSheet({ isOpen, onClose }: CreatePostSheetProps) {
  const { user } = useAuth();
  const { createPost } = usePostActions();
  const [text, setText] = useState("");
  const [selectedImages, setSelectedImages] = useState<{ file: File; preview: string }[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleAddPhoto = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    const newImages: { file: File; preview: string }[] = [];
    
    for (let i = 0; i < files.length && selectedImages.length + newImages.length < 10; i++) {
      const file = files[i];
      
      // Validate file type
      if (!file.type.startsWith("image/")) {
        toast.error(`${file.name} не является изображением`);
        continue;
      }
      
      // Validate file size (max 10MB)
      if (file.size > 10 * 1024 * 1024) {
        toast.error(`${file.name} слишком большой (макс. 10MB)`);
        continue;
      }

      const preview = URL.createObjectURL(file);
      newImages.push({ file, preview });
    }

    setSelectedImages([...selectedImages, ...newImages]);
    
    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleRemoveImage = (index: number) => {
    URL.revokeObjectURL(selectedImages[index].preview);
    setSelectedImages(selectedImages.filter((_, i) => i !== index));
  };

  const uploadImages = async (): Promise<string[]> => {
    if (!user || selectedImages.length === 0) return [];

    const uploadedUrls: string[] = [];

    for (const { file } of selectedImages) {
      const fileExt = file.name.split(".").pop();
      const fileName = `${user.id}/${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from("post-media")
        .upload(fileName, file);

      if (uploadError) {
        console.error("Upload error:", uploadError);
        throw new Error(`Не удалось загрузить ${file.name}`);
      }

      const { data: publicUrl } = supabase.storage
        .from("post-media")
        .getPublicUrl(fileName);

      uploadedUrls.push(publicUrl.publicUrl);
    }

    return uploadedUrls;
  };

  const handlePublish = async () => {
    if (!user) {
      toast.error("Войдите, чтобы создать пост");
      return;
    }

    if (!text.trim() && selectedImages.length === 0) {
      toast.error("Добавьте текст или изображения");
      return;
    }

    setIsUploading(true);

    try {
      // Upload images first
      const mediaUrls = await uploadImages();

      // Create post
      const { error } = await createPost(text.trim(), mediaUrls);

      if (error) {
        throw new Error(error);
      }

      toast.success("Публикация создана!");
      
      // Cleanup
      selectedImages.forEach(({ preview }) => URL.revokeObjectURL(preview));
      setText("");
      setSelectedImages([]);
      onClose();
    } catch (error: any) {
      toast.error("Ошибка публикации", { description: error.message });
    } finally {
      setIsUploading(false);
    }
  };

  const handleClose = () => {
    // Cleanup previews
    selectedImages.forEach(({ preview }) => URL.revokeObjectURL(preview));
    setText("");
    setSelectedImages([]);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[70] flex flex-col bg-background">
      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={handleFileChange}
      />

      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border safe-area-top">
        <Button variant="ghost" size="icon" onClick={handleClose} disabled={isUploading}>
          <X className="w-6 h-6" />
        </Button>
        <h1 className="font-semibold text-lg">Новая публикация</h1>
        <Button 
          size="sm" 
          className="rounded-full px-5 font-semibold"
          disabled={(!text.trim() && selectedImages.length === 0) || isUploading}
          onClick={handlePublish}
        >
          {isUploading ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            "Опубликовать"
          )}
        </Button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto native-scroll">
        {/* Author */}
        <div className="flex items-center gap-3 px-4 py-3">
          <img
            src={`https://i.pravatar.cc/150?u=${user?.id}`}
            alt="Your avatar"
            className="w-10 h-10 rounded-full object-cover"
          />
          <div>
            <p className="font-semibold text-sm">{user?.email?.split("@")[0] || "user"}</p>
            <button className="flex items-center gap-1 text-xs text-muted-foreground">
              <span>Все</span>
              <ChevronDown className="w-3 h-3" />
            </button>
          </div>
        </div>

        {/* Text Input */}
        <div className="px-4">
          <Textarea
            placeholder="О чём вы думаете?"
            value={text}
            onChange={(e) => setText(e.target.value)}
            className="min-h-[120px] border-0 resize-none text-base p-0 focus-visible:ring-0 placeholder:text-muted-foreground"
            disabled={isUploading}
          />
        </div>

        {/* Selected Images */}
        {selectedImages.length > 0 && (
          <div className="px-4 py-3">
            <div className="grid grid-cols-2 gap-2">
              {selectedImages.map((image, index) => (
                <div key={index} className="relative aspect-square rounded-xl overflow-hidden">
                  <img
                    src={image.preview}
                    alt={`Selected ${index + 1}`}
                    className="w-full h-full object-cover"
                  />
                  <button
                    onClick={() => handleRemoveImage(index)}
                    disabled={isUploading}
                    className="absolute top-2 right-2 w-7 h-7 bg-black/60 rounded-full flex items-center justify-center disabled:opacity-50"
                  >
                    <X className="w-4 h-4 text-white" />
                  </button>
                </div>
              ))}
            </div>
            <p className="text-xs text-muted-foreground mt-2 text-center">
              {selectedImages.length}/10 изображений
            </p>
          </div>
        )}

        {/* Add to post */}
        <div className="px-4 py-3 mt-auto">
          <div className="border border-border rounded-xl p-3">
            <div className="flex items-center justify-between mb-3">
              <span className="font-medium text-sm">Добавить в публикацию</span>
            </div>
            <div className="flex items-center gap-4">
              <button 
                onClick={handleAddPhoto}
                disabled={isUploading || selectedImages.length >= 10}
                className="w-10 h-10 rounded-full bg-green-500/10 flex items-center justify-center disabled:opacity-50"
              >
                <Image className="w-5 h-5 text-green-500" />
              </button>
              <button className="w-10 h-10 rounded-full bg-blue-500/10 flex items-center justify-center">
                <Users className="w-5 h-5 text-blue-500" />
              </button>
              <button className="w-10 h-10 rounded-full bg-yellow-500/10 flex items-center justify-center">
                <Smile className="w-5 h-5 text-yellow-500" />
              </button>
              <button className="w-10 h-10 rounded-full bg-red-500/10 flex items-center justify-center">
                <MapPin className="w-5 h-5 text-red-500" />
              </button>
              <button className="w-10 h-10 rounded-full bg-muted flex items-center justify-center">
                <MoreHorizontal className="w-5 h-5 text-muted-foreground" />
              </button>
            </div>
          </div>
        </div>

        {/* Options */}
        <div className="px-4 pb-6 space-y-1">
          <button className="w-full flex items-center justify-between py-3 border-b border-border">
            <span className="text-sm">Добавить музыку</span>
            <ChevronDown className="w-5 h-5 text-muted-foreground -rotate-90" />
          </button>
          <button className="w-full flex items-center justify-between py-3 border-b border-border">
            <span className="text-sm">Настройки аудитории</span>
            <ChevronDown className="w-5 h-5 text-muted-foreground -rotate-90" />
          </button>
          <button className="w-full flex items-center justify-between py-3 border-b border-border">
            <span className="text-sm">Расширенные настройки</span>
            <ChevronDown className="w-5 h-5 text-muted-foreground -rotate-90" />
          </button>
        </div>
      </div>
    </div>
  );
}
