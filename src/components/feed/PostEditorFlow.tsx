import { useState, useRef, useEffect } from "react";
import { X, ChevronLeft, ChevronRight, Music, Type, Layers, Sparkles, SlidersHorizontal, Users, MapPin, MessageSquare, HelpCircle, Eye, ImagePlus, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { BrandBackground } from "@/components/ui/brand-background";
import { Switch } from "@/components/ui/switch";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { useChatOpen } from "@/contexts/ChatOpenContext";
import { useAuth } from "@/hooks/useAuth";
import { usePostActions } from "@/hooks/usePosts";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { SimpleMediaEditor } from "@/components/editor";

interface PostEditorFlowProps {
  isOpen: boolean;
  onClose: () => void;
}

// Mock gallery images (fallback when no device images)
const mockGalleryImages = [
  { id: "1", src: "https://images.unsplash.com/photo-1461749280684-dccba630e2f6?w=300&q=80", isVideo: true, views: 175 },
  { id: "2", src: "https://images.unsplash.com/photo-1498050108023-c5249f4df085?w=300&q=80" },
  { id: "3", src: "https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=300&q=80" },
  { id: "4", src: "https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=300&q=80" },
  { id: "5", src: "https://images.unsplash.com/photo-1542831371-29b0f74f9713?w=300&q=80" },
  { id: "6", src: "https://images.unsplash.com/photo-1504639725590-34d0984388bd?w=300&q=80" },
  { id: "7", src: "https://images.unsplash.com/photo-1512453979798-5ea266f8880c?w=300&q=80" },
  { id: "8", src: "https://images.unsplash.com/photo-1469474968028-56623f02e42e?w=300&q=80", isVideo: true, views: 89 },
  { id: "9", src: "https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=300&q=80" },
];

const editorTools = [
  { id: "audio", label: "Аудио", icon: Music },
  { id: "text", label: "Текст", icon: Type },
  { id: "overlay", label: "Оверлей", icon: Layers },
  { id: "filter", label: "Фильтр", icon: Sparkles },
  { id: "edit", label: "Редактировать", icon: SlidersHorizontal },
];

const suggestedTracks = [
  { id: "1", title: "MONEY ON THE...", artist: "Artist", cover: "https://i.pravatar.cc/40?img=1" },
  { id: "2", title: "Old Vibes", artist: "Artist", cover: "https://i.pravatar.cc/40?img=2" },
  { id: "3", title: "Dreams", artist: "Artist", cover: "https://i.pravatar.cc/40?img=3" },
];

type Step = "gallery" | "editor" | "details";
type ContentType = "post" | "story" | "video";

export function PostEditorFlow({ isOpen, onClose }: PostEditorFlowProps) {
  const { user } = useAuth();
  const { createPost } = usePostActions();
  const { setIsCreatingContent } = useChatOpen();
  const [step, setStep] = useState<Step>("gallery");
  const [contentType, setContentType] = useState<ContentType>("post");
  const [selectedImages, setSelectedImages] = useState<string[]>([]);
  const [caption, setCaption] = useState("");
  const [aiLabel, setAiLabel] = useState(false);
  const [deviceImages, setDeviceImages] = useState<{ id: string; src: string; file?: File }[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [showMediaEditor, setShowMediaEditor] = useState(false);
  const [editorFile, setEditorFile] = useState<File | null>(null);
  const [activeEditorTool, setActiveEditorTool] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Hide bottom nav when creating content
  useEffect(() => {
    setIsCreatingContent(isOpen);
    return () => setIsCreatingContent(false);
  }, [isOpen, setIsCreatingContent]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const newImages = files
      .filter(f => f.type.startsWith("image/"))
      .map((file, index) => ({
        id: `device-${Date.now()}-${index}`,
        src: URL.createObjectURL(file),
        file,
      }));
    setDeviceImages(prev => [...newImages, ...prev]);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const allImages = deviceImages.length > 0 
    ? deviceImages 
    : mockGalleryImages;

  const handleSelectImage = (src: string) => {
    if (selectedImages.includes(src)) {
      setSelectedImages(selectedImages.filter(s => s !== src));
    } else {
      setSelectedImages([...selectedImages, src]);
    }
  };

  const handleNext = () => {
    if (step === "gallery" && selectedImages.length > 0) {
      setStep("editor");
    } else if (step === "editor") {
      setStep("details");
    }
  };

  const handleBack = () => {
    if (step === "editor") {
      setStep("gallery");
    } else if (step === "details") {
      setStep("editor");
    }
  };

  const handlePublish = async () => {
    if (!user) {
      toast.error("Войдите, чтобы создать пост");
      return;
    }

    if (selectedImages.length === 0 && !caption.trim()) {
      toast.error("Добавьте фото или текст");
      return;
    }

    setIsUploading(true);

    try {
      // Upload selected images
      const mediaUrls: string[] = [];
      for (const imgSrc of selectedImages) {
        const deviceImg = deviceImages.find(d => d.src === imgSrc);
        let fileToUpload: File | Blob | null = null;

        if (deviceImg?.file) {
          fileToUpload = deviceImg.file;
        } else {
          // Fetch external/mock image as blob
          try {
            const response = await fetch(imgSrc);
            const blob = await response.blob();
            fileToUpload = blob;
          } catch {
            console.warn("Could not fetch image:", imgSrc);
            continue;
          }
        }

        if (fileToUpload) {
          const ext = deviceImg?.file?.name?.split(".").pop() || "jpg";
          const fileName = `${user.id}/${Date.now()}-${Math.random().toString(36).substring(7)}.${ext}`;
          const { error: uploadError } = await supabase.storage
            .from("post-media")
            .upload(fileName, fileToUpload);
          if (uploadError) throw new Error(`Не удалось загрузить файл`);
          const { data: publicUrl } = supabase.storage
            .from("post-media")
            .getPublicUrl(fileName);
          mediaUrls.push(publicUrl.publicUrl);
        }
      }

      const { error } = await createPost(caption.trim(), mediaUrls);
      if (error) throw new Error(error);

      toast.success("Публикация создана!");
      setStep("gallery");
      setSelectedImages([]);
      setCaption("");
      deviceImages.forEach(img => URL.revokeObjectURL(img.src));
      setDeviceImages([]);
      onClose();
    } catch (error: any) {
      toast.error("Ошибка публикации", { description: error.message });
    } finally {
      setIsUploading(false);
    }
  };

  const handleClose = () => {
    setStep("gallery");
    setSelectedImages([]);
    setCaption("");
    // Clean up object URLs
    deviceImages.forEach(img => URL.revokeObjectURL(img.src));
    setDeviceImages([]);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[70] flex flex-col">
      <BrandBackground />
      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*,video/*"
        multiple
        className="hidden"
        onChange={handleFileSelect}
      />

      {/* Step 1: Gallery */}
      {step === "gallery" && (
        <>
          {/* Header */}
          <div className="relative z-10 flex items-center justify-between px-4 py-3 border-b border-white/10 bg-black/20 backdrop-blur-xl safe-area-top">
            <Button variant="ghost" size="icon" onClick={handleClose} className="text-white hover:bg-white/10">
              <X className="w-6 h-6" />
            </Button>
            <h1 className="font-semibold text-lg text-white">Новая публикация</h1>
            <Button 
              variant="link" 
              className="text-primary font-semibold px-0"
              disabled={selectedImages.length === 0}
              onClick={handleNext}
            >
              Далее
            </Button>
          </div>

          {/* Preview */}
          <div className="aspect-square relative overflow-hidden">
            {selectedImages.length > 0 ? (
              <>
                <div 
                  className="absolute inset-0 scale-150 blur-3xl opacity-50"
                  style={{ 
                    backgroundImage: `url(${selectedImages[0]})`,
                    backgroundSize: 'cover',
                    backgroundPosition: 'center'
                  }}
                />
                <div className="absolute inset-0 bg-black/20" />
                <img 
                  src={selectedImages[0]} 
                  alt="Selected" 
                  className="relative w-full h-full object-contain"
                />
              </>
            ) : (
              <div className="w-full h-full bg-white/5 flex items-center justify-center text-white/40">
                Выберите фото
              </div>
            )}
          </div>

          {/* Gallery Header */}
          <div className="relative z-10 flex items-center justify-between px-4 py-3">
            <button className="flex items-center gap-1 font-semibold text-white">
              Недавние
              <ChevronRight className="w-5 h-5" />
            </button>
            <button 
              onClick={() => fileInputRef.current?.click()}
              className="text-primary text-sm font-semibold"
            >
              Выбрать из галереи
            </button>
          </div>

          {/* Gallery Grid */}
          <div className="relative z-10 flex-1 overflow-y-auto">
            <div className="grid grid-cols-4 gap-[2px]">
              <button 
                className="aspect-square bg-white/5 flex flex-col items-center justify-center gap-1"
                onClick={() => fileInputRef.current?.click()}
              >
                <ImagePlus className="w-6 h-6 text-white/50" />
                <span className="text-[10px] text-white/50">Галерея</span>
              </button>
              
              {allImages.map((img) => (
                <button
                  key={img.id}
                  onClick={() => handleSelectImage(img.src)}
                  className="aspect-square relative"
                >
                  <img 
                    src={img.src} 
                    alt="" 
                    className="w-full h-full object-cover"
                  />
                  {'isVideo' in img && (img as { isVideo?: boolean }).isVideo && (
                    <div className="absolute bottom-1 left-1 flex items-center gap-1">
                      <Eye className="w-3 h-3 text-white" />
                      <span className="text-white text-xs">
                        {'views' in img ? String((img as { views?: number }).views) : ''}
                      </span>
                    </div>
                  )}
                  {selectedImages.includes(img.src) && (
                    <div className="absolute inset-0 bg-primary/30 flex items-center justify-center">
                      <div className="w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-bold">
                        {selectedImages.indexOf(img.src) + 1}
                      </div>
                    </div>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Content Type Tabs */}
          <div className="relative z-10 border-t border-white/10 bg-black/20 backdrop-blur-xl safe-area-bottom">
            <div className="flex justify-center gap-8 py-4">
              {[
                { id: "post", label: "ПУБЛИКАЦИЯ" },
                { id: "story", label: "ИСТОРИЯ" },
                { id: "video", label: "ВИДЕО" },
              ].map((type) => (
                <button
                  key={type.id}
                  onClick={() => setContentType(type.id as ContentType)}
                  className={cn(
                    "text-sm font-semibold transition-colors",
                    contentType === type.id ? "text-white" : "text-white/40"
                  )}
                >
                  {type.label}
                </button>
              ))}
            </div>
          </div>
        </>
      )}

      {/* Step 2: Editor */}
      {step === "editor" && (
        <>
          {/* Full Screen with Blurred Background */}
          <div className="flex-1 relative overflow-hidden">
            {/* Blurred Background */}
            <div 
              className="absolute inset-0 scale-150 blur-3xl opacity-60"
              style={{ 
                backgroundImage: `url(${selectedImages[0]})`,
                backgroundSize: 'cover',
                backgroundPosition: 'center'
              }}
            />
            
            {/* Close Button */}
            <button 
              className="absolute top-4 left-4 w-10 h-10 bg-black/30 backdrop-blur-sm text-white rounded-full flex items-center justify-center z-10 safe-area-top"
              onClick={handleBack}
            >
              <X className="w-6 h-6" strokeWidth={1.5} />
            </button>

            {/* Image */}
            <div className="absolute inset-0 flex items-center justify-center p-4">
              <img 
                src={selectedImages[0]} 
                alt="Edit" 
                className="max-w-full max-h-full object-contain rounded-2xl shadow-2xl"
              />
            </div>
          </div>

          {/* Editor Tools */}
          <div className="relative z-10 bg-black/20 backdrop-blur-xl border-t border-white/10 safe-area-bottom">
            <div className="flex justify-around py-4">
              {editorTools.map((tool) => {
                const Icon = tool.icon;
                return (
                  <button 
                    key={tool.id} 
                    className={cn(
                      "flex flex-col items-center gap-1.5 transition-all",
                      activeEditorTool === tool.id && "scale-105"
                    )}
                    onClick={async () => {
                      setActiveEditorTool(tool.id);
                      if (tool.id === "filter" || tool.id === "edit") {
                        // Open SimpleMediaEditor for filter/edit
                        const imgSrc = selectedImages[0];
                        const deviceImg = deviceImages.find(d => d.src === imgSrc);
                        if (deviceImg?.file) {
                          setEditorFile(deviceImg.file);
                        } else if (imgSrc) {
                          try {
                            const response = await fetch(imgSrc);
                            const blob = await response.blob();
                            setEditorFile(new File([blob], `edit-${Date.now()}.jpg`, { type: blob.type }));
                          } catch {
                            toast.error("Не удалось загрузить изображение");
                            return;
                          }
                        }
                        setShowMediaEditor(true);
                      } else {
                        toast.info(`${tool.label} — скоро будет доступно`);
                      }
                    }}
                  >
                    <div className={cn(
                      "w-12 h-12 rounded-2xl flex items-center justify-center transition-colors",
                      activeEditorTool === tool.id ? "bg-primary/30 ring-1 ring-primary/50" : "bg-white/10"
                    )}>
                      <Icon className="w-5 h-5 text-white" />
                    </div>
                    <span className={cn(
                      "text-xs transition-colors",
                      activeEditorTool === tool.id ? "text-white" : "text-white/70"
                    )}>{tool.label}</span>
                  </button>
                );
              })}
            </div>
            
            <div className="px-4 pb-4">
              <Button 
                className="w-full rounded-full h-12 font-semibold gap-2"
                onClick={handleNext}
              >
                Далее
                <ChevronRight className="w-5 h-5" />
              </Button>
            </div>
          </div>
        </>
      )}

      {/* Step 3: Details */}
      {step === "details" && (
        <>
          {/* Header */}
          <div className="relative z-10 flex items-center justify-between px-4 py-3 border-b border-white/10 bg-black/20 backdrop-blur-xl safe-area-top">
            <Button variant="ghost" size="icon" onClick={handleBack} className="text-white hover:bg-white/10">
              <ChevronLeft className="w-6 h-6" />
            </Button>
            <h1 className="font-semibold text-lg text-white">Новая публикация</h1>
            <div className="w-10" />
          </div>

          {/* Content */}
          <div className="relative z-10 flex-1 overflow-y-auto native-scroll">
            {/* Preview */}
            <div className="p-4 flex justify-center">
              <div className="w-48 aspect-[3/4] rounded-xl overflow-hidden shadow-lg">
                <img 
                  src={selectedImages[0]} 
                  alt="Preview" 
                  className="w-full h-full object-cover"
                />
              </div>
            </div>

            {/* Caption */}
            <div className="px-4 pb-4">
              <textarea
                placeholder="Добавьте подпись..."
                value={caption}
                onChange={(e) => setCaption(e.target.value)}
                className="w-full bg-transparent resize-none outline-none text-white placeholder:text-white/30 min-h-[60px]"
              />
            </div>

            {/* Quick Actions */}
            <div className="px-4 pb-4 flex gap-2">
              <button className="flex items-center gap-2 px-4 py-2 bg-white/10 rounded-full text-white">
                <MessageSquare className="w-4 h-4" />
                <span className="text-sm font-medium">Опрос</span>
              </button>
              <button className="flex items-center gap-2 px-4 py-2 bg-white/10 rounded-full text-white">
                <HelpCircle className="w-4 h-4" />
                <span className="text-sm font-medium">Подсказка</span>
              </button>
            </div>

            {/* Options */}
            <div className="border-t border-white/10">
              <button className="w-full flex items-center gap-4 px-4 py-4 border-b border-white/10 text-white">
                <Music className="w-6 h-6" />
                <span className="flex-1 text-left font-medium">Добавьте аудио</span>
                <ChevronRight className="w-5 h-5 text-white/40" />
              </button>

              <div className="px-4 py-3 border-b border-white/10">
                <ScrollArea className="w-full">
                  <div className="flex gap-2">
                    {suggestedTracks.map((track) => (
                      <button 
                        key={track.id}
                        className="flex items-center gap-2 px-3 py-2 bg-white/10 rounded-full flex-shrink-0 text-white"
                      >
                        <img src={track.cover} alt="" className="w-6 h-6 rounded-full" />
                        <span className="text-sm">↗ {track.title}</span>
                      </button>
                    ))}
                  </div>
                  <ScrollBar orientation="horizontal" className="invisible" />
                </ScrollArea>
              </div>

              <button className="w-full flex items-center gap-4 px-4 py-4 border-b border-white/10 text-white">
                <Users className="w-6 h-6" />
                <span className="flex-1 text-left font-medium">Отметить людей</span>
                <ChevronRight className="w-5 h-5 text-white/40" />
              </button>

              <button className="w-full flex items-center gap-4 px-4 py-4 border-b border-white/10 text-white">
                <MapPin className="w-6 h-6" />
                <span className="flex-1 text-left font-medium">Добавить место</span>
                <ChevronRight className="w-5 h-5 text-white/40" />
              </button>

              <div className="flex items-start gap-4 px-4 py-4 text-white">
                <Sparkles className="w-6 h-6 flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p className="font-medium">Добавить значок ИИ</p>
                  <p className="text-sm text-white/50">
                    Вы должны отмечать значком определенный реалистичный контент, созданный с помощью ИИ.
                  </p>
                </div>
                <Switch checked={aiLabel} onCheckedChange={setAiLabel} />
              </div>
            </div>
          </div>

          {/* Publish Button */}
          <div className="relative z-10 px-4 py-4 border-t border-white/10 bg-black/20 backdrop-blur-xl safe-area-bottom">
            <Button 
              className="w-full rounded-full h-12 font-semibold text-base"
              onClick={handlePublish}
              disabled={isUploading}
            >
              {isUploading ? <Loader2 className="w-5 h-5 animate-spin" /> : "Поделиться"}
            </Button>
          </div>
        </>
      )}

      {/* Media Editor */}
      <SimpleMediaEditor
        open={showMediaEditor}
        onOpenChange={setShowMediaEditor}
        mediaFile={editorFile}
        contentType="post"
        onSave={(blob) => {
          const newUrl = URL.createObjectURL(blob);
          const newFile = new File([blob], `edited-${Date.now()}.jpg`, { type: blob.type });
          // Replace selected image with edited version
          const oldSrc = selectedImages[0];
          setSelectedImages(prev => prev.map(s => s === oldSrc ? newUrl : s));
          // Add to device images so it can be uploaded
          setDeviceImages(prev => [
            { id: `edited-${Date.now()}`, src: newUrl, file: newFile },
            ...prev.filter(d => d.src !== oldSrc),
          ]);
          setShowMediaEditor(false);
          setActiveEditorTool(null);
          toast.success("Изменения применены");
        }}
        onCancel={() => { setShowMediaEditor(false); setActiveEditorTool(null); }}
      />
    </div>
  );
}
